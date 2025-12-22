'use client'

import React from 'react'
import { Document, Page, Text, View, StyleSheet, Font, PDFViewer } from '@react-pdf/renderer'

// Registrera typsnitt
Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxP.ttf', fontWeight: 'normal' },
    { src: 'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlfBBc9.ttf', fontWeight: 'bold' },
  ],
})

// Stilar
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Roboto',
    fontSize: 11,
    padding: 40,
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 20,
    borderBottom: '2 solid #1F3C58',
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F3C58',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 3,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F3C58',
    marginBottom: 10,
    paddingBottom: 5,
    borderBottom: '1 solid #e5e7eb',
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 5,
    marginTop: 10,
  },
  text: {
    fontSize: 11,
    lineHeight: 1.6,
    color: '#333333',
    marginBottom: 5,
  },
  valuationBox: {
    backgroundColor: '#F5F8FA',
    padding: 20,
    borderRadius: 8,
    marginBottom: 20,
    border: '1 solid #1F3C58',
  },
  valuationAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F3C58',
    marginBottom: 5,
  },
  valuationRange: {
    fontSize: 14,
    color: '#666666',
  },
  table: {
    marginTop: 10,
    marginBottom: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1 solid #e5e7eb',
    paddingVertical: 5,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottom: '2 solid #1F3C58',
    paddingBottom: 5,
    marginBottom: 5,
  },
  tableCell: {
    flex: 1,
    paddingRight: 10,
  },
  tableCellHeader: {
    flex: 1,
    fontWeight: 'bold',
    color: '#1F3C58',
  },
  bullet: {
    fontSize: 11,
    lineHeight: 1.6,
    marginBottom: 3,
    paddingLeft: 15,
  },
  pageNumber: {
    position: 'absolute',
    fontSize: 10,
    bottom: 30,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: '#666666',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    fontSize: 9,
    color: '#999999',
    textAlign: 'center',
    borderTop: '1 solid #e5e7eb',
    paddingTop: 10,
  },
  badge: {
    backgroundColor: '#22c55e',
    color: 'white',
    padding: '3 8',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 'bold',
    marginRight: 10,
  },
  riskBadge: {
    padding: '3 8',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 'bold',
    marginRight: 10,
  },
  highRisk: {
    backgroundColor: '#ef4444',
    color: 'white',
  },
  mediumRisk: {
    backgroundColor: '#f59e0b',
    color: 'white',
  },
  lowRisk: {
    backgroundColor: '#22c55e',
    color: 'white',
  },
})

interface PremiumValuationPDFProps {
  companyName: string
  result: any
  generatedAt: string
}

const PremiumValuationPDF: React.FC<PremiumValuationPDFProps> = ({
  companyName,
  result,
  generatedAt,
}) => {
  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)} MSEK`
    }
    return `${value.toLocaleString('sv-SE')} kr`
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return styles.highRisk
      case 'medium': return styles.mediumRisk
      case 'low': return styles.lowRisk
      default: return styles.lowRisk
    }
  }

  return (
    <Document>
      {/* Framsida */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Professionell Företagsvärdering</Text>
          <Text style={styles.subtitle}>{companyName}</Text>
          <Text style={styles.subtitle}>{generatedAt}</Text>
        </View>

        <View style={styles.valuationBox}>
          <Text style={styles.valuationAmount}>
            {formatCurrency(result.valuation.range.mostLikely)}
          </Text>
          <Text style={styles.valuationRange}>
            Intervall: {formatCurrency(result.valuation.range.min)} - {formatCurrency(result.valuation.range.max)}
          </Text>
          <Text style={styles.text}>
            Säkerhet: {(result.valuation.range.confidence * 100).toFixed(0)}%
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sammanfattning</Text>
          <Text style={styles.text}>{result.executiveSummary}</Text>
        </View>

        <Text style={styles.pageNumber}>1</Text>
      </Page>

      {/* Värderingsmetodik */}
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Värderingsmetodik</Text>
          
          <Text style={styles.subsectionTitle}>Primär metod</Text>
          <Text style={styles.text}>{result.valuation.methodology.primary}</Text>
          
          <Text style={styles.subsectionTitle}>Sekundär metod</Text>
          <Text style={styles.text}>{result.valuation.methodology.secondary}</Text>
          
          <Text style={styles.subsectionTitle}>Förklaring</Text>
          <Text style={styles.text}>{result.valuation.methodology.explanation}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Värderingsjusteringar</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableCellHeader}>Typ</Text>
              <Text style={styles.tableCellHeader}>Påverkan</Text>
              <Text style={styles.tableCellHeader}>Motivering</Text>
            </View>
            {result.valuation.adjustments.map((adj: any, index: number) => (
              <View style={styles.tableRow} key={index}>
                <Text style={styles.tableCell}>{adj.type}</Text>
                <Text style={styles.tableCell}>{formatCurrency(adj.impact)}</Text>
                <Text style={styles.tableCell}>{adj.reason}</Text>
              </View>
            ))}
          </View>
        </View>

        <Text style={styles.pageNumber}>2</Text>
      </Page>

      {/* DD-resultat */}
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Due Diligence-resultat</Text>
          
          <Text style={styles.subsectionTitle}>Styrkor ({result.ddFindings.strengths.length})</Text>
          {result.ddFindings.strengths.map((item: string, index: number) => (
            <Text style={styles.bullet} key={index}>• {item}</Text>
          ))}
          
          <Text style={styles.subsectionTitle}>Svagheter ({result.ddFindings.weaknesses.length})</Text>
          {result.ddFindings.weaknesses.map((item: string, index: number) => (
            <Text style={styles.bullet} key={index}>• {item}</Text>
          ))}
        </View>

        <Text style={styles.pageNumber}>3</Text>
      </Page>

      {/* Röda flaggor */}
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Röda flaggor</Text>
          {result.ddFindings.redFlags.map((flag: any, index: number) => (
            <View key={index} style={{ marginBottom: 15 }}>
              <View style={{ flexDirection: 'row', marginBottom: 5 }}>
                <Text style={[styles.riskBadge, getRiskColor(flag.severity)]}>
                  {flag.severity.toUpperCase()}
                </Text>
                <Text style={styles.subsectionTitle}>{flag.area}</Text>
              </View>
              <Text style={styles.text}>{flag.description}</Text>
              <Text style={[styles.text, { fontStyle: 'italic' }]}>
                Åtgärd: {flag.mitigation}
              </Text>
            </View>
          ))}
        </View>

        <Text style={styles.pageNumber}>4</Text>
      </Page>

      {/* Finansiell analys */}
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Finansiell analys</Text>
          
          <Text style={styles.subsectionTitle}>Historisk prestation</Text>
          <Text style={styles.text}>
            Omsättningstillväxt (CAGR): {result.financialAnalysis.historicalPerformance.revenue.cagr}%
          </Text>
          <Text style={styles.text}>
            {result.financialAnalysis.historicalPerformance.revenue.analysis}
          </Text>
          
          <Text style={styles.subsectionTitle}>Projektioner</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableCellHeader}>Scenario</Text>
              <Text style={styles.tableCellHeader}>År 1</Text>
              <Text style={styles.tableCellHeader}>År 2</Text>
              <Text style={styles.tableCellHeader}>År 3</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableCell}>Bästa fall</Text>
              <Text style={styles.tableCell}>{formatCurrency(result.financialAnalysis.projections.bestCase.year1)}</Text>
              <Text style={styles.tableCell}>{formatCurrency(result.financialAnalysis.projections.bestCase.year2)}</Text>
              <Text style={styles.tableCell}>{formatCurrency(result.financialAnalysis.projections.bestCase.year3)}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { fontWeight: 'bold' }]}>Basfall</Text>
              <Text style={[styles.tableCell, { fontWeight: 'bold' }]}>{formatCurrency(result.financialAnalysis.projections.baseCase.year1)}</Text>
              <Text style={[styles.tableCell, { fontWeight: 'bold' }]}>{formatCurrency(result.financialAnalysis.projections.baseCase.year2)}</Text>
              <Text style={[styles.tableCell, { fontWeight: 'bold' }]}>{formatCurrency(result.financialAnalysis.projections.baseCase.year3)}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableCell}>Sämsta fall</Text>
              <Text style={styles.tableCell}>{formatCurrency(result.financialAnalysis.projections.worstCase.year1)}</Text>
              <Text style={styles.tableCell}>{formatCurrency(result.financialAnalysis.projections.worstCase.year2)}</Text>
              <Text style={styles.tableCell}>{formatCurrency(result.financialAnalysis.projections.worstCase.year3)}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.pageNumber}>5</Text>
      </Page>

      {/* Förhandlingsstrategi */}
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Förhandlingsstrategi</Text>
          
          <Text style={styles.subsectionTitle}>Optimal tidpunkt</Text>
          <Text style={styles.text}>{result.transactionGuidance.optimalTiming}</Text>
          
          <Text style={styles.subsectionTitle}>Köparprofiler</Text>
          {result.transactionGuidance.buyerProfile.map((profile: string, index: number) => (
            <Text style={styles.bullet} key={index}>• {profile}</Text>
          ))}
          
          <Text style={styles.subsectionTitle}>Rekommenderad affärsstruktur</Text>
          <Text style={styles.text}>{result.transactionGuidance.dealStructure.recommended}</Text>
          
          {result.transactionGuidance.dealStructure.earnOut.recommended && (
            <>
              <Text style={styles.subsectionTitle}>Earn-out struktur</Text>
              <Text style={styles.text}>{result.transactionGuidance.dealStructure.earnOut.structure}</Text>
            </>
          )}
        </View>

        <Text style={styles.pageNumber}>6</Text>
      </Page>

      {/* Handlingsplan */}
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Handlingsplan</Text>
          
          <Text style={styles.subsectionTitle}>Åtgärder före försäljning</Text>
          {result.actionPlan.preSale.map((action: any, index: number) => (
            <View key={index} style={{ marginBottom: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={[
                  styles.riskBadge, 
                  action.priority === 'high' ? styles.highRisk : 
                  action.priority === 'medium' ? styles.mediumRisk : 
                  styles.lowRisk
                ]}>
                  {action.priority.toUpperCase()}
                </Text>
                <Text style={[styles.text, { fontWeight: 'bold' }]}>{action.action}</Text>
              </View>
              <Text style={styles.text}>Tidsram: {action.timeframe} | Ansvarig: {action.responsibleParty}</Text>
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <Text>
            Detta dokument är konfidentiellt och endast för intern användning.
            © {new Date().getFullYear()} BOLAXO. Alla rättigheter förbehållna.
          </Text>
        </View>

        <Text style={styles.pageNumber}>7</Text>
      </Page>
    </Document>
  )
}

export default PremiumValuationPDF
