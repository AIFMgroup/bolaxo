'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useLocale } from 'next-intl'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import SalesProcessDataModal, { 
  CompanyData, 
  initialCompanyData 
} from '@/components/SalesProcessDataModal'
import IndustrySelectorModal, { INDUSTRIES, IndustryOption } from '@/components/IndustrySelectorModal'
import { getIndustrySteps, type IndustryStep } from '@/lib/industrySalesSteps'

// Dynamically import PDF components to avoid SSR issues
const PDFDownloadLink = dynamic(
  () => import('@react-pdf/renderer').then((mod) => mod.PDFDownloadLink),
  { 
    ssr: false, 
    loading: () => <span>Förbereder PDF...</span>
  }
)

const SalesProcessReportPDF = dynamic(
  () => import('@/components/SalesProcessReportPDF').then((mod) => mod.default),
  { 
    ssr: false,
    loading: () => null
  }
)

type ModalCategory = 'financialDocs' | 'businessRelations' | 'keyPerson' | 'balanceSheet' | 'legalDocs'

interface AnalysisResult {
  executiveSummary: string
  companyOverview: string
  financialAnalysis: string
  businessRelationsAnalysis: string
  keyPersonAnalysis: string
  balanceSheetAnalysis: string
  legalAnalysis: string
  riskAssessment: {
    overall: 'low' | 'medium' | 'high'
    financialRisk: number
    operationalRisk: number
    keyPersonRisk: number
    customerRisk: number
    legalRisk: number
  }
  recommendations: string[]
  nextSteps: string[]
  strengths: string[]
  weaknesses: string[]
  valuationFactors: string
}

// Type definitions
interface TipContent {
  title: string
  description: string
  tips: string[]
  examples: { title: string; content: string }[]
  commonMistakes?: string[]
  sources: { name: string; url: string }[]
}

interface StepItem {
  title: string
  summary: string
  expanded: string
  stats?: { value: string; label: string; sublabel?: string; tipKey?: string }[]
  chart?: { data: number[]; label: string }
  rings?: { percent: number; label: string }[]
  timeline?: { label: string; duration: string }[]
}

interface Step {
  id: number
  title: string
  subtitle: string
  duration: string
  fact: string
  items: StepItem[]
}

// Comprehensive tips database
const TIPS_DATABASE: Record<string, TipContent> = {
  'finansiell-historik': {
    title: 'Finansiell historik: 3-5 år',
    description: 'En köpare förväntar sig att kunna granska minst 3-5 års finansiell historik för att förstå företagets ekonomiska utveckling och stabilitet.',
    tips: [
      'Samla årsredovisningar för de senaste 3-5 åren i original (undertecknade)',
      'Förbered månadsrapporter som visar säsongsvariationer och trender',
      'Dokumentera alla engångsposter separat med tydliga förklaringar',
      'Skapa en brygga mellan bokfört resultat och justerat EBITDA',
      'Ha koll på skillnaden mellan redovisat och normaliserat resultat',
      'Förbered prognoser för kommande 2-3 år med tydliga antaganden'
    ],
    examples: [
      {
        title: 'Exempel på EBITDA-brygga',
        content: 'Redovisat resultat: 2 500 TSEK\n+ Ägarens marknadsmässiga lön utöver bokförd: +400 TSEK\n+ Engångskostnad flytt: +150 TSEK\n- Privata kostnader bokförda i bolaget: -80 TSEK\n= Justerat EBITDA: 2 970 TSEK\n\nDenna typ av brygga hjälper köparen förstå den verkliga intjäningsförmågan.'
      },
      {
        title: 'Checklista för finansiell dokumentation',
        content: '□ Årsredovisningar (3-5 år)\n□ Månadsrapporter (12-24 månader)\n□ Budgetar och prognoser\n□ Skattekontoutdrag\n□ Momsdeklarationer\n□ Kundreskontra\n□ Leverantörsreskontra\n□ Bankkontoutdrag\n□ Låneavtal\n□ Leasingavtal'
      }
    ],
    commonMistakes: [
      'Att inte kunna förklara stora avvikelser mellan år',
      'Sakna dokumentation för engångsposter',
      'Blanda privata och företagskostnader utan att dokumentera',
      'Glömma att normalisera ägarens lön'
    ],
    sources: [
      { name: 'Deloitte - Planera för en lyckad företagsförsäljning', url: 'https://www.deloitte.com/se/sv/services/deloitte-private/perspectives/planera-for-en-lyckad-foretagsforsaljning.html' },
      { name: 'PwC - M&A Due Diligence Guide', url: 'https://www.pwc.com/gx/en/services/deals/trends.html' }
    ]
  },
  'kopare-krav-bokslut': {
    title: 'Varför 85% av köpare kräver bokslut',
    description: 'Det är standard i M&A-världen att köpare begär fullständiga bokslut. Utan dessa anses företaget inte vara "sale-ready".',
    tips: [
      'Se till att alla bokslut är reviderade av auktoriserad revisor',
      'Årsredovisningen ska vara komplett med förvaltningsberättelse',
      'Inkludera noter som förklarar redovisningsprinciper',
      'Ha tillhörande revisorsberättelser tillgängliga',
      'Förbered dig på att förklara alla väsentliga poster'
    ],
    examples: [
      {
        title: 'Vad köparen letar efter i bokslutet',
        content: '• Omsättningstillväxt och stabilitet\n• Bruttomarginal och dess utveckling\n• EBITDA-marginal\n• Rörelsekapitalets utveckling\n• Skuldsättningsgrad\n• Kassaflöde från rörelsen\n• Beroende av enskilda kunder/leverantörer\n• Säsongsvariationer'
      },
      {
        title: 'Röda flaggor köparen ser upp för',
        content: '⚠️ Oregelbundna intäktsmönster utan förklaring\n⚠️ Krympande marginaler\n⚠️ Stora mellanhavanden med närstående\n⚠️ Anmärkningar i revisionsberättelsen\n⚠️ Försenade eller ofullständiga bokslut\n⚠️ Stora förändringar i redovisningsprinciper'
      }
    ],
    sources: [
      { name: 'EY - Global M&A Trends', url: 'https://www.ey.com/en_gl/insights/strategy-transactions/global-m-and-a-sector-trends' },
      { name: 'SVCA - Riktlinjer för PE-transaktioner', url: 'https://www.svca.se/rapporter/' }
    ]
  },
  'teaser-sidor': {
    title: 'Teaser-dokument: 1-2 sidor',
    description: 'En teaser är det första dokumentet potentiella köpare ser. Det ska väcka intresse utan att avslöja för mycket känslig information.',
    tips: [
      'Håll dokumentet till max 2 A4-sidor',
      'Använd professionell design och layout',
      'Inkludera inte företagets namn - använd beskrivande titel',
      'Fokusera på de 3-5 starkaste säljargumenten',
      'Inkludera grundläggande nyckeltal utan exakta siffror (t.ex. "omsättning 20-30 MSEK")',
      'Avsluta med tydlig call-to-action'
    ],
    examples: [
      {
        title: 'Exempel på teaser-struktur',
        content: '📄 SIDA 1:\n\n"Ledande nordisk aktör inom industriell automation"\n\nVerksamhetsöversikt:\n• Etablerat 2008, huvudkontor i Göteborg\n• Utvecklar och säljer automationslösningar\n• 45 anställda, omsättning 35-45 MSEK\n• Stark tillväxt de senaste 5 åren\n\nInvesteringsargument:\n✓ Återkommande intäkter (65% av omsättning)\n✓ Patentskyddad teknologi\n✓ Diversifierad kundbas (ingen kund >15%)\n✓ Erfaren ledningsgrupp\n\n📄 SIDA 2:\n\nFinansiell översikt (MSEK):\n• Omsättning: 35-45\n• EBITDA-marginal: 15-20%\n• Tillväxt senaste 3 år: 12% årligen\n\nTransaktionsstruktur:\n• 100% aktieöverlåtelse\n• Ägarna tillgängliga för övergångsperiod\n\nKontakt: [Rådgivarens namn och kontaktinfo]'
      },
      {
        title: 'Vanliga rubriker i teaser',
        content: '• Investeringsmöjlighet\n• Verksamhetsöversikt\n• Marknadsposition\n• Finansiell översikt\n• Investeringsargument\n• Tillväxtmöjligheter\n• Transaktionsstruktur\n• Nästa steg'
      }
    ],
    commonMistakes: [
      'Avslöja företagets namn för tidigt',
      'Inkludera för detaljerad finansiell information',
      'Glömma att inkludera kontaktinformation',
      'Använda oprofessionell design',
      'Skriva för långt och detaljerat'
    ],
    sources: [
      { name: 'Deloitte - M&A Transaction Services', url: 'https://www.deloitte.com/se/sv/services/deloitte-private/perspectives/planera-for-en-lyckad-foretagsforsaljning.html' },
      { name: 'Bayswater - Försäljningsprocessen', url: 'https://bayswater.se/processen' }
    ]
  },
  'potentiella-kopare': {
    title: 'Identifiera 50+ potentiella köpare',
    description: 'En bred lista med potentiella köpare skapar konkurrens och ökar chansen att hitta rätt köpare till rätt pris.',
    tips: [
      'Kategorisera köpare i strategiska, finansiella och privata',
      'Använd branschdatabaser och LinkedIn för research',
      'Inkludera internationella köpare om relevant',
      'Rangordna köpare efter sannolikhet och attraktivitet',
      'Ha "Plan B"-köpare redo om förstahandsvalet faller',
      'Överväg konkurrenter, kunder, leverantörer som strategiska köpare'
    ],
    examples: [
      {
        title: 'Kategorier av köpare',
        content: '🏢 STRATEGISKA KÖPARE (ofta högst pris):\n• Konkurrenter som vill växa\n• Företag i angränsande branscher\n• Kunder som vill integrera bakåt\n• Leverantörer som vill integrera framåt\n• Internationella aktörer som vill in på marknaden\n\n💼 FINANSIELLA KÖPARE:\n• Private Equity-bolag\n• Family Offices\n• Venture Capital (för tillväxtbolag)\n• Investeringsfonder\n\n👤 PRIVATA KÖPARE:\n• Search Funds\n• MBI-kandidater (Management Buy-In)\n• Förmögna privatpersoner\n• Serieentreprenörer'
      },
      {
        title: 'Exempel på köparlista-struktur',
        content: '| Köpare | Typ | Rationale | Prioritet |\n|--------|-----|-----------|----------|\n| Nordic Tech AB | Strategisk | Konkurrent, vill växa | Hög |\n| Growth Capital Partners | PE | Branschfokus | Hög |\n| German Industrial GmbH | Strategisk | Nordisk expansion | Medel |\n| Family Office X | Finansiell | Generalist | Låg |'
      }
    ],
    sources: [
      { name: 'SVCA - Swedish Private Equity', url: 'https://www.svca.se/rapporter/' },
      { name: 'Mergr - Nordic M&A Database', url: 'https://mergr.com/' },
      { name: 'Argos Wityu - Mid-Market Monitor', url: 'https://www.argos.wityu.fund/mid-market-monitor/' }
    ]
  },
  'svarsfrekvens': {
    title: 'Svarsfrekvens: 10-15%',
    description: 'En svarsfrekvens på 10-15% är normal vid utskick av teasers. Det innebär att av 50 kontaktade köpare kan du förvänta dig 5-8 seriöst intresserade.',
    tips: [
      'Personalisera varje utskick - undvik massutskick',
      'Ring efter 3-5 dagar för att följa upp',
      'Ha en strukturerad uppföljningsprocess',
      'Dokumentera alla kontakter i ett CRM eller kalkylblad',
      'Var beredd på att justera pitch baserat på feedback',
      'Tajma utskick till början av veckan (tisdag-onsdag)'
    ],
    examples: [
      {
        title: 'Exempel på uppföljningsschema',
        content: 'Dag 1: Skicka teaser via e-post\nDag 3-5: Uppföljningssamtal\nDag 10: Påminnelse via e-post (om inget svar)\nDag 14: Sista uppföljningssamtal\nDag 21: Avsluta kontakt eller arkivera\n\nTips: Håll tonen professionell men inte påträngande. "Jag ville säkerställa att du mottagit informationen och höra om det finns intresse att diskutera vidare."'
      },
      {
        title: 'Förväntad konverteringstratt',
        content: '100 identifierade köpare\n↓\n50 kontaktade med teaser\n↓\n5-8 visar intresse (10-15%)\n↓\n4-6 signerar NDA\n↓\n3-4 får Informationsmemorandum\n↓\n2-3 lämnar indikativt bud\n↓\n1-2 går vidare till DD\n↓\n1 slutför köpet'
      }
    ],
    sources: [
      { name: 'IBBA - Business Broker Statistics', url: 'https://www.ibba.org/research/' },
      { name: 'AM&AA - M&A Advisor Research', url: 'https://www.amaaonline.com/alliance-of-ma-advisors-research' }
    ]
  },
  'im-sidor': {
    title: 'Informationsmemorandum: 30-50 sidor',
    description: 'Informationsmemorandum (IM) är det detaljerade säljdokumentet som delas efter signerat NDA. Det är ditt viktigaste verktyg för att övertyga köparen.',
    tips: [
      'Använd professionell grafisk design',
      'Inkludera en exekutiv sammanfattning på 2-3 sidor',
      'Var ärlig - överdrifter upptäcks vid due diligence',
      'Använd diagram och grafik för att visualisera data',
      'Inkludera marknadsanalys från oberoende källor',
      'Ha en tydlig investeringstes',
      'Beskriv tillväxtmöjligheter konkret'
    ],
    examples: [
      {
        title: 'Typisk IM-struktur',
        content: '1. EXEKUTIV SAMMANFATTNING (3-5 sidor)\n   • Investeringsargument\n   • Finansiell översikt\n   • Transaktionsöversikt\n\n2. FÖRETAGET (8-10 sidor)\n   • Historia och milstolpar\n   • Verksamhetsbeskrivning\n   • Produkter/tjänster\n   • Geografisk närvaro\n\n3. MARKNADEN (5-8 sidor)\n   • Marknadsstorlek och tillväxt\n   • Trender och drivkrafter\n   • Konkurrenslandskap\n   • Positionering\n\n4. ORGANISATION (3-5 sidor)\n   • Ledningsgrupp\n   • Organisationsstruktur\n   • Nyckelpersoner\n   • Kultur och värderingar\n\n5. FINANSIELLT (8-12 sidor)\n   • Historiska resultat\n   • Nyckeltal och KPIer\n   • Prognoser\n   • Kapitalbehov\n\n6. RISKER OCH MÖJLIGHETER (3-5 sidor)\n   • Tillväxtmöjligheter\n   • Synergipotential\n   • Riskfaktorer\n\n7. TRANSAKTION (2-3 sidor)\n   • Transaktionsstruktur\n   • Tidplan\n   • Kontaktinformation'
      }
    ],
    sources: [
      { name: 'McKinsey - M&A Best Practices', url: 'https://www.mckinsey.com/capabilities/m-and-a/our-insights' },
      { name: 'Oaklins Sweden', url: 'https://www.oaklins.com/se/sv/' }
    ]
  },
  'nyckelperson-vardeminskning': {
    title: 'Värdeminskning: -15% vid nyckelpersonberoende',
    description: 'Högt beroende av ägaren eller enskilda nyckelpersoner är en av de vanligaste värdesänkande faktorerna vid företagsförsäljning.',
    tips: [
      'Börja delegera ansvar minst 12 månader före försäljning',
      'Dokumentera alla processer och rutiner i manualer',
      'Bygg en stark andraledsnivå',
      'Överväg incitamentsprogram för nyckelpersoner',
      'Formalisera kundrelationer så de inte är personberoende',
      'Säkerställ att någon annan kan ta över direkt vid behov'
    ],
    examples: [
      {
        title: 'Värderingspåverkan av nyckelpersonberoende',
        content: 'Lågt beroende (ägaren kan lämna direkt):\nMultipel: 5-6x EBITDA\nPremie: +10-15%\n\nMedelberoende (3-6 mån övergång):\nMultipel: 4-5x EBITDA\nNeutralt\n\nHögt beroende (12+ mån övergång krävs):\nMultipel: 3-4x EBITDA\nAvdrag: -15-25%\n\nKritiskt beroende (verksamheten stannar utan ägaren):\nOftast ingen affär möjlig, eller kraftigt reducerat pris med lång earnout.'
      },
      {
        title: 'Checklista: Minska nyckelpersonberoende',
        content: '□ Dokumentera alla arbetsprocesser\n□ Skapa backup för varje nyckelroll\n□ Delegera kundrelationer\n□ Implementera CRM-system\n□ Bygg ledningsgrupp med mandat\n□ Träna efterträdare\n□ Skapa incitamentsprogram\n□ Formalisera leverantörsavtal\n□ Dokumentera prissättningsmodeller\n□ Säkerställ att IT-system inte är personberoende'
      }
    ],
    sources: [
      { name: 'Harvard Business Review - M&A Research', url: 'https://hbr.org/topic/subject/mergers-and-acquisitions' },
      { name: 'EY - Key Person Risk in M&A', url: 'https://www.ey.com/en_gl/insights/strategy-transactions/global-m-and-a-sector-trends' }
    ]
  },
  'affarer-misslyckas-nyckelperson': {
    title: '67% av affärer misslyckas pga nyckelpersonberoende',
    description: 'Nyckelpersonberoende är en av de främsta orsakerna till att företagsförsäljningar misslyckas eller får betydligt lägre pris än förväntat.',
    tips: [
      'Identifiera vilka personer som är "mission critical"',
      'Skapa retention-avtal med nyckelpersoner före försäljning',
      'Dokumentera alla kundrelationer i CRM',
      'Se till att flera personer kan varje kritisk process',
      'Överväg stay-bonus för nyckelpersoner efter tillträdet'
    ],
    examples: [
      {
        title: 'Varför affärer misslyckas - statistik',
        content: '🔴 Nyckelpersonberoende: 67%\n   • Ägaren har alla kundrelationer\n   • Ingen dokumentation av processer\n   • Ledningsgrupp saknas\n\n🔴 Finansiella problem: 45%\n   • Fallande resultat under processen\n   • Dolda skulder upptäcks\n   • Oförklarliga engångsposter\n\n🔴 Övervärdering: 38%\n   • Orealistiska prisförväntningar\n   • Ignorerar marknadsmultiplar\n   • Emotionellt värde vs marknadsvärde\n\n🔴 Kulturkrock: 25%\n   • Inkompatibla organisationskulturer\n   • Ledningsgruppens motstånd\n   • Strategiska meningsskiljaktigheter'
      },
      {
        title: 'Retention-avtal för nyckelpersoner',
        content: 'Ett retention-avtal kan inkludera:\n\n• Stay-bonus: X månaders lön om personen stannar Y månader efter tillträde\n• Aktie-/optionsprogram: Del av köpeskillingen\n• Karriärmöjligheter: Tydlig roll i det nya bolaget\n• Konkurrensklausul: Med rimlig ersättning\n\nTypisk stay-bonus: 25-100% av årslön\nTypisk bindningstid: 12-24 månader'
      }
    ],
    sources: [
      { name: 'BCG - M&A Report', url: 'https://www.bcg.com/publications/2024/m-and-a-report-dealmakers-guide' },
      { name: 'McKinsey - Why M&A Deals Fail', url: 'https://www.mckinsey.com/capabilities/m-and-a/our-insights' }
    ]
  },
  'datarum-dokument': {
    title: 'Datarum: 200-500 dokument',
    description: 'Ett virtuellt datarum (VDR) innehåller all dokumentation som köparen behöver för sin due diligence-granskning.',
    tips: [
      'Använd en professionell VDR-plattform (Intralinks, Merrill, Ansarada)',
      'Organisera i tydliga mappar och undermappar',
      'Namnge filer konsekvent och sökbart',
      'Förbered Q&A-process för köparens frågor',
      'Spåra vem som läst vad (signalerar intresse)',
      'Lägg till dokument successivt, inte allt på en gång'
    ],
    examples: [
      {
        title: 'Typisk mappstruktur i datarum',
        content: '📁 1. BOLAGSINFORMATION\n   ├── Bolagsordning\n   ├── Aktiebok\n   ├── Styrelsebeslut\n   └── Bolagsstämmoprotokoll\n\n📁 2. FINANSIELLT\n   ├── Årsredovisningar\n   ├── Månadsrapporter\n   ├── Budgetar\n   └── Revisions-PM\n\n📁 3. JURIDISKT/AVTAL\n   ├── Kundavtal\n   ├── Leverantörsavtal\n   ├── Anställningsavtal\n   └── Fastigheter/Hyresavtal\n\n📁 4. SKATT\n   ├── Skattedeklarationer\n   ├── Momsredovisning\n   └── Skattekontoutdrag\n\n📁 5. PERSONAL/HR\n   ├── Organisationsschema\n   ├── Anställningsvillkor\n   ├── Pensionsplaner\n   └── Kollektivavtal\n\n📁 6. IP/IT\n   ├── Patent\n   ├── Varumärken\n   ├── IT-system\n   └── Licensavtal\n\n📁 7. FÖRSÄKRINGAR\n   └── Alla försäkringsbrev\n\n📁 8. MILJÖ\n   └── Tillstånd och rapporter'
      },
      {
        title: 'Namnkonvention för filer',
        content: 'Använd konsekvent namngivning:\n\n[Kategori]_[Dokumenttyp]_[År/Period]_[Version]\n\nExempel:\nFIN_Årsredovisning_2023_Final.pdf\nAVT_Kundavtal_XYZ_AB_2022.pdf\nHR_Anställningsavtal_Mall_v3.docx\nIT_Systemöversikt_Q4_2023.xlsx'
      }
    ],
    sources: [
      { name: 'Intralinks - Virtual Data Room Best Practices', url: 'https://www.intralinks.com/' },
      { name: 'DLA Piper - M&A Due Diligence', url: 'https://www.dlapiper.com/en/insights/publications/global-ma-intelligence-report' }
    ]
  },
  'dd-kategorier': {
    title: 'Due Diligence: 8-12 huvudkategorier',
    description: 'En komplett due diligence täcker alla väsentliga aspekter av verksamheten, uppdelat i logiska kategorier.',
    tips: [
      'Förbered varje kategori systematiskt',
      'Utse en ansvarig person för varje kategori',
      'Ha svaren redo på förväntade frågor',
      'Var proaktiv med att flagga kända problem',
      'Planera för att DD tar 4-8 veckor'
    ],
    examples: [
      {
        title: 'De 12 vanligaste DD-kategorierna',
        content: '1. FINANSIELL DD\n   Bokslut, prognoser, rörelsekapital, skulder\n\n2. SKATTE-DD\n   Skatteskulder, tvister, strukturer, risker\n\n3. JURIDISK DD\n   Avtal, tvister, bolagshandlingar, IP\n\n4. KOMMERSIELL DD\n   Marknad, kunder, konkurrenter, affärsmodell\n\n5. HR/PERSONAL DD\n   Anställda, löner, pension, nyckelpersoner\n\n6. IT/TEKNIK DD\n   System, säkerhet, teknikskuld, licenser\n\n7. OPERATIONS DD\n   Processer, leveranskedja, kapacitet\n\n8. MILJÖ DD\n   Tillstånd, risker, åtaganden\n\n9. FÖRSÄKRINGS DD\n   Täckning, skador, premiehistorik\n\n10. FASTIGHETS DD\n    Hyresavtal, ägande, skick\n\n11. REGULATORISK DD\n    Tillstånd, compliance, branschkrav\n\n12. ESG DD\n    Hållbarhet, socialt ansvar, styrning'
      }
    ],
    sources: [
      { name: 'KPMG - Due Diligence Guide', url: 'https://kpmg.com/xx/en/home/insights/2024/01/m-and-a-trends.html' },
      { name: 'CMS - European M&A Study', url: 'https://www.cmslegalondemand.com/dealinsight' }
    ]
  },
  'prisjustering-dd': {
    title: '40% av affärer får prisjusteringar efter DD',
    description: 'Det är vanligt att köpeskillingen justeras efter due diligence. Förbered dig på detta och minimera överraskningarna.',
    tips: [
      'Var transparent från början - dolda problem kostar mer',
      'Gör en intern "säljsides-DD" innan du går ut',
      'Förbered förklaringar till alla avvikelser',
      'Ha alternativa lösningar redo (garantier, escrow, earnout)',
      'Sätt inte priset för högt från början'
    ],
    examples: [
      {
        title: 'Typiska orsaker till prisjustering',
        content: '⬇️ VANLIGA PRISAVDRAG:\n• Rörelsekapital lägre än normalt: -5-10%\n• Dolda skulder upptäcks: Krona för krona\n• Kund säger upp avtal: Värderas\n• Nyckelperson avgår: -5-15%\n• Miljöproblem: Betydande\n• Skatteskuld: Krona för krona\n• IT-teknikskuld: -2-5%\n\n⬆️ SÄLLSYNTA PRISHÖJNINGAR:\n• Bättre resultat än väntat under DD\n• Nya kontrakt signeras\n• Konkurrent bjuder högre'
      },
      {
        title: 'Typisk förhandlingsstruktur efter DD',
        content: 'SITUATION: DD avslöjar 2 MSEK i oväntade kostnader\n\nALTERNATIV 1: Prisavdrag\nPris minskas med 2 MSEK\n\nALTERNATIV 2: Escrow\n2 MSEK i escrow, frigörs om problemet inte materialiseras\n\nALTERNATIV 3: Garanti\nSäljaren lämnar specifik garanti som täcker risken\n\nALTERNATIV 4: Delat ansvar\nParterna delar risken 50/50'
      }
    ],
    sources: [
      { name: 'SRS Transact - Nordic M&A Study', url: 'https://www.srs.se/en/transact' },
      { name: 'Aon - M&A Claims Study', url: 'https://www.aon.com/home/insights/reports/2024/ma-and-transaction-solutions-trends' }
    ]
  },
  'earnout-struktur': {
    title: '65% inkluderar tilläggsköpeskilling (earnout)',
    description: 'Earnout är ett sätt att överbrygga värderingsgapet mellan köpare och säljare genom att koppla en del av priset till framtida resultat.',
    tips: [
      'Definiera tydliga mätbara mål (EBITDA, omsättning, kunder)',
      'Specificera beräkningsmetod exakt',
      'Reglera säljarens inflytande under earnout-perioden',
      'Inkludera acceleration-klausuler vid ägarbyte',
      'Håll earnout-andelen rimlig (20-30% av total köpeskilling)',
      'Begränsa earnout-perioden till max 2-3 år'
    ],
    examples: [
      {
        title: 'Exempel på earnout-struktur',
        content: 'DEAL: Köpeskilling 50 MSEK\n\nStruktur:\n• Kontant vid tillträde: 35 MSEK (70%)\n• Earnout år 1: Max 7,5 MSEK (15%)\n• Earnout år 2: Max 7,5 MSEK (15%)\n\nEarnout-villkor:\n• Baseras på EBITDA vs budget\n• 100% av target = 100% utbetalning\n• 90% av target = 50% utbetalning\n• <85% av target = 0 utbetalning\n• >110% av target = 125% utbetalning (cap)\n\nSäljaren stannar som rådgivare under earnout-perioden.'
      },
      {
        title: 'Vanliga earnout-mått',
        content: '📊 FINANSIELLA MÅTT:\n• EBITDA (vanligast)\n• Omsättning\n• Bruttovinst\n• Kassaflöde\n\n📈 OPERATIONELLA MÅTT:\n• Antal kunder\n• Customer retention\n• Nya kontrakt\n• Produktlanseringar\n\n⚠️ UNDVIK:\n• För komplexa formler\n• Subjektiva mått\n• Mått säljaren inte kan påverka'
      }
    ],
    sources: [
      { name: 'CMS - European M&A Study (Earnout trends)', url: 'https://www.cmslegalondemand.com/dealinsight' },
      { name: 'SRS Acqusom - Earnout Statistik', url: 'https://www.srs.se/en/transact' }
    ]
  },
  'spa-sidor': {
    title: 'SPA (Aktieöverlåtelseavtal): 40-80 sidor',
    description: 'Share Purchase Agreement (SPA) är det juridiska huvudavtalet vid aktieöverlåtelse. Det reglerar alla aspekter av transaktionen.',
    tips: [
      'Anlita erfaren M&A-jurist',
      'Fokusera på de kommersiellt viktiga punkterna',
      'Läs och förstå garantikatalogen noga',
      'Förhandla tak och golv för garantiansvar',
      'Överväg W&I-försäkring för att begränsa ansvar',
      'Se till att bilagor är kompletta'
    ],
    examples: [
      {
        title: 'Typisk SPA-struktur',
        content: '1. DEFINITIONER (2-5 sidor)\n   Alla centrala begrepp definieras\n\n2. ÖVERLÅTELSE (1-2 sidor)\n   Aktier överlåts från säljare till köpare\n\n3. KÖPESKILLING (3-5 sidor)\n   Belopp, betalning, justeringar\n\n4. TILLTRÄDE (2-3 sidor)\n   Datum, villkor, genomförande\n\n5. SÄLJARENS GARANTIER (15-25 sidor)\n   Omfattande garantikatalog\n\n6. KÖPARENS ÅTAGANDEN (2-3 sidor)\n   Köparens förpliktelser\n\n7. ANSVARSBEGRÄNSNINGAR (3-5 sidor)\n   Tak, golv, tidsfrister\n\n8. ÖVRIGA BESTÄMMELSER (5-10 sidor)\n   Sekretess, tvister, tillämplig lag\n\nBILAGOR (10-20+ sidor)\n   Disclosure letter, garantikatalog, etc.'
      },
      {
        title: 'Viktiga förhandlingspunkter i SPA',
        content: '💰 KÖPESKILLING:\n• Locked box vs completion accounts\n• Rörelsekapitaljustering\n• Nettoskuldsdefinition\n\n⚖️ GARANTIER:\n• Omfattning och undantag\n• "Best knowledge" vs absolut\n• Takbelopp (ofta 20-50% av pris)\n• Golvbelopp (de minimis)\n• Tidsfrister (2-7 år beroende på typ)\n\n🛡️ SKYDD:\n• Escrow-belopp och period\n• W&I-försäkring\n• Specific indemnities'
      }
    ],
    sources: [
      { name: 'DLA Piper - Global M&A Intelligence', url: 'https://www.dlapiper.com/en/insights/publications/global-ma-intelligence-report' },
      { name: 'CMS - European M&A Study', url: 'https://www.cmslegalondemand.com/dealinsight' }
    ]
  },
  'garantiklausuler': {
    title: 'SPA innehåller 15-25 garantiklausuler',
    description: 'Garantiklausulerna är en av de mest förhandlade delarna av SPA. De avgör säljarens ansvar om det visar sig att information var felaktig.',
    tips: [
      'Läs varje garanti noga och förstå innebörden',
      'Kvalificera garantier med "så vitt säljaren vet"',
      'Upprätta disclosure letter med alla undantag',
      'Förhandla rimliga tak och tidsfrister',
      'Överväg W&I-försäkring'
    ],
    examples: [
      {
        title: 'Vanliga garantityper',
        content: '📋 BOLAGSGARANTIER:\n• Säljaren äger aktierna\n• Inga andra rättigheter till aktierna\n• Bolaget är korrekt bildat\n\n💼 FINANSIELLA GARANTIER:\n• Bokslut ger rättvisande bild\n• Inga dolda skulder\n• Korrekta skatter\n\n📄 AVTALSGARANTIER:\n• Väsentliga avtal är giltiga\n• Inga avtalsbrott\n• Inga change-of-control-klausuler\n\n👥 PERSONALGARANTIER:\n• Korrekta anställningsvillkor\n• Inga pågående tvister\n• Pensionsåtaganden korrekt redovisade\n\n⚖️ TVISTGARANTIER:\n• Inga pågående rättstvister\n• Inga hotande krav\n• Inga regulatoriska utredningar'
      },
      {
        title: 'Typiska begränsningar',
        content: 'TAKBELOPP (Cap):\n• Generellt tak: 20-50% av köpeskilling\n• Skattegarantier: Ofta obegränsade\n• Äganderätt: Ofta obegränsade\n\nGOLVBELOPP (De minimis):\n• Enskilt krav: >0,1-0,5% av köpeskilling\n• Aggregerat: >1-2% innan ansvar uppstår\n\nTIDSFRISTER:\n• Generella garantier: 18-24 månader\n• Skattegarantier: 5-7 år\n• Äganderätt: Obegränsat\n• Miljö: 5-10 år'
      }
    ],
    sources: [
      { name: 'CMS - European M&A Study', url: 'https://www.cmslegalondemand.com/dealinsight' },
      { name: 'Aon - W&I Insurance Market', url: 'https://www.aon.com/home/insights/reports/2024/ma-and-transaction-solutions-trends' }
    ]
  },
  'konkurrens-kopare': {
    title: '+15-25% högre pris med konkurrens',
    description: 'Att ha flera intresserade köpare som konkurrerar är det bästa sättet att maximera köpeskillingen.',
    tips: [
      'Kontakta aldrig bara en köpare',
      'Skapa tidpress med tydliga deadlines',
      'Kommunicera att det finns andra intressenter (utan detaljer)',
      'Behåll alternativ så länge som möjligt',
      'Låt köpare veta att det finns en "reservation price"'
    ],
    examples: [
      {
        title: 'Hur konkurrens driver upp priset',
        content: 'SCENARIO A: En köpare\n• Initial bewertung: 40 MSEK\n• Slutpris: 38 MSEK (-5%)\n• Köparen dikterar villkor\n• Lång process, många krav\n\nSCENARIO B: Tre köpare\n• Initiala bud: 38-42 MSEK\n• Andra rundan: 42-48 MSEK\n• Slutpris: 46 MSEK (+15%)\n• Bättre villkor för säljaren\n• Snabbare process'
      },
      {
        title: 'Strategier för att skapa konkurrens',
        content: '✅ GÖR:\n• Sätt tydlig deadline för bud\n• Håll parallella processer\n• Ge alla köpare samma information\n• Kommunicera intresse från andra\n• Var beredd att gå vidare med #2\n\n❌ UNDVIK:\n• Berätta exakt vilka som budar\n• Ge olika information till olika köpare\n• Visa desperation\n• Acceptera första budet direkt'
      }
    ],
    sources: [
      { name: 'Harvard Business Review - Auction Theory in M&A', url: 'https://hbr.org/topic/subject/mergers-and-acquisitions' },
      { name: 'McKinsey - Creating Value in M&A', url: 'https://www.mckinsey.com/capabilities/m-and-a/our-insights' }
    ]
  }
}

// Hide header on this page
const HideHeader = () => {
  useEffect(() => {
    const header = document.querySelector('header')
    if (header) {
      header.style.display = 'none'
    }
    return () => {
      if (header) {
        header.style.display = ''
      }
    }
  }, [])
  return null
}

// Mini bar chart component
function MiniBarChart({ data, label }: { data: number[]; label: string }) {
  const max = Math.max(...data)
  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
      <p className="text-xs text-gray-500 mb-3 font-medium">{label}</p>
      <div className="flex items-end gap-1 h-16">
        {data.map((value, idx) => (
          <div key={idx} className="flex-1 flex flex-col items-center gap-1">
            <div 
              className="w-full bg-[#1F3C58] rounded-t transition-all duration-500"
              style={{ height: `${(value / max) * 100}%`, minHeight: '4px' }}
            />
            <span className="text-[10px] text-gray-400">{idx + 1}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Statistic highlight component - now clickable
function StatHighlight({ value, label, sublabel, tipKey, onTipClick }: { 
  value: string; 
  label: string; 
  sublabel?: string;
  tipKey?: string;
  onTipClick?: (tipKey: string) => void;
}) {
  const hasTip = tipKey && TIPS_DATABASE[tipKey]
  
  return (
    <div 
      className={`bg-[#1F3C58]/5 border border-[#1F3C58]/10 rounded-lg p-3 text-center transition-all ${
        hasTip ? 'cursor-pointer hover:bg-[#1F3C58]/10 hover:border-[#1F3C58]/30 hover:shadow-md' : ''
      }`}
      onClick={() => hasTip && onTipClick && onTipClick(tipKey)}
    >
      <div className="text-2xl sm:text-3xl font-bold text-[#1F3C58]">{value}</div>
      <div className="text-xs text-gray-600 mt-1">{label}</div>
      {sublabel && <div className="text-[10px] text-gray-400 mt-0.5">{sublabel}</div>}
      {hasTip && (
        <div className="text-[10px] text-[#1F3C58] mt-2 flex items-center justify-center gap-1">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Klicka för tips
        </div>
      )}
    </div>
  )
}

// Tips Modal Component
function TipsModal({ tipKey, onClose }: { tipKey: string; onClose: () => void }) {
  const tip = TIPS_DATABASE[tipKey]
  if (!tip) return null

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-[#1F3C58] px-6 py-5 flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-bold text-white pr-4">{tip.title}</h2>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white text-2xl leading-none flex-shrink-0"
          >
            ×
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Description */}
          <p className="text-gray-700 mb-6 leading-relaxed">{tip.description}</p>

          {/* Tips Section */}
          <div className="mb-6">
            <h3 className="font-bold text-[#1F3C58] mb-3 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Praktiska tips
            </h3>
            <ul className="space-y-2">
              {tip.tips.map((t, idx) => (
                <li key={idx} className="flex gap-2 text-sm text-gray-700">
                  <span className="text-[#1F3C58] mt-1">✓</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Examples Section */}
          {tip.examples.map((example, idx) => (
            <div key={idx} className="mb-6">
              <h3 className="font-bold text-[#1F3C58] mb-3 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {example.title}
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">
                  {example.content}
                </pre>
              </div>
            </div>
          ))}

          {/* Common Mistakes */}
          {tip.commonMistakes && tip.commonMistakes.length > 0 && (
            <div className="mb-6">
              <h3 className="font-bold text-red-600 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Vanliga misstag att undvika
              </h3>
              <ul className="space-y-2">
                {tip.commonMistakes.map((mistake, idx) => (
                  <li key={idx} className="flex gap-2 text-sm text-gray-700">
                    <span className="text-red-500 mt-1">✗</span>
                    <span>{mistake}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Sources */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <h3 className="font-bold text-[#1F3C58] mb-3 text-sm">Källor</h3>
            <div className="space-y-2">
              {tip.sources.map((source, idx) => (
                <a 
                  key={idx}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm text-[#1F3C58] hover:underline"
                >
                  • {source.name}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Progress ring component
function ProgressRing({ percent, size = 60, label }: { percent: number; size?: number; label: string }) {
  const strokeWidth = 6
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (percent / 100) * circumference

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke="#E5E7EB"
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke="#1F3C58"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000"
        />
      </svg>
      <span className="text-xs text-gray-600 mt-1 text-center">{label}</span>
    </div>
  )
}

// Timeline component
function Timeline({ items }: { items: { label: string; duration: string }[] }) {
  return (
    <div className="mt-4 relative">
      <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-[#1F3C58]/20" />
      <div className="space-y-3">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center gap-3 pl-0">
            <div className="w-6 h-6 rounded-full bg-[#1F3C58] flex items-center justify-center text-white text-xs font-bold z-10">
              {idx + 1}
            </div>
            <div className="flex-1 flex justify-between items-center text-sm">
              <span className="text-gray-700">{item.label}</span>
              <span className="text-[#1F3C58] font-medium text-xs bg-[#1F3C58]/10 px-2 py-0.5 rounded">{item.duration}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const steps: Step[] = [
  {
    id: 1,
    title: 'Förberedelse',
    subtitle: 'Lägg grunden för en lyckad försäljning',
    duration: '2-6 månader',
    fact: 'Företag som förbereder sig i minst 12 månader får i snitt 23% högre försäljningspris.',
    items: [
      {
        title: 'Samla finansiell dokumentation',
        summary: 'Bokslut, resultatrapporter och prognoser för de senaste 3-5 åren.',
        expanded: 'En köpare vill se en tydlig bild av företagets ekonomiska utveckling. Samla årsredovisningar, månadsrapporter, budgetar och prognoser.\n\nSe till att alla siffror är avstämda och kan förklaras. Eventuella engångsposter eller extraordinära händelser bör dokumenteras separat med förklaringar.\n\nJu mer transparent och välorganiserad din finansiella historik är, desto snabbare går due diligence-processen och desto högre förtroende skapas hos köparen.',
        stats: [
          { value: '3-5 år', label: 'Finansiell historik', tipKey: 'finansiell-historik' },
          { value: '85%', label: 'Köpare kräver bokslut', tipKey: 'kopare-krav-bokslut' }
        ]
      },
      {
        title: 'Dokumentera affärsrelationer',
        summary: 'Alla kundkontrakt, leverantörsavtal och andra väsentliga affärsrelationer.',
        expanded: 'Gå igenom alla aktiva avtal och kategorisera dem efter betydelse. Identifiera vilka kunder som står för störst andel av omsättningen (kundkoncentration är en vanlig riskfaktor).\n\nKartlägg leverantörsberoendet och eventuella exklusivitetsavtal. Dokumentera även informella överenskommelser som bör formaliseras.\n\nEn köpare vill förstå hur stabila intäkterna är och vilka risker som finns i avtalsportföljen.',
        chart: { data: [30, 25, 15, 12, 8, 5, 5], label: 'Typisk kundkoncentration (% av omsättning per kund)' }
      },
      {
        title: 'Minimera nyckelpersonberoende',
        summary: 'Dokumentera processer och rutiner för att minska beroendet av enskilda personer.',
        expanded: 'Nyckelpersonberoende är en av de vanligaste värdesänkande faktorerna vid företagsförsäljning. Börja med att identifiera vilka personer som är kritiska för verksamheten.\n\nDokumentera sedan deras arbetsuppgifter, kontaktnät och beslutprocesser. Skapa manualer och rutinbeskrivningar.\n\nÖverväg att bredda ansvarsfördelningen och introducera backupfunktioner. Köpare betalar premium för företag som kan drivas utan säljaren.',
        stats: [
          { value: '-15%', label: 'Värdeminskning vid högt beroende', tipKey: 'nyckelperson-vardeminskning' },
          { value: '67%', label: 'Affärer misslyckas pga nyckelperson', tipKey: 'affarer-misslyckas-nyckelperson' }
        ]
      },
      {
        title: 'Städa i balansräkningen',
        summary: 'Reglera mellanhavanden med närstående och optimera rörelsekapitalet.',
        expanded: 'Gå igenom balansräkningen med kritiska ögon. Har företaget lån till ägare eller närstående? Dessa måste oftast regleras före försäljning.\n\nFinns det tillgångar som inte används i verksamheten (t.ex. fastigheter, bilar, konst)? Dessa kan behöva delas ut eller säljas separat.\n\nOptimera lagernivåer och kundfordringar för att visa ett sunt rörelsekapitalbehov. En "ren" balansräkning underlättar värderingen och förhandlingen.',
        rings: [
          { percent: 75, label: 'Reglera lån' },
          { percent: 60, label: 'Optimera lager' },
          { percent: 85, label: 'Rensa poster' }
        ]
      },
      {
        title: 'Ordna juridiska dokument',
        summary: 'Bolagsordning, aktiebok, styrelsebeslut och andra formalia.',
        expanded: 'Se till att alla bolagsdokument är uppdaterade och korrekta. Aktieboken ska vara komplett och spåra alla historiska överlåtelser.\n\nStyrelsebeslut och bolagsstämmoprotokoll ska vara signerade och arkiverade. Kontrollera att eventuella ägaravtal, optionsavtal eller bonusplaner är dokumenterade.\n\nVerifiera att bolaget har alla nödvändiga tillstånd och registreringar. Juridiska brister som upptäcks sent i processen kan försena eller till och med stoppa en affär.',
        timeline: [
          { label: 'Aktiebok uppdaterad', duration: '1 vecka' },
          { label: 'Protokoll arkiverade', duration: '2 veckor' },
          { label: 'Tillstånd verifierade', duration: '1-2 veckor' },
          { label: 'Ägaravtal granskade', duration: '1 vecka' }
        ]
      }
    ]
  },
  {
    id: 2,
    title: 'Värdering',
    subtitle: 'Fastställ ett realistiskt marknadsvärde',
    duration: '2-4 veckor',
    fact: 'Svenska SMB säljs typiskt för 3-6x EBITDA, men tech-bolag kan nå 10-15x.',
    items: [
      {
        title: 'Professionell företagsvärdering',
        summary: 'Baserad på kassaflöde, substans och jämförbara transaktioner.',
        expanded: 'Det finns flera värderingsmetoder som kompletterar varandra. DCF-metoden (diskonterat kassaflöde) värderar framtida intjäningsförmåga.\n\nSubstansvärdering fokuserar på tillgångarnas marknadsvärde. Multipelvärdering jämför med liknande transaktioner i branschen.\n\nEn professionell värdering kombinerar dessa metoder och tar hänsyn till företagets specifika situation. Undvik att enbart förlita dig på enkla tumregler - varje företag är unikt.',
        stats: [
          { value: 'DCF', label: 'Kassaflödesvärdering' },
          { value: 'Multipel', label: 'Jämförande värdering' },
          { value: 'Substans', label: 'Tillgångsvärdering' }
        ]
      },
      {
        title: 'Analysera branschens multiplar',
        summary: 'Förstå marknadstrender och köparnas förväntningar.',
        expanded: 'Olika branscher handlas till olika multiplar av omsättning eller EBITDA. Tech-bolag kan värderas till 10x EBITDA medan traditionella tjänsteföretag kanske ligger på 4-6x.\n\nUndersök vilka transaktioner som gjorts i din bransch de senaste åren. Tänk på att multiplar varierar med konjunktur, ränteläge och tillgång på kapital.\n\nHa realistiska förväntningar baserade på faktiska marknadstransaktioner snarare än önsketänkande.',
        chart: { data: [4, 5, 6, 8, 10, 12, 15], label: 'EBITDA-multiplar per bransch (Tjänst → Tech)' }
      },
      {
        title: 'Identifiera värdeskapande faktorer',
        summary: 'Tillväxtpotential, unika tillgångar och marknadsposition.',
        expanded: 'Vad gör ditt företag unikt och attraktivt? Stark tillväxt de senaste åren motiverar en premie.\n\nÅterkommande intäkter (prenumerationsmodeller, serviceavtal) värderas högre än projektbaserade intäkter. Immateriella tillgångar som varumärken, patent eller kunddata kan vara mycket värdefulla.\n\nEn stark marknadsposition med inträdesbarriärer minskar risken för köparen. Dokumentera och kvantifiera dessa faktorer inför förhandlingen.',
        rings: [
          { percent: 90, label: 'Tillväxt' },
          { percent: 75, label: 'Återk. intäkter' },
          { percent: 60, label: 'IP/Patent' }
        ]
      },
      {
        title: 'Förstå Enterprise Value vs Equity Value',
        summary: 'Hur skulder och kassa påverkar det slutliga priset.',
        expanded: 'Enterprise Value (EV) är värdet på hela verksamheten, oavsett finansiering. Equity Value är det som tillfaller aktieägarna efter att skulder dragits av och kassa lagts till.\n\nFormeln är: Equity Value = EV - Nettoskuld. Om ditt företag har stora lån minskar köpeskillingen till dig. Om företaget har överskottskassa ökar den.\n\nFörstå också hur rörelsekapitaljusteringar fungerar - köparen vill ha en "normal" nivå vid tillträdet.',
        stats: [
          { value: 'EV', label: 'Enterprise Value', sublabel: 'Totalt verksamhetsvärde' },
          { value: '−', label: 'Nettoskuld', sublabel: 'Skulder minus kassa' },
          { value: '=', label: 'Equity Value', sublabel: 'Värde för ägare' }
        ]
      },
      {
        title: 'Förbered prisargument',
        summary: 'Köpare värderar ofta lägre - ha tydliga argument redo.',
        expanded: 'Det är naturligt att köpare och säljare har olika syn på värdet. Förbered dig genom att dokumentera varför ditt pris är motiverat.\n\nAnvänd konkreta siffror: "Våra återkommande intäkter har ökat 25% per år de senaste tre åren." Visa synergier köparen kan realisera.\n\nHa backup-argument om köparen ifrågasätter specifika poster. Var också beredd att kompromissa på struktur (t.ex. earnout) om inte pris, för att nå en överenskommelse.',
        chart: { data: [100, 85, 75, 70, 80, 95], label: 'Typisk prisförhandling (Ägarens ask → Slutpris över tid)' }
      }
    ]
  },
  {
    id: 3,
    title: 'Marknadsföring',
    subtitle: 'Nå rätt köpare på rätt sätt',
    duration: '1-3 månader',
    fact: '78% av framgångsrika försäljningar involverar minst 3 seriösa köpare i processen.',
    items: [
      {
        title: 'Skapa teaser-dokument',
        summary: 'Väck intresse utan att avslöja företagets identitet.',
        expanded: 'En teaser är ett 1-2 sidigt dokument som beskriver företaget anonymt. Inkludera bransch, geografisk marknad, ungefärlig omsättning och tillväxt, samt huvudsakliga styrkor.\n\nSyftet är att väcka intresse hos potentiella köpare utan att röja företagets identitet. Teasern skickas ut brett och de som visar intresse får signera ett NDA innan de får mer information.\n\nEn bra teaser balanserar informationsgivning med sekretess.',
        stats: [
          { value: '1-2', label: 'Sidor i teaser', tipKey: 'teaser-sidor' },
          { value: '50+', label: 'Potentiella köpare', tipKey: 'potentiella-kopare' },
          { value: '10-15%', label: 'Svarsfrekvens', tipKey: 'svarsfrekvens' }
        ]
      },
      {
        title: 'Utveckla informationsmemorandum',
        summary: 'Detaljerad presentation med verksamhet, finansiell historik och potential.',
        expanded: 'Informationsmemorandum (IM) är säljarens huvuddokument - ofta 30-50 sidor. Det innehåller: företagets historia och verksamhetsbeskrivning, marknadsanalys, konkurrenssituation, organisation och nyckelpersoner, finansiell historik och prognoser, samt investeringsargument.\n\nIM ska vara professionellt utformat, faktabaserat och säljande utan att överdriva.\n\nEn välskriven IM sparar tid och skapar förtroende hos seriösa köpare.',
        timeline: [
          { label: 'Verksamhetsbeskrivning', duration: '5-10 sidor' },
          { label: 'Marknadsanalys', duration: '5-8 sidor' },
          { label: 'Finansiell historik', duration: '10-15 sidor' },
          { label: 'Investeringscase', duration: '5-10 sidor' }
        ]
      },
      {
        title: 'Identifiera potentiella köpare',
        summary: 'Strategiska köpare (konkurrenter, leverantörer) och finansiella (PE, family offices).',
        expanded: 'Det finns olika typer av köpare med olika motiv. Strategiska köpare (konkurrenter, kunder, leverantörer) söker synergier och betalar ofta högre pris.\n\nPrivate Equity-bolag vill växa och effektivisera för att sälja vidare. Family offices har ofta längre investeringshorisont.\n\nPrivatpersoner (search funds, MBI) söker ett företag att driva själva. Analysera vilken typ av köpare som passar bäst och prioritera uppsökandet därefter.',
        rings: [
          { percent: 45, label: 'Strategiska' },
          { percent: 30, label: 'PE/VC' },
          { percent: 25, label: 'Privata' }
        ]
      },
      {
        title: 'Kontrollerad informationsprocess',
        summary: 'Stegvis informationsgivning efter signerat sekretessavtal (NDA).',
        expanded: 'En professionell försäljningsprocess är strukturerad i faser. Först skickas teaser brett. Intressenter signerar NDA och får IM.\n\nEfter analys lämnar de indikativt bud. De mest seriösa bjuds in till management-presentation och Q&A.\n\nDärefter öppnas datarum för due diligence och slutligt bud lämnas. Denna struktur skyddar känslig information och skapar konkurrens mellan köpare.',
        chart: { data: [100, 40, 20, 10, 5, 3, 1], label: 'Försäljningstratt: Kontaktade → Slutlig köpare' }
      },
      {
        title: 'Skapa konkurrens mellan köpare',
        summary: 'Hantera flera köpare parallellt för att maximera värdet.',
        expanded: 'Att ha flera intresserade köpare är den bästa förhandlingspositionen. Det skapar tidpress, minskar köparnas förhandlingsutrymme och kan driva upp priset.\n\nVar transparent om att det finns andra intressenter utan att röja detaljer. Sätt tydliga deadlines för bud och håll alla parter informerade om tidplanen.\n\nÄven om du har en favorit, behåll alternativen så länge som möjligt.',
        stats: [
          { value: '+15-25%', label: 'Högre pris med konkurrens', tipKey: 'konkurrens-kopare' },
          { value: '3-5', label: 'Optimalt antal budgivare' }
        ]
      }
    ]
  },
  {
    id: 4,
    title: 'Due Diligence',
    subtitle: 'Köparens djupgranskning av företaget',
    duration: '4-8 veckor',
    fact: '40% av alla M&A-affärer får prisjusteringar efter due diligence.',
    items: [
      {
        title: 'Förbered strukturerat datarum',
        summary: 'All relevant dokumentation: finansiellt, juridiskt, kommersiellt, HR.',
        expanded: 'Ett datarum är ett digitalt (eller fysiskt) arkiv där köparen granskar all dokumentation. Organisera materialet i tydliga mappar: bolagsdokumentation, finansiellt, juridiskt/avtal, kommersiellt, personal/HR, IT, miljö, etc.\n\nAnvänd en professionell datarumsplattform med spårning av vem som tittat på vad.\n\nFörbered datarum i förväg - det signalerar professionalism och sparar tid under processen.',
        stats: [
          { value: '200-500', label: 'Dokument i typiskt datarum', tipKey: 'datarum-dokument' },
          { value: '8-12', label: 'Huvudkategorier', tipKey: 'dd-kategorier' }
        ]
      },
      {
        title: 'Finansiell due diligence',
        summary: 'Granskning av historisk ekonomi, intjäningskvalitet och rörelsekapital.',
        expanded: 'Köparens finansiella rådgivare granskar bokslut, månadsrapporter och budget. De analyserar intjäningskvaliteten - är vinsten hållbar eller finns engångsposter?\n\nRörelsekapitalbehovet normaliseras för att bestämma vilken nivå som ska finnas vid tillträdet. Skulder och eventualförpliktelser kartläggs.\n\nFörbered dig på detaljerade frågor och ha förklaringar redo för avvikelser eller ovanliga poster.',
        rings: [
          { percent: 85, label: 'Intjäning' },
          { percent: 70, label: 'Rörelsekapital' },
          { percent: 90, label: 'Skulder' }
        ]
      },
      {
        title: 'Juridisk due diligence',
        summary: 'Granskning av avtal, tvister, IP-rättigheter och regulatoriska frågor.',
        expanded: 'Juristerna granskar alla väsentliga avtal: kundavtal, leverantörsavtal, anställningsavtal, hyresavtal, licensavtal. De letar efter change-of-control-klausuler som kan triggas vid försäljning.\n\nEventuella pågående eller hotande tvister dokumenteras. Immateriella rättigheter (varumärken, patent, domäner) verifieras.\n\nRegulatoriska tillstånd och compliance kontrolleras. Juridiska problem som hittas kan påverka pris eller avtalsvillkor.',
        timeline: [
          { label: 'Avtalsgranskning', duration: '2-3 veckor' },
          { label: 'IP-verifiering', duration: '1-2 veckor' },
          { label: 'Compliance-check', duration: '1-2 veckor' },
          { label: 'Tvistanalys', duration: '1 vecka' }
        ]
      },
      {
        title: 'Kommersiell due diligence',
        summary: 'Analys av marknad, kunder, konkurrenter och affärsmodell.',
        expanded: 'Den kommersiella granskningen validerar affärsplanen och marknadspotentialen. Köparen kan intervjua nyckelpersoner och ibland även kunder (med säljarens godkännande).\n\nMarknadsdata verifieras mot externa källor. Konkurrenslandskapet analyseras. Kundkoncentration och churn-risk bedöms.\n\nSyftet är att bekräfta att affärsmodellen är hållbar och att tillväxtantaganden är realistiska.',
        chart: { data: [20, 35, 55, 70, 85, 90], label: 'Köparens förtroende under DD-processen (%)' }
      },
      {
        title: 'Var transparent och proaktiv',
        summary: 'Överraskningar skapar misstro och kan sänka priset.',
        expanded: 'Den viktigaste regeln i DD: inga överraskningar. Om det finns skelett i garderoben, ta upp dem tidigt och på dina villkor.\n\nEn köpare som upptäcker något som säljaren försökt dölja tappar förtroende och blir misstänksam mot allt annat.\n\nVar proaktiv med att förklara ovanliga poster eller händelser. Svara snabbt och professionellt på frågor. En smidig DD-process bygger förtroende och håller tidplanen.',
        stats: [
          { value: '72h', label: 'Max svarstid på frågor' },
          { value: '0', label: 'Överraskningar (målet)' }
        ]
      }
    ]
  },
  {
    id: 5,
    title: 'Förhandling',
    subtitle: 'Enas om villkor och struktur',
    duration: '2-6 veckor',
    fact: '65% av svenska företagsförsäljningar inkluderar någon form av tilläggsköpeskilling.',
    items: [
      {
        title: 'Förhandla köpeskilling',
        summary: 'Fast belopp, tilläggsköpeskilling (earnout) baserad på framtida resultat.',
        expanded: 'Köpeskillingen kan struktureras på olika sätt. Fast belopp vid tillträde ger säkerhet men köparen tar mer risk.\n\nTilläggsköpeskilling (earnout) kopplar en del av priset till framtida resultat - vanligt om parterna har olika syn på värdet.\n\nSäljarrevers innebär att säljaren lånar ut en del av köpeskillingen. Fundera på vad som är viktigast för dig: maximal köpeskilling eller trygghet om kontant betalning.',
        rings: [
          { percent: 70, label: 'Kontant' },
          { percent: 20, label: 'Earnout' },
          { percent: 10, label: 'Revers' }
        ]
      },
      {
        title: 'Definiera transaktionsstruktur',
        summary: 'Aktieöverlåtelse eller inkråmsförsäljning, skattekonsekvenser.',
        expanded: 'Vid aktieöverlåtelse säljs aktierna och köparen tar över hela bolaget med dess historia. Vid inkråmsförsäljning säljs tillgångarna separat och köparen får ett "rent" bolag.\n\nValet har stora skattekonsekvenser. Aktieförsäljning i fåmansbolag beskattas ofta som kapitalinkomst (delvis), medan inkråmsförsäljning kan medföra inkomstskatt i bolaget.\n\nKonsultera alltid en skatterådgivare innan du bestämmer struktur.',
        stats: [
          { value: '85%', label: 'Aktieöverlåtelser' },
          { value: '15%', label: 'Inkråmsförsäljningar' }
        ]
      },
      {
        title: 'Diskutera garantier',
        summary: 'Vilka utfästelser lämnar säljaren och med vilka begränsningar?',
        expanded: 'Garantikatalogen är ofta en het förhandlingspunkt. Köparen vill ha breda garantier om att företaget är i gott skick. Säljaren vill begränsa sitt ansvar.\n\nTypiska garantier rör: att säljaren äger aktierna, att finansiella rapporter är korrekta, att det inte finns okända tvister, att väsentliga avtal är giltiga.\n\nGarantiernas omfattning, tidsfrister och takbelopp förhandlas. Överväg en W&I-försäkring som övertar delar av garantiansvaret.',
        chart: { data: [10, 15, 20, 18, 12, 8, 5], label: 'Garantianspråk över tid (% av affärer per år efter tillträde)' }
      },
      {
        title: 'Reglera övergångsperiod',
        summary: 'Ska säljaren stanna kvar? I vilken roll och hur länge?',
        expanded: 'Många köpare vill att säljaren stannar en period för kunskapsöverföring. Detta kan vara några månader till flera år beroende på verksamheten.\n\nDefiniera tydligt: vilken roll har säljaren, vilken ersättning, vilka befogenheter, hur länge? Vad händer om samarbetet inte fungerar?\n\nKonkurrensbegränsning efter övergångsperioden? En otydlig övergångsplan skapar ofta konflikter - var specifik.',
        timeline: [
          { label: 'Intensiv överlämning', duration: '1-3 mån' },
          { label: 'Rådgivande roll', duration: '3-6 mån' },
          { label: 'Tillgänglig vid behov', duration: '6-12 mån' },
          { label: 'Konkurrensbegränsning', duration: '2-3 år' }
        ]
      },
      {
        title: 'Villkor för tillträde',
        summary: 'Finansiering, myndighetsgodkännanden, nyckelpersoners kvarstående.',
        expanded: 'Closing conditions är villkor som måste uppfyllas innan affären slutförs. Vanliga villkor: köparens finansiering säkras, konkurrensmyndighetens godkännande (vid större affärer), att nyckelpersoner inte sagt upp sig, att inga väsentliga negativa förändringar skett (MAC-klausul).\n\nJu fler villkor, desto mer osäkerhet.\n\nFörhandla om vilka villkor som är rimliga och vem som bär risken om de inte uppfylls.',
        stats: [
          { value: '95%', label: 'Affärer med villkor' },
          { value: '30-60', label: 'Dagar till tillträde' }
        ]
      }
    ]
  },
  {
    id: 6,
    title: 'Köpeavtal',
    subtitle: 'Juridisk formalisering av affären',
    duration: '2-4 veckor',
    fact: 'Ett genomsnittligt aktieöverlåtelseavtal (SPA) är 40-80 sidor långt.',
    items: [
      {
        title: 'Aktieöverlåtelseavtal (SPA)',
        summary: 'Huvudavtalet med alla överenskomna villkor.',
        expanded: 'Share Purchase Agreement (SPA) är det centrala juridiska dokumentet. Det innehåller: parter och bakgrund, överlåtelse av aktierna, köpeskilling och betalningsvillkor, tillträdesdag och -villkor, säljarens garantier, köparens åtaganden, ersättningsansvar, tvistlösning.\n\nSPA förhandlas intensivt mellan parternas jurister.\n\nSom säljare, fokusera på de kommersiellt viktiga punkterna och låt juristerna hantera det tekniska.',
        stats: [
          { value: '40-80', label: 'Sidor i SPA', tipKey: 'spa-sidor' },
          { value: '15-25', label: 'Garantiklausuler', tipKey: 'garantiklausuler' },
          { value: '10-20', label: 'Bilagor' }
        ]
      },
      {
        title: 'Köpeskillingens betalning',
        summary: 'Kontant vid tillträde, uppskjuten betalning, säljarrevers.',
        expanded: 'Betalningsstrukturen är en nyckelfråga. Kontant vid tillträde är enklast och säkrast för säljaren.\n\nDeponering hos tredje part (escrow) kan användas för att säkra garantiåtaganden. Uppskjuten betalning innebär att delar betalas senare - kräver säkerheter.\n\nSäljarrevers är ett lån från säljaren till köparen - medför kreditrisk. Earnout kopplar betalning till framtida resultat - kräver tydliga beräkningsregler.',
        rings: [
          { percent: 80, label: 'Vid tillträde' },
          { percent: 15, label: 'Escrow' },
          { percent: 5, label: 'Uppskjutet' }
        ]
      },
      {
        title: 'Garantikatalog',
        summary: 'Vilka garantier lämnar säljaren avseende företagets skick?',
        expanded: 'Garantikatalogen är ofta en bilaga på 10-30 sidor. Den täcker typiskt: äganderätt till aktierna, bolagsdokument och organisation, finansiella rapporter, skatteförhållanden, avtal och åtaganden, anställda och pensioner, immateriella rättigheter, miljö, tvister, försäkringar.\n\nTill katalogen hör ett "disclosure letter" där säljaren anger kända undantag.\n\nBegränsningar förhandlas: takbelopp, tidsfrister, minimibelopp för anspråk.',
        timeline: [
          { label: 'Generella garantier', duration: '2-3 år' },
          { label: 'Skattegarantier', duration: '5-7 år' },
          { label: 'Äganderättsgaranti', duration: 'Obegränsad' },
          { label: 'Tak: % av köpeskilling', duration: '10-50%' }
        ]
      },
      {
        title: 'Tilläggsköpeskilling (earnout)',
        summary: 'Beräkningsmodeller och tvistlösning.',
        expanded: 'Om earnout ingår krävs stor noggrannhet. Definiera exakt vilka mått som avgör utbetalning (omsättning, EBITDA, kundanskaffning?).\n\nSpecificera redovisningsprinciper och hur måtten beräknas. Reglera säljarens insyn och möjlighet att påverka.\n\nBestäm vad som händer om köparen integrerar verksamheten eller ändrar strategi. Inkludera en tydlig tvistlösningsmekanism. Dåligt skrivna earnout-klausuler är en vanlig källa till konflikter.',
        chart: { data: [0, 20, 50, 80, 100], label: 'Typisk earnout-utbetalning över tid (% efter år)' }
      },
      {
        title: 'Bilagor och sidoavtal',
        summary: 'Aktiebok, arbetsordning, fullmakter, konkurrensbegränsningar.',
        expanded: 'Till SPA hör ofta ett batteri av bilagor och sidoavtal. Aktieboken visar ägandet. Arbetsordning för styrelse och VD-instruktion kan krävas.\n\nFullmakter för registreringar. Konkurrensbegränsning för säljaren (vanligtvis 2-3 år). Tystnadsplikt.\n\nEventuella anställningsavtal eller konsultavtal för övergångsperioden. Hyresavtal om säljaren äger lokalen. Se till att alla dokument är förberedda och koordinerade.',
        stats: [
          { value: '10-20', label: 'Bilagor till SPA' },
          { value: '2-3 år', label: 'Konkurrensbegränsning' }
        ]
      }
    ]
  },
  {
    id: 7,
    title: 'Tillträde',
    subtitle: 'Överlämning och slutförande',
    duration: '1 dag - 2 veckor',
    fact: 'Efter tillträdet stannar 70% av säljarna kvar i någon form under minst 6 månader.',
    items: [
      {
        title: 'Slutlig verifiering',
        summary: 'Alla villkor för tillträde uppfyllda (closing conditions).',
        expanded: 'Före tillträdet görs en slutlig kontroll att alla villkor är uppfyllda. Köparens finansiering är på plats. Eventuella myndighetsgodkännanden har erhållits.\n\nInga väsentliga negativa förändringar har skett. Nyckelpersoner har bekräftat att de stannar.\n\nEn "bring-down certificate" kan krävas där säljaren bekräftar att garantierna fortfarande gäller. Om något villkor inte är uppfyllt måste parterna enas om hur det hanteras.',
        rings: [
          { percent: 100, label: 'Finansiering' },
          { percent: 100, label: 'Godkännanden' },
          { percent: 100, label: 'Garantier' }
        ]
      },
      {
        title: 'Aktieöverlåtelse',
        summary: 'Uppdatering av aktiebok och registrering hos Bolagsverket.',
        expanded: 'Vid tillträdet överlåts aktierna formellt. Säljaren signerar transportköp på aktiebreven (om fysiska). Aktieboken uppdateras med ny ägare.\n\nAnmälan görs till Bolagsverket om ändrad ägarstruktur och eventuellt ny styrelse. Om aktieägartillskott eller lån ska regleras sker detta samtidigt.\n\nAlla originaldokument överlämnas. En tillträdesprotokoll dokumenterar vad som hänt.',
        timeline: [
          { label: 'Signera transportköp', duration: '1 timme' },
          { label: 'Uppdatera aktiebok', duration: '1 timme' },
          { label: 'Bolagsverket', duration: '1-5 dagar' },
          { label: 'Överlämna dokument', duration: '1 dag' }
        ]
      },
      {
        title: 'Likvidavräkning',
        summary: 'Köpeskillingen betalas mot överlämning.',
        expanded: 'Betalningen sker normalt mot simultant tillträde - aktierna överlåts när pengarna landat på säljarens konto.\n\nEn closing statement visar den slutliga köpeskillingen efter eventuella justeringar för rörelsekapital, nettoskuld och andra avtalade poster.\n\nEventuell escrow-deponering för garantier sätts upp. Om det finns earnout bekräftas beräkningsgrunder. Parterna signerar ett completion memorandum som bekräftar tillträdet.',
        stats: [
          { value: 'T+0', label: 'Betalning vid tillträde' },
          { value: '10-20%', label: 'Typisk escrow' }
        ]
      },
      {
        title: 'Praktisk överlämning',
        summary: 'Nycklar, lösenord, kundkontakter, leverantörsrelationer.',
        expanded: 'Den praktiska överlämningen är minst lika viktig som den juridiska. Överför alla fysiska tillgångar: nycklar, fordon, utrustning.\n\nDela digitala tillgångar: lösenord, admin-åtkomst, domäner, sociala medier. Introducera köparen för viktiga kontakter: nyckelpersonal, nyckelkunder, strategiska leverantörer.\n\nVar tillgänglig för frågor under övergångsperioden. En smidig överlämning ger gott samvete och minskar risken för tvist.',
        rings: [
          { percent: 100, label: 'Fysiskt' },
          { percent: 100, label: 'Digitalt' },
          { percent: 100, label: 'Relationer' }
        ]
      },
      {
        title: 'Övergångsperiod',
        summary: 'Stötta köparen med kunskapsöverföring.',
        expanded: 'Under övergångsperioden hjälper säljaren köparen att ta över verksamheten. Detta kan innebära dagligt arbete på plats, tillgänglighet för frågor per telefon/mejl, eller formella utbildningspass.\n\nDokumentera den kunskap som överförs. Var professionell även om det känns konstigt att inte längre ha kontrollen.\n\nEn lyckad övergång ökar chansen att eventuell earnout betalas ut och att relationen med köparen förblir god.',
        chart: { data: [100, 80, 50, 30, 15, 5], label: 'Säljarens engagemang över tid (% timmar per månad)' }
      }
    ]
  },
  {
    id: 8,
    title: 'Komplett Analys',
    subtitle: 'Generera din professionella rapport',
    duration: 'Några minuter',
    fact: 'En väl förberedd försäljningsdokumentation kan öka försäljningspriset med 15-25%.',
    items: [
      {
        title: 'Sammanställ all information',
        summary: 'AI-driven analys av allt du har fyllt i under processens gång.',
        expanded: 'Baserat på all information du har angett i de tidigare stegen skapar vi en omfattande analys av ditt företag ur en köpares perspektiv.\n\nAnalysen inkluderar en riskbedömning, styrkor och svagheter, samt konkreta rekommendationer för att maximera värdet vid försäljning.\n\nRapporten är ett professionellt dokument du kan använda som underlag i samtal med potentiella köpare eller M&A-rådgivare.',
        stats: [
          { value: '12', label: 'Sidor i rapporten' },
          { value: '5', label: 'Riskområden analyserade' },
          { value: 'AI', label: 'Driven analys' }
        ]
      },
      {
        title: 'Riskbedömning',
        summary: 'Identifiering av finansiella, operationella och juridiska risker.',
        expanded: 'Vi analyserar fem huvudsakliga riskområden: finansiell risk, operationell risk, nyckelpersonrisk, kundrisk och juridisk risk.\n\nVarje område bedöms på en skala och du får en övergripande riskprofil som hjälper dig förstå hur en köpare kommer att se på ditt företag.\n\nRiskbedömningen baseras på branschstandarder och M&A-praxis.',
        rings: [
          { percent: 100, label: 'Finansiell' },
          { percent: 100, label: 'Operationell' },
          { percent: 100, label: 'Juridisk' }
        ]
      },
      {
        title: 'Styrkor & svagheter',
        summary: 'SWOT-inspirerad analys av ditt företags position.',
        expanded: 'Vi identifierar de faktorer som gör ditt företag attraktivt för köpare och de områden som kan påverka värderingen negativt.\n\nGenomen att förstå dessa kan du fokusera dina förberedelser på rätt saker och presentera företaget på bästa sätt.\n\nAnalysen är baserad på den specifika information du har angett - inte generiska mallar.',
        stats: [
          { value: '5+', label: 'Styrkor identifierade' },
          { value: '4+', label: 'Förbättringsområden' }
        ]
      },
      {
        title: 'Rekommendationer',
        summary: 'Konkreta åtgärder för att maximera värdet.',
        expanded: 'Baserat på analysen ger vi dig prioriterade rekommendationer för vad du bör fokusera på innan du går ut i en försäljningsprocess.\n\nVarje rekommendation är konkret och baserad på din specifika situation.\n\nVi inkluderar också nästa steg i försäljningsprocessen för att hjälpa dig framåt.',
        timeline: [
          { label: 'Prioriterade åtgärder', duration: '1-3 mån' },
          { label: 'Förberedande dokumentation', duration: '2-4 mån' },
          { label: 'Redo för marknaden', duration: '3-6 mån' }
        ]
      },
      {
        title: 'Ladda ner PDF-rapport',
        summary: 'En professionell 12-sidig rapport att spara och dela.',
        expanded: 'Din kompletta analys sammanställs i en snygg PDF-rapport med Afterfounder:s professionella design.\n\nRapporten innehåller alla analyser, diagram, checklistor och rekommendationer.\n\nDetta är ett konfidentiellt dokument som du kan dela med rådgivare, styrelse eller potentiella köpare efter eget val.',
        stats: [
          { value: 'PDF', label: 'Format' },
          { value: '12', label: 'Sidor' },
          { value: '∞', label: 'Spara för alltid' }
        ]
      }
    ]
  }
]

export default function ForsaljningsprocessenPage() {
  const locale = useLocale()
  const [currentStep, setCurrentStep] = useState(0)
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({})
  const [showSources, setShowSources] = useState(false)
  const [selectedTip, setSelectedTip] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  
  // Industry selector state
  const [showIndustrySelector, setShowIndustrySelector] = useState(true)
  const [selectedIndustry, setSelectedIndustry] = useState<IndustryOption | null>(null)
  
  const handleIndustrySelect = (industry: IndustryOption) => {
    setSelectedIndustry(industry)
    setShowIndustrySelector(false)
    // Also update companyData with industry
    setCompanyData(prev => ({
      ...prev,
      industry: {
        id: industry.id,
        label: industry.label
      }
    }))
  }
  
  useEffect(() => {
    setIsMounted(true)
  }, [])
  
  // Company data state
  const [companyData, setCompanyData] = useState<CompanyData>(initialCompanyData)
  const [urlInput, setUrlInput] = useState('')
  const [isScrapingUrl, setIsScrapingUrl] = useState(false)
  const [scrapeError, setScrapeError] = useState<string | null>(null)
  const [scrapeSuccess, setScrapeSuccess] = useState(false)
  
  // Document upload state
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [isAnalyzingDocs, setIsAnalyzingDocs] = useState(false)
  const [docAnalysisError, setDocAnalysisError] = useState<string | null>(null)
  const [docAnalysisSuccess, setDocAnalysisSuccess] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  
  // Modal state
  const [activeModal, setActiveModal] = useState<ModalCategory | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  
  // Complete analysis state
  const [completeAnalysis, setCompleteAnalysis] = useState<AnalysisResult | null>(null)
  const [isGeneratingAnalysis, setIsGeneratingAnalysis] = useState(false)
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const [showPdfReady, setShowPdfReady] = useState(false)

  // Scrape URL function
  const handleScrapeUrl = async () => {
    if (!urlInput.trim()) return
    
    setIsScrapingUrl(true)
    setScrapeError(null)
    setScrapeSuccess(false)
    
    try {
      const response = await fetch('/api/scrape-company-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          url: urlInput,
          companyName: companyData.companyName || undefined
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Kunde inte skrapa URL')
      }
      
      if (data.success) {
        setCompanyData(prev => ({
          ...prev,
          websiteUrl: urlInput,
          companyName: data.combined?.companyName || prev.companyName,
          scrapedData: {
            title: data.website?.title,
            description: data.combined?.description,
            highlights: data.website?.highlights,
            contact: data.website?.contact
          }
        }))
        setScrapeSuccess(true)
        setTimeout(() => setScrapeSuccess(false), 3000)
      } else {
        setScrapeError('Kunde inte hitta information på den angivna URL:en')
      }
    } catch (error) {
      console.error('Scrape error:', error)
      setScrapeError(error instanceof Error ? error.message : 'Ett fel uppstod')
    } finally {
      setIsScrapingUrl(false)
    }
  }

  // Handle document upload and analysis
  const handleFileUpload = async (files: FileList | File[]) => {
    const fileArray = Array.from(files)
    const validFiles = fileArray.filter(file => {
      const ext = file.name.toLowerCase()
      return ext.endsWith('.pdf') || ext.endsWith('.docx') || ext.endsWith('.doc') || 
             ext.endsWith('.xlsx') || ext.endsWith('.xls') || ext.endsWith('.txt') || ext.endsWith('.csv') ||
             ext.endsWith('.jpg') || ext.endsWith('.jpeg') || ext.endsWith('.png') || 
             ext.endsWith('.gif') || ext.endsWith('.webp') || ext.endsWith('.tiff') || ext.endsWith('.tif')
    })
    
    if (validFiles.length === 0) {
      setDocAnalysisError('Inga giltiga filer. Stödda format: PDF, Word, Excel, TXT, CSV, bilder (JPG, PNG)')
      return
    }
    
    setUploadedFiles(prev => [...prev, ...validFiles])
  }

  const handleAnalyzeDocuments = async () => {
    if (uploadedFiles.length === 0) return
    
    setIsAnalyzingDocs(true)
    setDocAnalysisError(null)
    setDocAnalysisSuccess(false)
    
    try {
      const formData = new FormData()
      uploadedFiles.forEach(file => formData.append('files', file))
      
      const response = await fetch('/api/analyze-documents', {
        method: 'POST',
        body: formData
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Kunde inte analysera dokumenten')
      }
      
      if (data.success && data.analysis) {
        const analysis = data.analysis
        
        // Update company data with extracted information
        setCompanyData(prev => ({
          ...prev,
          companyName: analysis.companyName || prev.companyName,
          financialDocs: {
            ...prev.financialDocs,
            revenue3Years: analysis.financialDocs?.revenue3Years || prev.financialDocs.revenue3Years,
            profit3Years: analysis.financialDocs?.profit3Years || prev.financialDocs.profit3Years,
            forecastYears: analysis.financialDocs?.forecastYears || prev.financialDocs.forecastYears,
            ebitdaNotes: analysis.financialDocs?.ebitdaNotes || prev.financialDocs.ebitdaNotes,
            oneTimeItems: analysis.financialDocs?.oneTimeItems || prev.financialDocs.oneTimeItems
          },
          businessRelations: {
            ...prev.businessRelations,
            topCustomers: analysis.businessRelations?.topCustomers?.length > 0 
              ? analysis.businessRelations.topCustomers 
              : prev.businessRelations.topCustomers,
            customerConcentrationRisk: analysis.businessRelations?.customerConcentrationRisk || prev.businessRelations.customerConcentrationRisk,
            keySuppliers: analysis.businessRelations?.keySuppliers || prev.businessRelations.keySuppliers,
            exclusivityAgreements: analysis.businessRelations?.exclusivityAgreements || prev.businessRelations.exclusivityAgreements,
            informalAgreements: analysis.businessRelations?.informalAgreements || prev.businessRelations.informalAgreements
          },
          keyPerson: {
            ...prev.keyPerson,
            ownerInvolvement: analysis.keyPerson?.ownerInvolvement || prev.keyPerson.ownerInvolvement,
            managementTeam: analysis.keyPerson?.managementTeam || prev.keyPerson.managementTeam,
            transitionPlan: analysis.keyPerson?.transitionPlan || prev.keyPerson.transitionPlan
          },
          balanceSheet: {
            ...prev.balanceSheet,
            loansToOwners: analysis.balanceSheet?.loansToOwners || prev.balanceSheet.loansToOwners,
            nonOperatingAssets: analysis.balanceSheet?.nonOperatingAssets || prev.balanceSheet.nonOperatingAssets,
            inventoryStatus: analysis.balanceSheet?.inventoryStatus || prev.balanceSheet.inventoryStatus,
            receivablesStatus: analysis.balanceSheet?.receivablesStatus || prev.balanceSheet.receivablesStatus,
            liabilitiesToClean: analysis.balanceSheet?.liabilitiesToClean || prev.balanceSheet.liabilitiesToClean
          },
          legalDocs: {
            ...prev.legalDocs,
            pendingLegalIssues: analysis.legalDocs?.pendingLegalIssues || prev.legalDocs.pendingLegalIssues
          }
        }))
        
        setDocAnalysisSuccess(true)
        setTimeout(() => setDocAnalysisSuccess(false), 5000)
      }
    } catch (error) {
      console.error('Document analysis error:', error)
      setDocAnalysisError(error instanceof Error ? error.message : 'Ett fel uppstod')
    } finally {
      setIsAnalyzingDocs(false)
    }
  }

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  // Save category data
  const handleSaveCategory = useCallback((category: ModalCategory, data: any) => {
    setCompanyData(prev => ({
      ...prev,
      [category]: data
    }))
  }, [])

  // Generate summary for category
  const handleGenerateSummary = useCallback(async (category: ModalCategory) => {
    setIsGenerating(true)
    
    try {
      const response = await fetch('/api/generate-sales-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          categoryData: companyData[category],
          scrapedData: { combined: companyData.scrapedData },
          companyName: companyData.companyName
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Kunde inte generera sammanfattning')
      }
      
      setCompanyData(prev => ({
        ...prev,
        generatedSummaries: {
          ...prev.generatedSummaries,
          [category]: data.summary
        }
      }))
      
      setActiveModal(null)
    } catch (error) {
      console.error('Generate error:', error)
      alert(error instanceof Error ? error.message : 'Ett fel uppstod')
    } finally {
      setIsGenerating(false)
    }
  }, [companyData])

  // Generate complete analysis for PDF
  const handleGenerateCompleteAnalysis = useCallback(async () => {
    setIsGeneratingAnalysis(true)
    setAnalysisError(null)
    
    try {
      const response = await fetch('/api/generate-complete-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyData })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Kunde inte generera analys')
      }
      
      setCompleteAnalysis(data.analysis)
      setShowPdfReady(true)
    } catch (error) {
      console.error('Complete analysis error:', error)
      setAnalysisError(error instanceof Error ? error.message : 'Ett fel uppstod')
    } finally {
      setIsGeneratingAnalysis(false)
    }
  }, [companyData])

  // Check if enough data has been filled in
  const hasEnoughDataForAnalysis = () => {
    const summaries = Object.values(companyData.generatedSummaries).filter(Boolean)
    return summaries.length >= 2 || companyData.scrapedData !== null
  }

  const toggleExpand = (stepId: number, itemIdx: number) => {
    const key = `${stepId}-${itemIdx}`
    setExpandedItems(prev => ({ ...prev, [key]: !prev[key] }))
  }

  // Map step items to modal categories
  const getModalCategory = (stepId: number, itemIdx: number): ModalCategory | null => {
    if (stepId === 1) {
      // Förberedelse-steget
      switch (itemIdx) {
        case 0: return 'financialDocs' // Samla finansiell dokumentation
        case 1: return 'businessRelations' // Dokumentera affärsrelationer
        case 2: return 'keyPerson' // Minimera nyckelpersonberoende
        case 3: return 'balanceSheet' // Städa i balansräkningen
        case 4: return 'legalDocs' // Ordna juridiska dokument
        default: return null
      }
    }
    return null
  }

  const getCategoryStatus = (category: ModalCategory): 'empty' | 'filled' | 'generated' => {
    if (companyData.generatedSummaries[category]) return 'generated'
    
    const data = companyData[category]
    if (!data) return 'empty'
    
    // Check if any meaningful data has been entered
    const hasData = Object.values(data).some(val => {
      if (typeof val === 'boolean') return val
      if (typeof val === 'string') return val.trim().length > 0
      if (Array.isArray(val)) return val.some((item: any) => 
        typeof item === 'object' ? Object.values(item).some(v => typeof v === 'string' && v.trim().length > 0) : item
      )
      return false
    })
    
    return hasData ? 'filled' : 'empty'
  }

  // Check if a step is completed (all items have data GENERATED - not just filled)
  const isStepCompleted = (stepIdx: number): boolean => {
    const stepData = steps[stepIdx]
    if (!stepData) return false
    
    // Step 1 (Förberedelse) - check all 5 categories must be GENERATED
    if (stepIdx === 0) {
      const categories: ModalCategory[] = ['financialDocs', 'businessRelations', 'keyPerson', 'balanceSheet', 'legalDocs']
      return categories.every(cat => {
        const status = getCategoryStatus(cat)
        return status === 'generated' // Only generated counts as complete
      })
    }
    
    // For other steps, only mark complete if step 1 is done and user has passed this step
    if (!isStepCompleted(0)) return false
    return currentStep > stepIdx
  }
  
  // Check if a step is in progress (at least one item has data but not all complete)
  const isStepInProgress = (stepIdx: number): boolean => {
    if (stepIdx === 0) {
      const categories: ModalCategory[] = ['financialDocs', 'businessRelations', 'keyPerson', 'balanceSheet', 'legalDocs']
      const hasAnyData = categories.some(cat => {
        const status = getCategoryStatus(cat)
        return status === 'filled' || status === 'generated'
      })
      const allComplete = isStepCompleted(stepIdx)
      return hasAnyData && !allComplete
    }
    return false
  }

  // Get industry-specific steps if industry is selected
  const industrySteps = selectedIndustry 
    ? getIndustrySteps(selectedIndustry.id, steps as IndustryStep[])
    : steps
  
  const progress = ((currentStep + 1) / industrySteps.length) * 100
  const step = industrySteps[currentStep]

  // Show industry selector first
  if (showIndustrySelector) {
    return (
      <div className="min-h-screen bg-gray-100">
        <HideHeader />
        <IndustrySelectorModal
          onSelect={handleIndustrySelect}
          onClose={() => setShowIndustrySelector(false)}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <HideHeader />

      <div className="relative min-h-screen px-3 sm:px-4 py-8 sm:py-12">
        {/* Top header bar with mascot */}
        <div className="max-w-6xl mx-auto mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href={`/${locale}`} className="text-2xl font-bold text-[#1F3C58] hover:opacity-80 transition-opacity">
                Afterfounder
              </Link>
              {selectedIndustry && (
                <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-[#1F3C58]/5 rounded-xl">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#1F3C58] text-white">
                    {selectedIndustry.icon}
                  </div>
                  <span className="text-sm font-medium text-[#1F3C58]">{selectedIndustry.label}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-500">
                Försäljningsprocess · {currentStep + 1} av {industrySteps.length} steg klara
              </div>
              <div className="hidden lg:block">
                <Image
                  src="/Maskots/maskot6.png"
                  alt="Afterfounder maskot"
                  width={80}
                  height={80}
                  className="object-contain"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Main layout with sidebar */}
        <div className="max-w-6xl mx-auto flex gap-6">
          {/* Left Sidebar - Steps Navigation */}
          <div className="hidden lg:block w-72 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-8">
              <h2 className="text-lg font-bold text-[#1F3C58] mb-2">Försäljningsprocessen</h2>
              <p className="text-xs text-gray-500 mb-6">Vi använder informationen för att matcha dig med rätt köpare.</p>
              
              {/* Step List */}
              <div className="space-y-1">
                {industrySteps.map((s, idx) => {
                  const isActive = currentStep === idx
                  const completed = isStepCompleted(idx)
                  const inProgress = isStepInProgress(idx)
                  
                  // Color logic: Active = dark blue, Completed = green, In Progress = gold, Default = gray
                  const getButtonStyle = () => {
                    if (isActive) return 'bg-[#1F3C58] text-white'
                    if (completed) return 'bg-green-50 text-green-700 hover:bg-green-100'
                    if (inProgress) return 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                    return 'text-gray-500 hover:bg-gray-50'
                  }
                  
                  const getCircleStyle = () => {
                    if (isActive) return 'bg-white/20 text-white'
                    if (completed) return 'bg-green-500 text-white'
                    if (inProgress) return 'bg-amber-400 text-white'
                    return 'bg-gray-200 text-gray-500'
                  }
                  
                  return (
                    <button
                      key={s.id}
                      onClick={() => setCurrentStep(idx)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${getButtonStyle()}`}
                    >
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${getCircleStyle()}`}>
                        {completed ? (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          idx + 1
                        )}
                      </span>
                      <span className={`text-sm font-medium truncate ${isActive ? 'text-white' : ''}`}>
                        {s.title}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* Selected Industry Badge */}
              {selectedIndustry && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#1F3C58]">
                      <div className="text-white text-sm">
                        {selectedIndustry.icon}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider">Bransch</p>
                      <p className="text-sm font-medium text-[#1F3C58] truncate">{selectedIndustry.label}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowIndustrySelector(true)}
                    className="text-xs text-[#1F3C58] hover:underline"
                  >
                    Ändra bransch
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
            {/* White content card */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              {/* Step Header */}
              <div className="bg-[#1F3C58] px-6 py-5">
                <div className="flex items-center gap-3 mb-1">
                  <span className="px-2 py-0.5 bg-white/20 rounded text-xs text-white/80">
                    Steg {currentStep + 1}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white">{step.title}</h2>
                <p className="text-white/70 text-sm">{step.subtitle}</p>
              </div>

              {/* URL Input Section and Document Upload - Only on step 1 */}
              {currentStep === 0 && (
              <>
              <div className="px-4 sm:px-10 py-5 bg-gradient-to-r from-[#1F3C58]/5 to-[#1F3C58]/10 border-b border-[#1F3C58]/10">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-5 h-5 text-[#1F3C58]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                  <h3 className="font-semibold text-[#1F3C58] text-sm">Börja med ditt företag</h3>
                </div>
                <p className="text-xs text-gray-600 mb-3">
                  Ange din företagshemsida så hämtar vi automatiskt information som hjälper dig fylla i uppgifterna.
                </p>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="url"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleScrapeUrl()}
                      placeholder="https://mittforetag.se"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1F3C58] focus:border-transparent text-sm pr-10"
                    />
                    {scrapeSuccess && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleScrapeUrl}
                    disabled={isScrapingUrl || !urlInput.trim()}
                    className="px-4 py-2.5 bg-[#1F3C58] text-white rounded-lg text-sm font-medium hover:bg-[#1F3C58]/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                  >
                    {isScrapingUrl ? (
                      <>
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Hämtar...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        Hämta info
                      </>
                    )}
                  </button>
                </div>
                {scrapeError && (
                  <p className="text-xs text-red-500 mt-2">{scrapeError}</p>
                )}
                {companyData.scrapedData && (
                  <div className="mt-3 p-3 bg-white rounded-lg border border-[#1F3C58]/20">
                    <div className="flex items-center gap-2 text-xs text-green-600 mb-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Information hämtad!
                    </div>
                    {companyData.scrapedData.title && (
                      <p className="text-sm font-medium text-gray-800">{companyData.scrapedData.title}</p>
                    )}
                    {companyData.scrapedData.description && (
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">{companyData.scrapedData.description}</p>
                    )}
                    {companyData.scrapedData.highlights && companyData.scrapedData.highlights.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {companyData.scrapedData.highlights.slice(0, 4).map((highlight, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-[#1F3C58]/10 text-[#1F3C58] rounded text-[10px]">
                            {highlight}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Document Upload Section */}
              <div className="px-4 sm:px-10 py-5 bg-white border-b border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-5 h-5 text-[#1F3C58]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="font-semibold text-[#1F3C58] text-sm">Ladda upp dokument</h3>
                </div>
                <p className="text-xs text-gray-600 mb-3">
                  Ladda upp bokslut, avtal, organisationsscheman eller andra dokument. AI:n analyserar och fyller i uppgifterna automatiskt.
                </p>
                
                {/* Dropzone */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault()
                    setIsDragging(false)
                    if (e.dataTransfer.files) handleFileUpload(e.dataTransfer.files)
                  }}
                  className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
                    isDragging 
                      ? 'border-[#1F3C58] bg-[#1F3C58]/5' 
                      : 'border-gray-200 hover:border-[#1F3C58]/50 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.jpg,.jpeg,.png,.gif,.webp,.tiff,.tif"
                    onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center gap-2">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                      isDragging ? 'bg-[#1F3C58] text-white' : 'bg-gray-100 text-gray-400'
                    }`}>
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        {isDragging ? 'Släpp filerna här' : 'Dra och släpp filer här'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        eller klicka för att välja • PDF, Word, Excel, TXT, bilder
                      </p>
                    </div>
                  </div>
                </div>

                {/* Uploaded files list */}
                {uploadedFiles.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-gray-700">{uploadedFiles.length} fil(er) valda</p>
                      <button
                        onClick={() => setUploadedFiles([])}
                        className="text-xs text-gray-500 hover:text-red-500 transition-colors"
                      >
                        Ta bort alla
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {uploadedFiles.map((file, idx) => (
                        <div 
                          key={idx}
                          className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full text-xs"
                        >
                          <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="text-gray-700 max-w-[120px] truncate">{file.name}</span>
                          <button
                            onClick={() => removeFile(idx)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                    
                    {/* Analyze button */}
                    <button
                      onClick={handleAnalyzeDocuments}
                      disabled={isAnalyzingDocs}
                      className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-3 bg-[#1F3C58] text-white rounded-lg text-sm font-medium hover:bg-[#1F3C58]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {isAnalyzingDocs ? (
                        <>
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Analyserar dokument... (kan ta 30-60 sek)
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          Analysera och fyll i uppgifter automatiskt
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Error message */}
                {docAnalysisError && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-xs text-red-600">{docAnalysisError}</p>
                  </div>
                )}

                {/* Success message */}
                {docAnalysisSuccess && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 text-green-700">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-xs font-medium">Dokument analyserade! Uppgifterna har fyllts i under respektive kategori.</p>
                    </div>
                  </div>
                )}
              </div>
              </>
              )}

              {/* Progress bar */}
              <div className="px-4 sm:px-10 py-3 sm:py-4 border-b border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs sm:text-sm font-medium text-[#1F3C58]">
                    Steg {currentStep + 1} av {industrySteps.length}
                  </span>
                  <span className="text-xs sm:text-sm text-gray-500">
                    {Math.round(progress)}%
                  </span>
                </div>
                <div className="h-1.5 sm:h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#1F3C58] transition-all duration-500 ease-out rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Step content - min height for consistency */}
              <div className="px-4 sm:px-10 py-6 sm:py-10 min-h-[500px] sm:min-h-[600px]">
                <div className="mb-4 sm:mb-6">
                  <div className="flex items-center gap-3 sm:gap-4 mb-2">
                    <span className={`flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-base sm:text-lg font-bold transition-colors ${
                      isStepCompleted(currentStep) 
                        ? 'bg-green-500 text-white' 
                        : isStepInProgress(currentStep)
                          ? 'bg-amber-400 text-white'
                          : 'bg-[#1F3C58] text-white'
                    }`}>
                      {isStepCompleted(currentStep) ? (
                        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        step.id
                      )}
                    </span>
                    <div>
                      <h2 className={`text-lg sm:text-2xl font-bold ${
                        isStepCompleted(currentStep) 
                          ? 'text-green-600' 
                          : isStepInProgress(currentStep)
                            ? 'text-amber-600'
                            : 'text-[#1F3C58]'
                      }`}>
                        {step.title}
                        {isStepCompleted(currentStep) && (
                          <span className="ml-2 text-sm font-normal text-green-500">✓ Klart</span>
                        )}
                        {isStepInProgress(currentStep) && !isStepCompleted(currentStep) && (
                          <span className="ml-2 text-sm font-normal text-amber-500">⏳ Pågår</span>
                        )}
                      </h2>
                      <p className="text-gray-500 text-xs sm:text-sm">{step.subtitle}</p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2 text-xs sm:text-sm">
                    <span className="text-gray-400">
                      Tidsåtgång: {step.duration}
                    </span>
                  </div>
                  {/* Fact box */}
                  <div className="mt-3 sm:mt-4 p-3 bg-[#1F3C58]/5 border-l-4 border-[#1F3C58] rounded-r-lg">
                    <p className="text-xs sm:text-sm text-[#1F3C58] font-medium">
                      {step.fact}
                    </p>
                  </div>
                </div>

                {/* Special UI for Step 8 - Complete Analysis */}
                {step.id === 8 && (
                  <div className="mb-6 p-6 bg-gradient-to-br from-[#1F3C58] to-[#2D5A7B] rounded-xl text-white">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold">Generera din kompletta rapport</h3>
                        <p className="text-white/70 text-sm">AI-driven analys baserad på all din data</p>
                      </div>
                    </div>
                    
                    {/* Progress indicator */}
                    <div className="mb-4 p-4 bg-white/10 rounded-lg">
                      <p className="text-sm font-medium mb-3">Din framgång i processen:</p>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${companyData.scrapedData ? 'bg-green-500' : 'bg-white/30'}`}>
                            {companyData.scrapedData ? '✓' : '○'}
                          </span>
                          <span className={companyData.scrapedData ? 'text-white' : 'text-white/50'}>Webbplats skrapad</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${companyData.generatedSummaries.financialDocs ? 'bg-green-500' : 'bg-white/30'}`}>
                            {companyData.generatedSummaries.financialDocs ? '✓' : '○'}
                          </span>
                          <span className={companyData.generatedSummaries.financialDocs ? 'text-white' : 'text-white/50'}>Finansiell info</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${companyData.generatedSummaries.businessRelations ? 'bg-green-500' : 'bg-white/30'}`}>
                            {companyData.generatedSummaries.businessRelations ? '✓' : '○'}
                          </span>
                          <span className={companyData.generatedSummaries.businessRelations ? 'text-white' : 'text-white/50'}>Affärsrelationer</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${companyData.generatedSummaries.keyPerson ? 'bg-green-500' : 'bg-white/30'}`}>
                            {companyData.generatedSummaries.keyPerson ? '✓' : '○'}
                          </span>
                          <span className={companyData.generatedSummaries.keyPerson ? 'text-white' : 'text-white/50'}>Nyckelpersoner</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${companyData.generatedSummaries.balanceSheet ? 'bg-green-500' : 'bg-white/30'}`}>
                            {companyData.generatedSummaries.balanceSheet ? '✓' : '○'}
                          </span>
                          <span className={companyData.generatedSummaries.balanceSheet ? 'text-white' : 'text-white/50'}>Balansräkning</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${companyData.generatedSummaries.legalDocs ? 'bg-green-500' : 'bg-white/30'}`}>
                            {companyData.generatedSummaries.legalDocs ? '✓' : '○'}
                          </span>
                          <span className={companyData.generatedSummaries.legalDocs ? 'text-white' : 'text-white/50'}>Juridik</span>
                        </div>
                      </div>
                    </div>
                    
                    {!hasEnoughDataForAnalysis() && (
                      <div className="mb-4 p-3 bg-amber-500/20 border border-amber-400/30 rounded-lg">
                        <p className="text-sm text-amber-100">
                          💡 Tips: Gå tillbaka till steg 1 och fyll i uppgifter för minst 2 kategorier för bästa resultat.
                        </p>
                      </div>
                    )}
                    
                    {analysisError && (
                      <div className="mb-4 p-3 bg-red-500/20 border border-red-400/30 rounded-lg">
                        <p className="text-sm text-red-100">{analysisError}</p>
                      </div>
                    )}
                    
                    {!completeAnalysis ? (
                      <button
                        onClick={handleGenerateCompleteAnalysis}
                        disabled={isGeneratingAnalysis}
                        className="w-full py-4 bg-white text-[#1F3C58] rounded-lg font-bold text-lg hover:bg-gray-100 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                      >
                        {isGeneratingAnalysis ? (
                          <>
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Genererar analys... (kan ta 30-60 sek)
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            Generera komplett analys
                          </>
                        )}
                      </button>
                    ) : (
                      <div className="space-y-4">
                        <div className="p-4 bg-green-500/20 border border-green-400/30 rounded-lg">
                          <div className="flex items-center gap-2 text-green-100 font-medium mb-2">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Analys klar!
                          </div>
                          <p className="text-sm text-green-100/80">{completeAnalysis.executiveSummary.slice(0, 200)}...</p>
                        </div>
                        
                        {isMounted ? (
                          <PDFDownloadLink
                            document={
                              <SalesProcessReportPDF
                                companyData={companyData}
                                analysis={completeAnalysis}
                                generatedAt={new Date().toLocaleDateString('sv-SE', { 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric' 
                                })}
                              />
                            }
                            fileName={`Försäljningsanalys-${companyData.companyName || 'Företag'}-${new Date().toISOString().split('T')[0]}.pdf`}
                            className="w-full py-4 bg-white text-[#1F3C58] rounded-lg font-bold text-lg hover:bg-gray-100 transition-all flex items-center justify-center gap-3"
                          >
                            {({ loading }) => (
                              loading ? (
                                <>
                                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                  </svg>
                                  Skapar PDF...
                                </>
                              ) : (
                                <>
                                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  Ladda ner PDF-rapport (12 sidor)
                                </>
                              )
                            )}
                          </PDFDownloadLink>
                        ) : (
                          <div className="w-full py-4 bg-white text-[#1F3C58] rounded-lg font-bold text-lg flex items-center justify-center gap-3">
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Förbereder PDF...
                          </div>
                        )}
                        
                        <button
                          onClick={() => setCompleteAnalysis(null)}
                          className="w-full py-2 text-white/70 hover:text-white text-sm transition-colors"
                        >
                          Generera ny analys
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-2 sm:space-y-3">
                  {step.items.map((item, idx) => {
                    const key = `${step.id}-${idx}`
                    const isExpanded = expandedItems[key]
                    
                    // Get status for this item if it's in step 1
                    const modalCategory = getModalCategory(step.id, idx)
                    const itemStatus = modalCategory ? getCategoryStatus(modalCategory) : 'empty'
                    
                    return (
                      <div 
                        key={idx} 
                        className="border border-gray-200 rounded-lg sm:rounded-xl overflow-hidden"
                        style={{
                          animation: `fadeIn 0.3s ease-out ${idx * 0.1}s both`
                        }}
                      >
                        {/* Item header - always visible */}
                        <button
                          onClick={() => toggleExpand(step.id, idx)}
                          className="w-full flex items-start gap-2 sm:gap-3 p-3 sm:p-4 text-left hover:bg-gray-50 transition-colors"
                        >
                          {/* Status indicator with number */}
                          <span className={`flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-medium mt-0.5 transition-colors ${
                            itemStatus === 'generated'
                              ? 'bg-green-500 text-white'
                              : itemStatus === 'filled'
                                ? 'bg-amber-400 text-white'
                                : 'bg-[#1F3C58]/10 text-[#1F3C58]'
                          }`}>
                            {itemStatus === 'generated' ? (
                              <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              idx + 1
                            )}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-[#1F3C58] text-sm sm:text-base mb-0.5 sm:mb-1">{item.title}</h3>
                              {/* Status badge */}
                              {modalCategory && itemStatus !== 'empty' && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                                  itemStatus === 'generated'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-amber-100 text-amber-700'
                                }`}>
                                  {itemStatus === 'generated' ? 'Klar' : 'Påbörjad'}
                                </span>
                              )}
                            </div>
                            <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">{item.summary}</p>
                          </div>
                          {/* Arrow */}
                          <span 
                            className={`flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center text-[#1F3C58] transition-transform duration-300 ${
                              isExpanded ? 'rotate-180' : ''
                            }`}
                          >
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </span>
                        </button>
                        
                        {/* Expanded content */}
                        <div 
                          className={`overflow-hidden transition-all duration-300 ease-in-out ${
                            isExpanded ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'
                          }`}
                        >
                          <div className="px-3 sm:px-4 pb-4 pt-4 mt-2 border-t border-gray-100">
                            {/* "Fyll i dina uppgifter" prompt for step 1 items */}
                            {(() => {
                              const modalCategory = getModalCategory(step.id, idx)
                              if (!modalCategory) return null
                              
                              const summary = companyData.generatedSummaries[modalCategory]
                              const status = getCategoryStatus(modalCategory)
                              
                              if (summary) {
                                // Show completed state
                                return (
                                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2 text-green-700 text-sm font-medium">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Ifyllt & genererat
                                      </div>
                                      <button
                                        onClick={() => setActiveModal(modalCategory)}
                                        className="text-xs text-green-700 hover:text-green-800 underline"
                                      >
                                        Redigera
                                      </button>
                                    </div>
                                    <p className="text-xs text-gray-600 mt-2 line-clamp-2">{summary}</p>
                                  </div>
                                )
                              }
                              
                              // Show fill in prompt
                              return (
                                <button
                                  onClick={() => setActiveModal(modalCategory)}
                                  className={`w-full mb-4 p-4 rounded-xl flex items-center gap-3 transition-all group shadow-md hover:shadow-lg ${
                                    status === 'filled'
                                      ? 'bg-amber-500 hover:bg-amber-600'
                                      : 'bg-[#1F3C58] hover:bg-[#2a4d6e]'
                                  }`}
                                >
                                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </div>
                                  <div className="text-left flex-1">
                                    <span className="block text-sm font-semibold text-white">
                                      {status === 'filled' ? 'Komplettera & generera sammanfattning' : 'Fyll i dina uppgifter'}
                                    </span>
                                    <span className="block text-xs text-white/70">
                                      {status === 'filled' 
                                        ? 'Du har påbörjat - klicka för att slutföra'
                                        : 'Klicka för att fylla i information om ditt företag'
                                      }
                                    </span>
                                  </div>
                                  <svg className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                </button>
                              )
                            })()}
                            
                            <div className="pl-7 sm:pl-9 border-l-2 border-[#1F3C58]/20 ml-2.5 sm:ml-3">
                              <div className="text-gray-700 text-xs sm:text-sm leading-relaxed pl-3 sm:pl-4 mb-4 space-y-3">
                                {item.expanded.split('\n\n').map((paragraph, pIdx) => (
                                  <p key={pIdx}>{paragraph}</p>
                                ))}
                              </div>
                              
                              {/* Stats */}
                              {item.stats && (
                                <div className={`pl-3 sm:pl-4 grid gap-2 sm:gap-3 ${item.stats.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                                  {item.stats.map((stat, statIdx) => (
                                    <StatHighlight 
                                      key={statIdx} 
                                      value={stat.value}
                                      label={stat.label}
                                      sublabel={stat.sublabel}
                                      tipKey={stat.tipKey}
                                      onTipClick={(tipKey) => setSelectedTip(tipKey)}
                                    />
                                  ))}
                                </div>
                              )}
                              
                              {/* Chart */}
                              {item.chart && (
                                <div className="pl-3 sm:pl-4">
                                  <MiniBarChart data={item.chart.data} label={item.chart.label} />
                                </div>
                              )}
                              
                              {/* Rings */}
                              {item.rings && (
                                <div className="pl-3 sm:pl-4 mt-4">
                                  <div className="flex justify-around gap-2">
                                    {item.rings.map((ring, ringIdx) => (
                                      <ProgressRing key={ringIdx} percent={ring.percent} label={ring.label} size={50} />
                                    ))}
                                  </div>
                                </div>
                              )}
                              
{/* Timeline */}
                                              {item.timeline && (
                                                <div className="pl-3 sm:pl-4">
                                                  <Timeline items={item.timeline} />
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
              </div>

              {/* Navigation buttons */}
              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => {
                      setCurrentStep(Math.max(0, currentStep - 1))
                      setExpandedItems({})
                    }}
                    disabled={currentStep === 0}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                      currentStep === 0
                        ? 'text-gray-300 border-gray-200 cursor-not-allowed'
                        : 'text-[#1F3C58] border-[#1F3C58]/20 hover:bg-[#1F3C58]/5'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Föregående
                  </button>

                  {currentStep < industrySteps.length - 1 ? (
                    <button
                      onClick={() => {
                        setCurrentStep(currentStep + 1)
                        setExpandedItems({})
                      }}
                      className="flex items-center gap-2 px-5 py-2.5 bg-[#1F3C58] text-white rounded-lg text-sm font-medium hover:bg-[#1F3C58]/90 transition-all"
                    >
                      Nästa steg
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ) : (
                    <Link
                      href={`/${locale}/analysera`}
                      className="flex items-center gap-2 px-5 py-2.5 bg-[#1F3C58] text-white rounded-lg text-sm font-medium hover:bg-[#1F3C58]/90 transition-all"
                    >
                      Analysera ditt företag
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  )}
                </div>
                
                {/* Step progress indicator */}
                <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
                  <button
                    onClick={() => setShowSources(true)}
                    className="hover:text-[#1F3C58] underline transition-colors"
                  >
                    Källor
                  </button>
                  <span>{currentStep + 1} av {industrySteps.length} steg klara</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Back to home link */}
        <div className="max-w-6xl mx-auto mt-6 text-center">
          <Link
            href={`/${locale}`}
            className="text-[#1F3C58]/70 hover:text-[#1F3C58] text-xs sm:text-sm underline"
          >
            Tillbaka till startsidan
          </Link>
        </div>
      </div>

      {/* Add animations and hide scrollbar */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      <style jsx global>{`
        @keyframes ctaPulse {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(31, 60, 88, 0.7);
          }
          50% {
            box-shadow: 0 0 0 12px rgba(31, 60, 88, 0);
          }
        }
        .animate-cta-pulse {
          animation: ctaPulse 2s infinite;
        }
      `}</style>

      {/* Tips Modal */}
      {selectedTip && (
        <TipsModal tipKey={selectedTip} onClose={() => setSelectedTip(null)} />
      )}

      {/* Company Data Modal */}
      {activeModal && (
        <SalesProcessDataModal
          category={activeModal}
          isOpen={true}
          onClose={() => setActiveModal(null)}
          data={companyData}
          onSave={handleSaveCategory}
          onGenerate={handleGenerateSummary}
          isGenerating={isGenerating}
        />
      )}

      {/* Sources Modal */}
      {showSources && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowSources(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-[#1F3C58] px-6 py-5 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Källor och referenser</h2>
              <button
                onClick={() => setShowSources(false)}
                className="text-white/70 hover:text-white text-2xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(85vh-80px)]">
              <p className="text-gray-600 text-sm mb-6">
                Statistik och fakta i denna guide baseras på följande erkända källor inom M&A och företagsförsäljning:
              </p>

              {/* Category: Global M&A Reports */}
              <div className="mb-6">
                <h3 className="font-bold text-[#1F3C58] mb-3 pb-2 border-b border-gray-200">
                  Globala M&A-rapporter
                </h3>
                <ul className="space-y-3 text-sm">
                  <li className="flex gap-2">
                    <span className="text-[#1F3C58]">•</span>
                    <div>
                      <a href="https://www.pwc.com/gx/en/services/deals/trends.html" target="_blank" rel="noopener noreferrer" className="text-[#1F3C58] hover:underline font-medium">
                        PwC Global M&A Industry Trends
                      </a>
                      <p className="text-gray-500 text-xs mt-0.5">Årlig rapport om globala M&A-trender, multiplar och marknadsutveckling</p>
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[#1F3C58]">•</span>
                    <div>
                      <a href="https://www2.deloitte.com/global/en/pages/finance/articles/ma-trends.html" target="_blank" rel="noopener noreferrer" className="text-[#1F3C58] hover:underline font-medium">
                        Deloitte M&A Trends Report
                      </a>
                      <p className="text-gray-500 text-xs mt-0.5">Kvartalsvisa analyser av M&A-aktivitet och transaktionsstrukturer</p>
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[#1F3C58]">•</span>
                    <div>
                      <a href="https://kpmg.com/xx/en/home/insights/2024/01/m-and-a-trends.html" target="_blank" rel="noopener noreferrer" className="text-[#1F3C58] hover:underline font-medium">
                        KPMG M&A Predictor
                      </a>
                      <p className="text-gray-500 text-xs mt-0.5">Prediktiv analys av M&A-marknaden och värderingsmultiplar</p>
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[#1F3C58]">•</span>
                    <div>
                      <a href="https://www.ey.com/en_gl/insights/strategy-transactions/global-m-and-a-sector-trends" target="_blank" rel="noopener noreferrer" className="text-[#1F3C58] hover:underline font-medium">
                        EY Global M&A Trends
                      </a>
                      <p className="text-gray-500 text-xs mt-0.5">Sektorspecifika M&A-trender och due diligence-statistik</p>
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[#1F3C58]">•</span>
                    <div>
                      <a href="https://www.bcg.com/publications/2024/m-and-a-report-dealmakers-guide" target="_blank" rel="noopener noreferrer" className="text-[#1F3C58] hover:underline font-medium">
                        BCG M&A Report
                      </a>
                      <p className="text-gray-500 text-xs mt-0.5">Boston Consulting Groups årliga M&A-rapport med transaktionsdata</p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Category: Nordic & Swedish */}
              <div className="mb-6">
                <h3 className="font-bold text-[#1F3C58] mb-3 pb-2 border-b border-gray-200">
                  Nordiska och svenska källor
                </h3>
                <ul className="space-y-3 text-sm">
                  <li className="flex gap-2">
                    <span className="text-[#1F3C58]">•</span>
                    <div>
                      <a href="https://www.svca.se/rapporter/" target="_blank" rel="noopener noreferrer" className="text-[#1F3C58] hover:underline font-medium">
                        SVCA (Swedish Private Equity & Venture Capital Association)
                      </a>
                      <p className="text-gray-500 text-xs mt-0.5">Svensk statistik om PE-transaktioner, multiplar och exitvärden</p>
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[#1F3C58]">•</span>
                    <div>
                      <a href="https://www.argentum.no/en/research/" target="_blank" rel="noopener noreferrer" className="text-[#1F3C58] hover:underline font-medium">
                        Argentum Nordic Private Equity Report
                      </a>
                      <p className="text-gray-500 text-xs mt-0.5">Nordisk PE-data inklusive svenska SMB-transaktioner</p>
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[#1F3C58]">•</span>
                    <div>
                      <a href="https://www.argos.wityu.fund/mid-market-monitor/" target="_blank" rel="noopener noreferrer" className="text-[#1F3C58] hover:underline font-medium">
                        Argos Wityu Mid-Market Monitor
                      </a>
                      <p className="text-gray-500 text-xs mt-0.5">Europeisk mid-market M&A-statistik med EBITDA-multiplar</p>
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[#1F3C58]">•</span>
                    <div>
                      <a href="https://mergr.com/" target="_blank" rel="noopener noreferrer" className="text-[#1F3C58] hover:underline font-medium">
                        Mergr Nordic M&A Database
                      </a>
                      <p className="text-gray-500 text-xs mt-0.5">Nordisk M&A-databas med transaktionsdetaljer</p>
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[#1F3C58]">•</span>
                    <div>
                      <a href="https://www.oaklins.com/se/sv/" target="_blank" rel="noopener noreferrer" className="text-[#1F3C58] hover:underline font-medium">
                        Oaklins Sweden M&A Reports
                      </a>
                      <p className="text-gray-500 text-xs mt-0.5">Svenska M&A-trender och sektoranalyser</p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Category: Due Diligence & Transaction Data */}
              <div className="mb-6">
                <h3 className="font-bold text-[#1F3C58] mb-3 pb-2 border-b border-gray-200">
                  Due diligence och transaktionsdata
                </h3>
                <ul className="space-y-3 text-sm">
                  <li className="flex gap-2">
                    <span className="text-[#1F3C58]">•</span>
                    <div>
                      <a href="https://www.srs.se/en/transact" target="_blank" rel="noopener noreferrer" className="text-[#1F3C58] hover:underline font-medium">
                        SRS Transact Nordic M&A Study
                      </a>
                      <p className="text-gray-500 text-xs mt-0.5">Statistik om prisjusteringar och DD-fynd i Norden</p>
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[#1F3C58]">•</span>
                    <div>
                      <a href="https://www.cmslegalondemand.com/dealinsight" target="_blank" rel="noopener noreferrer" className="text-[#1F3C58] hover:underline font-medium">
                        CMS European M&A Study
                      </a>
                      <p className="text-gray-500 text-xs mt-0.5">Årlig analys av M&A-avtal, garantier och earnout-strukturer</p>
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[#1F3C58]">•</span>
                    <div>
                      <a href="https://www.aon.com/home/insights/reports/2024/ma-and-transaction-solutions-trends" target="_blank" rel="noopener noreferrer" className="text-[#1F3C58] hover:underline font-medium">
                        Aon M&A and Transaction Solutions
                      </a>
                      <p className="text-gray-500 text-xs mt-0.5">W&I-försäkringsstatistik och garantianspråksdata</p>
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[#1F3C58]">•</span>
                    <div>
                      <a href="https://www.dlapiper.com/en/insights/publications/global-ma-intelligence-report" target="_blank" rel="noopener noreferrer" className="text-[#1F3C58] hover:underline font-medium">
                        DLA Piper Global M&A Intelligence
                      </a>
                      <p className="text-gray-500 text-xs mt-0.5">Juridiska trender i M&A-avtal och tviststatistik</p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Category: Academic & Research */}
              <div className="mb-6">
                <h3 className="font-bold text-[#1F3C58] mb-3 pb-2 border-b border-gray-200">
                  Akademiska källor och forskning
                </h3>
                <ul className="space-y-3 text-sm">
                  <li className="flex gap-2">
                    <span className="text-[#1F3C58]">•</span>
                    <div>
                      <a href="https://hbr.org/topic/subject/mergers-and-acquisitions" target="_blank" rel="noopener noreferrer" className="text-[#1F3C58] hover:underline font-medium">
                        Harvard Business Review - M&A Research
                      </a>
                      <p className="text-gray-500 text-xs mt-0.5">Forskningsartiklar om M&A-framgångsfaktorer och misslyckanden</p>
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[#1F3C58]">•</span>
                    <div>
                      <a href="https://www.mckinsey.com/capabilities/m-and-a/our-insights" target="_blank" rel="noopener noreferrer" className="text-[#1F3C58] hover:underline font-medium">
                        McKinsey M&A Insights
                      </a>
                      <p className="text-gray-500 text-xs mt-0.5">Analyser av värdeskapande i M&A och integrationsframgång</p>
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[#1F3C58]">•</span>
                    <div>
                      <a href="https://papers.ssrn.com/sol3/JELJOUR_Results.cfm?form_name=journalBrowse&journal_id=270666" target="_blank" rel="noopener noreferrer" className="text-[#1F3C58] hover:underline font-medium">
                        SSRN M&A Research Papers
                      </a>
                      <p className="text-gray-500 text-xs mt-0.5">Akademisk forskning om M&A-processer och värdering</p>
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[#1F3C58]">•</span>
                    <div>
                      <a href="https://www.handelshogskolan.se/forskning" target="_blank" rel="noopener noreferrer" className="text-[#1F3C58] hover:underline font-medium">
                        Handelshögskolan Stockholm - Forskning
                      </a>
                      <p className="text-gray-500 text-xs mt-0.5">Svensk akademisk forskning om företagstransaktioner</p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Category: Industry Associations */}
              <div className="mb-6">
                <h3 className="font-bold text-[#1F3C58] mb-3 pb-2 border-b border-gray-200">
                  Branschorganisationer
                </h3>
                <ul className="space-y-3 text-sm">
                  <li className="flex gap-2">
                    <span className="text-[#1F3C58]">•</span>
                    <div>
                      <a href="https://www.ibba.org/research/" target="_blank" rel="noopener noreferrer" className="text-[#1F3C58] hover:underline font-medium">
                        IBBA (International Business Brokers Association)
                      </a>
                      <p className="text-gray-500 text-xs mt-0.5">Statistik om SMB-försäljningar och förmedlardata</p>
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[#1F3C58]">•</span>
                    <div>
                      <a href="https://www.amaaonline.com/alliance-of-ma-advisors-research" target="_blank" rel="noopener noreferrer" className="text-[#1F3C58] hover:underline font-medium">
                        AM&AA (Alliance of M&A Advisors)
                      </a>
                      <p className="text-gray-500 text-xs mt-0.5">Middle-market M&A-trender och rådgivarperspektiv</p>
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[#1F3C58]">•</span>
                    <div>
                      <a href="https://www.investeurope.eu/research/" target="_blank" rel="noopener noreferrer" className="text-[#1F3C58] hover:underline font-medium">
                        Invest Europe
                      </a>
                      <p className="text-gray-500 text-xs mt-0.5">Europeisk PE/VC-statistik och exitdata</p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Category: Data Providers */}
              <div className="mb-6">
                <h3 className="font-bold text-[#1F3C58] mb-3 pb-2 border-b border-gray-200">
                  Datakällor och databaser
                </h3>
                <ul className="space-y-3 text-sm">
                  <li className="flex gap-2">
                    <span className="text-[#1F3C58]">•</span>
                    <div>
                      <a href="https://pitchbook.com/" target="_blank" rel="noopener noreferrer" className="text-[#1F3C58] hover:underline font-medium">
                        PitchBook
                      </a>
                      <p className="text-gray-500 text-xs mt-0.5">Omfattande databas över PE/VC-transaktioner och värderingar</p>
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[#1F3C58]">•</span>
                    <div>
                      <a href="https://www.refinitiv.com/en/financial-data/deals-data" target="_blank" rel="noopener noreferrer" className="text-[#1F3C58] hover:underline font-medium">
                        Refinitiv (LSEG) Deals Intelligence
                      </a>
                      <p className="text-gray-500 text-xs mt-0.5">Global M&A-transaktionsdata och marknadsanalyser</p>
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[#1F3C58]">•</span>
                    <div>
                      <a href="https://www.preqin.com/" target="_blank" rel="noopener noreferrer" className="text-[#1F3C58] hover:underline font-medium">
                        Preqin
                      </a>
                      <p className="text-gray-500 text-xs mt-0.5">Alternativa investeringsdata och PE-statistik</p>
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[#1F3C58]">•</span>
                    <div>
                      <a href="https://www.bloomberg.com/professional/solution/bloomberg-terminal/" target="_blank" rel="noopener noreferrer" className="text-[#1F3C58] hover:underline font-medium">
                        Bloomberg Terminal M&A Data
                      </a>
                      <p className="text-gray-500 text-xs mt-0.5">Realtids M&A-data och transaktionsanalyser</p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Disclaimer */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">
                  <strong>Not:</strong> Statistik och procentsatser i denna guide är baserade på aggregerad data från ovanstående källor och representerar typiska värden för den nordiska och europeiska M&A-marknaden. Faktiska värden kan variera beroende på bransch, företagsstorlek, marknadsförhållanden och transaktionens specifika omständigheter. För specifika råd, konsultera alltid professionella M&A-rådgivare.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

