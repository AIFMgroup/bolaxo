// Canonical seller-readiness requirements (per DD best practice).
// Used for: checklists, gap analysis, auto-tagging suggestions.

export type RequirementCategory =
  | 'finans'
  | 'skatt'
  | 'juridik'
  | 'hr'
  | 'kommersiellt'
  | 'it'
  | 'operation'

export type Requirement = {
  id: string
  category: RequirementCategory
  title: string
  description: string
  mandatory: boolean
  docTypes?: string[] // e.g. ['pdf', 'xlsx', 'csv']
  requiresSignature?: boolean
  minYears?: number // e.g. 3 for ÅR, deklarationer
  periodType?: 'FY' | 'YTD' | 'LTM' | 'Monthly'
}

export const REQUIREMENTS: Requirement[] = [
  // Finans
  {
    id: 'fin-arsredovisning',
    category: 'finans',
    title: 'Årsredovisningar + revisionsberättelser (3–5 år)',
    description: 'Fullständiga ÅR och revisionsberättelser, signerade PDF',
    mandatory: true,
    docTypes: ['pdf'],
    requiresSignature: true,
    minYears: 3,
    periodType: 'FY',
  },
  {
    id: 'fin-manadsbokslut',
    category: 'finans',
    title: 'Månadsbokslut (LTM/YTD)',
    description: 'Resultat- och balansrapporter månadsvis, LTM/YTD',
    mandatory: true,
    docTypes: ['pdf', 'xlsx'],
    periodType: 'Monthly',
  },
  {
    id: 'fin-huvudbok',
    category: 'finans',
    title: 'Huvudbok (LTM/YTD)',
    description: 'Full huvudbok i CSV/XLSX',
    mandatory: true,
    docTypes: ['xlsx', 'csv'],
    periodType: 'Monthly',
  },
  {
    id: 'fin-ar-aging',
    category: 'finans',
    title: 'Kundreskontra (AR) med åldersanalys',
    description: 'AR-aging med förfallostruktur',
    mandatory: true,
    docTypes: ['xlsx', 'csv', 'pdf'],
  },
  {
    id: 'fin-ap-aging',
    category: 'finans',
    title: 'Leverantörsreskontra (AP) med åldersanalys',
    description: 'AP-aging med förfallostruktur',
    mandatory: true,
    docTypes: ['xlsx', 'csv', 'pdf'],
  },
  {
    id: 'fin-top10-kunder',
    category: 'finans',
    title: 'Top-10 kunder (andel, intäkter)',
    description: 'Lista top-10 kunder med andel och belopp',
    mandatory: true,
    docTypes: ['xlsx', 'csv', 'pdf'],
  },
  {
    id: 'fin-top10-leverantorer',
    category: 'finans',
    title: 'Top-10 leverantörer (andel, inköp)',
    description: 'Lista top-10 leverantörer med andel och belopp',
    mandatory: true,
    docTypes: ['xlsx', 'csv', 'pdf'],
  },
  {
    id: 'fin-ebitda-bridge',
    category: 'finans',
    title: 'EBITDA-bridge och engångsposter',
    description: 'Justeringar med belopp, beskrivning och evidens',
    mandatory: true,
    docTypes: ['xlsx', 'pdf'],
  },
  {
    id: 'fin-cashflow-budget',
    category: 'finans',
    title: 'Kassaflödesprognos / budget (12–24 mån)',
    description: 'Prognoser och antaganden',
    mandatory: true,
    docTypes: ['xlsx', 'pdf'],
  },
  {
    id: 'fin-lagerlista',
    category: 'finans',
    title: 'Lagerlista + lagervärdering',
    description: 'Lagerlista med värderingsprinciper',
    mandatory: false,
    docTypes: ['xlsx', 'pdf'],
  },
  {
    id: 'fin-anlaggning',
    category: 'finans',
    title: 'Anläggningsregister + avskrivningar',
    description: 'Register över anläggningstillgångar och avskrivningsprinciper',
    mandatory: false,
    docTypes: ['xlsx', 'pdf'],
  },
  {
    id: 'fin-skuld-finans',
    category: 'finans',
    title: 'Skuld/finansieringsöversikt + covenants',
    description: 'Lån, borgen, pant, covenant-status',
    mandatory: true,
    docTypes: ['pdf', 'xlsx'],
  },

  // Skatt
  {
    id: 'tax-deklarationer',
    category: 'skatt',
    title: 'Deklarationer 3–5 år (inkomst, moms, AGI)',
    description: 'Fullständiga deklarationer per år',
    mandatory: true,
    docTypes: ['pdf'],
    minYears: 3,
    periodType: 'FY',
  },
  {
    id: 'tax-rulings',
    category: 'skatt',
    title: 'Tax rulings / dialoger / tvister',
    description: 'Underlag för pågående eller avslutade skattetvister/dialoger',
    mandatory: false,
    docTypes: ['pdf'],
  },
  {
    id: 'tax-tp-doc',
    category: 'skatt',
    title: 'Transfer pricing-dokumentation',
    description: 'TP-dokumentation om koncern/internprissättning finns',
    mandatory: false,
    docTypes: ['pdf'],
  },

  // Juridik
  {
    id: 'leg-bolagsdokument',
    category: 'juridik',
    title: 'Registreringsbevis, bolagsordning, aktiebok/cap table, ägaravtal',
    description: 'Giltiga och uppdaterade bolags- och ägardokument',
    mandatory: true,
    docTypes: ['pdf'],
    requiresSignature: true,
  },
  {
    id: 'leg-protokoll',
    category: 'juridik',
    title: 'Styrelse- och stämmoprotokoll (3–5 år)',
    description: 'Signerade protokoll med beslutsunderlag',
    mandatory: true,
    docTypes: ['pdf'],
    requiresSignature: true,
    minYears: 3,
  },
  {
    id: 'leg-avtal-väsentliga',
    category: 'juridik',
    title: 'Väsentliga avtal (kund, leverantör, hyra, agent, dist, JV/licens)',
    description: 'Aktuella signerade avtal, senast gällande version',
    mandatory: true,
    docTypes: ['pdf'],
    requiresSignature: true,
  },
  {
    id: 'leg-pant-lan',
    category: 'juridik',
    title: 'Pant-/säkerhetsavtal, lån, borgen',
    description: 'Översikt + avtal, covenantstatus',
    mandatory: true,
    docTypes: ['pdf'],
  },
  {
    id: 'leg-forsakring',
    category: 'juridik',
    title: 'Försäkringar + skadehistorik',
    description: 'Gällande försäkringsbrev och skador',
    mandatory: false,
    docTypes: ['pdf'],
  },
  {
    id: 'leg-tvister',
    category: 'juridik',
    title: 'Tvister/claims och myndighetsärenden',
    description: 'Lista med status, reserveringar',
    mandatory: true,
    docTypes: ['pdf'],
  },
  {
    id: 'leg-gdpr',
    category: 'juridik',
    title: 'GDPR/Privacy: biträdesavtal, registerförteckningar, policies',
    description: 'Dokumentation av personuppgiftsbehandling och biträden',
    mandatory: true,
    docTypes: ['pdf'],
  },

  // HR
  {
    id: 'hr-nyckel-avtal',
    category: 'hr',
    title: 'Anställningsavtal nyckelpersoner/ledning',
    description: 'Signerade avtal, konkurrensklausuler',
    mandatory: true,
    docTypes: ['pdf'],
    requiresSignature: true,
  },
  {
    id: 'hr-lone-bonus',
    category: 'hr',
    title: 'Löne/bonusstruktur, incitaments-/optionsprogram',
    description: 'Översikt av komp och optioner',
    mandatory: true,
    docTypes: ['pdf', 'xlsx'],
  },
  {
    id: 'hr-pension-semester',
    category: 'hr',
    title: 'Pensionsåtaganden, semester- och kompskuld',
    description: 'Underlag och beräkningar',
    mandatory: true,
    docTypes: ['xlsx', 'pdf'],
  },
  {
    id: 'hr-policy',
    category: 'hr',
    title: 'Policyer: uppförandekod, arbetsmiljö',
    description: 'Aktuella policyer',
    mandatory: false,
    docTypes: ['pdf'],
  },

  // Kommersiellt
  {
    id: 'com-topplistor',
    category: 'kommersiellt',
    title: 'Kund-/leverantörstopplistor (andel, intäkter/inköp)',
    description: 'Sammanställning topplistor, koncentrationsrisk',
    mandatory: true,
    docTypes: ['xlsx', 'pdf'],
  },
  {
    id: 'com-pipeline-orderbok',
    category: 'kommersiellt',
    title: 'Pipeline/orderbok, prishistorik',
    description: 'Aktuell pipeline, order backlog, prishöjningar',
    mandatory: false,
    docTypes: ['xlsx', 'pdf'],
  },
  {
    id: 'com-sla-nps',
    category: 'kommersiellt',
    title: 'SLA/servicenivåer, kundnöjdhet/NPS',
    description: 'SLA-dokument, kundnöjdhetsdata',
    mandatory: false,
    docTypes: ['pdf', 'xlsx'],
  },
  {
    id: 'com-partner',
    category: 'kommersiellt',
    title: 'Partner/återförsäljare, provisioner/kickbacks',
    description: 'Avtal/översikt över partnerprogram',
    mandatory: false,
    docTypes: ['pdf'],
  },

  // IT / Infosec
  {
    id: 'it-systemkarta',
    category: 'it',
    title: 'Systemkarta (ERP/CRM/BI), licenser, ägande',
    description: 'Översikt över system, integrationer och licenser',
    mandatory: true,
    docTypes: ['pdf', 'png'],
  },
  {
    id: 'it-infosec-policy',
    category: 'it',
    title: 'Infosec-policy, accesskontroller, backup/DR-plan, incidenthistorik',
    description: 'Dokumenterade kontroller och incidentlogg',
    mandatory: true,
    docTypes: ['pdf'],
  },
  {
    id: 'it-gdpr-teknik',
    category: 'it',
    title: 'GDPR-tekniska kontroller: loggning, behörigheter, retention',
    description: 'Tekniska rutiner för dataskydd',
    mandatory: true,
    docTypes: ['pdf'],
  },
  {
    id: 'it-ip-oss',
    category: 'it',
    title: 'IP/kod: äganderätt, open-source compliance, licenser',
    description: 'Bevis på ägande och OSS-efterlevnad',
    mandatory: true,
    docTypes: ['pdf'],
  },

  // Operation / ESG / Övrigt
  {
    id: 'ops-processer',
    category: 'operation',
    title: 'Processdokumentation (O2C, P2P, F2D m.fl.)',
    description: 'Kärnprocesser dokumenterade',
    mandatory: false,
    docTypes: ['pdf'],
  },
  {
    id: 'ops-hse-esg',
    category: 'operation',
    title: 'HSE/ESG, certifikat, policys',
    description: 'Miljö/arbetsmiljöpolicy, certifieringar',
    mandatory: false,
    docTypes: ['pdf'],
  },
  {
    id: 'ops-leasing',
    category: 'operation',
    title: 'Leasing-/hyresavtal, underhållsplaner',
    description: 'Gällande avtal och underhållsplan',
    mandatory: false,
    docTypes: ['pdf'],
  },
]

