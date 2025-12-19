'use client'

import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

// Skapa stilar för PDF med mörkblå tema (#1F3C58)
const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: '#FFFFFF',
    fontFamily: 'Helvetica',
    fontSize: 11,
    lineHeight: 1.5,
  },
  // Header med mörkblå accent
  header: {
    marginBottom: 30,
    paddingBottom: 15,
    borderBottom: '2 solid #1F3C58',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F3C58',
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 10,
    color: '#666666',
    marginLeft: 12,
    fontStyle: 'italic',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1F3C58',
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 5,
  },
  date: {
    fontSize: 10,
    color: '#999999',
  },
  // Huvudvärderingsbox med mörkblå accent
  valuationBox: {
    backgroundColor: '#FFFFFF',
    padding: 30,
    borderRadius: 8,
    marginBottom: 25,
    border: '3 solid #1F3C58',
  },
  valuationLabel: {
    fontSize: 12,
    marginBottom: 10,
    color: '#1F3C58',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  valuationAmount: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#1F3C58',
    marginBottom: 8,
  },
  valuationRange: {
    fontSize: 14,
    color: '#666666',
  },
  // Mjuka vita boxar för sektioner
  section: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 6,
    marginBottom: 18,
    border: '1 solid #E5E5E5',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F3C58',
    marginBottom: 12,
  },
  // Metodologi box
  methodBox: {
    backgroundColor: '#F5F0E8',
    padding: 15,
    borderRadius: 6,
    marginBottom: 12,
    borderLeft: '4 solid #1F3C58',
  },
  methodTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#1F3C58',
  },
  methodText: {
    fontSize: 11,
    color: '#333333',
    lineHeight: 1.6,
  },
  // Metrics grid
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  metricBox: {
    width: '48%',
    backgroundColor: '#F9F9F9',
    padding: 12,
    borderRadius: 5,
    marginBottom: 10,
    marginRight: '2%',
    border: '1 solid #E5E5E5',
  },
  metricLabel: {
    fontSize: 9,
    color: '#666666',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1F3C58',
  },
  // Listor
  listItem: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingLeft: 5,
  },
  bullet: {
    width: 20,
    fontSize: 12,
    color: '#1F3C58',
  },
  listText: {
    flex: 1,
    fontSize: 11,
    color: '#333333',
    lineHeight: 1.5,
  },
  // Rekommendationer
  recommendation: {
    marginBottom: 15,
    padding: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    borderLeft: '4 solid #1F3C58',
    border: '1 solid #E5E5E5',
  },
  recHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  recTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1F3C58',
    flex: 1,
  },
  recDescription: {
    fontSize: 11,
    color: '#333333',
    lineHeight: 1.6,
  },
  impactBadge: {
    fontSize: 9,
    fontWeight: 'bold',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 3,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  impactHigh: {
    backgroundColor: '#FFE5E5',
    color: '#CC0000',
  },
  impactMedium: {
    backgroundColor: '#FFF4E5',
    color: '#CC6600',
  },
  impactLow: {
    backgroundColor: '#E5F0FF',
    color: '#1F3C58',
  },
  // Sidnumrering
  pageNumber: {
    position: 'absolute',
    bottom: 25,
    right: 40,
    fontSize: 9,
    color: '#999999',
  },
  // Footer/Disclaimer
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    paddingTop: 12,
    borderTop: '1 solid #E5E5E5',
  },
  disclaimer: {
    fontSize: 9,
    color: '#666666',
    lineHeight: 1.4,
    textAlign: 'center',
  },
  // Marknadsanalys box
  analysisBox: {
    backgroundColor: '#F9F9F9',
    padding: 15,
    borderRadius: 6,
    marginBottom: 12,
    border: '1 solid #E5E5E5',
  },
  analysisText: {
    fontSize: 11,
    color: '#333333',
    lineHeight: 1.6,
  },
  // SWOT specifika stilar
  swotContainer: {
    marginBottom: 18,
  },
  swotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  swotBox: {
    width: '48%',
    marginBottom: 15,
    marginRight: '2%',
    padding: 12,
    backgroundColor: '#F9F9F9',
    borderRadius: 6,
    border: '1 solid #E5E5E5',
  },
  swotTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1F3C58',
    paddingBottom: 6,
    borderBottom: '2 solid #E5E5E5',
  },
  qualityIndicator: {
    padding: 12,
    borderRadius: 6,
    marginBottom: 18,
    borderLeft: '4 solid',
  },
  qualityText: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  qualityDesc: {
    fontSize: 9,
    lineHeight: 1.4,
  },
})

interface ValuationPDFProps {
  companyName: string
  result: any
  generatedAt: string
  companyInfo?: {
    orgNumber?: string
    website?: string
    email?: string
    phone?: string
    address?: string
    industry?: string
    employees?: string
  }
  hasExactFinancials?: boolean
}

export default function ValuationPDF({ companyName, result, generatedAt, companyInfo, hasExactFinancials = false }: ValuationPDFProps) {
  // Funktion för att få rätt stil för impact badge
  const getImpactStyle = (impact: string) => {
    switch(impact) {
      case 'high': return { ...styles.impactBadge, ...styles.impactHigh }
      case 'medium': return { ...styles.impactBadge, ...styles.impactMedium }
      case 'low': return { ...styles.impactBadge, ...styles.impactLow }
      default: return styles.impactBadge
    }
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logo}>BOLAXO</Text>
            <Text style={styles.tagline}>AI-driven företagsvärdering</Text>
          </View>
          <Text style={styles.title}>Värderingsrapport</Text>
          <Text style={styles.subtitle}>{companyName}</Text>
          <Text style={styles.date}>Genererad: {generatedAt}</Text>
        </View>

        {/* Huvudvärdering */}
        <View style={styles.valuationBox}>
          <Text style={styles.valuationLabel}>
            Uppskattat företagsvärde
          </Text>
          <Text style={styles.valuationAmount}>
            {(result.valuationRange.mostLikely / 1000000).toFixed(1)} MSEK
          </Text>
          <Text style={styles.valuationRange}>
            Värderingsintervall: {(result.valuationRange.min / 1000000).toFixed(1)} - {(result.valuationRange.max / 1000000).toFixed(1)} MSEK
          </Text>
        </View>

        {/* Data quality indicator */}
        <View style={{
          ...styles.qualityIndicator,
          backgroundColor: hasExactFinancials ? '#E8F5E9' : '#FFF8E1',
          borderLeftColor: hasExactFinancials ? '#4CAF50' : '#FFC107',
        }}>
          <Text style={{
            ...styles.qualityText,
            color: hasExactFinancials ? '#2E7D32' : '#F57C00',
          }}>
            {hasExactFinancials ? '✓ Baserat på exakta finansiella siffror' : '⚠ Baserat på uppskattningar'}
          </Text>
          <Text style={{
            ...styles.qualityDesc,
            color: hasExactFinancials ? '#388E3C' : '#E65100',
          }}>
            {hasExactFinancials 
              ? 'Värderingen baseras på faktisk omsättning och rörelsekostnader, vilket ger högre precision.'
              : 'Värderingen baseras på intervalluppskattningar. För mer exakt värdering, ange exakta finansiella siffror.'
            }
          </Text>
        </View>

        {/* Värderingsmetod */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Värderingsmetod</Text>
          <View style={styles.analysisBox}>
            <Text style={styles.analysisText}>{result.method}</Text>
          </View>
        </View>

        {/* Metodologi */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Beräkningsunderlag</Text>
          
          {result.methodology.multipel && (
            <View style={styles.methodBox}>
              <Text style={styles.methodTitle}>Multipelvärdering</Text>
              <Text style={styles.methodText}>{result.methodology.multipel}</Text>
            </View>
          )}
          
          {result.methodology.avkastningskrav && (
            <View style={styles.methodBox}>
              <Text style={styles.methodTitle}>Avkastningsvärdering</Text>
              <Text style={styles.methodText}>{result.methodology.avkastningskrav}</Text>
            </View>
          )}
          
          {result.methodology.substans && (
            <View style={styles.methodBox}>
              <Text style={styles.methodTitle}>Substansvärde / Kontroll</Text>
              <Text style={styles.methodText}>{result.methodology.substans}</Text>
            </View>
          )}
        </View>

        {/* Nyckeltal */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nyckeltal</Text>
          <View style={styles.metricsGrid}>
            {result.keyMetrics?.map((metric: any, i: number) => (
              <View key={i} style={styles.metricBox}>
                <Text style={styles.metricLabel}>{metric.label}</Text>
                <Text style={styles.metricValue}>{metric.value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Företagsinformation om tillgänglig */}
        {companyInfo && Object.keys(companyInfo).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Företagsinformation</Text>
            <View style={styles.metricsGrid}>
              {companyInfo.orgNumber && (
                <View style={styles.metricBox}>
                  <Text style={styles.metricLabel}>Organisationsnummer</Text>
                  <Text style={styles.metricValue}>{companyInfo.orgNumber}</Text>
                </View>
              )}
              {companyInfo.industry && (
                <View style={styles.metricBox}>
                  <Text style={styles.metricLabel}>Bransch</Text>
                  <Text style={styles.metricValue}>{companyInfo.industry}</Text>
                </View>
              )}
              {companyInfo.employees && (
                <View style={styles.metricBox}>
                  <Text style={styles.metricLabel}>Antal anställda</Text>
                  <Text style={styles.metricValue}>{companyInfo.employees}</Text>
                </View>
              )}
              {companyInfo.website && (
                <View style={styles.metricBox}>
                  <Text style={styles.metricLabel}>Webbplats</Text>
                  <Text style={styles.metricValue}>{companyInfo.website.replace(/^https?:\/\//, '')}</Text>
                </View>
              )}
            </View>
            {(companyInfo.email || companyInfo.phone || companyInfo.address) && (
              <View style={{ marginTop: 10 }}>
                {companyInfo.address && (
                  <Text style={{ ...styles.methodText, marginBottom: 3 }}>Adress: {companyInfo.address}</Text>
                )}
                {companyInfo.email && (
                  <Text style={{ ...styles.methodText, marginBottom: 3 }}>E-post: {companyInfo.email}</Text>
                )}
                {companyInfo.phone && (
                  <Text style={styles.methodText}>Telefon: {companyInfo.phone}</Text>
                )}
              </View>
            )}
          </View>
        )}

        {/* Sidnummer */}
        <Text style={styles.pageNumber}>Sida 1 av 3</Text>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.disclaimer}>
            Detta är en indikativ värdering baserad på AI-analys och tillgänglig publik information. 
            För bindande värdering, kontakta auktoriserad värderare.
          </Text>
        </View>
      </Page>

      {/* Sida 2: SWOT-analys */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logo}>BOLAXO</Text>
          </View>
          <Text style={styles.title}>Företagsanalys</Text>
          <Text style={styles.subtitle}>{companyName}</Text>
        </View>

        <View style={styles.swotContainer}>
          <View style={styles.swotGrid}>
            {/* Styrkor */}
            <View style={styles.swotBox}>
              <Text style={{ ...styles.swotTitle, color: '#1F3C58' }}>Styrkor</Text>
              {result.analysis.strengths.slice(0, 4).map((item: string, i: number) => (
                <View key={i} style={styles.listItem}>
                  <Text style={{ ...styles.bullet, color: '#1F3C58' }}>•</Text>
                  <Text style={styles.listText}>{item}</Text>
                </View>
              ))}
            </View>

            {/* Svagheter */}
            <View style={styles.swotBox}>
              <Text style={{ ...styles.swotTitle, color: '#1F3C58' }}>Svagheter</Text>
              {result.analysis.weaknesses.slice(0, 4).map((item: string, i: number) => (
                <View key={i} style={styles.listItem}>
                  <Text style={{ ...styles.bullet, color: '#1F3C58' }}>•</Text>
                  <Text style={styles.listText}>{item}</Text>
                </View>
              ))}
            </View>

            {/* Möjligheter */}
            <View style={styles.swotBox}>
              <Text style={{ ...styles.swotTitle, color: '#1F3C58' }}>Möjligheter</Text>
              {result.analysis.opportunities.slice(0, 4).map((item: string, i: number) => (
                <View key={i} style={styles.listItem}>
                  <Text style={{ ...styles.bullet, color: '#1F3C58' }}>•</Text>
                  <Text style={styles.listText}>{item}</Text>
                </View>
              ))}
            </View>

            {/* Risker */}
            <View style={styles.swotBox}>
              <Text style={{ ...styles.swotTitle, color: '#1F3C58' }}>Risker</Text>
              {result.analysis.risks.slice(0, 4).map((item: string, i: number) => (
                <View key={i} style={styles.listItem}>
                  <Text style={{ ...styles.bullet, color: '#1F3C58' }}>•</Text>
                  <Text style={styles.listText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Marknadsanalys */}
        {result.marketComparison && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Marknadsposition</Text>
            <View style={styles.analysisBox}>
              <Text style={styles.analysisText}>{result.marketComparison}</Text>
            </View>
          </View>
        )}

        {/* Sidnummer */}
        <Text style={styles.pageNumber}>Sida 2 av 3</Text>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.disclaimer}>
            BOLAXO © 2025 | info@bolaxo.com | www.bolaxo.com
          </Text>
        </View>
      </Page>

      {/* Sida 3: Rekommendationer och nästa steg */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logo}>BOLAXO</Text>
          </View>
          <Text style={styles.title}>Rekommendationer för värdeökning</Text>
          <Text style={styles.subtitle}>{companyName}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Prioriterade åtgärder</Text>
          {result.recommendations?.map((rec: any, i: number) => (
            <View key={i} style={styles.recommendation}>
              <View style={styles.recHeader}>
                <Text style={styles.recTitle}>{i + 1}. {rec.title}</Text>
                <Text style={getImpactStyle(rec.impact)}>
                  {rec.impact === 'high' ? 'HÖG PRIORITET' : rec.impact === 'medium' ? 'MEDEL' : 'LÅG'}
                </Text>
              </View>
              <Text style={styles.recDescription}>{rec.description}</Text>
            </View>
          ))}
        </View>

        {/* Nästa steg */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nästa steg</Text>
          <View style={styles.methodBox}>
            <Text style={styles.methodTitle}>1. Förbered för försäljning</Text>
            <Text style={styles.methodText}>
              Implementera rekommendationerna ovan för att maximera företagets värde innan försäljning.
            </Text>
          </View>
          <View style={styles.methodBox}>
            <Text style={styles.methodTitle}>2. Professionell rådgivning</Text>
            <Text style={styles.methodText}>
              Överväg att anlita en M&A-rådgivare för att optimera försäljningsprocessen och säkerställa bästa möjliga utfall.
            </Text>
          </View>
          <View style={styles.methodBox}>
            <Text style={styles.methodTitle}>3. Publicera på BOLAXO</Text>
            <Text style={styles.methodText}>
              Lista ditt företag på BOLAXO för att nå kvalificerade köpare och få en transparent försäljningsprocess.
            </Text>
          </View>
        </View>

        {/* Sidnummer */}
        <Text style={styles.pageNumber}>Sida 3 av 3</Text>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.disclaimer}>
            Denna rapport är konfidentiell och avsedd endast för mottagaren. Spridning utan tillstånd är förbjuden.
          </Text>
        </View>
      </Page>
    </Document>
  )
}