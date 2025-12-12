import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { REQUIREMENTS, RequirementCategory } from '@/lib/readiness/requirements'
import { callLLM, parseJSONResponse, getLLMProviderInfo } from '@/lib/llm-client'
import { extractTextFromDocument, splitTextForGPT } from '@/lib/universal-document-reader'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'

const CATEGORY_META_LABELS: Record<RequirementCategory, string> = {
  finans: 'Finansiellt',
  skatt: 'Skatte-relaterat',
  juridik: 'Juridiskt',
  hr: 'HR-relaterat',
  kommersiellt: 'Kommersiellt',
  it: 'IT-relaterat',
  operation: 'Operationellt',
}

const s3Client = new S3Client({
  region: process.env.AWS_S3_REGION || 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY || '',
  },
})

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'trestor-dataroom-prod'

interface AnalysisFinding {
  type: 'success' | 'warning' | 'error' | 'info'
  title: string
  description: string
}

interface AnalysisResult {
  score: number // 0-100
  status: 'approved' | 'needs_review' | 'rejected'
  summary: string
  findings: AnalysisFinding[]
  suggestedCategory: RequirementCategory | null
  suggestedPeriodYear: number | null
  isSigned: boolean
  missingElements: string[]
  recommendations: string[]
}

// Build the DD expert prompt
function buildSystemPrompt(): string {
  const requirementsContext = REQUIREMENTS.map(r => ({
    id: r.id,
    category: r.category,
    title: r.title,
    description: r.description,
    mandatory: r.mandatory,
  }))

  return `Du är en erfaren Due Diligence-expert specialiserad på företagsförsäljningar i Sverige. Din uppgift är att granska dokument som företagare laddar upp inför en potentiell försäljning.

Du ska:
1. Analysera dokumentets innehåll noggrant
2. Identifiera vad dokumentet är (årsredovisning, huvudbok, avtal, etc.)
3. Bedöma om dokumentet är komplett och uppfyller DD-krav
4. Ge konkret feedback på vad som saknas eller behöver förbättras
5. Ge ett poäng (0-100) baserat på dokumentets DD-kvalitet

Viktiga DD-krav för svenska företag:
${JSON.stringify(requirementsContext, null, 2)}

Var konstruktiv och specifik i din feedback. Fokusera på:
- Saknas någon viktig information?
- Är perioderna/datumen korrekta och aktuella?
- Är dokumentet signerat (om det krävs)?
- Stämmer siffrorna överens?
- Finns det några varningssignaler?

Svara ALLTID på svenska.`
}

function buildUserPrompt(fileName: string, mimeType: string, textContent: string): string {
  return `Analysera följande dokument för Due Diligence:

**Filnamn:** ${fileName}
**Filtyp:** ${mimeType}

**Dokumentinnehåll:**
${textContent.substring(0, 15000)}
${textContent.length > 15000 ? '\n\n[...dokumentet trunkerat, visa endast de första 15000 tecknen...]' : ''}

Ge din analys i följande JSON-format:
{
  "score": <0-100 poäng>,
  "status": "<approved|needs_review|rejected>",
  "summary": "<kort sammanfattning av dokumentet på 1-2 meningar>",
  "findings": [
    {"type": "<success|warning|error|info>", "title": "<kort titel>", "description": "<beskrivning>"}
  ],
  "suggestedCategory": "<finans|skatt|juridik|hr|kommersiellt|it|operation eller null>",
  "suggestedPeriodYear": <årtal eller null>,
  "isSigned": <true|false>,
  "missingElements": ["<sak som saknas 1>", "<sak som saknas 2>"],
  "recommendations": ["<rekommendation 1>", "<rekommendation 2>"]
}

Var noggrann och specifik. Om du hittar problem, förklara exakt vad som är fel och hur det kan åtgärdas.`
}

// Fetch file from S3
async function fetchFileFromS3(s3Key: string): Promise<Buffer> {
  const key = s3Key.startsWith('s3://') 
    ? s3Key.replace(`s3://${BUCKET_NAME}/`, '')
    : s3Key

  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  })

  const response = await s3Client.send(command)
  
  if (!response.Body) {
    throw new Error('Empty file from S3')
  }

  // Convert stream to buffer
  const chunks: Uint8Array[] = []
  for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
    chunks.push(chunk)
  }
  return Buffer.concat(chunks)
}

// POST /api/readiness/analyze
// Analyze a document's content using AI
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('bolaxo_user_id')?.value

    if (!userId) {
      return NextResponse.json({ error: 'Ej autentiserad' }, { status: 401 })
    }

    const body = await request.json()
    const { fileName, documentId, fileContent: directContent, mimeType } = body

    if (!fileName) {
      return NextResponse.json({ error: 'fileName krävs' }, { status: 400 })
    }

    // Demo mode: return intelligent mock analysis based on document type
    if (userId.startsWith('demo') || documentId?.startsWith('demo')) {
      // Simulate processing delay for realism
      await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000))
      
      const lowerFileName = fileName.toLowerCase()
      
      // Detect document type and category from filename
      const documentTypes: Record<string, { 
        category: RequirementCategory
        type: string
        baseScore: number
        findings: AnalysisFinding[]
        missingElements: string[]
        recommendations: string[]
      }> = {
        'årsredovisning': {
          category: 'finans',
          type: 'Årsredovisning',
          baseScore: 85,
          findings: [
            { type: 'success', title: 'Komplett årsredovisning', description: 'Dokumentet innehåller balansräkning, resultaträkning och förvaltningsberättelse enligt Årsredovisningslagen (ÅRL).' },
            { type: 'success', title: 'Revisionsberättelse inkluderad', description: 'Revisorsyttrande finns med vilket är obligatoriskt för revisionspliktiga bolag. Ren revisionsberättelse utan anmärkningar.' },
            { type: 'success', title: 'Styrelsens underskrifter', description: 'Årsredovisningen är undertecknad av samtliga styrelseledamöter och VD.' },
            { type: 'info', title: 'Notapparat analyserad', description: 'Noterna följer K2/K3-regelverket. Not 1 innehåller redovisningsprinciper, värderingsprinciper för tillgångar specificerade.' },
            { type: 'info', title: 'Jämförelsetal', description: 'Jämförelsetal för föregående år finns inkluderade vilket möjliggör trendanalys.' },
            { type: 'warning', title: 'Väsentliga händelser efter räkenskapsåret', description: 'Kontrollera om det finns väsentliga händelser efter balansdagen som bör beaktas vid DD.' },
          ],
          missingElements: [],
          recommendations: [
            'Begär även koncernredovisning om bolaget är moderbolag',
            'Jämför utvecklingen över 3-5 år för att identifiera trender',
            'Verifiera att alla noter har tillräcklig detaljeringsgrad för DD-ändamål',
            'Kontrollera eventuella anmärkningar i revisionsberättelsen från tidigare år',
          ],
        },
        'arsredovisning': {
          category: 'finans',
          type: 'Årsredovisning',
          baseScore: 85,
          findings: [
            { type: 'success', title: 'Komplett årsredovisning', description: 'Dokumentet innehåller balansräkning, resultaträkning och förvaltningsberättelse enligt Årsredovisningslagen (ÅRL).' },
            { type: 'success', title: 'Revisionsberättelse inkluderad', description: 'Revisorsyttrande finns med vilket är obligatoriskt för revisionspliktiga bolag. Ren revisionsberättelse utan anmärkningar.' },
            { type: 'success', title: 'Styrelsens underskrifter', description: 'Årsredovisningen är undertecknad av samtliga styrelseledamöter och VD.' },
            { type: 'info', title: 'Notapparat analyserad', description: 'Noterna följer K2/K3-regelverket. Not 1 innehåller redovisningsprinciper, värderingsprinciper för tillgångar specificerade.' },
            { type: 'info', title: 'Jämförelsetal', description: 'Jämförelsetal för föregående år finns inkluderade vilket möjliggör trendanalys.' },
            { type: 'warning', title: 'Väsentliga händelser efter räkenskapsåret', description: 'Kontrollera om det finns väsentliga händelser efter balansdagen som bör beaktas vid DD.' },
          ],
          missingElements: [],
          recommendations: [
            'Begär även koncernredovisning om bolaget är moderbolag',
            'Jämför utvecklingen över 3-5 år för att identifiera trender',
            'Verifiera att alla noter har tillräcklig detaljeringsgrad för DD-ändamål',
            'Kontrollera eventuella anmärkningar i revisionsberättelsen från tidigare år',
          ],
        },
        'huvudbok': {
          category: 'finans',
          type: 'Huvudbok',
          baseScore: 78,
          findings: [
            { type: 'success', title: 'Fullständig transaktionshistorik', description: 'Huvudboken innehåller samtliga verifikationer och transaktioner för perioden med verifikationsnummer, datum och belopp.' },
            { type: 'success', title: 'BAS-kontoplan', description: 'Konteringar följer BAS-kontoplanen vilket underlättar jämförelse och analys.' },
            { type: 'info', title: 'Momshantering', description: 'Ingående och utgående moms är separerade på korrekta konton (2640/2610-serien).' },
            { type: 'warning', title: 'Periodavgränsningsposter', description: 'Kontrollera förutbetalda kostnader (konto 17XX) och upplupna intäkter (konto 17XX) vid årsskifte. Dessa är ofta föremål för DD-granskning.' },
            { type: 'warning', title: 'Intercompany-transaktioner', description: 'Om bolaget ingår i koncern, verifiera att koncerninterna transaktioner är markerade och prissatta enligt armlängdsprincipen.' },
            { type: 'info', title: 'Kontanthantering', description: 'Kassatransaktioner (konto 1910) bör granskas för att säkerställa korrekt dokumentation.' },
          ],
          missingElements: [
            'Kontospecifikationer för konton med saldon över 100 000 kr',
            'Avstämning mot bokslut/årsredovisning',
            'Verifikationsunderlag för större transaktioner',
          ],
          recommendations: [
            'Inkludera kontospecifikationer för alla väsentliga balansposter',
            'Lägg till avstämningsdokumentation som visar att huvudboken stämmer mot bokslutet',
            'Markera och förklara ovanliga eller stora transaktioner',
            'Säkerställ att alla periodiseringar vid årsskifte är korrekta',
            'Kontrollera att manuella bokningar är attesterade',
          ],
        },
        'balans': {
          category: 'finans',
          type: 'Balansrapport',
          baseScore: 82,
          findings: [
            { type: 'success', title: 'Komplett ställningsrapport', description: 'Balansrapporten visar fullständig ställning av tillgångar, skulder och eget kapital enligt uppställningsform i ÅRL.' },
            { type: 'success', title: 'Eget kapital korrekt', description: 'Aktiekapital, fria reserver och balanserat resultat redovisas korrekt. Eget kapital överensstämmer med registrerat aktiekapital hos Bolagsverket.' },
            { type: 'info', title: 'Obeskattade reserver', description: 'Periodiseringsfonder och överavskrivningar finns redovisade. Kom ihåg att dessa innehåller latent skatteskuld (20.6%).' },
            { type: 'warning', title: 'Värdering av anläggningstillgångar', description: 'Kontrollera avskrivningsplaner för materiella tillgångar och om nedskrivningsbehov föreligger för immateriella tillgångar (goodwill, patent).' },
            { type: 'warning', title: 'Kundfordringar', description: 'Granska åldersfördelning av kundfordringar. Osäkra fordringar äldre än 90 dagar bör ha reservering.' },
            { type: 'info', title: 'Skulder till kreditinstitut', description: 'Långfristiga och kortfristiga lån är separerade. Kontrollera lånevillkor och säkerheter.' },
          ],
          missingElements: [
            'Specifikation av kundfordringar med åldersanalys',
            'Lagerförteckning med värderingsmetod (FIFO/genomsnittsmetod)',
            'Avskrivningsplaner för anläggningstillgångar',
            'Lånespecifikation med räntor och amorteringsplaner',
          ],
          recommendations: [
            'Begär åldersanalys för kundfordringar för att bedöma kreditrisk',
            'Inkludera inventarieförteckning och lagerspecifikation',
            'Verifiera att skulder till närstående är på marknadsmässiga villkor',
            'Kontrollera pantsättningar och säkerheter i förhållande till skulder',
            'Analysera rörelsekapitalbehovet baserat på omsättningstillgångar och kortfristiga skulder',
          ],
        },
        'resultat': {
          category: 'finans',
          type: 'Resultaträkning',
          baseScore: 80,
          findings: [
            { type: 'success', title: 'Komplett resultaträkning', description: 'Resultaträkningen följer kostnadsslagsindelad eller funktionsindelad uppställning enligt ÅRL.' },
            { type: 'success', title: 'Bruttovinst identifierad', description: 'Bruttovinst kan beräknas: Nettoomsättning minus kostnader för sålda varor. Bruttomarginalen är en viktig KPI för DD.' },
            { type: 'info', title: 'Rörelsemarginal', description: 'Rörelseresultat (EBIT) framgår tydligt. Detta är ofta utgångspunkt för värdering.' },
            { type: 'info', title: 'Finansiella poster', description: 'Ränteintäkter och räntekostnader är separerade. Kontrollera eventuella koncernbidrag.' },
            { type: 'warning', title: 'Engångsposter identifierade', description: 'Granska om det finns extraordinära intäkter/kostnader som påverkar jämförbarheten (t.ex. försäljning av tillgångar, omstruktureringskostnader).' },
            { type: 'warning', title: 'Personalkostnader', description: 'Analysera personalkostnadernas andel av omsättningen. Kontrollera om det finns ovanliga ersättningar eller bonusar.' },
          ],
          missingElements: [
            'Månadsvisa/kvartalsvisa siffror för trendanalys',
            'Jämförelse mot budget',
            'Segmentuppdelning om verksamheten har flera affärsområden',
            'EBITDA-beräkning (justerat för avskrivningar)',
          ],
          recommendations: [
            'Begär månadsvisa resultatrapporter för att analysera säsongsvariationer',
            'Identifiera och dokumentera alla engångsposter för normaliserad EBITDA',
            'Analysera intäktsfördelning per produkt/tjänst och kund',
            'Jämför marginaler med branschsnitt',
            'Kontrollera att alla personalkostnader är fullständigt bokförda (inklusive semester, pensioner)',
            'Verifiera att avskrivningar speglar ekonomisk livslängd på tillgångarna',
          ],
        },
        'avtal': {
          category: 'juridik',
          type: 'Avtal',
          baseScore: 75,
          findings: [
            { type: 'success', title: 'Avtalsstruktur', description: 'Dokumentet har professionell avtalsstruktur med tydligt definierade parter, definitioner och villkor.' },
            { type: 'info', title: 'Avtalsperiod', description: 'Giltighetstid och eventuella förlängningsklausuler är specificerade. Kontrollera uppsägningstid.' },
            { type: 'warning', title: 'Signaturverifikation', description: 'Kontrollera att alla parter har signerat och att signatärerna har behörighet (firmatecknare eller fullmakt).' },
            { type: 'warning', title: 'Change of Control', description: 'VIKTIGT: Granska om avtalet innehåller change of control-klausul som kan triggas vid ägarförändring/företagsförsäljning.' },
            { type: 'info', title: 'Tvistlösning', description: 'Kontrollera vilken lag som gäller och hur tvister ska lösas (skiljedom/allmän domstol).' },
            { type: 'warning', title: 'Ansvarsklausuler', description: 'Granska ansvarsbegränsningar och eventuella vitesklausuler som kan påverka risk vid DD.' },
          ],
          missingElements: [
            'Fullständig signatursida med datum',
            'Bilagor som refereras i avtalet',
            'Eventuella tilläggsavtal/ändringsavtal',
            'Firmateckningsbevis för avtalsparterna',
          ],
          recommendations: [
            'Verifiera firmateckning hos Bolagsverket för samtliga parter',
            'Kontrollera att alla bilagor och appendix finns bifogade',
            'Särskilt granska change of control-klausuler vid företagsförsäljning',
            'Upprätta lista över alla väsentliga avtal med löptid, värde och uppsägningstid',
            'Identifiera avtal med konkurrensklausuler eller exklusivitetsvillkor',
            'Bedöm risk för tvister baserat på avtalsvillkor',
          ],
        },
        'skatt': {
          category: 'skatt',
          type: 'Skattedeklaration',
          baseScore: 83,
          findings: [
            { type: 'success', title: 'Inlämnad i tid', description: 'Skattedeklarationen verkar vara inlämnad enligt gällande frister hos Skatteverket.' },
            { type: 'success', title: 'Komplett deklaration', description: 'Samtliga obligatoriska bilagor och uppgifter finns med (INK2, ränteavdragsbilaga etc.).' },
            { type: 'info', title: 'Bolagsskatt', description: 'Skatteberäkning verkar stämma överens med årsredovisningens resultat före skatt. Kontrollera ej avdragsgilla kostnader.' },
            { type: 'info', title: 'Underskott att rulla', description: 'Kontrollera om det finns tidigare års underskott som kan utnyttjas och hur de behandlas vid ägarförändring.' },
            { type: 'warning', title: 'Beloppsspärr vid ägarförändring', description: 'VIKTIGT: Vid ägarförändring över 50% kan rätten att utnyttja underskottsavdrag begränsas (beloppsspärr och koncernbidragsspärr).' },
            { type: 'warning', title: 'Transfer Pricing', description: 'Om koncerninterna transaktioner förekommer, kontrollera att internprissättningsdokumentation finns.' },
          ],
          missingElements: [
            'Kvitto/bekräftelse på inlämning från Skatteverket',
            'Slutskattebesked',
            'Eventuella omprövningsbeslut eller pågående ärenden',
          ],
          recommendations: [
            'Begär skattekontoutdrag från Skatteverket för att verifiera skatteskulder/fordringar',
            'Kontrollera om det finns pågående skatteärenden eller revisioner',
            'Analysera skattemässiga underskott och eventuella spärrbelopp vid förvärv',
            'Verifiera att bolagsskatten är korrekt beräknad på justerat resultat',
            'Granska eventuella taxeringsändringar de senaste 5 åren',
            'Kontrollera momsregistrering och F-skattesedel är aktiva',
          ],
        },
        'anställning': {
          category: 'hr',
          type: 'Anställningsavtal',
          baseScore: 77,
          findings: [
            { type: 'success', title: 'Grundläggande villkor', description: 'Anställningsvillkor finns dokumenterade: befattning, arbetstid, lön och anställningsform.' },
            { type: 'info', title: 'Anställningsform', description: 'Kontrollera om anställningen är tillsvidare, provanställning eller tidsbegränsad.' },
            { type: 'warning', title: 'Konkurrensklausul', description: 'VIKTIGT: Kontrollera om det finns konkurrensklausul som hindrar nyckelpersoner från att lämna och starta konkurrerande verksamhet.' },
            { type: 'warning', title: 'Sekretess', description: 'Granska sekretessåtaganden och hur de gäller vid anställningens upphörande.' },
            { type: 'info', title: 'Uppsägningstid', description: 'Kontrollera uppsägningstid - för nyckelpersoner ofta 3-6 månader vilket är viktigt vid DD.' },
            { type: 'warning', title: 'Bonus och incitament', description: 'Granska eventuella bonusavtal, optionsprogram eller andra incitamentsavtal som kan påverka transaktionen.' },
          ],
          missingElements: [
            'Underskrift från båda parter',
            'Aktuell lönebilaga',
            'Eventuella tilläggsavtal (bonus, bil, telefon)',
            'Pensionsavtal',
          ],
          recommendations: [
            'Upprätta komplett förteckning över alla anställda med position, lön och anställningstid',
            'Identifiera nyckelpersoner och deras avtal (VD, säljchef, etc.)',
            'Granska kollektivavtalstillhörighet och dess konsekvenser',
            'Kontrollera eventuella pågående arbetsrättstvister',
            'Verifiera att alla löner och sociala avgifter är korrekta',
            'Analysera pensionsåtaganden (ITP, egen pensionsplan)',
            'Bedöm risk för nyckelpersoner att lämna efter förvärv',
          ],
        },
        'kund': {
          category: 'kommersiellt',
          type: 'Kundavtal/Kundlista',
          baseScore: 79,
          findings: [
            { type: 'success', title: 'Kundöversikt', description: 'Dokumentet innehåller relevant information om kundbas och kundrelationer.' },
            { type: 'info', title: 'Kundkoncentration', description: 'Analysera beroendet av enskilda stora kunder. Om en kund står för >20% av omsättningen är det en riskfaktor.' },
            { type: 'warning', title: 'GDPR-compliance', description: 'Personuppgifter i kundregister kräver laglig grund. Säkerställ att databehandling följer GDPR.' },
            { type: 'warning', title: 'Kundavtals giltighetstid', description: 'Kontrollera löptider på kundavtal och om det finns change of control-klausuler som kan aktiveras.' },
            { type: 'info', title: 'Betalningshistorik', description: 'Analysera betalningsvillkor och historisk betalningsdisciplin hos kunderna.' },
            { type: 'info', title: 'Kundsegment', description: 'Segmentera kunder efter bransch, storlek och lönsamhet för bättre riskbedömning.' },
          ],
          missingElements: [
            'Omsättning per kund (Top 20)',
            'Kundkoncentrationsanalys',
            'Historisk churn-rate (kundbortfall)',
            'Customer Lifetime Value (CLV)',
          ],
          recommendations: [
            'Skapa Top 20-lista över kunder med omsättning, marginal och avtalslängd',
            'Beräkna kundkoncentration (Herfindahl-index) för riskbedömning',
            'Analysera churn-rate och kundlojalitet över tid',
            'Granska kundavtal för change of control-klausuler före försäljning',
            'Identifiera kunder med förfallna fordringar > 60 dagar',
            'Verifiera NDA/sekretessavtal med nyckelpersoner som har kundrelationer',
            'Analysera säsongsmönster i kundköp',
          ],
        },
        'leverantör': {
          category: 'kommersiellt',
          type: 'Leverantörsavtal',
          baseScore: 76,
          findings: [
            { type: 'success', title: 'Leverantörsinformation', description: 'Dokumentet innehåller information om leverantörsrelationer och inköpsvillkor.' },
            { type: 'info', title: 'Leverantörskoncentration', description: 'Granska beroende av enskilda leverantörer - viktigt för supply chain-risk.' },
            { type: 'warning', title: 'Avtalsvillkor', description: 'Kontrollera prisjusteringsklausuler och möjligheter att byta leverantör.' },
            { type: 'warning', title: 'Change of control', description: 'Granska om leverantörsavtal innehåller change of control-klausuler.' },
            { type: 'info', title: 'Betalningsvillkor', description: 'Analysera betalningsvillkor och eventuella rabatter vid snabb betalning.' },
          ],
          missingElements: [
            'Inköpsvolymer per leverantör',
            'Alternativa leverantörer för kritiska komponenter',
            'Prishistorik och avtalade priser',
          ],
          recommendations: [
            'Kartlägg kritiska leverantörer och alternativa källor',
            'Analysera leverantörskoncentration och supply chain-risk',
            'Granska avtalsvillkor för prisher och leveranstider',
            'Verifiera att det inte finns change of control-klausuler som kan triggas',
            'Kontrollera leverantörers finansiella stabilitet för kritiska komponenter',
          ],
        },
        'patent': {
          category: 'it',
          type: 'Patent/Immaterialrätt',
          baseScore: 74,
          findings: [
            { type: 'success', title: 'IP-dokumentation', description: 'Dokumentet innehåller information om immateriella rättigheter.' },
            { type: 'warning', title: 'Ägarskap', description: 'KRITISKT: Verifiera att bolaget äger eller har fullständig licens till all IP som används i verksamheten.' },
            { type: 'warning', title: 'Registreringar', description: 'Kontrollera att varumärken och patent är registrerade och avgifter är betalda.' },
            { type: 'info', title: 'Licensavtal', description: 'Granska eventuella in- och utlicensieringsavtal för IP.' },
            { type: 'warning', title: 'Intrångskontroll', description: 'Undersök om det finns risk för intrång i tredje parts IP eller pågående tvister.' },
          ],
          missingElements: [
            'Registreringsbevis för patent och varumärken',
            'Komplett lista över all IP med status',
            'Licensavtal för tredjepartskomponenter',
          ],
          recommendations: [
            'Begär fullständig IP-inventering med registreringsnummer och giltighetstid',
            'Verifiera ägarskap via PRV, EPO eller USPTO',
            'Granska anställningsavtal för överlåtelse av uppfinningsrätt',
            'Kontrollera att inga IP-tvister pågår eller riskerar att uppstå',
            'Analysera värdet och betydelsen av IP för verksamheten',
          ],
        },
        'hyresavtal': {
          category: 'operation',
          type: 'Hyresavtal/Lokaler',
          baseScore: 78,
          findings: [
            { type: 'success', title: 'Lokaldokumentation', description: 'Dokumentet innehåller information om hyrda lokaler och villkor.' },
            { type: 'info', title: 'Hyresvillkor', description: 'Granska hyra, indexklausul och vad som ingår (el, värme, etc.).' },
            { type: 'warning', title: 'Uppsägningstid', description: 'Kommersiella lokalhyresavtal har ofta 9-12 månaders uppsägningstid. Viktigt vid omstrukturering.' },
            { type: 'warning', title: 'Överlåtelseförbud', description: 'Kontrollera om hyresrätten kan överlåtas vid försäljning av verksamheten.' },
            { type: 'info', title: 'Lokalkostnader', description: 'Analysera lokalkostnader i relation till omsättning - branschstandard varierar.' },
          ],
          missingElements: [
            'Komplett hyresavtal med alla bilagor',
            'Indexberäkning och historisk hyreskostnad',
            'Uppgift om säkerhet/deposition',
          ],
          recommendations: [
            'Kontrollera att hyresavtalet tillåter överlåtelse eller att hyresvärden godkänner byte av hyresgäst',
            'Analysera lokalbehovet efter förvärv - möjlighet att konsolidera?',
            'Granska eventuella eftersatta underhållsåtaganden',
            'Verifiera att brandskydd och myndighetskrav uppfylls',
            'Kontrollera eventuella option på förlängning eller utvidgning',
          ],
        },
        'försäkring': {
          category: 'operation',
          type: 'Försäkringsbrev',
          baseScore: 80,
          findings: [
            { type: 'success', title: 'Försäkringsskydd', description: 'Dokumentet visar gällande försäkringsskydd för verksamheten.' },
            { type: 'info', title: 'Omfattning', description: 'Granska vilka risker som täcks: egendom, ansvar, avbrott, etc.' },
            { type: 'warning', title: 'Självrisk', description: 'Kontrollera självrisknivåer och om de är rimliga för verksamheten.' },
            { type: 'info', title: 'Premie', description: 'Analysera premiekostnad i relation till omsättning och risknivå.' },
            { type: 'warning', title: 'Ansvarsförsäkring', description: 'Särskilt viktigt: Kontrollera VD/styrelseansvar och produktansvar.' },
          ],
          missingElements: [
            'Fullständiga försäkringsvillkor',
            'Historik över skadeanmälningar',
            'D&O-försäkring (Directors & Officers)',
          ],
          recommendations: [
            'Verifiera att försäkringsskydd är tillräckligt vid värsta scenario',
            'Kontrollera att alla väsentliga tillgångar är försäkrade till rätt värde',
            'Granska historiska skador och eventuella undantag i villkoren',
            'Säkerställ att W&I-försäkring (Warranty & Indemnity) övervägs för transaktionen',
            'Analysera om försäkringspremier kan optimeras efter förvärv',
          ],
        },
      }

      // Find matching document type
      let matchedType = null
      for (const [keyword, config] of Object.entries(documentTypes)) {
        if (lowerFileName.includes(keyword)) {
          matchedType = config
          break
        }
      }

      // Default fallback if no match
      if (!matchedType) {
        matchedType = {
          category: 'finans' as RequirementCategory,
          type: 'Dokument',
          baseScore: 72,
          findings: [
            { type: 'success' as const, title: 'Dokument mottaget', description: 'Dokumentet har laddats upp framgångsrikt och är läsbart.' },
            { type: 'info' as const, title: 'Klassificering krävs', description: 'DD-coach kunde inte automatiskt identifiera dokumenttypen från filnamnet. Manuell kategorisering rekommenderas.' },
            { type: 'info' as const, title: 'Innehållsgranskning', description: 'Dokumentet bör granskas för att säkerställa att det är relevant för Due Diligence-processen.' },
            { type: 'warning' as const, title: 'Namngivning', description: 'För bättre automatisk klassificering, namnge filen beskrivande (t.ex. "Årsredovisning_2024.pdf" eller "Huvudbok_Q1-Q4_2024.xlsx").' },
            { type: 'warning' as const, title: 'Datummärkning saknas', description: 'Inkludera årtal eller period i filnamnet för att underlätta sortering och spårbarhet.' },
          ],
          missingElements: [
            'Tydlig dokumenttyp i filnamnet',
            'Datummärkning eller periodangivelse',
            'Dokumentets syfte i DD-sammanhang',
          ],
          recommendations: [
            'Döp om filen med beskrivande namn som inkluderar dokumenttyp och period',
            'Verifiera att dokumentet är komplett och inte saknar sidor',
            'Kontrollera att dokumentet är relevant för företagsförsäljningen',
            'Om dokumentet är ett avtal - säkerställ att det är signerat av behöriga parter',
            'Överväg att lägga till sammanfattande kommentar om dokumentets innehåll',
          ],
        }
      }

      // Extract year from filename
      const yearMatch = fileName.match(/20[0-9]{2}/)
      const detectedYear = yearMatch ? parseInt(yearMatch[0]) : new Date().getFullYear()

      // Add some randomness to score for realism
      const scoreVariation = Math.floor(Math.random() * 10) - 5
      const finalScore = Math.max(50, Math.min(100, matchedType.baseScore + scoreVariation))

      // Determine status based on score
      const status = finalScore >= 85 ? 'approved' : finalScore >= 65 ? 'needs_review' : 'rejected'

      // Build dynamic summary
      const summary = `${matchedType.type} för ${detectedYear} har analyserats. ${
        status === 'approved' 
          ? 'Dokumentet uppfyller DD-kraven och är redo för granskning.'
          : status === 'needs_review'
          ? 'Dokumentet behöver kompletteras med vissa uppgifter innan det kan godkännas.'
          : 'Dokumentet saknar väsentlig information och behöver åtgärdas.'
      }`

      return NextResponse.json({
        analysis: {
          score: finalScore,
          status,
          summary,
          findings: [
            ...matchedType.findings,
            { 
              type: 'info' as const, 
              title: 'Period identifierad', 
              description: `Dokumentet avser ${detectedYear}.` 
            },
          ],
          suggestedCategory: matchedType.category,
          suggestedPeriodYear: detectedYear,
          isSigned: lowerFileName.includes('sign') || lowerFileName.includes('under'),
          missingElements: status === 'approved' ? [] : matchedType.missingElements,
          recommendations: status === 'approved' 
            ? ['Dokumentet uppfyller DD-kraven - inga åtgärder krävs'] 
            : matchedType.recommendations,
        },
        provider: 'demo',
      })
    }

    let textContent = ''
    let extractedMimeType = mimeType || 'application/octet-stream'

    // Try to get file content
    if (directContent) {
      // Content was passed directly (from upload)
      textContent = directContent
    } else if (documentId) {
      // Fetch from database and S3
      try {
        const document = await prisma.document.findUnique({
          where: { id: documentId },
        })

        if (document?.fileUrl) {
          extractedMimeType = document.mimeType || extractedMimeType
          
          // Fetch file from S3
          const fileBuffer = await fetchFileFromS3(document.fileUrl)
          
          // Extract text from the document
          const extraction = await extractTextFromDocument(fileBuffer, fileName, extractedMimeType)
          textContent = extraction.text
          
          console.log(`[Analyze] Extracted ${textContent.length} chars from ${fileName} (${extraction.format}, confidence: ${extraction.confidence})`)
        }
      } catch (fetchError) {
        console.error('Error fetching document:', fetchError)
        // Continue with just filename analysis if S3 fails
      }
    }

    // If we couldn't extract text, still analyze based on filename
    if (!textContent || textContent.length < 50) {
      textContent = `[Kunde inte extrahera fullständigt textinnehåll från filen. Analyserar baserat på filnamn: ${fileName}]`
    }

    // Call LLM for analysis
    const { provider } = getLLMProviderInfo()
    console.log(`[Analyze] Using LLM provider: ${provider}`)

    const systemPrompt = buildSystemPrompt()
    const userPrompt = buildUserPrompt(fileName, extractedMimeType, textContent)

    const llmResponse = await callLLM(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      {
        temperature: 0.2,
        maxTokens: 2000,
        jsonMode: true,
      }
    )

    // Parse the response
    let analysis: AnalysisResult
    try {
      analysis = parseJSONResponse(llmResponse.content)
    } catch (parseError) {
      console.error('Failed to parse LLM response:', llmResponse.content)
      // Return a fallback analysis
      analysis = {
        score: 60,
        status: 'needs_review',
        summary: 'Dokumentet kunde analyseras men resultatet kunde inte tolkas korrekt.',
        findings: [
          { type: 'info', title: 'Analys slutförd', description: 'DD-coach har granskat dokumentet.' },
          { type: 'warning', title: 'Manuell granskning rekommenderas', description: 'Automatisk analys kunde inte slutföras helt.' },
        ],
        suggestedCategory: null,
        suggestedPeriodYear: null,
        isSigned: false,
        missingElements: [],
        recommendations: ['Kontrollera dokumentet manuellt'],
      }
    }

    // Update document metadata in database if documentId provided
    if (documentId && !documentId.startsWith('demo')) {
      try {
        const existingDoc = await prisma.document.findUnique({
          where: { id: documentId },
        })

        if (existingDoc) {
          const existingMeta = existingDoc.uploadedByName?.startsWith('{')
            ? JSON.parse(existingDoc.uploadedByName)
            : {}

          const updatedMeta = {
            ...existingMeta,
            aiScore: analysis.score,
            aiStatus: analysis.status,
            aiSummary: analysis.summary,
            aiFindings: analysis.findings,
            aiCategory: analysis.suggestedCategory,
            aiPeriodYear: analysis.suggestedPeriodYear,
            aiIsSigned: analysis.isSigned,
            aiMissingElements: analysis.missingElements,
            aiRecommendations: analysis.recommendations,
            aiAnalyzedAt: new Date().toISOString(),
            aiProvider: provider,
          }

          await prisma.document.update({
            where: { id: documentId },
            data: {
              uploadedByName: JSON.stringify(updatedMeta),
              status: analysis.status === 'approved' ? 'APPROVED' : 'UPLOADED',
            },
          })
        }
      } catch (dbError) {
        console.error('Error updating document with AI analysis:', dbError)
      }
    }

    return NextResponse.json({ 
      analysis,
      provider,
    })
  } catch (error) {
    console.error('Error analyzing document:', error)
    return NextResponse.json(
      { error: 'Kunde inte analysera dokumentet' },
      { status: 500 }
    )
  }
}
