'use client'

import { useState, useEffect, Suspense } from 'react'
import { useLocale } from 'next-intl'
import Link from 'next/link'
import { CompanyData } from '@/components/SalesProcessDataModal'
import { FileText, Download, ArrowLeft, CheckCircle } from 'lucide-react'

// Mockup company data - Comprehensive example with realistic data
const mockCompanyData: CompanyData = {
  websiteUrl: 'https://techab.se',
  companyName: 'Tech Solutions AB',
  orgNumber: '556789-0123',
  scrapedData: {
    title: 'Tech Solutions AB - Ledande inom IT-konsulttjänster',
    description: 'Vi levererar skräddarsydda IT-lösningar och konsulttjänster till företag i hela Skandinavien sedan 2010. Specialiserade på digital transformation, molnlösningar och systemintegration.',
    highlights: [
      'ISO 27001-certifierade sedan 2018', 
      '52 anställda varav 45 konsulter', 
      'Kontor i Stockholm & Göteborg',
      'Microsoft Gold Partner & AWS Advanced Partner',
      '90% kundnöjdhet enligt senaste NPS-mätning',
      'Återkommande intäkter: 65% av omsättningen'
    ],
    contact: {
      emails: ['info@techab.se', 'sales@techab.se'],
      phones: ['+46 8 123 45 67']
    }
  },
  financialDocs: {
    revenue3Years: '2025: 45 MSEK, 2024: 38 MSEK, 2023: 32 MSEK',
    profit3Years: '2025: 6,2 MSEK, 2024: 4,8 MSEK, 2023: 3,9 MSEK',
    revenueByYear: { year1: '45', year2: '38', year3: '32' },
    profitByYear: { year1: '6.2', year2: '4.8', year3: '3.9' },
    hasAuditedReports: true,
    hasMonthlyReports: true,
    budgetAvailable: true,
    forecastYears: '3',
    ebitdaNotes: 'EBITDA 2025: 8,5 MSEK efter justering för ägarlön (800 TSEK) och engångskostnad för kontorsflytt (350 TSEK). Normaliserat EBITDA-marginal på 18,8%. Bruttomarginal konsultverksamhet: 72%.',
    oneTimeItems: 'Kontorsflytt 2025: 350 TSEK, Rekryteringskostnader för ny CFO 2024: 180 TSEK, Försäljning av gammal utrustning 2023: 150 TSEK, Kostnad för ISO-certifiering 2023: 120 TSEK'
  },
  businessRelations: {
    topCustomers: [
      { name: 'Volvo Cars IT', percentage: '18' },
      { name: 'Nordea Bank', percentage: '12' },
      { name: 'IKEA Digital', percentage: '8' },
      { name: 'Ericsson', percentage: '7' },
      { name: 'SEB', percentage: '6' }
    ],
    customerConcentrationRisk: 'medium',
    keySuppliers: 'Microsoft (Gold Partner) - primär teknologiplattform. AWS (Advanced Partner) - molninfrastruktur. Salesforce (Consulting Partner) - CRM-implementationer. Inga exklusiva avtal som begränsar flexibilitet. Samtliga partneravtal förnyas årligen.',
    exclusivityAgreements: 'Preferred vendor-avtal med Volvo Cars t.o.m. 2026. Ej exklusivt men med volymrabatter på 15%. Ramavtal med Nordea för IT-konsulttjänster löper till 2027.',
    informalAgreements: 'Muntligt avtal med tre senior konsulter om resultatbonus (ca 200 TSEK/år) som bör formaliseras innan closing. Ingen dokumentation finns idag.'
  },
  keyPerson: {
    ownerInvolvement: 'medium',
    documentedProcesses: true,
    backupPersons: true,
    managementTeam: 'VD: Johan Andersson (grundare, 55 år, 100% ägare). CFO: Maria Lindberg (extern, 3 år i bolaget, tidigare PwC). CTO: Erik Svensson (delägare 15%, 8 år i bolaget, drivande i teknikutveckling). Säljchef: Anna Karlsson (extern, 5 år, ansvarar för 80% av nyförsäljningen). Operativ chef: Peter Holm (intern rekryt, 6 år). Stabil ledningsgrupp med tydliga ansvarsområden och veckovisa ledningsgruppsmöten.',
    transitionPlan: 'VD planerar att stanna kvar 12-18 månader efter försäljning i rådgivande kapacitet (50% tjänst). CTO kan ta över operativt ansvar på sikt. Säljchefen har redan kundrelationer med 70% av nyckelkunderna. Dokumenterade processer finns för alla kritiska funktioner inklusive rekrytering, projektledning och kvalitetssäkring.'
  },
  balanceSheet: {
    loansToOwners: 'Skuld till ägare på 500 TSEK ska återbetalas före closing. Fordran på dotterbolag (Tech Solutions Konsult AB) om 200 TSEK kan kvittas. Ingen aktieägartillskott de senaste 5 åren.',
    nonOperatingAssets: 'Konstverk värderade till 300 TSEK (bokfört 50 TSEK). Bostadsrätt i Stockholm Östermalm (marknadsvärde 2,5 MSEK, bokfört 1,8 MSEK) som används som representation. Överskottslikviditet 3,2 MSEK placerat i räntefonder.',
    inventoryStatus: 'Minimalt lager (konsultbolag). Licenser och förbetalda kostnader uppgår till 400 TSEK, varav Microsoft-licenser 250 TSEK (förfaller inom 12 mån). Pågående arbete uppgår till 1,1 MSEK.',
    receivablesStatus: 'Kundfordringar 4,2 MSEK med god åldersstruktur: 0-30 dagar: 85% (3,6 MSEK), 31-60 dagar: 10% (420 TSEK), 61-90 dagar: 4% (168 TSEK), >90 dagar: 1% (42 TSEK). Reserv för osäkra fordringar 50 TSEK. DSO: 32 dagar.',
    liabilitiesToClean: 'Lån från aktieägare 500 TSEK att lösa innan closing. Semesterskuld 1,2 MSEK är normal för branschen. Checkkredit om 2 MSEK (outnyttjad) bör sägas upp eller överföras.'
  },
  legalDocs: {
    articlesOfAssociationUpdated: true,
    shareRegisterComplete: true,
    boardMinutesArchived: true,
    ownerAgreementsReviewed: true,
    permitsVerified: true,
    pendingLegalIssues: 'Inga pågående tvister. Tidigare tvist med underleverantör avslutad 2023 med förlikning (120 TSEK, ej materiell). Alla väsentliga avtal granskade av Mannheimer Swartling Q3 2024. ISO 27001-certifiering giltig till juni 2026. F-skattsedel och arbetsgivarregistrering uppdaterade.'
  },
  generatedSummaries: {
    financialDocs: 'Tech Solutions AB uppvisar en stark finansiell utveckling med 18% genomsnittlig årlig tillväxt de senaste tre åren. Omsättningen har ökat från 32 till 45 MSEK medan resultatet förbättrats från 3,9 till 6,2 MSEK. EBITDA-marginalen har förbättrats till 18,8% genom effektivt resursutnyttjande och förbättrad prissättning. Bolaget har reviderade årsredovisningar för de senaste fem åren, månatliga rapporter och 3-åriga prognoser på plats.',
    businessRelations: 'Kundportföljen är diversifierad med 51% koncentration till de fem största kunderna. Volvo Cars är största kunden med 18% av omsättningen, följt av Nordea (12%) och IKEA Digital (8%). Kundrelationerna är stabila med 90%+ förnyelsegrader. Bolaget har starka partnerrelationer med Microsoft, AWS och Salesforce. Ramavtal finns med flera storföretag.',
    keyPerson: 'VD och grundare Johan Andersson är aktivt involverad men har byggt en kompetent ledningsgrupp under de senaste åren. CFO, CTO, Säljchef och Operativ chef bildar ett starkt team. CTO är delägare (15%) och kan ta över operativt ansvar. Dokumenterade processer och tydliga ansvarsområden minskar nyckelpersonberoendet. En 12-18 månaders övergångsperiod planeras.',
    balanceSheet: 'Balansräkningen är i gott skick med begränsade justeringsbehov. Nettokassa på ca 3 MSEK ger finansiell styrka. Mindre poster som skuld till ägare (500 TSEK) och bostadsrättsinnehav behöver hanteras. Kundfordringarna har utmärkt kvalitet med 85% under 30 dagar och låga kreditförluster historiskt.',
    legalDocs: 'Den juridiska dokumentationen är exemplarisk. Bolagsordning, aktiebok och styrelseprotokoll är uppdaterade och digitalt arkiverade. Alla tillstånd verifierade. Inga pågående tvister eller kända legala risker. ISO 27001-certifiering giltig till 2026. Väsentliga avtal har granskats av extern juristbyrå under 2024.'
  }
}

const mockAnalysis = {
  executiveSummary: 'Tech Solutions AB är ett välpositionerat IT-konsultbolag med 52 anställda, stark tillväxt (18% CAGR) och förbättrad lönsamhet (EBITDA 8,5 MSEK). Bolaget utmärker sig genom sin ISO 27001-certifiering, diversifierade kundbas med blue-chip kunder (Volvo, Nordea, IKEA) och dokumenterade processer. Med en kompetent ledningsgrupp och tydlig successionsplan bedöms bolaget vara väl förberett för en transaktion. Värderingsintervallet 51-68 MSEK (6-8x EBITDA) är realistiskt givet bolagets kvalitet och marknadsutveckling.',
  companyOverview: 'Tech Solutions AB grundades 2010 av Johan Andersson och har vuxit till ett ledande IT-konsultbolag med fokus på digital transformation, molnlösningar och systemintegration för stora och medelstora företag i Skandinavien. Bolaget är ISO 27001-certifierat sedan 2018 och har etablerat strategiska partnerskap med Microsoft (Gold Partner), AWS (Advanced Partner) och Salesforce. Med 52 anställda (45 konsulter), kontor i Stockholm och Göteborg, samt en årsomsättning på 45 MSEK har bolaget etablerat sig som en pålitlig och innovativ partner. Återkommande intäkter utgör 65% av omsättningen genom service- och supportavtal.',
  financialAnalysis: 'Bolaget uppvisar exceptionell finansiell utveckling med 18% genomsnittlig årlig omsättningstillväxt de senaste tre åren (32→38→45 MSEK). EBITDA-marginalen har förbättrats från 12% till 19% genom effektivare resursutnyttjande, automatisering av interna processer och strategisk prissättning. Normaliserat EBITDA 2025 uppgår till 8,5 MSEK efter justering för ägarlön och engångsposter. Kassaflödet är stabilt positivt med nettokassa om 3,2 MSEK och inga banklån. Bruttomarginal för konsultverksamheten ligger på 72%, i linje med branschledande bolag. Prognosen för 2026 indikerar fortsatt tillväxt om 12-15%.',
  businessRelationsAnalysis: 'Kundportföljen är väldiversifierad med 5 huvudkunder som tillsammans utgör 51% av omsättningen: Volvo Cars IT (18%), Nordea Bank (12%), IKEA Digital (8%), Ericsson (7%) och SEB (6%). Ingen enskild kund dominerar kritiskt. Kundrelationerna är mycket stabila med 92% förnyelsegrader de senaste tre åren och ett genomsnittligt kundengagemang på 4,5 år. Ramavtal finns med samtliga nyckelkunder. Leverantörsrelationerna är starka med strategiska partnerskap hos Microsoft, AWS och Salesforce utan kritiska beroenden eller exklusivitetsklausuler som kan begränsa en ny ägare.',
  keyPersonAnalysis: 'VD och grundare Johan Andersson (55 år, 100% ägare) är aktivt involverad men har byggt en stark andra linje. CFO Maria Lindberg (tidigare PwC) har moderniserat ekonomistyrningen. CTO Erik Svensson (delägare 15%) driver teknikutvecklingen och kan ta operativt ansvar. Säljchef Anna Karlsson har redan etablerade relationer med 70% av nyckelkunderna. Dokumenterade processer finns för rekrytering, projektledning, kvalitetssäkring och kundleverans. VD planerar 12-18 månaders övergångsperiod som rådgivare (50% tjänst), vilket möjliggör smidig transition.',
  balanceSheetAnalysis: 'Balansräkningen är i mycket gott skick. Nettokassa om ca 3,2 MSEK ger finansiell styrka och eliminerar refinansieringsbehov vid transaktion. Kundfordringarna (4,2 MSEK) har utmärkt kvalitet med 85% under 30 dagar, 10% 31-60 dagar och minimala historiska kreditförluster. DSO (Days Sales Outstanding) på 32 dagar är bättre än branschgenomsnittet (45 dagar). Poster att hantera: skuld till ägare 500 TSEK (ska återbetalas före closing), bostadsrätt för representation (2,5 MSEK marknadsvärde) kan överföras till ägaren eller inkluderas i värderingen. Överskottslikviditet kan eventuellt utdelas före closing.',
  legalAnalysis: 'Den juridiska dokumentationen är exemplarisk och uppfyller högsta krav för due diligence. Bolagsordning uppdaterad 2024, aktiebok komplett och digital, styrelseprotokoll arkiverade sedan grundandet. Samtliga tillstånd verifierade. ISO 27001-certifiering giltig till juni 2026. Inga pågående tvister eller kända legala risker. Väsentliga kund- och leverantörsavtal har granskats av Mannheimer Swartling Q3 2024. Anställningsavtal och konkurrensklausuler är uppdaterade. GDPR-compliance säkerställd med DPO på plats.',
  riskAssessment: {
    overall: 'low' as const,
    financialRisk: 20,
    operationalRisk: 30,
    keyPersonRisk: 45,
    customerRisk: 35,
    legalRisk: 15
  },
  strengths: [
    'Stark finansiell historik med 18% CAGR och förbättrad lönsamhet (EBITDA-marginal 19%)',
    'ISO 27001-certifiering och dokumenterade processer för alla kritiska funktioner',
    'Kompetent ledningsgrupp med erfaren CFO, CTO och Säljchef - tydlig successionsplan',
    'Blue-chip kunder (Volvo, Nordea, IKEA, Ericsson, SEB) med 92% förnyelsegrader',
    'Strategiska partnerskap med Microsoft, AWS och Salesforce',
    'Stark balansräkning med nettokassa 3,2 MSEK och inga banklån',
    'Återkommande intäkter utgör 65% av omsättningen',
    'Ren juridisk struktur granskad av extern juristbyrå 2024'
  ],
  weaknesses: [
    'Kundkoncentration: Volvo Cars utgör 18% av omsättningen (ramavtal till 2026)',
    'Nyckelpersonberoende av VD/grundare i vissa strategiska kundrelationer',
    'Informella bonusavtal med tre seniorkonsulter (200 TSEK/år) behöver formaliseras',
    'Geografisk koncentration till Stockholm/Göteborg - begränsad närvaro i övriga Sverige',
    'Begränsad egen produktutveckling - primärt tjänsteförsäljning'
  ],
  recommendations: [
    'Formalisera bonusavtal med nyckelpersoner i skriftliga avtal innan försäljningsprocess inleds',
    'Accelerera kunskapsöverföring från VD till övrig ledning genom strukturerade överlämningar',
    'Dokumentera alla informella kundavtal och säkerställ skriftliga ramavtal med samtliga nyckelkunder',
    'Genomför legal due diligence-förberedelse och sammanställ datarum',
    'Överväg att lösa skuld till ägare och utvärdera hantering av överskottslikviditet före closing',
    'Förläng eller förnya ramavtal med nyckelkunder som löper ut inom 12 månader'
  ],
  nextSteps: [
    'Vecka 1-2: Slutför finansiell due diligence-förberedelse och sammanställ virtuellt datarum',
    'Vecka 2-3: Uppdatera värderingsunderlag med Q4-data och 2026-prognos',
    'Vecka 3-4: Engagera M&A-rådgivare och fastställ processstrategi',
    'Vecka 4-6: Förbered teaser (2 sidor) och informationsmemorandum (30+ sidor)',
    'Vecka 6-8: Identifiera och kontakta 15-20 potentiella strategiska och finansiella köpare',
    'Vecka 8-10: Genomför management-presentationer med intresserade parter',
    'Vecka 10-14: Förhandla LOI/termsheet med 2-3 finalkandidater',
    'Vecka 14-22: Due diligence och slutförhandling av SPA'
  ],
  valuationFactors: 'Baserat på analys av 12 jämförbara transaktioner för nordiska IT-konsultbolag 2023-2024 (median 7,2x EV/EBITDA) bedöms Tech Solutions AB kunna värderas till 6-8x normaliserat EBITDA, motsvarande 51-68 MSEK Enterprise Value. Den starka tillväxten (18% CAGR), förbättrade lönsamheten (19% EBITDA-marginal), blue-chip kundbasen och väl förberedda successionen motiverar övre delen av intervallet. Nettokassa om 3,2 MSEK tillkommer vid beräkning av Equity Value. Potentiella köpare inkluderar större IT-konsultbolag (HiQ, Sigma, CGI), PE-bolag med plattformsstrategi inom IT-tjänster, samt industriella köpare som söker IT-kompetens. Rekommenderad utgångspunkt för förhandling: 60-65 MSEK.'
}

// Separate component for PDF download that handles dynamic imports
function PDFDownloadButton({ companyData, analysis, generatedAt }: { 
  companyData: CompanyData
  analysis: typeof mockAnalysis
  generatedAt: string 
}) {
  const [PDFComponents, setPDFComponents] = useState<{
    PDFDownloadLink: any
    SalesProcessReportPDF: any
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    
    const loadPDFComponents = async () => {
      try {
        // Load both modules in parallel
        const [reactPdf, reportPdf] = await Promise.all([
          import('@react-pdf/renderer'),
          import('@/components/SalesProcessReportPDF')
        ])
        
        if (mounted) {
          setPDFComponents({
            PDFDownloadLink: reactPdf.PDFDownloadLink,
            SalesProcessReportPDF: reportPdf.default
          })
          setIsLoading(false)
        }
      } catch (err) {
        console.error('Failed to load PDF components:', err)
        if (mounted) {
          setError('Kunde inte ladda PDF-komponenter')
          setIsLoading(false)
        }
      }
    }
    
    loadPDFComponents()
    
    return () => {
      mounted = false
    }
  }, [])

  if (isLoading) {
    return (
      <div className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-[#1F3C58] text-white rounded-xl font-semibold text-lg">
        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        Laddar PDF-komponenter...
      </div>
    )
  }

  if (error || !PDFComponents) {
    return (
      <div className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gray-400 text-white rounded-xl font-semibold text-lg cursor-not-allowed">
        PDF ej tillgänglig
      </div>
    )
  }

  const { PDFDownloadLink, SalesProcessReportPDF } = PDFComponents

  return (
    <PDFDownloadLink
      document={
        <SalesProcessReportPDF
          companyData={companyData}
          analysis={analysis}
          generatedAt={generatedAt}
        />
      }
      fileName={`Exempelrapport-Försäljningsanalys-Tech-Solutions-AB.pdf`}
      className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-[#1F3C58] text-white rounded-xl font-semibold text-lg hover:bg-[#1F3C58]/90 transition-all shadow-lg hover:shadow-xl"
    >
      {({ loading }: { loading: boolean }) => (
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
            <Download className="w-5 h-5" />
            Ladda ner exempelrapport (PDF)
          </>
        )
      )}
    </PDFDownloadLink>
  )
}

export default function ExempelrapportPage() {
  const locale = useLocale()
  const [isMounted, setIsMounted] = useState(false)
  
  useEffect(() => {
    setIsMounted(true)
  }, [])
  
  const generatedAt = new Date().toLocaleDateString('sv-SE', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })

  const reportContent = [
    'Innehållsförteckning',
    'Sammanfattning & Nyckeltal',
    'Övergripande Bedömning',
    'Företagsöversikt',
    'Finansiell Analys (3 sidor)',
    'Affärsrelationer & Kunder (2 sidor)',
    'Organisation & Ledning (2 sidor)',
    'Balansräkning (2 sidor)',
    'Juridisk Dokumentation (2 sidor)',
    'Riskbedömning (2 sidor)',
    'SWOT-Analys',
    'Branschspecifik Analys',
    'Värderingsfaktorer',
    'Rekommendationer',
    'Handlingsplan & Tidslinje',
    'Nästa Steg & Kontakt',
    'Bilagor & Ansvarsfriskrivning'
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Spacer for fixed header */}
      <div className="h-20 sm:h-24" />
      
      {/* Header */}
      <div className="bg-[#1F3C58] py-12 sm:py-16">
        <div className="max-w-5xl mx-auto px-4">
          <Link 
            href={`/${locale}/forsaljningsprocessen`}
            className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-white" />
            <span className="text-white/70 hover:text-white">Tillbaka till Försäljningsprocessen</span>
          </Link>
          
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
            {/* Mascot - Left side */}
            <div className="flex-shrink-0">
              <img 
                src="/Maskots/maskot4.png" 
                alt="Afterfounder maskot" 
                className="w-36 h-36 md:w-48 md:h-48 lg:w-56 lg:h-56 object-contain"
              />
            </div>

            {/* Content - Right side */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl sm:text-4xl font-bold mb-4 text-white">
                Exempelrapport: Försäljningsanalys
              </h1>
              <p className="text-white/80 text-lg">
                Se hur en komplett försäljningsanalysrapport ser ut med ifyllda uppgifter
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16">
        {/* Info Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-14 h-14 bg-[#1F3C58]/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <FileText className="w-7 h-7 text-[#1F3C58]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Komplett 24-sidig PDF-rapport
              </h2>
              <p className="text-gray-600">
                Denna exempelrapport visar hur din försäljningsanalys kommer att se ut 
                när du har fyllt i alla uppgifter i försäljningsprocessen.
              </p>
            </div>
          </div>

          {/* Sample Company Info */}
          <div className="bg-gray-50 rounded-xl p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">Exempelföretag: Tech Solutions AB</h3>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Omsättning:</span>
                <span className="ml-2 text-gray-900 font-medium">45 MSEK (2023)</span>
              </div>
              <div>
                <span className="text-gray-500">EBITDA:</span>
                <span className="ml-2 text-gray-900 font-medium">8,5 MSEK</span>
              </div>
              <div>
                <span className="text-gray-500">Anställda:</span>
                <span className="ml-2 text-gray-900 font-medium">50+</span>
              </div>
              <div>
                <span className="text-gray-500">Bransch:</span>
                <span className="ml-2 text-gray-900 font-medium">IT-konsult</span>
              </div>
            </div>
          </div>

          {/* Report Contents */}
          <div className="mb-8">
            <h3 className="font-semibold text-gray-900 mb-4">Rapporten innehåller:</h3>
            <div className="grid sm:grid-cols-2 gap-2">
              {reportContent.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Download Button */}
          {isMounted ? (
            <PDFDownloadButton 
              companyData={mockCompanyData}
              analysis={mockAnalysis}
              generatedAt={generatedAt}
            />
          ) : (
            <div className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-[#1F3C58] text-white rounded-xl font-semibold text-lg">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Förbereder...
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="bg-[#1F3C58] rounded-2xl p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-3 text-white">Vill du skapa din egen rapport?</h3>
          <p className="text-white mb-6">
            Gå till försäljningsprocessen och fyll i uppgifter om ditt företag för att generera 
            en skräddarsydd analysrapport.
          </p>
          <Link
            href={`/${locale}/forsaljningsprocessen`}
            className="inline-flex items-center gap-2 px-8 py-3 bg-white text-[#1F3C58] rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Starta försäljningsprocessen
            <ArrowLeft className="w-4 h-4 rotate-180" />
          </Link>
        </div>
      </div>
    </div>
  )
}
