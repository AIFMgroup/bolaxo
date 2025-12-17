'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { X, ArrowRight, ArrowLeft, Mail, Building, TrendingUp, Users, Target, FileText, Lightbulb, Sparkles, AlertCircle, CheckCircle, HelpCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import FormField from './FormField'
import FormTextarea from './FormTextarea'
import CustomSelect from './CustomSelect'
import FormFieldCurrency from './FormFieldCurrency'
import FormFieldPercent from './FormFieldPercent'
import { calculateQuickValuation, getValuationColor } from '@/utils/quickValuation'
import { useTranslations, useLocale } from 'next-intl'

interface ValuationData {
  // Step 1: Grunduppgifter
  email: string
  companyName: string
  website: string
  orgNumber: string
  industry: string
  
  // Step 2: Företagsdata (Allmänt)
  companyAge: string
  revenue: string
  revenue3Years: string
  profitMargin: string
  employees: string
  // Nyckelrisker och finansiella fält som används i formuläret
  grossMargin?: string
  customerConcentrationRisk?: string
  totalDebt?: string
  regulatoryLicenses?: string
  paymentTerms?: string
  exactRevenue?: string
  operatingCosts?: string
  cogs?: string
  salaries?: string
  marketingCosts?: string
  rentCosts?: string
  otherOperatingCosts?: string
  
  // Step 3: Branschspecifika frågor (dynamiska baserat på bransch)
  [key: string]: string | number | undefined
}

interface WizardProps {
  onClose: () => void
}

const industries = [
  { value: 'tech', label: 'Tech & IT' },
  { value: 'retail', label: 'Detaljhandel' },
  { value: 'manufacturing', label: 'Tillverkning' },
  { value: 'services', label: 'Tjänsteföretag' },
  { value: 'restaurant', label: 'Restaurang & Café' },
  { value: 'construction', label: 'Bygg & Anläggning' },
  { value: 'healthcare', label: 'Vård & Hälsa' },
  { value: 'ecommerce', label: 'E-handel' },
  { value: 'consulting', label: 'Konsultverksamhet' },
  { value: 'other', label: 'Övrigt' },
]

// Branschspecifika frågor
const industryQuestions: Record<string, Array<{ key: string; label: string; type: 'text' | 'select' | 'textarea'; options?: {value: string; label: string}[]; tooltip?: string; helpText?: string; fieldType?: 'currency' | 'percent' }>> = {
  tech: [
    { key: 'businessModel', label: 'Affärsmodell', type: 'select', options: [
      { value: 'saas', label: 'SaaS (Software as a Service)' },
      { value: 'license', label: 'Licensförsäljning' },
      { value: 'services', label: 'Tjänster/konsultation' },
      { value: 'marketplace', label: 'Marketplace/plattform' },
      { value: 'hybrid', label: 'Hybrid' }
    ]},
    { key: 'recurringRevenue', label: 'Andel återkommande intäkter / MRR', type: 'text', tooltip: 'T.ex. prenumerationer, support-avtal. För SaaS: ange MRR/ARR-andel.', fieldType: 'percent' },
    { key: 'monthlyRecurringRevenue', label: 'MRR - Monthly Recurring Revenue', type: 'text', tooltip: 'Endast för SaaS: månatliga återkommande intäkter', fieldType: 'currency' },
    { key: 'customerChurn', label: 'Årlig kundavgång (churn rate)', type: 'text', tooltip: 'Andel kunder som slutar per år. <5% är excellent för SaaS', fieldType: 'percent' },
    { key: 'netRevenueRetention', label: 'NRR - Net Revenue Retention', type: 'text', helpText: 'Net Revenue Retention (NRR) mäter hur mycket intäkter ni behåller från befintliga kunder från ett år till nästa. Formel: (Intäkter från befintliga kunder detta år / Intäkter från samma kunder förra året) × 100. >100% betyder att ni expanderar med befintliga kunder (upsell/cross-sell). <100% betyder att ni förlorar intäkter från befintliga kunder. Exempel: Om ni hade 1 MSEK från befintliga kunder förra året och 1.2 MSEK från samma kunder detta år = 120% NRR.', fieldType: 'percent' },
    { key: 'customerAcquisitionCost', label: 'CAC - Customer Acquisition Cost (kr)', type: 'text', tooltip: 'Kostnad för att värva en ny kund' },
    { key: 'lifetimeValue', label: 'LTV - Lifetime Value per kund (kr)', type: 'text', tooltip: 'Total intäkt från en genomsnittlig kund' },
    { key: 'cacPaybackMonths', label: 'CAC Payback Period', type: 'select', tooltip: 'Hur många månader för att tjäna tillbaka kundanskaffningskostnad? <12 mån excellent', options: [
      { value: '0-6', label: '0-6 månader' },
      { value: '7-12', label: '7-12 månader' },
      { value: '13-18', label: '13-18 månader' },
      { value: '19-24', label: '19-24 månader' },
      { value: '24+', label: 'Över 24 månader' }
    ]},
    { key: 'techStack', label: 'Beskriv er tekniska plattform', type: 'textarea' },
    { key: 'scalability', label: 'Hur skalbar är er lösning?', type: 'select', options: [
      { value: 'high', label: 'Hög - kan lätt växa utan extra kostnad' },
      { value: 'medium', label: 'Medel - viss skalbarhet' },
      { value: 'low', label: 'Låg - resurskrävande att växa' }
    ]},
    { key: 'ipRights', label: 'Har ni patent eller unik teknologi?', type: 'select', options: [
      { value: 'yes', label: 'Ja, patent eller skyddad IP' },
      { value: 'partial', label: 'Delvis, varumärken/copyright' },
      { value: 'no', label: 'Nej' }
    ]},
  ],
  retail: [
    { key: 'storeLocation', label: 'Butiksläge', type: 'select', options: [
      { value: 'prime', label: 'Toppläge (centrum, galleria)' },
      { value: 'good', label: 'Bra läge' },
      { value: 'average', label: 'Genomsnittligt läge' }
    ]},
    { key: 'leaseLength', label: 'Hur långt hyresavtal återstår?', type: 'select', tooltip: 'Långt hyresavtal = mer värt (mindre risk)', options: [
      { value: '0-1', label: '0-1 år' },
      { value: '2-3', label: '2-3 år' },
      { value: '4-5', label: '4-5 år' },
      { value: '6-10', label: '6-10 år' },
      { value: '10+', label: 'Över 10 år' }
    ]},
    { key: 'monthlyRent', label: 'Månadshyra', type: 'text', tooltip: 'Total lokalkostnad per månad', fieldType: 'currency' },
    { key: 'footTraffic', label: 'Uppskattat antal kunder per dag', type: 'select', options: [
      { value: '0-50', label: '0-50 kunder' },
      { value: '51-100', label: '51-100 kunder' },
      { value: '101-200', label: '101-200 kunder' },
      { value: '201-500', label: '201-500 kunder' },
      { value: '501-1000', label: '501-1000 kunder' },
      { value: '1000+', label: 'Över 1000 kunder' }
    ]},
    { key: 'avgTransactionSize', label: 'Genomsnittligt köp per kund', type: 'text', fieldType: 'currency' },
    { key: 'inventoryTurnover', label: 'Lageromsättning per år', type: 'select', tooltip: 'Hur många gånger per år säljs lagret. Högre = bättre cash flow', options: [
      { value: '0-2', label: '0-2 gånger' },
      { value: '3-4', label: '3-4 gånger' },
      { value: '5-6', label: '5-6 gånger' },
      { value: '7-10', label: '7-10 gånger' },
      { value: '10+', label: 'Över 10 gånger' }
    ]},
    { key: 'inventoryValue', label: 'Genomsnittligt lagervärde', type: 'text', tooltip: 'Värde på lager i butik. Påverkar working capital', fieldType: 'currency' },
    { key: 'sameStoreSalesGrowth', label: 'Årlig försäljningstillväxt', type: 'text', tooltip: 'Tillväxt för befintlig butik', fieldType: 'percent' },
    { key: 'onlinePresence', label: 'Har ni e-handel?', type: 'select', options: [
      { value: 'yes-integrated', label: 'Ja, integrerad med butik' },
      { value: 'yes-separate', label: 'Ja, separat e-handel' },
      { value: 'no', label: 'Nej, endast fysisk butik' }
    ]},
    { key: 'brandStrength', label: 'Varumärkesstyrka', type: 'select', options: [
      { value: 'strong', label: 'Starkt - välkänt lokalt/nationellt' },
      { value: 'medium', label: 'Medel - etablerat bland stamkunder' },
      { value: 'weak', label: 'Svagt - nytt/okänt' }
    ]},
  ],
  manufacturing: [
    { key: 'productionCapacity', label: 'Kapacitetsutnyttjande', type: 'text', tooltip: 'Hur mycket av produktionskapaciteten används?', fieldType: 'percent' },
    { key: 'equipmentAge', label: 'Genomsnittlig ålder på maskiner (år)', type: 'text' },
    { key: 'equipmentValue', label: 'Bokfört värde på maskiner', type: 'text', tooltip: 'Sammanlagt värde på produktionsutrustning', fieldType: 'currency' },
    { key: 'depreciation', label: 'Årlig avskrivning', type: 'text', fieldType: 'currency' },
    { key: 'productMix', label: 'Antal produktlinjer', type: 'text' },
    { key: 'rawMaterialCosts', label: 'Råvarukostnader (% av omsättning)', type: 'text', fieldType: 'percent' },
    { key: 'productionStaff', label: 'Antal produktionsanställda', type: 'text' },
    { key: 'qualityCertifications', label: 'Har ni kvalitetscertifieringar?', type: 'select', options: [
      { value: 'iso9001', label: 'Ja, ISO 9001 eller liknande' },
      { value: 'other', label: 'Ja, andra certifieringar' },
      { value: 'no', label: 'Nej' }
    ]},
    { key: 'exportShare', label: 'Exportandel', type: 'text', tooltip: 'Hur stor del av försäljningen är export?', fieldType: 'percent' },
    { key: 'supplierDependency', label: 'Beroende av enskilda leverantörer?', type: 'select', options: [
      { value: 'low', label: 'Lågt - flera alternativ' },
      { value: 'medium', label: 'Medel - 2-3 huvudleverantörer' },
      { value: 'high', label: 'Högt - en kritisk leverantör' }
    ]},
  ],
  services: [
    { key: 'serviceType', label: 'Typ av tjänst', type: 'text', tooltip: 'Ex: redovisning, städning, konsult' },
    { key: 'contractRenewalRate', label: 'Förnyelserate på kontrakt (%)', type: 'text', tooltip: 'Andel kunder som förnyas årligen' },
    { key: 'avgRevenuePerCustomer', label: 'Genomsnittlig intäkt per kund/år (kr)', type: 'text' },
    { key: 'billableHours', label: 'Debiteringsgrad (%)', type: 'text', tooltip: 'Andel av arbetstid som kan faktureras' },
    { key: 'clientRetention', label: 'Genomsnittlig kundlivslängd (år)', type: 'text' },
    { key: 'customerGrowthRate', label: 'Årlig kundtillväxt (%)', type: 'text' },
    { key: 'keyPersonDependency', label: 'Beroende av nyckelpersoner?', type: 'select', options: [
      { value: 'low', label: 'Lågt - processer på plats' },
      { value: 'medium', label: 'Medel - viss nyckelperson' },
      { value: 'high', label: 'Högt - kritiskt beroende' }
    ]},
  ],
  restaurant: [
    { key: 'seatingCapacity', label: 'Antal sittplatser', type: 'text' },
    { key: 'avgCheckSize', label: 'Genomsnittlig nota (kr)', type: 'text' },
    { key: 'monthlyCovers', label: 'Antal gäster per månad', type: 'text' },
    { key: 'foodCostPercentage', label: 'Råvarukostnad (% av försäljning)', type: 'text', tooltip: 'Typiskt 25-35% för restaurang' },
    { key: 'liquorLicense', label: 'Alkoholtillstånd', type: 'select', options: [
      { value: 'full', label: 'Fullständiga rättigheter' },
      { value: 'beer-wine', label: 'Öl och vin' },
      { value: 'none', label: 'Inget alkoholtillstånd' }
    ]},
    { key: 'leaseYearsRemaining', label: 'År kvar på hyresavtal', type: 'text' },
    { key: 'deliveryRevenue', label: 'Andel take-away/delivery (%)', type: 'text' },
    { key: 'peakSeasonVariation', label: 'Säsongsvariationer', type: 'select', options: [
      { value: 'low', label: 'Låg - jämn beläggning året om' },
      { value: 'medium', label: 'Medel - viss säsongsvariation' },
      { value: 'high', label: 'Hög - stark säsongsberoende' }
    ]},
  ],
  construction: [
    { key: 'projectBacklog', label: 'Orderstock (kr)', type: 'text', tooltip: 'Värde av bekräftade projekt' },
    { key: 'avgProjectSize', label: 'Genomsnittlig projektstorlek (kr)', type: 'text' },
    { key: 'projectCompletionRate', label: 'Projekt i tid (%)', type: 'text', tooltip: 'Andel projekt som slutförs enligt plan' },
    { key: 'equipmentValue', label: 'Värde på maskiner/utrustning (kr)', type: 'text' },
    { key: 'subcontractorShare', label: 'Andel underentreprenörer (%)', type: 'text' },
    { key: 'publicPrivateMix', label: 'Fördelning offentlig/privat (%)', type: 'text', tooltip: 'Ex: 60/40' },
    { key: 'geographicReach', label: 'Geografisk räckvidd', type: 'select', options: [
      { value: 'local', label: 'Lokal - inom kommunen' },
      { value: 'regional', label: 'Regional - inom länet' },
      { value: 'national', label: 'Nationell' }
    ]},
    { key: 'specializations', label: 'Specialiseringar', type: 'textarea', tooltip: 'Ex: ROT, nybyggnation, kommersiellt' },
  ],
  healthcare: [
    { key: 'patientBase', label: 'Antal aktiva patienter/klienter', type: 'text' },
    { key: 'avgRevenuePerPatient', label: 'Genomsnittlig intäkt per patient/år (kr)', type: 'text' },
    { key: 'appointmentCapacity', label: 'Behandlingar per dag', type: 'text' },
    { key: 'insuranceRevenue', label: 'Andel försäkringsintäkter (%)', type: 'text' },
    { key: 'privatePayShare', label: 'Andel privatbetalande (%)', type: 'text' },
    { key: 'staffingModel', label: 'Bemanningsmodell', type: 'select', options: [
      { value: 'employed', label: 'Anställd personal' },
      { value: 'contractors', label: 'Inhyrd personal' },
      { value: 'mixed', label: 'Blandad modell' }
    ]},
    { key: 'equipmentInvestment', label: 'Investeringar i utrustning senaste 3 år (kr)', type: 'text' },
    { key: 'regulatoryCompliance', label: 'Tillstånd och certifieringar', type: 'textarea' },
  ],
  ecommerce: [
    { key: 'monthlyVisitors', label: 'Besökare per månad', type: 'text' },
    { key: 'conversionRate', label: 'Konverteringsgrad (%)', type: 'text', tooltip: 'Andel besökare som köper' },
    { key: 'avgOrderValue', label: 'Genomsnittligt ordervärde (kr)', type: 'text' },
    { key: 'returnRate', label: 'Returgrad (%)', type: 'text' },
    { key: 'customerAcquisitionCost', label: 'CAC - Kundanskaffningskostnad (kr)', type: 'text' },
    { key: 'repeatPurchaseRate', label: 'Återköpsfrekvens (%)', type: 'text', tooltip: 'Andel kunder som köper igen' },
    { key: 'inventoryTurnover', label: 'Lageromsättningshastighet per år', type: 'text' },
    { key: 'platformDependency', label: 'Plattformsberoende', type: 'select', options: [
      { value: 'own', label: 'Egen plattform' },
      { value: 'mixed', label: 'Egen + marknadsplatser' },
      { value: 'marketplace', label: 'Huvudsakligen marknadsplatser' }
    ]},
    { key: 'mobileShare', label: 'Mobilandel av försäljning (%)', type: 'text' },
  ],
  consulting: [
    { key: 'consultantCount', label: 'Antal konsulter', type: 'text' },
    { key: 'utilizationRate', label: 'Debiteringsgrad (%)', type: 'text', tooltip: 'Andel av tiden som faktureras. 70%+ är bra för konsult' },
    { key: 'avgHourlyRate', label: 'Genomsnittlig timpris (kr)', type: 'text' },
    { key: 'clientDiversity', label: 'Antal aktiva kunder', type: 'text' },
    { key: 'contractRenewalRate', label: 'Förnyelserate på kontrakt (%)', type: 'text', tooltip: 'Hur stor andel av kunderna förnyas år efter år? 80%+ excellent' },
    { key: 'avgProjectValue', label: 'Genomsnittligt projektvärde (kr)', type: 'text', tooltip: 'Genomsnittlig storlek på uppdrag' },
    { key: 'grossMarginPerConsultant', label: 'Bruttovinstmarginal per konsult (%)', type: 'text', tooltip: 'Intäkter minus direkta kostnader per konsult' },
    { key: 'methodology', label: 'Unik metodik eller ramverk?', type: 'select', options: [
      { value: 'yes', label: 'Ja, vi har egenutvecklad metodik' },
      { value: 'partial', label: 'Delvis, vissa verktyg' },
      { value: 'no', label: 'Nej, standard konsultarbete' }
    ]},
  ],
}

// Gemensamma kvalitativa frågor (steg 4)
const qualitativeQuestions = [
  { key: 'customerBase', label: 'Beskriv din kundbas', type: 'textarea' as const, tooltip: 'Antal kunder, geografisk spridning, kundlojalitet' },
  { key: 'competitiveAdvantage', label: 'Unika konkurrensfördelar', type: 'textarea' as const, tooltip: 'Vad gör ert företag unikt?' },
  { key: 'futureGrowth', label: 'Tillväxtplaner kommande 3 år', type: 'textarea' as const },
  { key: 'challenges', label: 'Största utmaningar/risker', type: 'textarea' as const },
  { key: 'whySelling', label: 'Går du i säljtankar? Varför?', type: 'textarea' as const },
]

const defaultQualitativeAnswers: Record<string, string> = {
  customerBase: 'Stabila B2B-kunder med långa kontrakt och låg churn.',
  competitiveAdvantage: 'Egen teknikplattform, starkt varumärke och dokumenterade processer.',
  futureGrowth: 'Planerar expansion till Norden, stärker partnerförsäljning och utvecklar nya premiumtjänster.',
  challenges: 'Behov av fler säljare, minska nyckelperson-risk och uppdatera äldre system.',
  whySelling: 'Ägarna vill ta in strategisk partner för att accelerera expansionen.',
}

type DemoCompany = {
  label: string
  data: Partial<ValuationData>
  industryAnswers?: Record<string, string>
  qualitative?: Record<string, string>
}

const demoCompanies: DemoCompany[] = [
  {
    label: 'Nimbus Analytics (SaaS)',
    data: {
      email: 'demo+saas@afterfounder.com',
      companyName: 'Nimbus Analytics AB',
      website: 'https://nimbusanalytics.se',
      orgNumber: '5591234567',
      industry: 'tech',
      companyAge: '8',
      revenue: '42000000',
      revenue3Years: '36000000',
      profitMargin: '18',
      employees: '32',
      grossMargin: '72',
      customerConcentrationRisk: '28',
      regulatoryLicenses: 'yes',
      totalDebt: '2500000',
      paymentTerms: '31-45',
      exactRevenue: '42000000',
      operatingCosts: '28000000',
      cogs: '11800000',
      salaries: '15000000',
      marketingCosts: '3200000',
      rentCosts: '900000',
      otherOperatingCosts: '2500000'
    },
    industryAnswers: {
      businessModel: 'saas',
      recurringRevenue: '88',
      monthlyRecurringRevenue: '3500000',
      customerChurn: '4',
      netRevenueRetention: '118',
      customerAcquisitionCost: '85000',
      lifetimeValue: '640000',
      cacPaybackMonths: '7-12',
      techStack: 'React, Node.js, AWS serverless',
      scalability: 'high',
      ipRights: 'yes'
    },
    qualitative: {
      customerBase: '120 enterprise-kunder inom logistik och detaljhandel med 3-åriga avtal.',
      competitiveAdvantage: 'Prediktiva AI-modeller, ISO 27001 och 98% kundförnyelse.',
      futureGrowth: 'Lanserar modul för DACH-marknaden och stärker partnernätverk.',
      challenges: 'Behöver rekrytera två seniora säljare och minska beroende av CTO.',
      whySelling: 'Grundarna söker kapital för internationell expansion inom 18 månader.'
    }
  },
  {
    label: 'Nordic Retail Group',
    data: {
      email: 'demo+retail@afterfounder.com',
      companyName: 'Nordic Retail Group AB',
      website: 'https://nordicretailgroup.se',
      orgNumber: '5569876543',
      industry: 'retail',
      companyAge: '12',
      revenue: '28000000',
      revenue3Years: '24000000',
      profitMargin: '12',
      employees: '24',
      grossMargin: '46',
      customerConcentrationRisk: '15',
      regulatoryLicenses: 'partial',
      totalDebt: '1200000',
      paymentTerms: '16-30',
      exactRevenue: '28000000',
      operatingCosts: '21000000',
      cogs: '15120000',
      salaries: '7800000',
      marketingCosts: '1200000',
      rentCosts: '1500000',
      otherOperatingCosts: '1800000'
    },
    industryAnswers: {
      storeLocation: 'good',
      leaseLength: '4-5',
      monthlyRent: '125000',
      footTraffic: '201-500',
      avgTransactionSize: '780',
      inventoryTurnover: '5-6',
      inventoryValue: '4500000',
      sameStoreSalesGrowth: '9',
      onlinePresence: 'yes-integrated',
      brandStrength: 'medium'
    },
    qualitative: {
      customerBase: 'Butikskedja i tre storstäder med hög andel återkommande kunder.',
      competitiveAdvantage: 'Egen produktdesign, stark community och hög servicegrad.',
      futureGrowth: 'Öppnar pop-up stores, skalbar e-handel och B2B-samarbeten.',
      challenges: 'Ökade hyror och behov av bättre lagerplanering över säsong.',
      whySelling: 'Ägarna vill ta in kapital för fler etableringar samt internationell närvaro.'
    }
  },
  {
    label: 'CityCare Kliniken',
    data: {
      email: 'demo+care@afterfounder.com',
      companyName: 'CityCare Kliniken AB',
      website: 'https://citycarekliniken.se',
      orgNumber: '5561122334',
      industry: 'healthcare',
      companyAge: '9',
      revenue: '18000000',
      revenue3Years: '15000000',
      profitMargin: '22',
      employees: '18',
      grossMargin: '58',
      customerConcentrationRisk: '12',
      regulatoryLicenses: 'yes',
      totalDebt: '600000',
      paymentTerms: '0-15',
      exactRevenue: '18000000',
      operatingCosts: '12500000',
      cogs: '7560000',
      salaries: '6800000',
      marketingCosts: '800000',
      rentCosts: '1100000',
      otherOperatingCosts: '900000'
    },
    industryAnswers: {
      patientBase: '6200',
      avgRevenuePerPatient: '2900',
      appointmentCapacity: '320',
      insuranceRevenue: '55',
      privatePayShare: '45',
      staffingModel: 'mixed',
      equipmentInvestment: '2400000',
      regulatoryCompliance: 'IVO-tillstånd, ISO 13485 samt regionavtal'
    },
    qualitative: {
      customerBase: 'Primärt privatanställda patienter med abonnemang och företagsavtal.',
      competitiveAdvantage: 'Multidisciplinärt team, kort väntetid och helhetskoncept.',
      futureGrowth: 'Öppnar satellitklinik i Malmö och digital vårdplattform.',
      challenges: 'Behöver säkra fler specialister och automatisera patientflöden.',
      whySelling: 'Vill ta in investerare för att accelerera expansion och stärka varumärket.'
    }
  }
]

function getDefaultValueForQuestion(question: { type: 'text' | 'select' | 'textarea'; options?: { value: string; label: string }[]; fieldType?: 'currency' | 'percent' }) {
  if (question.type === 'select') {
    return question.options?.[0]?.value || ''
  }
  if (question.fieldType === 'percent') {
    return '50'
  }
  if (question.fieldType === 'currency') {
    return '500000'
  }
  return 'Ej angivet'
}

// Formateringsfunktioner
const formatCurrency = (value: string): string => {
  // Ta bort allt utom siffror
  const numbers = value.replace(/\D/g, '')
  if (!numbers) return ''
  
  // Formatera med tusentalsavgränsare
  const formatted = parseInt(numbers).toLocaleString('sv-SE')
  return formatted + ' kr'
}

const formatPercent = (value: string): string => {
  // Ta bort allt utom siffror
  const numbers = value.replace(/\D/g, '')
  if (!numbers) return ''
  
  return numbers + '%'
}

const parseCurrency = (value: string): string => {
  // Extrahera bara siffror
  return value.replace(/\D/g, '')
}

const parsePercent = (value: string): string => {
  // Extrahera bara siffror
  return value.replace(/\D/g, '')
}

export default function ValuationWizard({ onClose }: WizardProps) {
  const router = useRouter()
  const { user, login } = useAuth()
  const t = useTranslations('valuationWizard')
  const locale = useLocale()
  const [step, setStep] = useState(1)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [data, setData] = useState<ValuationData>({
    email: user?.email || '',
    companyName: '',
    website: '',
    orgNumber: '',
    industry: '',
    companyAge: '',
    revenue: '',
    revenue3Years: '',
    profitMargin: '',
    employees: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEnriching, setIsEnriching] = useState(false)
  const [enrichmentStatus, setEnrichmentStatus] = useState('')
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false)
  const [autoAccountCreated, setAutoAccountCreated] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [loadingText, setLoadingText] = useState(t('loading.analyzing'))
  const [showOrgNumberTooltip, setShowOrgNumberTooltip] = useState(false)
  const cogsManuallySetRef = useRef(false)
  const [autoFillMessage, setAutoFillMessage] = useState<string | null>(null)

  const totalSteps = 6
  const progress = (step / totalSteps) * 100

  // Placeholder-exempel för branschspecifika frågor
  const questionPlaceholders: Record<string, string> = {
    // Services (tjänsteföretag)
    serviceType: 'Ex: redovisning, juridik, marknadsföring',
    clientRetention: 'Ex: 5',
    contractRenewalRate: 'Ex: 85%',
    billableHours: 'Ex: 72%',
    avgRevenuePerCustomer: 'Ex: 120.000 kr',
    customerGrowthRate: 'Ex: 12%',
    keyPersonDependency: '',
    // Consulting
    consultantCount: 'Ex: 8',
    utilizationRate: 'Ex: 75%',
    avgHourlyRate: 'Ex: 1.250 kr',
    clientDiversity: 'Ex: 12',
    avgProjectValue: 'Ex: 240.000 kr',
    grossMarginPerConsultant: 'Ex: 40%',
    // Retail examples
    leaseLength: 'Ex: 3',
    monthlyRent: 'Ex: 35.000 kr',
    footTraffic: 'Ex: 250',
    avgTransactionSize: 'Ex: 320 kr',
    inventoryTurnover: 'Ex: 6',
    inventoryValue: 'Ex: 400.000 kr',
    sameStoreSalesGrowth: 'Ex: 12',
    // Manufacturing
    productionCapacity: 'Ex: 75',
    equipmentAge: 'Ex: 8',
    equipmentValue: 'Ex: 1.200.000 kr',
    depreciation: 'Ex: 350.000 kr',
    rawMaterialCosts: 'Ex: 55',
  }

  const getExamplePlaceholder = (question: { key: string; label: string; type: 'text' | 'select' | 'textarea' }): string => {
    if (questionPlaceholders[question.key]) return questionPlaceholders[question.key]
    const label = question.label.toLowerCase()
    if (label.includes('%')) return 'Ex: 75'
    if (label.includes('kr') || label.includes('sek')) return 'Ex: 700.000 kr'
    if (label.includes('antal')) return 'Ex: 6'
    if (label.includes('år')) return 'Ex: 3'
    if (question.type === 'textarea') return 'Beskriv...'
    return 'Ex: 12'
  }

  const handleEnrichData = async () => {
    if (!data.website && !data.orgNumber) return
    
    setIsEnriching(true)
    try {
      // Anropa API för att hämta data
      setEnrichmentStatus('Hämtar företagsdata från Bolagsverket...')
      
      const enrichResponse = await fetch('/api/enrich-company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          website: data.website,
          orgNumber: data.orgNumber,
          companyName: data.companyName
        }),
      })

      if (enrichResponse.ok) {
        const enrichedData = await enrichResponse.json()
        
        setEnrichmentStatus('Skrapar hemsida för information...')
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        setEnrichmentStatus('Analyserar SCB-statistik...')
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Uppdatera formulärdata med berikad information
        setData(prev => ({
          ...prev,
          ...enrichedData.autoFill
        }))
        
        // Spara även rå-data för GPT-analysen senare
        localStorage.setItem('enrichedCompanyData', JSON.stringify(enrichedData.rawData))
        
        setEnrichmentStatus('Data inhämtad! Fortsätt för att granska.')
      }
    } catch (error) {
      console.error('Enrichment error:', error)
      setEnrichmentStatus('Kunde inte hämta all data automatiskt. Fortsätt manuellt.')
    } finally {
      setIsEnriching(false)
    }
  }

  const handleFillDemoData = () => {
    const demo = demoCompanies[Math.floor(Math.random() * demoCompanies.length)]
    if (!demo) return
    const industryValue = demo.data.industry || data.industry || 'tech'
    const filledData: ValuationData = {
      ...data,
      ...demo.data,
      industry: industryValue
    }

    const questions = industryQuestions[industryValue] || []
    questions.forEach((question) => {
      const demoValue = demo.industryAnswers?.[question.key]
      if (demoValue !== undefined) {
        filledData[question.key] = demoValue
      } else if (!filledData[question.key]) {
        filledData[question.key] = getDefaultValueForQuestion(question)
      }
    })

    qualitativeQuestions.forEach((question) => {
      const key = question.key
      const demoValue = demo.qualitative?.[key]
      if (!filledData[key]) {
        filledData[key] = demoValue ?? defaultQualitativeAnswers[key] ?? 'Ej angivet'
      }
    })

    setData(filledData)
    setAcceptedPrivacy(true)
    setAutoFillMessage(`Fyllde i ${demo.label}`)
    setEnrichmentStatus('')
  }

  const handleNext = () => {
    // Om steg 1 och vi har URL/org.nr, berika data först
    if (step === 1 && (data.website || data.orgNumber) && !isEnriching && !enrichmentStatus) {
      handleEnrichData()
      return
    }
    
    if (step < totalSteps) {
      setStep(step + 1)
    } else {
      handleSubmit()
    }
  }

  useEffect(() => {
    if (!autoFillMessage) return
    const timer = setTimeout(() => setAutoFillMessage(null), 5000)
    return () => clearTimeout(timer)
  }, [autoFillMessage])

  // Auto-fetch company data when org number is entered (like in SME kit)
  useEffect(() => {
    const orgNumber = data.orgNumber?.replace(/\D/g, '')
    
    // Only fetch if org number is complete (10 digits) and we haven't enriched yet
    if (orgNumber && orgNumber.length === 10 && !isEnriching && !enrichmentStatus && !data.registrationDate) {
      const timer = setTimeout(() => {
        handleEnrichData()
      }, 1000) // Debounce 1 second after typing stops
      
      return () => clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.orgNumber, data.registrationDate])

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setLoadingProgress(0)
    setLoadingText(t('loading.analyzing'))
    
    // AUTO-SKAPA KONTO om användaren inte är inloggad
    if (!user && data.email && acceptedPrivacy) {
      try {
        const accountResult = await login(data.email, 'seller', acceptedPrivacy)
        if (accountResult.success) {
          setAutoAccountCreated(true)
          console.log('Auto-created account for:', data.email)
        }
      } catch (error) {
        console.error('Auto account creation failed:', error)
        // Fortsätt ändå med värderingen
      }
    }
    
    // Beräkna totala rörelsekostnader från de nya kategorierna
    const salaries = Number(data.salaries) || 0
    const rent = Number(data.rentCosts) || 0
    const marketing = Number(data.marketingCosts) || 0
    const other = Number(data.otherOperatingCosts) || 0
    const totalOperatingCosts = salaries + rent + marketing + other
    
    // Skapa en kopia av data med beräknade operatingCosts
    const submitData = {
      ...data,
      operatingCosts: totalOperatingCosts > 0 ? totalOperatingCosts.toString() : data.operatingCosts || ''
    }
    
    // Spara data i localStorage för att skicka till resultat-sidan
    localStorage.setItem('valuationData', JSON.stringify(submitData))
    
    // Anropa API för värdering
    try {
      const response = await fetch('/api/valuation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      })
      
      if (response.ok) {
        const result = await response.json()
        localStorage.setItem('valuationResult', JSON.stringify(result))
      }
    } catch (error) {
      console.error('Valuation API error:', error)
    }
    
    // Navigera till resultatsidan
    router.push(`/${locale}/vardering/resultat`)
  }

  const canProceed = () => {
    switch (step) {
      case 1:
        // Grundläggande fält krävs, URL/org.nr är valfritt
        const hasBasics = data.email && data.companyName && data.industry
        // Om användaren inte är inloggad, kräv privacy-godkännande
        const hasPrivacy = user ? true : acceptedPrivacy
        // Om enrichment pågår, vänta
        if (isEnriching) return false
        return hasBasics && hasPrivacy
      case 2:
        // Steg 2: Universella riskfrågor
        return data.grossMargin &&
               data.customerConcentrationRisk &&
               data.regulatoryLicenses
      case 3:
        // Steg 3: Finansiella frågor
        return data.exactRevenue && 
               data.companyAge && 
               data.revenue3Years && 
               data.employees
      case 4:
        // Steg 4: Branschspecifika frågor
        const questions = industryQuestions[data.industry] || []
        return questions.every(q => data[q.key])
      case 5:
        // Steg 5: Kvalitativa frågor
        return qualitativeQuestions.every(q => data[q.key])
      default:
        return true
    }
  }

  useEffect(() => {
    // Ensure the content starts at the very top when opening or changing step
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0
    }
    // Reset manual COGS flag when leaving step 3
    if (step !== 3) {
      cogsManuallySetRef.current = false
    }
  }, [step])

  // Auto-calculate COGS from revenue and gross margin
  useEffect(() => {
    if (data.exactRevenue && data.grossMargin && step === 3 && !cogsManuallySetRef.current) {
      const revenue = Number(data.exactRevenue)
      const grossMarginPercent = Number(data.grossMargin.replace('%', '').replace(',', '.'))
      
      if (revenue > 0 && grossMarginPercent > 0 && grossMarginPercent <= 100) {
        // COGS = Revenue * (1 - Gross Margin / 100)
        const calculatedCOGS = Math.round(revenue * (1 - grossMarginPercent / 100))
        setData(prev => ({ ...prev, cogs: calculatedCOGS.toString() }))
      }
    }
  }, [data.exactRevenue, data.grossMargin, step])

  // Laddningstexterna som ska visas i sekvens
  const loadingTexts = [
    t('loading.analyzing'),
    t('loading.creatingValuation'),
    t('loading.almostDone')
  ]

  // Uppdatera progress och text under laddning
  useEffect(() => {
    if (isSubmitting) {
      const totalDuration = 90000 // 1.5 minuter = 90 sekunder
      const updateInterval = 100 // Uppdatera var 100ms
      const progressIncrement = 100 / (totalDuration / updateInterval)
      const textChangeInterval = totalDuration / loadingTexts.length

      let currentProgress = 0
      let textIndex = 0

      const progressTimer = setInterval(() => {
        currentProgress += progressIncrement
        if (currentProgress >= 100) {
          currentProgress = 100
          clearInterval(progressTimer)
        }
        setLoadingProgress(currentProgress)
      }, updateInterval)

      const textTimer = setInterval(() => {
        textIndex++
        if (textIndex < loadingTexts.length) {
          setLoadingText(loadingTexts[textIndex])
        } else {
          clearInterval(textTimer)
        }
      }, textChangeInterval)

      return () => {
        clearInterval(progressTimer)
        clearInterval(textTimer)
      }
    }
  }, [isSubmitting])

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      {/* Laddningsskärm */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
            <div className="mb-8">
              <div className="w-20 h-20 bg-primary-navy/10 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                <TrendingUp className="w-10 h-10 text-primary-navy" />
              </div>
              <h2 className="text-2xl font-bold text-primary-navy mb-2">
                Analyserar ditt företag
              </h2>
              <p className="text-gray-600">
                {loadingText}
              </p>
            </div>

            <div className="mb-6">
              <div className="bg-gray-200 rounded-full h-4 overflow-hidden">
                <div
                  className="bg-primary-navy h-full rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${loadingProgress}%` }}
                />
              </div>
              <p className="text-sm text-gray-500 mt-2">{Math.round(loadingProgress)}%</p>
            </div>

            <p className="text-xs text-gray-400">
              Detta tar normalt 60-90 sekunder
            </p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-3xl h-[95vh] sm:h-[90vh] md:h-[85vh] flex flex-col">
        {/* Header - Fixed */}
        <div className="px-4 sm:px-6 md:px-8 pt-4 sm:pt-6 md:pt-8 pb-3 sm:pb-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 mr-2">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold" style={{ color: '#1F3C58' }}>
                {t('title')}
              </h2>
              <p className="text-xs sm:text-sm md:text-base mt-1" style={{ color: '#666666' }}>
                {t('subtitle')}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              {autoFillMessage && (
                <span className="text-xs text-green-700">{autoFillMessage}</span>
              )}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleFillDemoData}
                  disabled={isSubmitting}
                  className="px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors disabled:opacity-50"
                  style={{ borderColor: '#1F3C58', color: '#1F3C58' }}
                >
                  Fyll med demo-data
                </button>
                <button
                  onClick={onClose}
                  className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-4 sm:w-5 h-4 sm:h-5 text-gray-400 hover:text-gray-600" />
                </button>
              </div>
            </div>
          </div>

        {/* Progress Bar */}
          <div className="mt-3 sm:mt-4">
            <div className="flex items-center justify-between mb-1.5 sm:mb-2 text-xs sm:text-sm">
              <span style={{ color: '#1F3C58' }}>Steg {step} av {totalSteps}</span>
              <span style={{ color: '#666666' }}>{Math.round(progress)}% klart</span>
          </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-300 ease-out rounded-full"
                style={{ 
                  width: `${progress}%`,
                  backgroundColor: '#1F3C58'
                }}
              />
            </div>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 md:px-8 py-6">
          {/* Step 1: Grunduppgifter */}
          {step === 1 && (
            <div className="space-y-4 md:space-y-6">
              <div className="text-center mb-6 md:mb-8">
                <Mail className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-4" style={{ color: '#1F3C58' }} />
                <h3 className="text-xl md:text-2xl font-bold mb-2" style={{ color: '#1F3C58' }}>
                  {t('step1.title')}
                </h3>
                <p style={{ color: '#666666' }}>{t('step1.subtitle')}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#1F3C58' }}>
                    {t('common.emailAddress')}
                  </label>
                  <input
                type="email"
                value={data.email || ''}
                    onChange={(e) => setData({ ...data, email: e.target.value })}
                placeholder={t('common.emailPlaceholder')}
                    className="input-field"
                required
              />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#1F3C58' }}>
                    {t('common.companyName')}
                  </label>
                  <input
                    type="text"
                value={data.companyName || ''}
                    onChange={(e) => setData({ ...data, companyName: e.target.value })}
                placeholder={t('common.companyPlaceholder')}
                    className="input-field"
                required
              />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#1F3C58' }}>
                    {t('step1.industry')}
                  </label>
                  <CustomSelect
                    value={data.industry || ''}
                    onChange={(value) => setData({ ...data, industry: value })}
                    options={industries}
                    placeholder={t('step1.industryPlaceholder')}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#1F3C58' }}>
                      {t('step1.website')}
                    </label>
                    <input
                      type="url"
                      value={data.website || ''}
                      onChange={(e) => setData({ ...data, website: e.target.value })}
                      placeholder={t('step1.websitePlaceholder')}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 flex items-center gap-2" style={{ color: '#1F3C58' }}>
                      <span>{t('step1.orgNumber')}</span>
                      <div className="relative">
                        <button
                          type="button"
                          onMouseEnter={() => setShowOrgNumberTooltip(true)}
                          onMouseLeave={() => setShowOrgNumberTooltip(false)}
                          onFocus={() => setShowOrgNumberTooltip(true)}
                          onBlur={() => setShowOrgNumberTooltip(false)}
                          className="focus:outline-none"
                          aria-label={t('step1.orgNumberAriaLabel')}
                        >
                          <HelpCircle className="w-4 h-4 text-gray-400 hover:text-primary-navy transition-colors" />
                        </button>
                        {showOrgNumberTooltip && (
                          <div 
                            className="absolute bottom-full mb-2 w-64 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg z-50"
                            style={{ left: '50%', transform: 'translateX(-50%)' }}
                          >
                            {t('step1.orgNumberTooltip')}
                            <div 
                              className="absolute top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"
                              style={{ left: '50%', transform: 'translateX(-50%)' }}
                            />
                          </div>
                        )}
                      </div>
                    </label>
                    <input
                      type="text"
                      value={data.orgNumber || ''}
                      onChange={(e) => setData({ ...data, orgNumber: e.target.value })}
                      placeholder={t('step1.orgNumberPlaceholder')}
                      className="input-field"
                    />
                  </div>
              </div>

              {!user && (
                  <div className="mt-4 p-4 rounded-lg" style={{ backgroundColor: '#F5F0E8' }}>
                    <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={acceptedPrivacy}
                      onChange={(e) => setAcceptedPrivacy(e.target.checked)}
                        className="mt-0.5"
                      />
                      <span className="text-sm" style={{ color: '#666666' }}>
                        {t('step1.privacyAccept')} <a href={`/${locale}/juridiskt/integritetspolicy`} className="underline" style={{ color: '#FF69B4' }}>{t('step1.privacyPolicy')}</a> {t('step1.privacyAnd')} 
                        {t('step1.privacyAccount')}
                    </span>
                  </label>
                </div>
              )}

                {enrichmentStatus && (
                  <div className="mt-4 p-4 rounded-lg" style={{ backgroundColor: '#E8F4F8' }}>
                    <p className="text-sm" style={{ color: '#1F3C58' }}>{enrichmentStatus}</p>
                </div>
              )}
                </div>
            </div>
          )}

          {/* Step 2: Universella riskfrågor */}
          {step === 2 && (
            <div className="space-y-4 md:space-y-6">
              <div className="text-center mb-6 md:mb-8">
                <AlertCircle className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-4" style={{ color: '#1F3C58' }} />
                <h3 className="text-xl md:text-2xl font-bold mb-2" style={{ color: '#1F3C58' }}>
                  {t('step2.title')}
                </h3>
                <p style={{ color: '#666666' }}>{t('step2.subtitle')}</p>
              </div>

              <div className="space-y-4">
                <FormFieldPercent
                  label={t('step2.grossMargin')}
                  value={data.grossMargin || ''}
                  onChange={(value) => setData({ ...data, grossMargin: value })}
                  placeholder={t('step2.grossMarginPlaceholder')}
                  required
                />

                <FormFieldPercent
                  label={t('step2.customerConcentration')}
                  value={data.customerConcentrationRisk || ''}
                  onChange={(value) => setData({ ...data, customerConcentrationRisk: value })}
                  placeholder={t('step2.customerConcentrationPlaceholder')}
                  tooltip={t('step2.customerConcentrationTooltip')}
                  required
                />

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#1F3C58' }}>
                    {t('step2.regulatoryLicenses')}
                  </label>
                  <CustomSelect
                    value={data.regulatoryLicenses || ''}
                    onChange={(value) => setData({ ...data, regulatoryLicenses: value })}
                    options={[
                      { value: 'yes', label: t('step2.regulatoryLicensesYes') },
                      { value: 'partial', label: t('step2.regulatoryLicensesPartial') },
                      { value: 'no', label: t('step2.regulatoryLicensesNo') }
                    ]}
                    placeholder={t('step2.regulatoryLicensesPlaceholder')}
                  />
                </div>

                <FormFieldCurrency
                  label={t('step2.totalDebt')}
                  value={data.totalDebt || ''}
                  onChange={(value) => setData({ ...data, totalDebt: value })}
                  placeholder={t('step2.totalDebtPlaceholder')}
                  helpText={t('step2.totalDebtHelpText')}
                />

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#1F3C58' }}>
                    {t('step2.paymentTerms')}
                  </label>
                  <CustomSelect
                    value={data.paymentTerms || ''}
                    onChange={(value) => setData({ ...data, paymentTerms: value })}
                    options={[
                      { value: '0-15', label: t('step2.paymentTerms0to15') },
                      { value: '16-30', label: t('step2.paymentTerms16to30') },
                      { value: '31-45', label: t('step2.paymentTerms31to45') },
                      { value: '46-60', label: t('step2.paymentTerms46to60') },
                      { value: '61-90', label: t('step2.paymentTerms61to90') },
                      { value: '91+', label: t('step2.paymentTerms91plus') }
                    ]}
                    placeholder={t('step2.paymentTermsPlaceholder')}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Finansiella uppgifter */}
          {step === 3 && (
            <div className="space-y-4 md:space-y-6">
              <div className="text-center mb-6 md:mb-8">
                <TrendingUp className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-4" style={{ color: '#1F3C58' }} />
                <h3 className="text-xl md:text-2xl font-bold mb-2" style={{ color: '#1F3C58' }}>
                  {t('step3.title')}
                </h3>
                <p style={{ color: '#666666' }}>{t('step3.subtitle')}</p>
              </div>

              <div className="space-y-4">
                <FormFieldCurrency
                  label={t('step3.exactRevenue')}
                  value={data.exactRevenue || ''}
                  onChange={(value) => setData({ ...data, exactRevenue: value })}
                  placeholder={t('step3.exactRevenuePlaceholder')}
                  required
                />

                <div>
                  <h4 className="text-base font-semibold mb-3" style={{ color: '#1F3C58' }}>
                    {t('step3.operatingCosts')}
                  </h4>
                  <div className="space-y-4 pl-4 border-l-2 border-gray-200">
                    <FormFieldCurrency
                      label={t('step3.salaries')}
                      value={data.salaries || ''}
                      onChange={(value) => setData({ ...data, salaries: value })}
                      placeholder={t('step3.salariesPlaceholder')}
                    />
                    
                    <FormFieldCurrency
                      label={t('step3.rentCosts')}
                      value={data.rentCosts || ''}
                      onChange={(value) => setData({ ...data, rentCosts: value })}
                      placeholder={t('step3.rentCostsPlaceholder')}
                    />
                    
                    <FormFieldCurrency
                      label={t('step3.marketingCosts')}
                      value={data.marketingCosts || ''}
                      onChange={(value) => setData({ ...data, marketingCosts: value })}
                      placeholder={t('step3.marketingCostsPlaceholder')}
                    />
                    
                    <FormFieldCurrency
                      label={t('step3.otherOperatingCosts')}
                      value={data.otherOperatingCosts || ''}
                      onChange={(value) => setData({ ...data, otherOperatingCosts: value })}
                      placeholder={t('step3.otherOperatingCostsPlaceholder')}
                      helpText={t('step3.otherOperatingCostsHelpText')}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#1F3C58' }}>
                      {t('step3.companyAge')}
                    </label>
                    <CustomSelect
                value={data.companyAge || ''}
                      onChange={(value) => setData({ ...data, companyAge: value })}
                options={[
                        { value: '0-1', label: t('step3.companyAge0to1') },
                        { value: '2-3', label: t('step3.companyAge2to3') },
                        { value: '4-5', label: t('step3.companyAge4to5') },
                  { value: '6-10', label: t('step3.companyAge6to10') },
                  { value: '11-20', label: t('step3.companyAge11to20') },
                        { value: '21+', label: t('step3.companyAge21plus') }
                ]}
                placeholder={t('step3.companyAgePlaceholder')}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#1F3C58' }}>
                      {t('step3.employees')}
                    </label>
                    <CustomSelect
                value={data.employees || ''}
                      onChange={(value) => setData({ ...data, employees: value })}
                options={[
                  { value: '1-5', label: t('step3.employees1to5') },
                  { value: '6-10', label: t('step3.employees6to10') },
                  { value: '11-25', label: t('step3.employees11to25') },
                        { value: '26-50', label: t('step3.employees26to50') },
                        { value: '51-100', label: t('step3.employees51to100') },
                        { value: '101-250', label: t('step3.employees101to250') },
                        { value: '251+', label: t('step3.employees251plus') }
                ]}
                placeholder={t('step3.employeesPlaceholder')}
                    />
                  </div>
                </div>

                <div>
                <FormFieldPercent
                  label={t('step3.revenue3Years')}
                  value={data.revenue3Years || ''}
                  onChange={(value) => setData({ ...data, revenue3Years: value })}
                  placeholder={t('step3.revenue3YearsPlaceholder')}
                  tooltip={t('step3.revenue3YearsTooltip')}
                required
              />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <FormFieldCurrency
                      label={t('step3.cogs')}
                      value={data.cogs || ''}
                      onChange={(value) => {
                        cogsManuallySetRef.current = true
                        setData({ ...data, cogs: value })
                      }}
                      placeholder={t('step3.cogsPlaceholder')}
                      disabled={!!(data.exactRevenue && data.grossMargin && !cogsManuallySetRef.current)}
                    />
                    {data.exactRevenue && data.grossMargin && !cogsManuallySetRef.current && (
                      <p className="text-xs mt-1 text-gray-500">
                        {t('step3.cogsAutoCalculated')}
                      </p>
                    )}
                  </div>

                  <div>
                    <FormFieldCurrency
                      label={t('step3.salariesLabel')}
                      value={data.salaries || ''}
                      onChange={(value) => setData({ ...data, salaries: value })}
                      placeholder={t('step3.salariesLabelPlaceholder')}
                    />
                  </div>
                  </div>
                </div>
            </div>
          )}

          {/* Step 4: Branschspecifika frågor */}
          {step === 4 && (
            <div className="space-y-4 md:space-y-6">
              <div className="text-center mb-6 md:mb-8">
                <Target className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-4" style={{ color: '#1F3C58' }} />
                <h3 className="text-xl md:text-2xl font-bold mb-2" style={{ color: '#1F3C58' }}>
                  {t('step4.title', { industry: industries.find(i => i.value === data.industry)?.label || t('step1.industry') })}
                </h3>
                <p style={{ color: '#666666' }}>{t('step4.subtitle')}</p>
              </div>

              <div className="space-y-4">
              {(industryQuestions[data.industry] || []).map((question) => {
                  if (question.type === 'select') {
                  return (
                      <div key={question.key}>
                        <label className="block text-sm font-medium mb-2" style={{ color: '#1F3C58' }}>
                          {question.label} *
                        </label>
                        <CustomSelect
                      value={data[question.key] as string || ''}
                          onChange={(value) => setData({ ...data, [question.key]: value })}
                          options={question.options || []}
                          placeholder={t('step4.selectPlaceholder')}
                        />
                        {question.tooltip && (
                          <p className="text-xs mt-1" style={{ color: '#666666' }}>{question.tooltip}</p>
                        )}
                      </div>
                  )
                } else if (question.type === 'textarea') {
                  return (
                      <div key={question.key}>
                        <label className="block text-sm font-medium mb-2" style={{ color: '#1F3C58' }}>
                          {question.label} *
                        </label>
                        <textarea
                      value={data[question.key] as string || ''}
                      onChange={(e) => setData({ ...data, [question.key]: e.target.value })}
                      placeholder={getExamplePlaceholder(question)}
                      rows={3}
                          className="textarea-field"
                      required
                    />
                        {question.tooltip && (
                          <p className="text-xs mt-1" style={{ color: '#666666' }}>{question.tooltip}</p>
                        )}
                      </div>
                  )
                } else {
                  // Text input with formatting
                  if (question.fieldType === 'currency') {
                  return (
                      <FormFieldCurrency
                      key={question.key}
                      label={question.label}
                      value={data[question.key] as string || ''}
                        onChange={(value) => setData({ ...data, [question.key]: value })}
                      placeholder={getExamplePlaceholder(question)}
                      tooltip={question.tooltip}
                      required
                    />
                  )
                  } else if (question.fieldType === 'percent') {
                  return (
                      <FormFieldPercent
                      key={question.key}
                      label={question.label}
                      value={data[question.key] as string || ''}
                        onChange={(value) => setData({ ...data, [question.key]: value })}
                      placeholder={getExamplePlaceholder(question)}
                      tooltip={question.tooltip}
                      helpText={question.helpText}
                      required
                    />
                  )
                  } else {
                    return (
                      <div key={question.key}>
                        <label className="block text-sm font-medium mb-2" style={{ color: '#1F3C58' }}>
                          {question.label} *
                        </label>
                        <input
                          type="text"
                          value={data[question.key] as string || ''}
                          onChange={(e) => setData({ ...data, [question.key]: e.target.value })}
                          placeholder={getExamplePlaceholder(question)}
                          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20"
                          required
                        />
                        {question.tooltip && (
                          <p className="text-xs mt-1" style={{ color: '#666666' }}>{question.tooltip}</p>
                        )}
                      </div>
                    )
                  }
                }
              })}
              </div>
            </div>
          )}

          {/* Step 5: Kvalitativa frågor */}
          {step === 5 && (
            <div className="space-y-4 md:space-y-6">
              <div className="text-center mb-6 md:mb-8">
                <Lightbulb className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-4" style={{ color: '#1F3C58' }} />
                <h3 className="text-xl md:text-2xl font-bold mb-2" style={{ color: '#1F3C58' }}>
                  {t('step5.title')}
                </h3>
                <p style={{ color: '#666666' }}>{t('step5.subtitle')}</p>
              </div>

              <div className="space-y-4">
              {qualitativeQuestions.map((question) => (
                  <div key={question.key}>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#1F3C58' }}>
                      {question.label} *
                    </label>
                    <textarea
                  value={data[question.key] as string || ''}
                  onChange={(e) => setData({ ...data, [question.key]: e.target.value })}
                      placeholder={t('common.describe')}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20"
                  required
                />
                    {question.tooltip && (
                      <p className="text-xs mt-1" style={{ color: '#666666' }}>{question.tooltip}</p>
                    )}
                  </div>
              ))}
              </div>
            </div>
          )}

          {/* Step 6: Sammanfattning & Submit */}
          {step === 6 && (
            <div className="space-y-4 md:space-y-6">
              <div className="text-center mb-6 md:mb-8">
                <FileText className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-4" style={{ color: '#1F3C58' }} />
                <h3 className="text-xl md:text-2xl font-bold mb-2" style={{ color: '#1F3C58' }}>
                  {t('step6.title')}
                </h3>
                <p style={{ color: '#666666' }}>{t('step6.subtitle')}</p>
              </div>

              <div className="p-6 rounded-xl" style={{ backgroundColor: '#F5F0E8' }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <div className="text-sm" style={{ color: '#666666' }}>{t('step6.company')}</div>
                    <div className="font-semibold" style={{ color: '#1F3C58' }}>{data.companyName}</div>
                </div>
                <div>
                    <div className="text-sm" style={{ color: '#666666' }}>{t('step6.industry')}</div>
                    <div className="font-semibold" style={{ color: '#1F3C58' }}>
                    {industries.find(i => i.value === data.industry)?.label}
                  </div>
                </div>
                <div>
                    <div className="text-sm" style={{ color: '#666666' }}>{t('step6.revenue')}</div>
                    <div className="font-semibold" style={{ color: '#1F3C58' }}>
                    {data.exactRevenue ? `${(Number(data.exactRevenue) / 1000000).toFixed(2)} MSEK` : t('step6.notSpecified')}
                  </div>
                </div>
                <div>
                    <div className="text-sm" style={{ color: '#666666' }}>{t('step6.ebitda')}</div>
                    <div className="font-semibold" style={{ color: '#1F3C58' }}>
                    {(() => {
                      const revenue = Number(data.exactRevenue) || 0
                      const salaries = Number(data.salaries) || 0
                      const rent = Number(data.rentCosts) || 0
                      const marketing = Number(data.marketingCosts) || 0
                      const other = Number(data.otherOperatingCosts) || 0
                      const totalCosts = salaries + rent + marketing + other
                      return revenue > 0 && totalCosts > 0
                        ? `${((revenue - totalCosts) / 1000000).toFixed(2)} MSEK`
                        : t('step6.notSpecified')
                    })()}
                  </div>
                </div>
                <div>
                    <div className="text-sm" style={{ color: '#666666' }}>{t('step6.employees')}</div>
                    <div className="font-semibold" style={{ color: '#1F3C58' }}>{data.employees}</div>
                </div>
                  <div>
                    <div className="text-sm" style={{ color: '#666666' }}>{t('step6.companyAge')}</div>
                    <div className="font-semibold" style={{ color: '#1F3C58' }}>{data.companyAge} {t('step6.years')}</div>
                  </div>
                  </div>
              </div>

              <div className="p-4 rounded-xl border" style={{ borderColor: '#FFD700', backgroundColor: '#FFFACD' }}>
                <p className="text-sm" style={{ color: '#666666' }}>
                  <strong>{t('step6.note')}</strong> {t('step6.noteText')}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer - Fixed */}
        <div className="px-6 md:px-8 py-4 md:py-6 border-t border-gray-100 flex-shrink-0">
          <div className="flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={step === 1}
              className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('step6.back')}
          </button>

          <button
            onClick={handleNext}
            disabled={!canProceed() || isSubmitting}
              className="flex items-center px-6 py-3 font-medium text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              style={{ 
                backgroundColor: canProceed() && !isSubmitting ? '#FF69B4' : '#D1D5DB',
              }}
          >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  {t('loading.analyzing').replace('...', '')}
                </>
              ) : step === totalSteps ? (
                <>
                  {t('step6.getValuation')}
                  <TrendingUp className="w-4 h-4 ml-2" />
                </>
              ) : (
                <>
                  {t('step6.next')}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
          </button>
          </div>
        </div>
      </div>
    </div>
  )
}