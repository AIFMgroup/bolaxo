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
    const userId = cookieStore.get('afterfounder_user_id')?.value

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
        // Månadsbokslut
        'månadsbokslut': {
          category: 'finans',
          type: 'Månadsbokslut',
          baseScore: 81,
          findings: [
            { type: 'success', title: 'Periodisk rapportering', description: 'Månadsvisa resultat- och balansrapporter finns tillgängliga.' },
            { type: 'info', title: 'Jämförelse mot budget', description: 'Analysera avvikelser mot budget för varje månad - detta visar verksamhetens förutsägbarhet.' },
            { type: 'info', title: 'Trendanalys möjlig', description: 'Med månadsvisa siffror kan LTM (Last Twelve Months) och YTD beräknas korrekt.' },
            { type: 'warning', title: 'Periodiseringar', description: 'Kontrollera att månadsbokslutet är korrekt periodiserat (intäkter/kostnader allokerade till rätt period).' },
            { type: 'warning', title: 'Säsongsvariationer', description: 'Analysera säsongsmönster - viktigt för rörelsekapital och likviditetsbehov.' },
          ],
          missingElements: [
            'Budget-jämförelse per månad',
            'Kommentarer till väsentliga avvikelser',
            'Rullande 12-månaders prognos',
          ],
          recommendations: [
            'Inkludera budgetjämförelse och avvikelseanalys',
            'Lägg till ledningens kommentarer för månader med stora avvikelser',
            'Beräkna LTM EBITDA för varje månad som grund för värdering',
            'Identifiera engångsposter månad för månad',
            'Analysera rörelsekapitalcykeln månadsvis',
          ],
        },
        'månadsrapport': {
          category: 'finans',
          type: 'Månadsbokslut',
          baseScore: 81,
          findings: [
            { type: 'success', title: 'Periodisk rapportering', description: 'Månadsvisa resultat- och balansrapporter finns tillgängliga.' },
            { type: 'info', title: 'Jämförelse mot budget', description: 'Analysera avvikelser mot budget för varje månad - detta visar verksamhetens förutsägbarhet.' },
            { type: 'warning', title: 'Periodiseringar', description: 'Kontrollera att månadsbokslutet är korrekt periodiserat.' },
          ],
          missingElements: ['Budget-jämförelse', 'Avvikelsekommentarer'],
          recommendations: ['Inkludera budget och analys av avvikelser', 'Beräkna LTM EBITDA'],
        },
        // Kundreskontra / AR Aging
        'kundreskontra': {
          category: 'finans',
          type: 'Kundreskontra (AR Aging)',
          baseScore: 79,
          findings: [
            { type: 'success', title: 'Kundfordringar dokumenterade', description: 'Fullständig kundreskontra med förfallostruktur finns.' },
            { type: 'info', title: 'Åldersfördelning', description: 'Kundfordringar kan analyseras per ålderskategori (0-30, 31-60, 61-90, >90 dagar).' },
            { type: 'warning', title: 'Gamla fordringar', description: 'VIKTIGT: Fordringar äldre än 90 dagar bör ha reservering för osäkra kundfordringar.' },
            { type: 'warning', title: 'Kundkoncentration', description: 'Analysera om enskilda kunder har oproportionerligt stora utestående belopp.' },
            { type: 'info', title: 'DSO-beräkning', description: 'Days Sales Outstanding kan beräknas - jämför mot branschsnitt och historik.' },
          ],
          missingElements: [
            'Reservering för osäkra kundfordringar per kund',
            'Historisk inkassoförlust-statistik',
            'Kreditlimiter per kund',
          ],
          recommendations: [
            'Granska alla fordringar > 60 dagar och bedöm indrivningsmöjlighet',
            'Verifiera att reservering för osäkra fordringar är tillräcklig (ofta 50-100% för >90 dagar)',
            'Jämför DSO mot föregående period för att identifiera trend',
            'Kontrollera kreditförsäkring för stora kunder',
            'Analysera betalningshistorik för topp-20 kunder',
          ],
        },
        'aging': {
          category: 'finans',
          type: 'Reskontra (AR/AP Aging)',
          baseScore: 79,
          findings: [
            { type: 'success', title: 'Åldersfördelning', description: 'Fordringar/skulder kan analyseras per ålderskategori.' },
            { type: 'warning', title: 'Gamla poster', description: 'Poster äldre än 90 dagar kräver särskild granskning.' },
            { type: 'info', title: 'Rörelsekapital', description: 'Används för beräkning av rörelsekapitalbehov vid transaktion.' },
          ],
          missingElements: ['Reservering för osäkra fordringar', 'Historisk statistik'],
          recommendations: ['Granska gamla poster', 'Beräkna DSO/DPO'],
        },
        // Leverantörsreskontra / AP Aging
        'leverantörsreskontra': {
          category: 'finans',
          type: 'Leverantörsreskontra (AP Aging)',
          baseScore: 78,
          findings: [
            { type: 'success', title: 'Leverantörsskulder dokumenterade', description: 'Fullständig leverantörsreskontra med förfallostruktur.' },
            { type: 'info', title: 'Betalningsdisciplin', description: 'Förfallostrukturen visar bolagets betalningsdisciplin - viktigt för leverantörsrelationer.' },
            { type: 'warning', title: 'Förfallna skulder', description: 'Granska skulder som passerat förfallodatum - kan indikera likviditetsproblem.' },
            { type: 'info', title: 'DPO-beräkning', description: 'Days Payables Outstanding indikerar hur länge bolaget tar på sig att betala.' },
            { type: 'warning', title: 'Leverantörskoncentration', description: 'Analysera beroende av enskilda leverantörer med stora utestående skulder.' },
          ],
          missingElements: [
            'Avtalade betalningsvillkor per leverantör',
            'Historik över förseningsavgifter/räntor',
            'Bedömning av kritiska leverantörsrelationer',
          ],
          recommendations: [
            'Verifiera att inga leverantörer har hotat att stoppa leveranser pga förseningar',
            'Analysera om långa betalningstider kan bibehållas efter ägarförändring',
            'Kontrollera eventuella dold skulder (fakturor som inte bokförts)',
            'Jämför DPO mot branschsnitt och avtalade villkor',
            'Identifiera leverantörer med change of control-klausuler',
          ],
        },
        // EBITDA-bridge
        'ebitda': {
          category: 'finans',
          type: 'EBITDA-bridge / Normalisering',
          baseScore: 84,
          findings: [
            { type: 'success', title: 'EBITDA-beräkning', description: 'Resultat före räntor, skatt, av- och nedskrivningar är beräknat.' },
            { type: 'info', title: 'Justeringsposter identifierade', description: 'Engångsposter och normaliseringsposer är specificerade med belopp.' },
            { type: 'warning', title: 'Ägarrelaterade kostnader', description: 'Granska justeringar för ägarlöner, bilförmåner och andra ägarrelaterade kostnader - ofta föremål för förhandling.' },
            { type: 'warning', title: 'Engångsposter', description: 'KRITISKT: Varje justeringspost måste ha tillräcklig dokumentation och vara förklarad.' },
            { type: 'info', title: 'Pro forma-effekter', description: 'Beräkna effekt av planerade förändringar (t.ex. personal som ska avslutas).' },
          ],
          missingElements: [
            'Underlag för varje justeringspost',
            'Historisk jämförelse av normaliserad EBITDA',
            'Pro forma-beräkning för planerade förändringar',
          ],
          recommendations: [
            'Dokumentera varje justeringspost med faktura/avtal som stöd',
            'Beräkna normaliserad EBITDA för 3 år för trendanalys',
            'Separera engångsposter (one-off) från återkommande justeringar (run-rate)',
            'Inkludera endast justeringar som köpare kan acceptera',
            'Var konservativ - överambitiösa justeringar skapar konflikter',
          ],
        },
        // Kassaflöde/Budget
        'kassaflöde': {
          category: 'finans',
          type: 'Kassaflödesprognos',
          baseScore: 80,
          findings: [
            { type: 'success', title: 'Likviditetsprognos', description: 'Kassaflödesprognos finns med in- och utflöden specificerade.' },
            { type: 'info', title: 'Antaganden', description: 'Granska underliggande antaganden - är de realistiska baserat på historik?' },
            { type: 'warning', title: 'Rörelsekapitalvariationer', description: 'Kontrollera att säsongsvariationer i rörelsekapital är beaktade.' },
            { type: 'info', title: 'Investeringsbehov', description: 'CapEx och underhållsinvesteringar bör vara inkluderade.' },
            { type: 'warning', title: 'Känslighetsanalys', description: 'Vad händer om intäkterna minskar 10-20%? Stress-test prognosen.' },
          ],
          missingElements: [
            'Känslighetsanalys (best/base/worst case)',
            'Koppling till resultat- och balansbudget',
            'Detaljerade antaganden per post',
          ],
          recommendations: [
            'Skapa scenarios: best case, base case, worst case',
            'Koppla kassaflödet till resultat- och balansbudget för konsistens',
            'Dokumentera alla antaganden explicit',
            'Jämför historisk träffsäkerhet på budgetar',
            'Inkludera eventuella earn-out-betalningar om tillämpligt',
          ],
        },
        'budget': {
          category: 'finans',
          type: 'Budget/Prognos',
          baseScore: 78,
          findings: [
            { type: 'success', title: 'Budget upprättad', description: 'Årsbudget eller prognos finns dokumenterad.' },
            { type: 'warning', title: 'Realism', description: 'Jämför budget mot historiskt utfall - är antaganden rimliga?' },
            { type: 'info', title: 'Delårsuppföljning', description: 'Hur väl har bolaget träffat tidigare budgetar?' },
          ],
          missingElements: ['Historisk jämförelse', 'Antaganden dokumenterade'],
          recommendations: ['Jämför mot historiskt utfall', 'Dokumentera antaganden'],
        },
        // Lagerlista
        'lager': {
          category: 'finans',
          type: 'Lagerlista/Lagervärdering',
          baseScore: 77,
          findings: [
            { type: 'success', title: 'Lagerförteckning', description: 'Artiklar och lagerplatser finns dokumenterade.' },
            { type: 'info', title: 'Värderingsmetod', description: 'Kontrollera vilken metod som används: FIFU, vägt genomsnitt, eller annan.' },
            { type: 'warning', title: 'Inkurans', description: 'VIKTIGT: Granska lågfrekventa artiklar och bedöm inkuransrisk. Artiklar >12 månader utan rörelse bör ha reservering.' },
            { type: 'warning', title: 'Fysisk inventering', description: 'När genomfördes senaste fysiska inventering? Inventerings-differenser?' },
            { type: 'info', title: 'Lageromsättning', description: 'Beräkna lageromsättningshastighet - låg hastighet kan indikera problem.' },
          ],
          missingElements: [
            'Åldersanalys per artikel',
            'Inkuransreservering',
            'Inventerings-protokoll',
            'Värdering per artikelgrupp',
          ],
          recommendations: [
            'Genomför fysisk lagerinventering före transaktion',
            'Beräkna inkurans baserat på omsättningshastighet per artikel',
            'Granska lager på konsignation eller hos tredje part',
            'Analysera säsongsvariationer i lagernivåer',
            'Verifiera att lagervärdering överensstämmer med nettorealisationsvärde',
          ],
        },
        // Anläggningsregister
        'anläggning': {
          category: 'finans',
          type: 'Anläggningsregister',
          baseScore: 79,
          findings: [
            { type: 'success', title: 'Tillgångsregister', description: 'Anläggningstillgångar är förtecknade med anskaffningsvärde och ackumulerade avskrivningar.' },
            { type: 'info', title: 'Avskrivningsplan', description: 'Kontrollera att avskrivningstider speglar ekonomisk livslängd.' },
            { type: 'warning', title: 'Nedskrivningsbehov', description: 'Finns det tillgångar som behöver skrivas ned? Särskilt goodwill och immateriella tillgångar.' },
            { type: 'info', title: 'Underhållsstatus', description: 'Granska skick på maskiner och utrustning - behövs reinvesteringar?' },
            { type: 'warning', title: 'Lease vs. Ägt', description: 'Särskilj leasade tillgångar från ägda - leasingavtal bör granskas separat.' },
          ],
          missingElements: [
            'Underhållshistorik och -plan',
            'Bedömning av marknadsvärde vs. bokfört värde',
            'Leasingavtal för hyrda tillgångar',
          ],
          recommendations: [
            'Jämför bokfört värde med marknadsvärde/försäkringsvärde',
            'Identifiera reinvesteringsbehov de kommande 3-5 åren',
            'Granska avskrivningsprinciper mot branschstandard',
            'Kontrollera pantsättningar av tillgångar',
            'Planera för teknisk besiktning av väsentliga tillgångar',
          ],
        },
        // Skuld/Finansieringsöversikt
        'skuld': {
          category: 'finans',
          type: 'Skuld-/Finansieringsöversikt',
          baseScore: 82,
          findings: [
            { type: 'success', title: 'Låneöversikt', description: 'Befintliga lån och krediter är dokumenterade med belopp och villkor.' },
            { type: 'info', title: 'Räntekostnader', description: 'Räntenivåer och räntebindning framgår - viktigt för cashflow-analys.' },
            { type: 'warning', title: 'Covenants', description: 'KRITISKT: Granska finansiella covenants och aktuell covenant-status. Brott mot covenants kan trigga accelereringsklausuler.' },
            { type: 'warning', title: 'Change of control', description: 'De flesta låneavtal har change of control-klausuler som kan kräva förtida återbetalning vid försäljning.' },
            { type: 'info', title: 'Säkerheter', description: 'Dokumentera pantsättningar: företagsinteckning, fastigheter, aktier i dotterbolag.' },
          ],
          missingElements: [
            'Amorteringsplaner',
            'Senaste covenant-beräkning',
            'Panträttsinnehavare och belopp',
          ],
          recommendations: [
            'Kontakta långivare tidigt för att diskutera förtida återbetalning eller övertagande',
            'Beräkna net debt korrekt (lån minus kassa, plus/minus rörelsekapitaljusteringar)',
            'Granska eventuella garantier och borgensåtaganden',
            'Analysera refinansieringsbehov och möjligheter',
            'Inkludera pensionsskulder och leasingskulder i skuldbegreppet om relevant',
          ],
        },
        // Deklarationer
        'deklaration': {
          category: 'skatt',
          type: 'Skattedeklaration',
          baseScore: 83,
          findings: [
            { type: 'success', title: 'Deklaration komplett', description: 'Skattedeklaration med bilagor finns dokumenterad.' },
            { type: 'info', title: 'Avstämning mot ÅR', description: 'Skattemässigt resultat kan avstämmas mot bokfört resultat.' },
            { type: 'warning', title: 'Underskottsavdrag', description: 'Kontrollera tidigare års underskott och hur de påverkas av ägarförändring (beloppsspärr).' },
            { type: 'warning', title: 'Transferpricing', description: 'Om koncerninterna transaktioner finns - är internprissättningen dokumenterad?' },
            { type: 'info', title: 'Skattemässiga justeringar', description: 'Granska ej avdragsgilla kostnader och skattemässiga justeringar.' },
          ],
          missingElements: ['Skattekontoutdrag', 'Slutskattebesked', 'TP-dokumentation om relevant'],
          recommendations: [
            'Begär skattekontoutdrag för att verifiera inga obetalda skatter',
            'Analysera underskottsavdrag och hur de påverkas vid förvärv',
            'Granska skattemässiga reserveringar (periodiseringsfond, etc.)',
          ],
        },
        // Transfer Pricing
        'transfer': {
          category: 'skatt',
          type: 'Transfer Pricing-dokumentation',
          baseScore: 76,
          findings: [
            { type: 'success', title: 'TP-dokumentation finns', description: 'Internprissättningsdokumentation är upprättad.' },
            { type: 'info', title: 'Armlängdsprincipen', description: 'Granska att prissättning motsvarar marknadspris mellan oberoende parter.' },
            { type: 'warning', title: 'Jämförelseanalys', description: 'Dokumentationen bör innehålla benchmarking mot jämförbara transaktioner.' },
            { type: 'warning', title: 'Årlig uppdatering', description: 'TP-dokumentation bör uppdateras årligen - kontrollera aktualitet.' },
          ],
          missingElements: ['Jämförelsestudie/benchmarking', 'Master file', 'Local file'],
          recommendations: [
            'Säkerställ att TP-dokumentation uppfyller Skatteverkets krav',
            'Granska prissättning av management fees, royalties, koncernlån',
            'Analysera risk för TP-justeringar vid granskning',
          ],
        },
        // Bolagsdokument
        'bolagsordning': {
          category: 'juridik',
          type: 'Bolagsdokument',
          baseScore: 85,
          findings: [
            { type: 'success', title: 'Grunddokument', description: 'Bolagsordning och registreringsbevis finns.' },
            { type: 'info', title: 'Aktiebok', description: 'Kontrollera att aktieboken är uppdaterad och stämmer med Bolagsverket.' },
            { type: 'warning', title: 'Ägaravtal', description: 'Finns aktieägaravtal med hembudsklausuler eller förköpsrätt som påverkar försäljningen?' },
            { type: 'info', title: 'Firmateckning', description: 'Verifiera aktuella firmatecknare hos Bolagsverket.' },
          ],
          missingElements: ['Aktiebok', 'Eventuella ägaravtal', 'Fullmakter'],
          recommendations: [
            'Hämta färskt registreringsbevis från Bolagsverket',
            'Verifiera att aktiebok stämmer med registrerad information',
            'Granska ägaravtal för restriktioner vid försäljning',
          ],
        },
        'registreringsbevis': {
          category: 'juridik',
          type: 'Registreringsbevis',
          baseScore: 88,
          findings: [
            { type: 'success', title: 'Officiell dokumentation', description: 'Registreringsbevis från Bolagsverket bekräftar bolagets legala status.' },
            { type: 'info', title: 'Firmatecknare', description: 'Aktuella firmatecknare framgår av dokumentet.' },
            { type: 'info', title: 'Aktualitet', description: 'Kontrollera att registreringsbeviset är aktuellt (max 3 månader gammalt för transaktion).' },
          ],
          missingElements: [],
          recommendations: ['Hämta nytt registreringsbevis nära closing-datum', 'Verifiera mot aktiebok'],
        },
        'aktiebok': {
          category: 'juridik',
          type: 'Aktiebok/Cap Table',
          baseScore: 84,
          findings: [
            { type: 'success', title: 'Ägarlista', description: 'Aktiebok visar samtliga aktieägare och deras innehav.' },
            { type: 'warning', title: 'Aktualitet', description: 'Kontrollera att aktieboken är uppdaterad och stämmer med Bolagsverkets register.' },
            { type: 'info', title: 'Aktieslag', description: 'Om flera aktieslag finns - granska rösträttsfördelning och preferenser.' },
            { type: 'warning', title: 'Överlåtelserestriktioner', description: 'Finns hembudsklausuler i bolagsordningen som påverkar försäljningen?' },
          ],
          missingElements: ['Eventuella optionsavtal', 'Ägaravtal med restriktioner'],
          recommendations: ['Stäm av mot Bolagsverket', 'Granska hembudsklausuler', 'Identifiera alla potentiella sellers'],
        },
        // Protokoll
        'protokoll': {
          category: 'juridik',
          type: 'Styrelse-/Stämmoprotokoll',
          baseScore: 80,
          findings: [
            { type: 'success', title: 'Beslutsdokumentation', description: 'Protokoll från styrelsemöten och bolagsstämmor finns.' },
            { type: 'info', title: 'Beslutsunderlag', description: 'Granska att väsentliga beslut har dokumenterat underlag.' },
            { type: 'warning', title: 'Signatur', description: 'Kontrollera att alla protokoll är justerade och signerade.' },
            { type: 'warning', title: 'Särskilda beslut', description: 'Sök efter beslut om lån, pantförskrivning, emissioner som kan påverka transaktionen.' },
          ],
          missingElements: ['Komplett protokollserie', 'Beslutsunderlag för väsentliga beslut'],
          recommendations: [
            'Skapa kronologisk lista över alla väsentliga beslut',
            'Identifiera eventuella formfel i historiska beslut',
            'Kontrollera att inga beslut kräver stämmogodkännande som saknas',
          ],
        },
        // GDPR
        'gdpr': {
          category: 'juridik',
          type: 'GDPR/Privacy-dokumentation',
          baseScore: 75,
          findings: [
            { type: 'success', title: 'Dataskyddsdokumentation', description: 'GDPR-relaterad dokumentation finns upprättad.' },
            { type: 'info', title: 'Registerförteckning', description: 'Artikel 30-register över personuppgiftsbehandling bör finnas.' },
            { type: 'warning', title: 'Personuppgiftsbiträden', description: 'Kontrollera att biträdesavtal finns med alla underleverantörer som behandlar personuppgifter.' },
            { type: 'warning', title: 'Samtycken och laglig grund', description: 'Verifiera att laglig grund finns för all behandling - särskilt vid marknadsföring.' },
            { type: 'info', title: 'Incidenthantering', description: 'Finns rutiner för hantering och rapportering av personuppgiftsincidenter?' },
          ],
          missingElements: [
            'Artikel 30-register',
            'Biträdesavtal med alla underleverantörer',
            'Dataskyddspolicy',
            'Incidentlogg',
          ],
          recommendations: [
            'Kartlägg all personuppgiftsbehandling och verifiera laglig grund',
            'Inventera alla IT-system och underleverantörer som behandlar personuppgifter',
            'Granska historiska incidenter och hur de hanterats',
            'Analysera risk för sanktioner vid bristande efterlevnad',
            'Säkerställ att samtycken är giltiga vid ändrat ändamål efter förvärv',
          ],
        },
        'privacy': {
          category: 'juridik',
          type: 'GDPR/Privacy-dokumentation',
          baseScore: 75,
          findings: [
            { type: 'success', title: 'Integritetspolicy', description: 'Dokumentation om dataskydd finns.' },
            { type: 'warning', title: 'Biträdesavtal', description: 'Verifiera att alla underleverantörer har avtal.' },
            { type: 'info', title: 'Registerförteckning', description: 'Artikel 30-register bör finnas.' },
          ],
          missingElements: ['Komplett biträdesavtalsserie', 'Registerförteckning'],
          recommendations: ['Kartlägg all personuppgiftsbehandling', 'Granska samtycken'],
        },
        // Tvister
        'tvist': {
          category: 'juridik',
          type: 'Tvister/Claims',
          baseScore: 72,
          findings: [
            { type: 'info', title: 'Tvistelista', description: 'Dokumentation av pågående eller hotande tvister.' },
            { type: 'warning', title: 'Reservering', description: 'KRITISKT: Är tillräcklig reservering gjord i bokföringen för potentiella förluster?' },
            { type: 'warning', title: 'Försäkringstäckning', description: 'Kontrollera om tvisterna täcks av ansvarsförsäkring.' },
            { type: 'info', title: 'Historiska tvister', description: 'Granska även avslutade tvister för mönster och risker.' },
          ],
          missingElements: ['Juridisk bedömning av utfall', 'Kostnadsuppskattning', 'Försäkringsanalys'],
          recommendations: [
            'Inhämta juridisk second opinion på väsentliga tvister',
            'Analysera om tvister kan avgöras före transaktion',
            'Överväg escrow eller indemnity för pågående tvister i SPA',
          ],
        },
        // HR - Löne/Bonus
        'löne': {
          category: 'hr',
          type: 'Löne-/Bonusstruktur',
          baseScore: 79,
          findings: [
            { type: 'success', title: 'Kompensationsöversikt', description: 'Löne- och bonusstrukturer är dokumenterade.' },
            { type: 'info', title: 'Marknadsmässighet', description: 'Jämför lönenivåer mot branschsnitt för att bedöma retention-risk.' },
            { type: 'warning', title: 'Bonusförpliktelser', description: 'Granska utestående bonusåtaganden - dessa blir ofta föremål för förhandling vid closing.' },
            { type: 'warning', title: 'Förändringskostnader', description: 'Vad kostar det att säga upp nyckelpersoner (avgångsvederlag, uppsägningstid)?' },
            { type: 'info', title: 'Optionsprogram', description: 'Finns aktie- eller optionsprogram som triggas vid ägarförändring?' },
          ],
          missingElements: [
            'Individuell lönelista',
            'Pågående bonusprogram med beräknad utbetalning',
            'Optionsvillkor vid change of control',
          ],
          recommendations: [
            'Identifiera "stay bonus"-möjligheter för nyckelpersoner',
            'Analysera kostnader för befintliga optionsprogram vid transaktion',
            'Jämför lönenivåer med marknad för att bedöma retention',
            'Planera kommunikation till personal vid transaktion',
          ],
        },
        'bonus': {
          category: 'hr',
          type: 'Bonusstruktur',
          baseScore: 78,
          findings: [
            { type: 'success', title: 'Bonusprogram', description: 'Bonusstruktur och villkor dokumenterade.' },
            { type: 'warning', title: 'Utestående åtaganden', description: 'Beräkna upplupen bonus vid transaktionsdatum.' },
            { type: 'info', title: 'Måluppfyllelse', description: 'Analysera historisk utfallsnivå på bonusar.' },
          ],
          missingElements: ['Aktuell accrued bonus', 'Målformulering'],
          recommendations: ['Beräkna bonusskuld vid closing', 'Definiera ansvarsfördelning i SPA'],
        },
        // Pension
        'pension': {
          category: 'hr',
          type: 'Pensionsåtaganden',
          baseScore: 76,
          findings: [
            { type: 'success', title: 'Pensionsplan', description: 'Dokumentation av pensionsåtaganden finns.' },
            { type: 'info', title: 'ITP/Tjänstepension', description: 'Granska typ av pensionslösning - avgiftsbestämd eller förmånsbestämd.' },
            { type: 'warning', title: 'Förmånsbestämda planer', description: 'KRITISKT: Förmånsbestämda pensioner kan innebära betydande skulder som inte syns i balansräkningen.' },
            { type: 'warning', title: 'Direktpension', description: 'Finns direktpensionsåtaganden som måste övertas av köpare?' },
          ],
          missingElements: [
            'Aktuariell beräkning av pensionsskuld',
            'Försäkringsbesked',
            'Lista över direktpensioner',
          ],
          recommendations: [
            'Begär aktuariell värdering om förmånsbestämda planer finns',
            'Analysera kostnader för att lösa ut direktpensioner',
            'Verifiera att premier är betalda och försäkringar aktiva',
          ],
        },
        // IT/System
        'system': {
          category: 'it',
          type: 'Systemkarta/IT-översikt',
          baseScore: 77,
          findings: [
            { type: 'success', title: 'Systemlandskap', description: 'Översikt över IT-system och integrationer finns dokumenterad.' },
            { type: 'info', title: 'Licenser', description: 'Granska licensvillkor - är de överförbara vid ägarförändring?' },
            { type: 'warning', title: 'Teknisk skuld', description: 'Bedöm föråldrade system och reinvesteringsbehov.' },
            { type: 'warning', title: 'Molntjänster', description: 'Kartlägg alla SaaS/molntjänster och deras avtalsvillkor vid exit.' },
            { type: 'info', title: 'Integrationer', description: 'Dokumentera beroenden mellan system - risk vid förändring.' },
          ],
          missingElements: [
            'Komplett licensförteckning',
            'Avtalsvillkor för molntjänster',
            'Roadmap för teknisk utveckling',
          ],
          recommendations: [
            'Inventera alla licenser och verifiera överlåtbarhet',
            'Analysera molntjänsters change of control-villkor',
            'Bedöm kostnad för nödvändiga IT-uppgraderingar',
            'Dokumentera nyckelpersoner för kritiska system',
          ],
        },
        'licens': {
          category: 'it',
          type: 'Licenser/Programvara',
          baseScore: 76,
          findings: [
            { type: 'success', title: 'Licensdokumentation', description: 'Programvarulicenser finns dokumenterade.' },
            { type: 'warning', title: 'Överlåtbarhet', description: 'Verifiera att licenser kan överföras vid ägarförändring.' },
            { type: 'info', title: 'Compliance', description: 'Stämmer antal användare/installationer med licensvillkoren?' },
          ],
          missingElements: ['Licensavtal', 'Användarsstatistik'],
          recommendations: ['Inventera alla licenser', 'Kontrollera överlåtbarhet', 'Verifiera compliance'],
        },
        // Infosec
        'infosec': {
          category: 'it',
          type: 'Informationssäkerhet',
          baseScore: 74,
          findings: [
            { type: 'success', title: 'Säkerhetsdokumentation', description: 'Policy och rutiner för informationssäkerhet finns.' },
            { type: 'info', title: 'Accesskontroll', description: 'Granska behörighetsstyrning och åtkomstloggning.' },
            { type: 'warning', title: 'Incidenthistorik', description: 'Har det skett säkerhetsincidenter? Hur hanterades de?' },
            { type: 'warning', title: 'Backup/DR', description: 'Finns testad backup och disaster recovery-plan?' },
            { type: 'info', title: 'Certifieringar', description: 'ISO 27001 eller SOC 2-certifiering är meriterande.' },
          ],
          missingElements: [
            'Penetrationstest-rapport',
            'Incidentlogg',
            'DR-testprotokoll',
          ],
          recommendations: [
            'Genomför penetrationstest före transaktion',
            'Verifiera att backup faktiskt fungerar (test-restore)',
            'Granska tredjepartsleverantörers säkerhetsnivå',
            'Analysera cyberförsäkringsskydd',
          ],
        },
        // IP/Kod
        'källkod': {
          category: 'it',
          type: 'Källkod/IP',
          baseScore: 73,
          findings: [
            { type: 'success', title: 'Koddokumentation', description: 'Dokumentation om mjukvara och källkod finns.' },
            { type: 'warning', title: 'Ägarskap', description: 'KRITISKT: Verifiera att bolaget äger all källkod. Kontrollera anställningsavtal för IP-överlåtelse.' },
            { type: 'warning', title: 'Open source', description: 'Inventera open source-komponenter och deras licenser (GPL, MIT, etc.). GPL kan tvinga till öppning av egen kod.' },
            { type: 'info', title: 'Dokumentation', description: 'Finns teknisk dokumentation som möjliggör vidareutveckling?' },
          ],
          missingElements: [
            'Open source-inventering',
            'Anställningsavtal med IP-klausul',
            'Teknisk dokumentation',
          ],
          recommendations: [
            'Genomför open source-scanning av kodbasen',
            'Verifiera IP-överlåtelse i konsultavtal och anställningsavtal',
            'Dokumentera beroenden av nyckelpersoner för kodutveckling',
          ],
        },
        'open source': {
          category: 'it',
          type: 'Open Source Compliance',
          baseScore: 71,
          findings: [
            { type: 'info', title: 'OSS-inventering', description: 'Lista över open source-komponenter finns.' },
            { type: 'warning', title: 'Copyleft-licenser', description: 'KRITISKT: GPL och liknande licenser kan kräva att egen kod öppnas - verifiera compliance.' },
            { type: 'warning', title: 'Licensvillkor', description: 'Säkerställ att alla villkor följs (attribution, etc.).' },
          ],
          missingElements: ['Komplett OSS-inventering', 'Licensanalys'],
          recommendations: ['Använd verktyg för OSS-scanning', 'Analysera licensrisker', 'Dokumentera compliance'],
        },
        // ESG/HSE
        'esg': {
          category: 'operation',
          type: 'ESG/Hållbarhet',
          baseScore: 75,
          findings: [
            { type: 'success', title: 'Hållbarhetsdokumentation', description: 'ESG-relaterad dokumentation finns upprättad.' },
            { type: 'info', title: 'Miljöarbete', description: 'Granska miljöpolicy och eventuella miljötillstånd.' },
            { type: 'warning', title: 'Miljöskulder', description: 'Finns risk för historisk miljöförorening som kan medföra kostnader?' },
            { type: 'info', title: 'Socialt ansvar', description: 'Dokumentation kring arbetsvillkor och mänskliga rättigheter i leverantörskedjan.' },
            { type: 'info', title: 'Certifieringar', description: 'ISO 14001 eller liknande miljöcertifiering är meriterande.' },
          ],
          missingElements: [
            'Miljöutredning om relevant',
            'Hållbarhetsrapport',
            'Miljötillstånd',
          ],
          recommendations: [
            'Genomför miljöutredning för fastigheter vid behov',
            'Analysera krav på hållbarhetsrapportering (CSRD om tillämpligt)',
            'Kartlägg leverantörskedjan ur ESG-perspektiv',
          ],
        },
        'miljö': {
          category: 'operation',
          type: 'Miljö/HSE',
          baseScore: 76,
          findings: [
            { type: 'success', title: 'Miljödokumentation', description: 'Miljö- och arbetsmiljödokumentation finns.' },
            { type: 'warning', title: 'Miljötillstånd', description: 'Verifiera att alla nödvändiga tillstånd är giltiga.' },
            { type: 'warning', title: 'Historisk förorening', description: 'Finns risk för saneringsansvar?' },
          ],
          missingElements: ['Miljötillstånd', 'Arbetsmiljöplan'],
          recommendations: ['Verifiera tillstånd', 'Genomför miljöutredning om behov finns'],
        },
        // Processer
        'process': {
          category: 'operation',
          type: 'Processdokumentation',
          baseScore: 74,
          findings: [
            { type: 'success', title: 'Processdokumentation', description: 'Kärnprocesser finns dokumenterade.' },
            { type: 'info', title: 'O2C-process', description: 'Order-to-cash-processen bör vara tydligt dokumenterad.' },
            { type: 'info', title: 'P2P-process', description: 'Procure-to-pay-processen påverkar rörelsekapitalet.' },
            { type: 'warning', title: 'Nyckelpersonsberoende', description: 'Finns processer som endast behärskas av enskilda individer?' },
          ],
          missingElements: ['Processkartor', 'Rollbeskrivningar', 'Kontrollpunkter'],
          recommendations: [
            'Dokumentera kritiska processer med ansvariga',
            'Identifiera nyckelpersonsberoenden och succession-plan',
            'Analysera automatiseringsmöjligheter post-transaktion',
          ],
        },

        // ===== YTTERLIGARE ANALYSTYPER =====
        
        // Koncern/Dotterbolag
        'koncern': {
          category: 'finans',
          type: 'Koncernredovisning',
          baseScore: 83,
          findings: [
            { type: 'success', title: 'Koncernbokslut', description: 'Konsoliderad redovisning för koncernen finns upprättad.' },
            { type: 'info', title: 'Elimineringar', description: 'Koncerninterna transaktioner och mellanhavanden ska vara eliminerade.' },
            { type: 'warning', title: 'Minoritetsintressen', description: 'Finns minoritetsägare i dotterbolag? Dessa kan komplicera transaktionen.' },
            { type: 'info', title: 'Förvärvsanalyser', description: 'Granska goodwill från tidigare förvärv och nedskrivningsbehov.' },
            { type: 'warning', title: 'Dotterbolagsgarantier', description: 'Kontrollera korsvisa garantier och borgensåtaganden inom koncernen.' },
          ],
          missingElements: ['Koncernstruktur-schema', 'Elimineringstabell', 'Förvärvskalkyler'],
          recommendations: [
            'Rita upp komplett koncernstruktur med ägarandelar',
            'Dokumentera alla koncerninterna avtal och prissättning',
            'Analysera möjlighet att sälja dotterbolag separat vs. hela koncernen',
            'Verifiera att alla dotterbolag kan överföras utan consent',
          ],
        },
        'dotterbolag': {
          category: 'juridik',
          type: 'Dotterbolagsstruktur',
          baseScore: 80,
          findings: [
            { type: 'success', title: 'Koncernstruktur', description: 'Dokumentation av dotterbolag och ägarstruktur finns.' },
            { type: 'info', title: 'Ägarandelar', description: 'Verifiera ägarandelar i varje dotterbolag mot registerutdrag.' },
            { type: 'warning', title: 'Joint ventures', description: 'Delägda bolag kan kräva samtycke från andra ägare vid försäljning.' },
            { type: 'warning', title: 'Utländska dotterbolag', description: 'Bolag i andra jurisdiktioner kräver lokal DD och kan ha särskilda regler.' },
          ],
          missingElements: ['Registerutdrag för alla bolag', 'Ägaravtal i delägda bolag'],
          recommendations: ['Hämta registerutdrag för samtliga dotterbolag', 'Granska ägaravtal för delägda bolag'],
        },

        // Bank & Finansiering
        'bankutdrag': {
          category: 'finans',
          type: 'Bankutdrag/Kassaverifikation',
          baseScore: 86,
          findings: [
            { type: 'success', title: 'Likviditetsverifikation', description: 'Bankutdrag verifierar kassabehållning vid specifikt datum.' },
            { type: 'info', title: 'Banksaldon', description: 'Samtliga bankkonton bör vara inkluderade - även i utländsk valuta.' },
            { type: 'warning', title: 'Checkkredit', description: 'Kontrollera utnyttjad checkkredit - detta är skuld, inte kassa.' },
            { type: 'info', title: 'Bankgarantier', description: 'Granska utfärdade bankgarantier som reducerar tillgänglig kredit.' },
            { type: 'warning', title: 'Spärrade medel', description: 'Finns medel som är spärrade som säkerhet? Dessa räknas inte som fri kassa.' },
          ],
          missingElements: ['Utdrag från alla banker', 'Bekräftelse på checkkredit', 'Lista över bankgarantier'],
          recommendations: [
            'Begär saldobekräftelse från banker vid locked box-datum eller closing',
            'Inventera samtliga bankkonton inklusive dotterbolag',
            'Dokumentera nettoskuld-beräkning (skulder minus kassa)',
            'Analysera normaliserat kassabehov för rörelsekapital',
          ],
        },
        'checkkredit': {
          category: 'finans',
          type: 'Checkkredit/Kreditfacilitet',
          baseScore: 79,
          findings: [
            { type: 'success', title: 'Kreditfacilitet', description: 'Dokumentation av revolverande kredit eller checkkredit finns.' },
            { type: 'info', title: 'Beviljat vs utnyttjat', description: 'Viktigt att särskilja beviljat belopp från faktiskt utnyttjad kredit.' },
            { type: 'warning', title: 'Change of control', description: 'De flesta kreditavtal har klausul som kräver bankens godkännande vid ägarförändring.' },
            { type: 'warning', title: 'Säkerheter', description: 'Vilka säkerheter har ställts? Företagsinteckning, aktier, etc.' },
          ],
          missingElements: ['Kreditavtal', 'Senaste covenant-beräkning'],
          recommendations: ['Kontakta bank tidigt om change of control', 'Förhandla om övertagande av kredit'],
        },
        'factoring': {
          category: 'finans',
          type: 'Factoring/Finansiering av fordringar',
          baseScore: 75,
          findings: [
            { type: 'success', title: 'Factoringavtal', description: 'Dokumentation av factoringupplägg finns.' },
            { type: 'info', title: 'Med eller utan regress', description: 'Factoring med regress innebär att säljaren bär kreditrisken - viktigt för skuldberäkning.' },
            { type: 'warning', title: 'Dolda skulder', description: 'Factoring kan dölja faktisk skuldsättning - analysera effekt på nettoskuld.' },
            { type: 'warning', title: 'Kundrelationer', description: 'Hur påverkas kundrelationen? Är kunderna medvetna?' },
          ],
          missingElements: ['Factoringavtal', 'Aktuellt utnyttjande', 'Kostnadsanalys'],
          recommendations: [
            'Analysera om factoring ska avslutas eller fortsätta efter transaktion',
            'Beräkna normaliserad rörelsekapitalnivå utan factoring',
            'Granska kunders acceptans av factoringbolag',
          ],
        },
        'leasing': {
          category: 'finans',
          type: 'Leasingavtal',
          baseScore: 77,
          findings: [
            { type: 'success', title: 'Leasingportfölj', description: 'Dokumentation av leasingavtal finns (bilar, maskiner, etc.).' },
            { type: 'info', title: 'Finansiell vs operationell', description: 'Klassificering påverkar balansräkning under IFRS 16/K3.' },
            { type: 'warning', title: 'Restvärdesgaranti', description: 'Kontrollera eventuella restvärdesåtaganden vid avtalets slut.' },
            { type: 'warning', title: 'Överlåtelse', description: 'Kan leasingavtal överlåtas eller måste de avslutas vid försäljning?' },
            { type: 'info', title: 'Off-balance sheet', description: 'Operationella leasingavtal kan dölja betydande åtaganden.' },
          ],
          missingElements: ['Leasingmatris med alla avtal', 'Betalningsplan per avtal'],
          recommendations: [
            'Skapa matris över alla leasingavtal med slutdatum och månadskostnad',
            'Analysera total leasingskuld för skuldberäkning',
            'Kontrollera förtida uppsägningsvillkor och kostnader',
          ],
        },

        // Kommersiellt utökat
        'orderbok': {
          category: 'kommersiellt',
          type: 'Orderbok/Backlog',
          baseScore: 82,
          findings: [
            { type: 'success', title: 'Orderstatus', description: 'Dokumentation av bekräftade order och backlog finns.' },
            { type: 'info', title: 'Leveranstider', description: 'Granska planerade leveransdatum och risk för förseningar.' },
            { type: 'warning', title: 'Annulleringsvillkor', description: 'Kan kunder annullera order? Vilka kostnader/penalties?' },
            { type: 'info', title: 'Marginaler', description: 'Analysera marginaler per order - finns olönsamma projekt?' },
            { type: 'warning', title: 'Koncentration', description: 'Stor backlog hos enstaka kunder = risk om kunden avbeställer.' },
          ],
          missingElements: ['Orderlistning med värde och marginal', 'Leveransplan', 'Kundrisk-bedömning'],
          recommendations: [
            'Värdera orderboken och dess säkerhet (bekräftad vs pipeline)',
            'Analysera historisk träffsäkerhet i orderprognoser',
            'Identifiera order med change of control-klausuler',
          ],
        },
        'pipeline': {
          category: 'kommersiellt',
          type: 'Säljpipeline',
          baseScore: 73,
          findings: [
            { type: 'success', title: 'Pipeline-dokumentation', description: 'Säljpipeline med affärsmöjligheter finns dokumenterad.' },
            { type: 'info', title: 'Sannolikhetsviktning', description: 'Är sannolikheter per fas realistiska baserat på historisk conversion rate?' },
            { type: 'warning', title: 'Nyckelpersonsberoende', description: 'Hur mycket av pipelinen är beroende av specifika säljare som kan lämna?' },
            { type: 'info', title: 'Avslutsdatum', description: 'Granska förväntade avslutsdatum - är de realistiska?' },
            { type: 'warning', title: 'Kvalitet', description: 'Finns det "zombieaffärer" som legat i pipeline länge utan framsteg?' },
          ],
          missingElements: ['Historisk conversion rate per fas', 'Säljcykel-analys'],
          recommendations: [
            'Analysera historisk träffsäkerhet i pipeline-prognoser',
            'Intervjua säljare om status på större affärer',
            'Rensa pipeline från osannolika affärer före presentation',
          ],
        },
        'prislista': {
          category: 'kommersiellt',
          type: 'Prislista/Prissättning',
          baseScore: 78,
          findings: [
            { type: 'success', title: 'Prissättning dokumenterad', description: 'Prislistor och prismodeller finns dokumenterade.' },
            { type: 'info', title: 'Rabattstruktur', description: 'Granska rabattnivåer och vem som har mandat att ge rabatter.' },
            { type: 'warning', title: 'Prisökningar', description: 'Har bolaget möjlighet att höja priser? Analysera historiska prishöjningar.' },
            { type: 'info', title: 'Konkurrenskraft', description: 'Hur förhåller sig priserna till konkurrenternas?' },
            { type: 'warning', title: 'Kundspecifika priser', description: 'Finns priser låsta i avtal som inte kan ändras?' },
          ],
          missingElements: ['Rabattmatris', 'Historiska prishöjningar', 'Konkurrentanalys'],
          recommendations: [
            'Dokumentera prishöjningsmöjligheter per kundsegment',
            'Analysera marginalstruktur per produkt/tjänst',
            'Identifiera priskänsliga kunder',
          ],
        },
        'sla': {
          category: 'kommersiellt',
          type: 'SLA/Servicenivåavtal',
          baseScore: 77,
          findings: [
            { type: 'success', title: 'SLA-dokumentation', description: 'Servicenivåavtal med definierade KPIer finns.' },
            { type: 'info', title: 'Uppfyllnadsgrad', description: 'Granska historisk SLA-uppfyllnad - risk för vitesanspråk?' },
            { type: 'warning', title: 'Vitesklausuler', description: 'Vilka ekonomiska konsekvenser vid SLA-brott?' },
            { type: 'warning', title: 'Övertagande', description: 'Kan SLA-åtaganden hållas efter ägarförändring?' },
          ],
          missingElements: ['SLA-uppföljningsrapporter', 'Historiska SLA-brott', 'Vitesberäkningar'],
          recommendations: [
            'Verifiera att SLA-nivåer är uppnåbara även efter transaktion',
            'Analysera trend i SLA-uppfyllnad',
            'Identifiera kunder med särskilt krävande SLA',
          ],
        },
        'nps': {
          category: 'kommersiellt',
          type: 'Kundnöjdhet/NPS',
          baseScore: 79,
          findings: [
            { type: 'success', title: 'Kundnöjdhetsdata', description: 'Net Promoter Score eller motsvarande mätning finns.' },
            { type: 'info', title: 'Trend', description: 'Hur har NPS utvecklats över tid? Förbättring eller försämring?' },
            { type: 'info', title: 'Branschjämförelse', description: 'Hur förhåller sig NPS till branschsnitt?' },
            { type: 'warning', title: 'Detractors', description: 'Vilka kunder är missnöjda och varför? Risk för churn.' },
          ],
          missingElements: ['NPS-trend över tid', 'Kundfeedback-sammanställning'],
          recommendations: [
            'Analysera orsaker till låga betyg och åtgärdsplaner',
            'Koppla NPS till kundbortfall för prognoser',
          ],
        },
        'reklamation': {
          category: 'kommersiellt',
          type: 'Reklamationer/Garantier',
          baseScore: 74,
          findings: [
            { type: 'success', title: 'Reklamationshantering', description: 'Dokumentation av reklamationer och garantiärenden finns.' },
            { type: 'info', title: 'Garantikostnader', description: 'Analysera historiska garantikostnader som andel av omsättning.' },
            { type: 'warning', title: 'Produktansvar', description: 'Finns risk för produktansvarskrav? Särskilt för B2C-produkter.' },
            { type: 'warning', title: 'Reservering', description: 'Är tillräcklig reservering gjord för framtida garantiåtaganden?' },
          ],
          missingElements: ['Garantikostnadshistorik', 'Produktansvarskrav', 'Reserveringsberäkning'],
          recommendations: [
            'Beräkna normal garantikostnad som % av omsättning',
            'Analysera produkter med hög reklamationsfrekvens',
            'Granska produktansvarsförsäkring',
          ],
        },

        // Varumärken & Domäner
        'varumärke': {
          category: 'it',
          type: 'Varumärken',
          baseScore: 81,
          findings: [
            { type: 'success', title: 'Varumärkesregistrering', description: 'Varumärken är registrerade hos PRV, EUIPO eller WIPO.' },
            { type: 'info', title: 'Geografisk täckning', description: 'I vilka länder är varumärket skyddat? Täcker det marknaden?' },
            { type: 'warning', title: 'Förnyelse', description: 'Kontrollera förnyelsedatum - varumärken måste förnyas regelbundet.' },
            { type: 'warning', title: 'Invändningar', description: 'Pågår invändningsärenden eller tvister om varumärket?' },
            { type: 'info', title: 'Ägarskap', description: 'Verifiera att bolaget (inte ägaren personligen) äger varumärkena.' },
          ],
          missingElements: ['Registreringsbevis', 'Lista över alla klasser', 'Förnyelseplan'],
          recommendations: [
            'Inventera alla varumärken med registreringsnummer och länder',
            'Verifiera ägarskap via PRV/EUIPO',
            'Analysera om skyddet täcker relevanta marknader',
          ],
        },
        'domän': {
          category: 'it',
          type: 'Domännamn',
          baseScore: 80,
          findings: [
            { type: 'success', title: 'Domänportfölj', description: 'Dokumentation av registrerade domännamn finns.' },
            { type: 'info', title: 'Registrar', description: 'Vilken registrar och vem är registrerad ägare?' },
            { type: 'warning', title: 'Ägarskap', description: 'Domäner bör ägas av bolaget, inte privatpersoner.' },
            { type: 'warning', title: 'Förnyelse', description: 'Kontrollera utgångsdatum - domäner kan kapas om förnyelse missas.' },
          ],
          missingElements: ['Komplett domänlista', 'Registrar-inloggningar', 'Förnyelsekalender'],
          recommendations: [
            'Säkerställ att alla kritiska domäner ägs av bolaget',
            'Konsolidera till en registrar för enklare hantering',
            'Aktivera auto-renewal för viktiga domäner',
          ],
        },

        // Organisation & Personal
        'organisationsschema': {
          category: 'hr',
          type: 'Organisationsschema',
          baseScore: 81,
          findings: [
            { type: 'success', title: 'Organisationsstruktur', description: 'Organisationsschema med rapporteringslinjer finns dokumenterat.' },
            { type: 'info', title: 'Ledningsgrupp', description: 'Identifiera nyckelpersoner och deras roller i organisationen.' },
            { type: 'warning', title: 'Vakanser', description: 'Finns kritiska roller som är vakanta eller under rekrytering?' },
            { type: 'info', title: 'Span of control', description: 'Analysera om organisationen är för platt eller för hierarkisk.' },
          ],
          missingElements: ['Aktuellt organisationsschema', 'Ledningsgruppens sammansättning'],
          recommendations: [
            'Identifiera nyckelpersoner och deras retention-risk',
            'Analysera beroende av ägare/grundare i daglig verksamhet',
            'Planera succession för kritiska roller',
          ],
        },
        'cv': {
          category: 'hr',
          type: 'CV/Nyckelpersoner',
          baseScore: 78,
          findings: [
            { type: 'success', title: 'Ledningsprofiler', description: 'CV och bakgrundsinformation för nyckelpersoner finns.' },
            { type: 'info', title: 'Erfarenhet', description: 'Granska relevant branscherfarenhet och track record.' },
            { type: 'warning', title: 'Konkurrensklausuler', description: 'Har nyckelpersoner konkurrensklausuler från tidigare anställningar?' },
            { type: 'warning', title: 'Referenstagning', description: 'Bakgrundskontroll kan avslöja problem som inte framgår av CV.' },
          ],
          missingElements: ['CV för alla i ledningsgruppen', 'Bakgrundskontroller'],
          recommendations: [
            'Genomför bakgrundskontroller på ledning före closing',
            'Analysera retention-strategi för nyckelpersoner',
            'Diskutera stay-bonus eller lock-up för kritiska personer',
          ],
        },
        'kollektivavtal': {
          category: 'hr',
          type: 'Kollektivavtal',
          baseScore: 77,
          findings: [
            { type: 'success', title: 'Kollektivavtalstillhörighet', description: 'Information om kollektivavtal finns dokumenterad.' },
            { type: 'info', title: 'Arbetsgivarorganisation', description: 'Vilket arbetsgivarförbund och vilka avtal gäller?' },
            { type: 'warning', title: 'MBL-förhandlingar', description: 'Företagsförsäljning kräver MBL-förhandling (§11) med facket.' },
            { type: 'info', title: 'Övergång av verksamhet', description: 'Vid inkråmsförsäljning gäller regler om övergång av verksamhet (LAS §6b).' },
          ],
          missingElements: ['Kollektivavtal', 'Facklig kontaktperson', 'MBL-protokoll'],
          recommendations: [
            'Planera MBL-förhandling i god tid före transaktion',
            'Analysera påverkan på anställningsvillkor',
            'Granska eventuella lokala avtal',
          ],
        },
        'semesterskuld': {
          category: 'hr',
          type: 'Semesterskuld',
          baseScore: 82,
          findings: [
            { type: 'success', title: 'Semesterskuld beräknad', description: 'Upplupen semester- och kompskuld är dokumenterad.' },
            { type: 'info', title: 'Per anställd', description: 'Granska fördelning - har vissa anställda oproportionerligt mycket sparad semester?' },
            { type: 'warning', title: 'Obegränsad semester', description: 'Om obegränsad semester-policy finns - hur hanteras skulden?' },
            { type: 'info', title: 'Closing-justering', description: 'Semesterskuld är ofta föremål för justering av köpeskilling.' },
          ],
          missingElements: ['Semesterskuld per person', 'Beräkningsunderlag'],
          recommendations: [
            'Beräkna semesterskuld vid locked box/closing',
            'Analysera om skulden är normaliserad eller ovanligt hög',
            'Definiera hantering i SPA (inkluderad i pris eller separat justering)',
          ],
        },

        // Tillstånd & Certifikat
        'tillstånd': {
          category: 'operation',
          type: 'Tillstånd/Licenser',
          baseScore: 81,
          findings: [
            { type: 'success', title: 'Verksamhetstillstånd', description: 'Nödvändiga tillstånd för verksamheten finns dokumenterade.' },
            { type: 'info', title: 'Giltighetstid', description: 'Kontrollera giltighetstid och förnyelseprocess.' },
            { type: 'warning', title: 'Överlåtbarhet', description: 'Kan tillstånd överföras vid ägarförändring eller måste nya sökas?' },
            { type: 'warning', title: 'Villkorsförändringar', description: 'Kan myndigheten ändra villkor eller återkalla tillstånd?' },
          ],
          missingElements: ['Tillståndslista', 'Förnyelsekalender', 'Myndighetskontakter'],
          recommendations: [
            'Inventera alla tillstånd och licenser verksamheten är beroende av',
            'Kontakta myndigheter om tillstånds överlåtbarhet',
            'Planera för eventuella nya ansökningar',
          ],
        },
        'iso': {
          category: 'operation',
          type: 'ISO-certifiering',
          baseScore: 83,
          findings: [
            { type: 'success', title: 'Certifiering aktiv', description: 'ISO-certifiering (9001/14001/27001 eller annan) är aktiv.' },
            { type: 'info', title: 'Certifieringsorgan', description: 'Verifiera att certifieringsorganet är ackrediterat.' },
            { type: 'warning', title: 'Giltighetstid', description: 'Kontrollera när nästa recertifiering sker och om det finns avvikelser.' },
            { type: 'info', title: 'Kundkrav', description: 'Är certifieringen ett krav från kunder? Vad händer om den försvinner?' },
          ],
          missingElements: ['Certifikat', 'Senaste revisionsrapport', 'Avvikelselista'],
          recommendations: [
            'Verifiera att certifieringen upprätthålls efter transaktion',
            'Granska eventuella avvikelser från senaste revision',
            'Analysera vilka kunder som kräver certifiering',
          ],
        },
        'certifikat': {
          category: 'operation',
          type: 'Certifieringar',
          baseScore: 80,
          findings: [
            { type: 'success', title: 'Certifieringsstatus', description: 'Dokumentation av certifieringar finns.' },
            { type: 'info', title: 'Relevans', description: 'Vilka certifieringar är affärskritiska för kundrelationer?' },
            { type: 'warning', title: 'Underhåll', description: 'Certifieringar kräver löpande underhåll och revisioner.' },
          ],
          missingElements: ['Certifikatförteckning', 'Revisionskalender'],
          recommendations: ['Lista alla certifieringar med giltighetstid', 'Planera för recertifieringar'],
        },

        // M&A & Värdering
        'värdering': {
          category: 'finans',
          type: 'Värderingsrapport',
          baseScore: 79,
          findings: [
            { type: 'success', title: 'Tidigare värdering', description: 'Värderingsrapport eller indikativ värdering finns.' },
            { type: 'info', title: 'Värderingsmetod', description: 'Granska vilken metod som använts (DCF, multiplar, etc.).' },
            { type: 'warning', title: 'Aktualitet', description: 'Hur gammal är värderingen? Marknadsförutsättningar kan ha ändrats.' },
            { type: 'info', title: 'Antaganden', description: 'Vilka antaganden gjordes? Stämmer de fortfarande?' },
          ],
          missingElements: ['Värderingsunderlag', 'Antagandedokumentation'],
          recommendations: [
            'Uppdatera värdering med aktuella siffror',
            'Analysera skillnader mot tidigare värdering',
            'Förbered för köparens egen värderingsmodell',
          ],
        },
        'information memorandum': {
          category: 'kommersiellt',
          type: 'Information Memorandum',
          baseScore: 81,
          findings: [
            { type: 'success', title: 'IM upprättat', description: 'Information Memorandum/säljprospekt finns för transaktionen.' },
            { type: 'info', title: 'Investment highlights', description: 'Är de viktigaste värdedrivarna tydligt kommunicerade?' },
            { type: 'warning', title: 'Verifierbarhet', description: 'Alla påståenden i IM måste kunna verifieras i DD-materialet.' },
            { type: 'warning', title: 'Disclaimer', description: 'Säkerställ att korrekta friskrivningar finns.' },
          ],
          missingElements: ['Fullständigt IM', 'Underliggande dataunderlag'],
          recommendations: [
            'Säkerställ att alla uppgifter i IM kan styrkas med dokument',
            'Granska med juridisk rådgivare innan distribution',
          ],
        },
        'im': {
          category: 'kommersiellt',
          type: 'Information Memorandum',
          baseScore: 81,
          findings: [
            { type: 'success', title: 'Säljdokumentation', description: 'IM/säljprospekt finns upprättat.' },
            { type: 'warning', title: 'Verifierbarhet', description: 'Alla påståenden måste kunna backas upp.' },
          ],
          missingElements: ['Dataunderlag'],
          recommendations: ['Verifiera alla siffror mot DD-material'],
        },
        'nda': {
          category: 'juridik',
          type: 'Sekretessavtal/NDA',
          baseScore: 84,
          findings: [
            { type: 'success', title: 'NDA signerat', description: 'Sekretessavtal finns på plats med motpart.' },
            { type: 'info', title: 'Omfattning', description: 'Granska vad som omfattas och vad som är undantaget.' },
            { type: 'info', title: 'Giltighetstid', description: 'Hur länge gäller sekretessen? Normalt 2-5 år.' },
            { type: 'warning', title: 'Sanktioner', description: 'Vilka är konsekvenserna vid brott mot NDA?' },
          ],
          missingElements: ['Signerat NDA', 'Lista över mottagare av konfidentiell info'],
          recommendations: [
            'Säkerställ att alla som får DD-info har signerat NDA',
            'Spåra vilka dokument som delats med vem',
          ],
        },
        'loi': {
          category: 'juridik',
          type: 'Letter of Intent/Avsiktsförklaring',
          baseScore: 82,
          findings: [
            { type: 'success', title: 'LOI signerat', description: 'Letter of Intent eller term sheet finns med potentiell köpare.' },
            { type: 'info', title: 'Bindande vs icke-bindande', description: 'Vilka delar är juridiskt bindande (vanligen exklusivitet, sekretess)?' },
            { type: 'warning', title: 'Exklusivitet', description: 'Finns exklusivitetsperiod som hindrar parallella förhandlingar?' },
            { type: 'info', title: 'Villkor', description: 'Vilka förutsättningar (conditions) gäller för att gå vidare?' },
          ],
          missingElements: ['Signerat LOI', 'Term sheet'],
          recommendations: [
            'Granska LOI med juridisk rådgivare',
            'Tydliggör vad som är bindande respektive indikativt',
          ],
        },

        // ===== ÄNNU FLER ANALYSTYPER =====

        // Revision & Internkontroll
        'revisionsrapport': {
          category: 'finans',
          type: 'Revisionsrapport/Intern revision',
          baseScore: 78,
          findings: [
            { type: 'success', title: 'Revisionsunderlag', description: 'Revisionsrapport eller management letter finns tillgänglig.' },
            { type: 'info', title: 'Observationer', description: 'Granska revisorns observationer och rekommendationer.' },
            { type: 'warning', title: 'Väsentliga brister', description: 'Finns det allvarliga brister i intern kontroll som rapporterats?' },
            { type: 'info', title: 'Uppföljning', description: 'Hur har tidigare års observationer åtgärdats?' },
            { type: 'warning', title: 'Going concern', description: 'Har revisorn uttryckt tvivel om fortsatt drift?' },
          ],
          missingElements: ['Management letters 3 år', 'Åtgärdsplan för brister'],
          recommendations: [
            'Begär management letters för de senaste 3 åren',
            'Dokumentera åtgärder för rapporterade brister',
            'Analysera mönster i återkommande observationer',
          ],
        },
        'internkontroll': {
          category: 'finans',
          type: 'Internkontroll',
          baseScore: 76,
          findings: [
            { type: 'success', title: 'Kontrollramverk', description: 'Dokumentation av interna kontroller finns.' },
            { type: 'info', title: 'Segregation of duties', description: 'Granska uppdelning av arbetsuppgifter för att förhindra bedrägerier.' },
            { type: 'warning', title: 'Manuella kontroller', description: 'Manuella kontroller är mer riskfyllda än automatiserade.' },
            { type: 'info', title: 'Attestrutiner', description: 'Finns tydliga attestgränser och behörigheter?' },
          ],
          missingElements: ['Kontrollmatris', 'Behörighetstabell'],
          recommendations: [
            'Dokumentera samtliga väsentliga kontroller',
            'Analysera automatiseringspotential',
            'Granska behörigheter i ekonomisystem',
          ],
        },

        // Rapportering
        'kvartalsrapport': {
          category: 'finans',
          type: 'Kvartalsrapport/Delårsrapport',
          baseScore: 82,
          findings: [
            { type: 'success', title: 'Periodisk rapportering', description: 'Kvartalsvis finansiell rapport finns tillgänglig.' },
            { type: 'info', title: 'Jämförelser', description: 'Analysera utveckling kvartal-över-kvartal och mot föregående år.' },
            { type: 'info', title: 'Säsongsmönster', description: 'Kvartalsdata visar säsongsvariationer i verksamheten.' },
            { type: 'warning', title: 'Ej reviderad', description: 'Kvartalsrapporter är normalt ej reviderade - verifiera nyckeltal.' },
          ],
          missingElements: ['Kvartalsrapporter 2-3 år', 'Segmentuppdelning'],
          recommendations: [
            'Beräkna LTM från kvartalsdata',
            'Analysera kvartalstrender för värderingsunderlag',
          ],
        },
        'kpi': {
          category: 'finans',
          type: 'KPI-rapport/Dashboard',
          baseScore: 79,
          findings: [
            { type: 'success', title: 'KPI-uppföljning', description: 'Nyckeltal och KPIer följs upp regelbundet.' },
            { type: 'info', title: 'Relevanta mått', description: 'Granska vilka KPIer som används och om de är branschrelevanta.' },
            { type: 'info', title: 'Målvärden', description: 'Finns mål för respektive KPI och hur väl uppnås de?' },
            { type: 'warning', title: 'Datakvalitet', description: 'Verifiera att KPI-beräkningar är korrekta och konsekventa.' },
          ],
          missingElements: ['KPI-definitioner', 'Historiska värden', 'Branschjämförelse'],
          recommendations: [
            'Dokumentera hur varje KPI beräknas',
            'Jämför KPIer med branschsnitt',
            'Identifiera ledande vs eftersläpande indikatorer',
          ],
        },
        'styrelserapport': {
          category: 'finans',
          type: 'Styrelserapport/Ledningsrapport',
          baseScore: 77,
          findings: [
            { type: 'success', title: 'Ledningsrapportering', description: 'Rapportering till styrelse/ledning finns dokumenterad.' },
            { type: 'info', title: 'Innehåll', description: 'Vilken information rapporteras? Finansiellt, operativt, strategiskt?' },
            { type: 'warning', title: 'Frekvens', description: 'Hur ofta rapporteras? Månatlig rapportering är standard.' },
            { type: 'info', title: 'Beslutsunderlag', description: 'Används rapporterna för aktiv styrning av verksamheten?' },
          ],
          missingElements: ['Rapportmall', 'Historiska rapporter'],
          recommendations: [
            'Granska kvaliteten på ledningsrapportering',
            'Analysera hur snabbt avvikelser identifieras och hanteras',
          ],
        },

        // Strategi & Affärsplan
        'affärsplan': {
          category: 'kommersiellt',
          type: 'Affärsplan/Business Plan',
          baseScore: 75,
          findings: [
            { type: 'success', title: 'Strategisk planering', description: 'Affärsplan eller strategidokument finns.' },
            { type: 'info', title: 'Vision och mål', description: 'Är vision, mission och strategiska mål tydligt definierade?' },
            { type: 'warning', title: 'Aktualitet', description: 'Är affärsplanen uppdaterad och relevant för nuläget?' },
            { type: 'info', title: 'Genomförbarhet', description: 'Analysera realismen i tillväxtplaner och finansiella prognoser.' },
          ],
          missingElements: ['Uppdaterad affärsplan', 'Handlingsplan'],
          recommendations: [
            'Verifiera att planen reflekterar aktuell strategi',
            'Analysera historisk träffsäkerhet i prognoser',
            'Identifiera synergier med potentiella köpare',
          ],
        },
        'strategi': {
          category: 'kommersiellt',
          type: 'Strategidokument',
          baseScore: 74,
          findings: [
            { type: 'success', title: 'Strategisk riktning', description: 'Strategidokumentation finns tillgänglig.' },
            { type: 'info', title: 'Tillväxtstrategi', description: 'Organisk vs förvärvsdriven tillväxt - vad är planen?' },
            { type: 'warning', title: 'Marknadsposition', description: 'Hur ser konkurrenslandskapet ut och vad är bolagets position?' },
            { type: 'info', title: 'Differentiering', description: 'Vad är bolagets unika säljargument (USP)?' },
          ],
          missingElements: ['SWOT-analys', 'Konkurrentanalys'],
          recommendations: ['Uppdatera med aktuell marknadsanalys', 'Definiera tydliga strategiska initiativ'],
        },
        'swot': {
          category: 'kommersiellt',
          type: 'SWOT-analys',
          baseScore: 73,
          findings: [
            { type: 'success', title: 'Situationsanalys', description: 'SWOT-analys av styrkor, svagheter, möjligheter och hot finns.' },
            { type: 'info', title: 'Styrkor', description: 'Vilka är bolagets viktigaste konkurrensfördelar?' },
            { type: 'warning', title: 'Svagheter', description: 'Är svagheterna väl identifierade och finns åtgärdsplaner?' },
            { type: 'info', title: 'Externa faktorer', description: 'Möjligheter och hot ger kontext för framtida potential.' },
          ],
          missingElements: ['Handlingsplan baserad på SWOT'],
          recommendations: ['Koppla SWOT till konkreta strategiska initiativ', 'Prioritera åtgärder för svagheter'],
        },
        'marknadsanalys': {
          category: 'kommersiellt',
          type: 'Marknadsanalys',
          baseScore: 76,
          findings: [
            { type: 'success', title: 'Marknadsöversikt', description: 'Analys av målmarknaden finns dokumenterad.' },
            { type: 'info', title: 'Marknadsstorlek', description: 'TAM/SAM/SOM - hur stor är den adresserbara marknaden?' },
            { type: 'info', title: 'Tillväxttakt', description: 'Vilken tillväxt förväntas i marknaden de kommande åren?' },
            { type: 'warning', title: 'Källa', description: 'Är marknadsdata från trovärdiga källor (branschrapporter, analys)?' },
          ],
          missingElements: ['Marknadsdata med källor', 'Segmentanalys'],
          recommendations: [
            'Använd tredjepartskällor för att validera marknadsantaganden',
            'Analysera marknadsandel och positionering',
          ],
        },
        'konkurrent': {
          category: 'kommersiellt',
          type: 'Konkurrentanalys',
          baseScore: 74,
          findings: [
            { type: 'success', title: 'Konkurrensbild', description: 'Analys av konkurrenter finns dokumenterad.' },
            { type: 'info', title: 'Huvudkonkurrenter', description: 'Vilka är de viktigaste konkurrenterna och deras styrkor?' },
            { type: 'warning', title: 'Prisjämförelse', description: 'Hur förhåller sig bolagets priser till konkurrenternas?' },
            { type: 'info', title: 'Marknadsandelar', description: 'Hur stora är konkurrenternas marknadsandelar?' },
          ],
          missingElements: ['Detaljerad konkurrentmatris', 'Win/loss-analys'],
          recommendations: ['Dokumentera konkurrensfördelar', 'Analysera win/loss mot konkurrenter'],
        },

        // Avtal - utökade typer
        'franchiseavtal': {
          category: 'juridik',
          type: 'Franchiseavtal',
          baseScore: 74,
          findings: [
            { type: 'success', title: 'Franchiseupplägg', description: 'Franchiseavtal med villkor finns dokumenterat.' },
            { type: 'info', title: 'Avgifter', description: 'Granska franchiseavgifter (royalty, marknadsföring, etc.).' },
            { type: 'warning', title: 'Territoriella rättigheter', description: 'Vilka geografiska begränsningar gäller?' },
            { type: 'warning', title: 'Change of control', description: 'Kan franchisen överlåtas vid ägarförändring?' },
            { type: 'info', title: 'Uppsägning', description: 'Under vilka villkor kan avtalet sägas upp?' },
          ],
          missingElements: ['Franchisemanual', 'Ekonomisk historik'],
          recommendations: ['Verifiera överlåtbarhet', 'Granska lojalitetskrav och konkurrensförbud'],
        },
        'distributör': {
          category: 'juridik',
          type: 'Distributörsavtal',
          baseScore: 76,
          findings: [
            { type: 'success', title: 'Distributionsavtal', description: 'Avtal med distributörer finns dokumenterade.' },
            { type: 'info', title: 'Exklusivitet', description: 'Finns exklusiva distributörer för vissa marknader?' },
            { type: 'warning', title: 'Minimikrav', description: 'Finns minimiköpkrav eller prestationsmål?' },
            { type: 'warning', title: 'Lagerhållning', description: 'Vem äger lagret hos distributören?' },
          ],
          missingElements: ['Distributörsmatris', 'Försäljningsstatistik per distributör'],
          recommendations: ['Kartlägg alla distributörsavtal', 'Analysera beroendegrad'],
        },
        'agentavtal': {
          category: 'juridik',
          type: 'Agentavtal',
          baseScore: 75,
          findings: [
            { type: 'success', title: 'Agentrelationer', description: 'Agentavtal finns dokumenterade.' },
            { type: 'info', title: 'Provision', description: 'Vilka provisionsnivåer gäller och på vilka affärer?' },
            { type: 'warning', title: 'Avgångsvederlag', description: 'OBS! Handelsagenturlagen ger agenter rätt till avgångsvederlag vid uppsägning.' },
            { type: 'warning', title: 'Konkurrensbegränsning', description: 'Gäller konkurrensförbud efter avtalets upphörande?' },
          ],
          missingElements: ['Agentförteckning', 'Provisionsstruktur'],
          recommendations: [
            'Beräkna potentiellt avgångsvederlag vid uppsägning',
            'Granska geografiska rättigheter och överlappningar',
          ],
        },
        'outsourcing': {
          category: 'operation',
          type: 'Outsourcingavtal',
          baseScore: 74,
          findings: [
            { type: 'success', title: 'Outsourcingrelationer', description: 'Avtal för outsourcade funktioner finns.' },
            { type: 'info', title: 'Omfattning', description: 'Vilka funktioner är outsourcade (IT, lön, produktion, etc.)?' },
            { type: 'warning', title: 'Beroende', description: 'Hur kritiska är de outsourcade funktionerna för verksamheten?' },
            { type: 'warning', title: 'Exit-klausuler', description: 'Vad kostar det att avsluta eller byta leverantör?' },
            { type: 'info', title: 'Dataskydd', description: 'Behandlar leverantören personuppgifter? Finns biträdesavtal?' },
          ],
          missingElements: ['Leverantörsbedömning', 'SLA-uppföljning'],
          recommendations: [
            'Dokumentera alla outsourcade funktioner och leverantörer',
            'Analysera lock-in-effekter och byteskostnader',
            'Granska GDPR-compliance hos leverantörer',
          ],
        },
        'ramavtal': {
          category: 'juridik',
          type: 'Ramavtal',
          baseScore: 79,
          findings: [
            { type: 'success', title: 'Ramavtal', description: 'Ramavtal med kunder eller leverantörer finns.' },
            { type: 'info', title: 'Avtalsperiod', description: 'Hur lång är avtalsperioden och eventuella förlängningar?' },
            { type: 'warning', title: 'Volymåtaganden', description: 'Finns volymåtaganden som måste uppfyllas?' },
            { type: 'info', title: 'Prismekanismer', description: 'Hur justeras priser under avtalsperioden?' },
          ],
          missingElements: ['Avtalssammanställning', 'Volymuppföljning'],
          recommendations: ['Kartlägg alla ramavtal med värde och löptid', 'Analysera förnyelsesannolikhet'],
        },
        'offentlig upphandling': {
          category: 'kommersiellt',
          type: 'Offentlig upphandling',
          baseScore: 77,
          findings: [
            { type: 'success', title: 'Offentliga kontrakt', description: 'Avtal från offentlig upphandling finns.' },
            { type: 'info', title: 'LOU-villkor', description: 'Avtal lyder under Lagen om offentlig upphandling med särskilda villkor.' },
            { type: 'warning', title: 'Överlåtelse', description: 'Upphandlade avtal kan normalt inte överlåtas fritt - verifiera med myndigheten.' },
            { type: 'warning', title: 'Förnyelserisk', description: 'Vid ny upphandling finns risk att förlora kontraktet.' },
          ],
          missingElements: ['Upphandlingsdokumentation', 'Förnyelsekalender'],
          recommendations: [
            'Kontakta upphandlande myndigheter om tillåtlighet av överlåtelse',
            'Analysera förnyelsedatum och konkurrenssituation',
          ],
        },

        // Personal - utökat
        'personalomsättning': {
          category: 'hr',
          type: 'Personalomsättning/Retention',
          baseScore: 77,
          findings: [
            { type: 'success', title: 'Personalomsättningsdata', description: 'Statistik över personalomsättning finns.' },
            { type: 'info', title: 'Branschjämförelse', description: 'Hur förhåller sig omsättningen till branschsnitt?' },
            { type: 'warning', title: 'Nyckelpersoner', description: 'Har nyckelpersoner lämnat bolaget nyligen? Varför?' },
            { type: 'info', title: 'Kostnad', description: 'Beräkna kostnad för rekrytering och upplärning.' },
          ],
          missingElements: ['Historisk omsättning', 'Exit-intervju-sammanställning'],
          recommendations: [
            'Analysera orsaker till uppsägningar',
            'Identifiera avdelningar/roller med hög omsättning',
            'Implementera retention-program för nyckelpersoner',
          ],
        },
        'medarbetarundersökning': {
          category: 'hr',
          type: 'Medarbetarundersökning',
          baseScore: 76,
          findings: [
            { type: 'success', title: 'Medarbetarengagemang', description: 'Undersökning av medarbetarnöjdhet finns.' },
            { type: 'info', title: 'Svarsfrekvens', description: 'Hög svarsfrekvens indikerar engagemang.' },
            { type: 'warning', title: 'Problemområden', description: 'Vilka områden får låga betyg? Finns åtgärdsplaner?' },
            { type: 'info', title: 'Trend', description: 'Hur har resultaten utvecklats över tid?' },
          ],
          missingElements: ['Undersökningsresultat', 'Handlingsplan'],
          recommendations: ['Analysera trend i medarbetarnöjdhet', 'Prioritera åtgärder för lågt rankade områden'],
        },
        'successionsplan': {
          category: 'hr',
          type: 'Successionsplanering',
          baseScore: 73,
          findings: [
            { type: 'success', title: 'Successionsplan', description: 'Planering för efterträdare till nyckelroller finns.' },
            { type: 'warning', title: 'Kritiska roller', description: 'Finns identifierade efterträdare för alla kritiska positioner?' },
            { type: 'info', title: 'Utvecklingsprogram', description: 'Hur förbereds interna kandidater för avancemang?' },
            { type: 'warning', title: 'Ägarberoende', description: 'Om ägare har operativ roll - finns succession planerad?' },
          ],
          missingElements: ['Successionsmatris', 'Utvecklingsplaner'],
          recommendations: [
            'Identifiera kritiska roller utan backup',
            'Särskilt viktigt att planera för övergång från ägare/grundare',
          ],
        },
        'utbildning': {
          category: 'hr',
          type: 'Utbildning/Kompetensutveckling',
          baseScore: 75,
          findings: [
            { type: 'success', title: 'Utbildningsdokumentation', description: 'Utbildningsplaner och genomförd utbildning finns.' },
            { type: 'info', title: 'Obligatorisk utbildning', description: 'Finns branschspecifika certifieringar som krävs?' },
            { type: 'warning', title: 'Kompetensrisk', description: 'Finns kritisk kompetens hos enskilda individer?' },
            { type: 'info', title: 'Budget', description: 'Vilken budget avsätts för kompetensutveckling?' },
          ],
          missingElements: ['Utbildningsmatris', 'Certifieringsregister'],
          recommendations: ['Dokumentera kritiska kompetenser', 'Säkerställ att nödvändiga certifieringar är aktuella'],
        },

        // R&D och Produktutveckling
        'rd': {
          category: 'it',
          type: 'R&D/Utveckling',
          baseScore: 74,
          findings: [
            { type: 'success', title: 'Utvecklingsverksamhet', description: 'Dokumentation av R&D-aktiviteter finns.' },
            { type: 'info', title: 'Investeringar', description: 'Hur stor andel av omsättningen investeras i R&D?' },
            { type: 'info', title: 'Projekt', description: 'Vilka utvecklingsprojekt pågår och vad är deras status?' },
            { type: 'warning', title: 'IP-skydd', description: 'Skyddas utvecklingsresultat genom patent eller annan IP?' },
            { type: 'info', title: 'Bidrag', description: 'Erhålls FoU-bidrag eller skattelättnader?' },
          ],
          missingElements: ['Projektportfölj', 'R&D-budget', 'Patentansökningar'],
          recommendations: [
            'Dokumentera alla pågående utvecklingsprojekt',
            'Analysera konkurrensfördel från R&D-aktiviteter',
            'Granska möjligheter till FoU-avdrag',
          ],
        },
        'roadmap': {
          category: 'it',
          type: 'Produktroadmap',
          baseScore: 76,
          findings: [
            { type: 'success', title: 'Produktplanering', description: 'Roadmap för produktutveckling finns.' },
            { type: 'info', title: 'Prioriteringar', description: 'Hur prioriteras nya features och produkter?' },
            { type: 'warning', title: 'Resursbehov', description: 'Finns tillräckliga resurser för att leverera enligt plan?' },
            { type: 'info', title: 'Kunddriven', description: 'Baseras roadmap på kundfeedback och marknadsbehov?' },
          ],
          missingElements: ['Detaljerad roadmap', 'Resursplan'],
          recommendations: ['Validera roadmap mot kundefterfrågan', 'Koppla roadmap till affärsmål'],
        },
        'produktportfölj': {
          category: 'kommersiellt',
          type: 'Produktportfölj',
          baseScore: 78,
          findings: [
            { type: 'success', title: 'Produktöversikt', description: 'Dokumentation av produkter/tjänster finns.' },
            { type: 'info', title: 'Livscykelstatus', description: 'I vilken fas befinner sig respektive produkt (tillväxt, mognad, nedgång)?' },
            { type: 'warning', title: 'Koncentration', description: 'Hur stor andel av intäkterna kommer från en enskild produkt?' },
            { type: 'info', title: 'Marginaler', description: 'Vilka produkter har högst/lägst marginal?' },
          ],
          missingElements: ['Produktmatris med omsättning/marginal', 'Livscykelanalys'],
          recommendations: ['Analysera produktportföljens balans', 'Identifiera tillväxtprodukter vs cash cows'],
        },

        // Risk & Kontinuitet
        'riskanalys': {
          category: 'operation',
          type: 'Riskanalys/Riskregister',
          baseScore: 75,
          findings: [
            { type: 'success', title: 'Riskhantering', description: 'Riskanalys eller riskregister finns upprättat.' },
            { type: 'info', title: 'Riskbedömning', description: 'Är risker klassificerade efter sannolikhet och påverkan?' },
            { type: 'warning', title: 'Mitigering', description: 'Finns åtgärdsplaner för identifierade risker?' },
            { type: 'info', title: 'Uppföljning', description: 'Hur ofta uppdateras riskregistret?' },
          ],
          missingElements: ['Riskmatris', 'Åtgärdsplaner per risk'],
          recommendations: ['Säkerställ att DD-specifika risker är identifierade', 'Uppdatera inför transaktion'],
        },
        'kontinuitet': {
          category: 'operation',
          type: 'Business Continuity/Kontinuitetsplan',
          baseScore: 73,
          findings: [
            { type: 'success', title: 'Kontinuitetsplanering', description: 'Business Continuity Plan (BCP) finns dokumenterad.' },
            { type: 'info', title: 'Kritiska funktioner', description: 'Vilka verksamhetsfunktioner är mest kritiska vid avbrott?' },
            { type: 'warning', title: 'Testning', description: 'Har planen testats? När senast?' },
            { type: 'info', title: 'RTO/RPO', description: 'Finns definierade Recovery Time/Point Objectives?' },
          ],
          missingElements: ['Testprotokoll', 'Kontaktlistor'],
          recommendations: ['Testa kontinuitetsplan regelbundet', 'Uppdatera kontaktlistor och rutiner'],
        },
        'krishantering': {
          category: 'operation',
          type: 'Krishantering',
          baseScore: 72,
          findings: [
            { type: 'success', title: 'Krisplan', description: 'Dokumentation för krishantering finns.' },
            { type: 'info', title: 'Kristeam', description: 'Är roller och ansvar definierade vid kris?' },
            { type: 'warning', title: 'Kommunikation', description: 'Finns plan för intern och extern kommunikation vid kris?' },
            { type: 'info', title: 'Erfarenheter', description: 'Har bolaget hanterat kriser tidigare? Vad lärdes?' },
          ],
          missingElements: ['Krismanual', 'Kommunikationsplan'],
          recommendations: ['Definiera krisnivåer och eskaleringsrutiner', 'Genomför krisövning'],
        },

        // Bidrag och stöd
        'bidrag': {
          category: 'finans',
          type: 'Bidrag/Stöd',
          baseScore: 76,
          findings: [
            { type: 'success', title: 'Erhållna bidrag', description: 'Dokumentation av bidrag och stöd finns.' },
            { type: 'info', title: 'Villkor', description: 'Vilka villkor gäller för bidraget? Återbetalningskrav?' },
            { type: 'warning', title: 'Change of control', description: 'Kan bidrag behöva återbetalas vid ägarförändring?' },
            { type: 'info', title: 'Framtida bidrag', description: 'Finns pågående ansökningar eller möjligheter?' },
          ],
          missingElements: ['Bidragsbeslut', 'Villkorsuppföljning'],
          recommendations: [
            'Kontrollera om bidrag påverkas av transaktionen',
            'Dokumentera alla erhållna bidrag och återbetalningsvillkor',
          ],
        },
        'subvention': {
          category: 'finans',
          type: 'Statligt stöd/Subventioner',
          baseScore: 75,
          findings: [
            { type: 'success', title: 'Stöddokumentation', description: 'Statliga stöd eller subventioner finns dokumenterade.' },
            { type: 'warning', title: 'Statsstödsregler', description: 'EU:s statsstödsregler kan påverka giltigheten.' },
            { type: 'warning', title: 'Återkrav', description: 'Finns risk för återkrav vid regelbrott?' },
          ],
          missingElements: ['Stödbeslut', 'Rapportering till myndighet'],
          recommendations: ['Verifiera compliance med stödvillkor', 'Analysera påverkan av transaktion'],
        },

        // Aktieägarrelaterat
        'aktieägaravtal': {
          category: 'juridik',
          type: 'Aktieägaravtal',
          baseScore: 83,
          findings: [
            { type: 'success', title: 'Ägaravtal', description: 'Aktieägaravtal mellan ägarna finns.' },
            { type: 'warning', title: 'Förköpsrätt', description: 'Finns förköpsrätt eller hembud som påverkar försäljningen?' },
            { type: 'warning', title: 'Tag-along/Drag-along', description: 'Vilka rättigheter har minoritetsägare vid försäljning?' },
            { type: 'info', title: 'Rösträttsavtal', description: 'Finns avtal om hur aktieägare ska rösta i vissa frågor?' },
            { type: 'warning', title: 'Deadlock', description: 'Hur löses situationer där ägare inte kan enas?' },
          ],
          missingElements: ['Komplett aktieägaravtal', 'Cap table med alla optioner'],
          recommendations: [
            'Säkerställ att alla ägare är införstådda med försäljningen',
            'Granska tag-along-rättigheter som kan påverka pris',
            'Analysera eventuella minoritetsskydd',
          ],
        },
        'option': {
          category: 'hr',
          type: 'Optionsprogram/Incitament',
          baseScore: 76,
          findings: [
            { type: 'success', title: 'Optionsprogram', description: 'Aktiebaserat incitamentsprogram finns dokumenterat.' },
            { type: 'info', title: 'Utestående optioner', description: 'Hur många optioner är utställda och till vilket pris?' },
            { type: 'warning', title: 'Acceleration', description: 'Triggas automatisk inlösen vid change of control?' },
            { type: 'warning', title: 'Utspädning', description: 'Vilken utspädning innebär full konvertering?' },
            { type: 'info', title: 'Skattekonsekvenser', description: 'Hur beskattas optionerna vid inlösen?' },
          ],
          missingElements: ['Optionsvillkor', 'Förteckning över innehavare'],
          recommendations: [
            'Beräkna total utspädning vid full konvertering',
            'Analysera skattekonsekvenser för optionsinnehavare',
            'Hantera optioner i transaktionsstrukturen',
          ],
        },
        'utdelning': {
          category: 'finans',
          type: 'Utdelningspolicy/Vinstdisposition',
          baseScore: 79,
          findings: [
            { type: 'success', title: 'Utdelningshistorik', description: 'Information om historiska utdelningar finns.' },
            { type: 'info', title: 'Utdelningspolicy', description: 'Finns formell policy för utdelning?' },
            { type: 'warning', title: 'Lånevillkor', description: 'Begränsar låneavtal möjligheten till utdelning?' },
            { type: 'info', title: 'Likviditet', description: 'Hur påverkar utdelningar bolagets likviditet?' },
          ],
          missingElements: ['Utdelningshistorik', 'Stämmoprotokoll med vinstdisposition'],
          recommendations: [
            'Dokumentera historiska utdelningar för att förstå ägarnas förväntningar',
            'Analysera utdelningskapacitet baserat på fritt eget kapital',
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
