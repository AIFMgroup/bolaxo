import PDFDocument from 'pdfkit';
import { Readable } from 'stream';

type PDFDocumentType = InstanceType<typeof PDFDocument>;

interface TeaserData {
  companyName: string;
  industry: string;
  founded: number;
  employees: number;
  revenue: string;
  ebitdaMargin: string;
  products: string;
  geography: string;
  whySelling: string;
  futureNutential: string;
  normalizedEBITDA?: number;
  yearlyFinancials?: Array<{
    year: number;
    revenue: number;
    ebitda: number;
    ebit: number;
  }>;
  createdAt?: Date;
}

interface IMData extends TeaserData {
  marketSize?: string;
  competitiveAdvantage?: string;
  teamDescription?: string;
  risks?: string;
  opportunities?: string;
  keyEmployees?: Array<{ name: string; role: string }>;
  customers?: Array<{ name: string; revenue: string }>;
  strategicInitiatives?: string;
}

export async function generateTeaserPDF(data: TeaserData, buyerEmail?: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        bufferPages: true,
      });

      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Set metadata
      doc.info.Title = `${data.companyName} - Teaser`;
      doc.info.Subject = 'Confidential Business Overview';
      doc.info.Author = 'Afterfounder';
      doc.info.Creator = 'Afterfounder SME Automation';

      // PAGE 1: Cover page
      addCoverPage(doc, data, 'TEASER');

      // PAGE 2: Company Overview
      doc.addPage();
      addCompanyOverview(doc, data);

      // PAGE 3: Financial Highlights
      doc.addPage();
      addFinancialHighlights(doc, data);

      // Add watermark on all pages
      addWatermark(doc, buyerEmail);

      // Finalize
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

export async function generateIMPDF(data: IMData, buyerEmail?: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        bufferPages: true,
      });

      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Set metadata
      doc.info.Title = `${data.companyName} - Information Memorandum`;
      doc.info.Subject = 'Confidential Information Memorandum';
      doc.info.Author = 'Afterfounder';
      doc.info.Creator = 'Afterfounder SME Automation';

      // PAGE 1: Cover
      addCoverPage(doc, data, 'INFORMATION MEMORANDUM');

      // PAGE 2: Table of Contents
      doc.addPage();
      addTableOfContents(doc);

      // PAGE 3: Executive Summary
      doc.addPage();
      addExecutiveSummary(doc, data);

      // PAGE 4: Company Description
      doc.addPage();
      addCompanyDescription(doc, data);

      // PAGE 5: Market & Opportunity
      doc.addPage();
      addMarketOpportunity(doc, data);

      // PAGE 6: Financial Performance (3-5 years)
      if (data.yearlyFinancials && data.yearlyFinancials.length > 0) {
        doc.addPage();
        addFinancialAnalysis(doc, data);
      }

      // PAGE 7: Management & Team
      doc.addPage();
      addManagementTeam(doc, data);

      // PAGE 8: Growth Opportunities
      doc.addPage();
      addGrowthOpportunities(doc, data);

      // PAGE 9: Risk Assessment
      doc.addPage();
      addRiskAssessment(doc, data);

      // PAGE 10: Appendix
      doc.addPage();
      addAppendix(doc, data);

      // Add watermark to all pages
      addWatermark(doc, buyerEmail);

      // Finalize
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

function addCoverPage(doc: PDFDocumentType, data: TeaserData, type: string): void {
  // Background color
  doc.rect(0, 0, doc.page.width, doc.page.height).fill('#0f172a');

  // Title
  doc.font('Helvetica-Bold');
  doc.fontSize(48);
  doc.fillColor('#ffffff');
  doc.text(data.companyName, 50, 150, {
    width: doc.page.width - 100,
    align: 'center',
  });

  // Subtitle
  doc.fontSize(24);
  doc.fillColor('#94a3b8');
  doc.text(type, 50, 250, {
    width: doc.page.width - 100,
    align: 'center',
  });

  // Company info
  doc.fontSize(14);
  doc.fillColor('#cbd5e1');
  const infoY = 350;
  doc.text(`Industry: ${data.industry}`, 50, infoY);
  doc.text(`Founded: ${data.founded}`, 50, infoY + 25);
  doc.text(`Employees: ${data.employees}`, 50, infoY + 50);

  // Footer
  doc.fontSize(10);
  doc.fillColor('#64748b');
  const dateStr = data.createdAt ? new Date(data.createdAt).toLocaleDateString('sv-SE') : new Date().toLocaleDateString('sv-SE');
  doc.text(`Document created: ${dateStr}`, 50, doc.page.height - 80);
  doc.text('CONFIDENTIAL - For authorized recipients only', 50, doc.page.height - 60);
}

function addTableOfContents(doc: PDFDocumentType): void {
  doc.fontSize(24);
  doc.fillColor('#0f172a');
  doc.font('Helvetica-Bold');
  doc.text('Table of Contents', 50, 50);

  doc.fontSize(12);
  doc.font('Helvetica');
  doc.fillColor('#1e293b');

  const items = [
    '1. Executive Summary',
    '2. Company Description',
    '3. Market & Opportunity',
    '4. Financial Performance',
    '5. Management & Team',
    '6. Growth Opportunities',
    '7. Risk Assessment',
    '8. Appendix',
  ];

  let y = 100;
  items.forEach((item) => {
    doc.text(item, 70, y);
    y += 25;
  });
}

function addExecutiveSummary(doc: PDFDocumentType, data: IMData): void {
  doc.fontSize(20);
  doc.font('Helvetica-Bold');
  doc.fillColor('#0f172a');
  doc.text('Executive Summary', 50, 50);

  doc.fontSize(12);
  doc.font('Helvetica');
  doc.fillColor('#1e293b');

  const summary = `
${data.companyName} is a ${data.industry} company founded in ${data.founded} with ${data.employees} employees and annual revenue of approximately ${data.revenue}.

The company operates in ${data.geography} and specializes in ${data.products}.

Key Financial Metrics:
• Revenue: ${data.revenue}
• Normalized EBITDA Margin: ${data.ebitdaMargin}
• Growth Opportunity: Significant
• Market Position: ${data.competitiveAdvantage || 'Strong'}

Rationale for Sale:
${data.whySelling}

Future Potential:
${data.futureNutential}
  `.trim();

  doc.text(summary, 50, 120, {
    width: doc.page.width - 100,
    align: 'left',
    lineGap: 5,
  });
}

function addCompanyOverview(doc: PDFDocumentType, data: TeaserData): void {
  doc.fontSize(16);
  doc.font('Helvetica-Bold');
  doc.fillColor('#0f172a');
  doc.text('Company Overview', 50, 50);

  doc.fontSize(11);
  doc.font('Helvetica');
  doc.fillColor('#1e293b');

  const metrics = [
    { label: 'Company Name', value: data.companyName },
    { label: 'Industry', value: data.industry },
    { label: 'Founded', value: data.founded.toString() },
    { label: 'Employees', value: data.employees.toString() },
    { label: 'Annual Revenue', value: data.revenue },
    { label: 'EBITDA Margin', value: data.ebitdaMargin },
    { label: 'Geography', value: data.geography },
    { label: 'Primary Products/Services', value: data.products },
  ];

  let y = 100;
  metrics.forEach(({ label, value }) => {
    doc.font('Helvetica-Bold');
    doc.text(`${label}:`, 70, y);
    doc.font('Helvetica');
    doc.text(value, 200, y);
    y += 20;
  });
}

function addCompanyDescription(doc: PDFDocumentType, data: IMData): void {
  doc.fontSize(18);
  doc.font('Helvetica-Bold');
  doc.fillColor('#0f172a');
  doc.text('2. Company Description', 50, 50);

  doc.fontSize(12);
  doc.font('Helvetica');
  doc.fillColor('#1e293b');

  doc.text(data.products, 50, 100, {
    width: doc.page.width - 100,
    lineGap: 5,
  });
}

function addFinancialHighlights(doc: PDFDocumentType, data: TeaserData): void {
  doc.fontSize(16);
  doc.font('Helvetica-Bold');
  doc.fillColor('#0f172a');
  doc.text('Financial Highlights', 50, 50);

  doc.fontSize(11);
  doc.font('Helvetica');
  doc.fillColor('#1e293b');

  doc.text(`Annual Revenue: ${data.revenue}`, 70, 100);
  doc.text(`EBITDA Margin: ${data.ebitdaMargin}`, 70, 125);
  if (data.normalizedEBITDA) {
    doc.text(`Normalized EBITDA: ${(data.normalizedEBITDA / 1000000).toFixed(1)} MSEK`, 70, 150);
  }

  doc.fontSize(10);
  doc.fillColor('#475569');
  doc.text('Note: See detailed financial analysis in full IM for 3-5 year history', 70, 200);
}

function addFinancialAnalysis(doc: PDFDocumentType, data: IMData): void {
  doc.fontSize(18);
  doc.font('Helvetica-Bold');
  doc.fillColor('#0f172a');
  doc.text('4. Financial Performance', 50, 50);

  doc.fontSize(11);
  doc.font('Helvetica');
  doc.fillColor('#1e293b');

  // Table header
  doc.font('Helvetica-Bold');
  doc.text('Year', 70, 110);
  doc.text('Revenue', 150, 110);
  doc.text('EBITDA', 230, 110);
  doc.text('EBIT', 310, 110);

  // Table rows
  doc.font('Helvetica');
  let y = 135;
  data.yearlyFinancials?.forEach((year) => {
    doc.text(year.year.toString(), 70, y);
    doc.text(`${(year.revenue / 1000000).toFixed(1)} MSEK`, 150, y);
    doc.text(`${(year.ebitda / 1000000).toFixed(1)} MSEK`, 230, y);
    doc.text(`${(year.ebit / 1000000).toFixed(1)} MSEK`, 310, y);
    y += 25;
  });
}

function addMarketOpportunity(doc: PDFDocumentType, data: IMData): void {
  doc.fontSize(18);
  doc.font('Helvetica-Bold');
  doc.fillColor('#0f172a');
  doc.text('3. Market & Opportunity', 50, 50);

  doc.fontSize(12);
  doc.font('Helvetica');
  doc.fillColor('#1e293b');

  const text = `
Market Size: ${data.marketSize || 'Significant market opportunity'}

Competitive Advantage:
${data.competitiveAdvantage || 'Strong market position with differentiated offerings'}

Growth Opportunities:
${data.opportunities || 'Multiple expansion and optimization opportunities'}
  `.trim();

  doc.text(text, 50, 100, {
    width: doc.page.width - 100,
    lineGap: 5,
  });
}

function addManagementTeam(doc: PDFDocumentType, data: IMData): void {
  doc.fontSize(18);
  doc.font('Helvetica-Bold');
  doc.fillColor('#0f172a');
  doc.text('5. Management & Team', 50, 50);

  doc.fontSize(12);
  doc.font('Helvetica');
  doc.fillColor('#1e293b');

  if (data.keyEmployees && data.keyEmployees.length > 0) {
    let y = 100;
    data.keyEmployees.forEach(({ name, role }) => {
      doc.font('Helvetica-Bold');
      doc.text(name, 70, y);
      doc.font('Helvetica');
      doc.text(role, 70, y + 15);
      y += 40;
    });
  } else {
    doc.text(data.teamDescription || 'Experienced management team', 50, 100, {
      width: doc.page.width - 100,
      lineGap: 5,
    });
  }
}

function addGrowthOpportunities(doc: PDFDocumentType, data: IMData): void {
  doc.fontSize(18);
  doc.font('Helvetica-Bold');
  doc.fillColor('#0f172a');
  doc.text('6. Growth Opportunities', 50, 50);

  doc.fontSize(12);
  doc.font('Helvetica');
  doc.fillColor('#1e293b');

  doc.text(data.opportunities || 'Multiple growth opportunities available', 50, 100, {
    width: doc.page.width - 100,
    lineGap: 5,
  });
}

function addRiskAssessment(doc: PDFDocumentType, data: IMData): void {
  doc.fontSize(18);
  doc.font('Helvetica-Bold');
  doc.fillColor('#0f172a');
  doc.text('7. Risk Assessment', 50, 50);

  doc.fontSize(12);
  doc.font('Helvetica');
  doc.fillColor('#1e293b');

  doc.text(data.risks || 'Standard business risks', 50, 100, {
    width: doc.page.width - 100,
    lineGap: 5,
  });
}

function addAppendix(doc: PDFDocumentType, data: IMData): void {
  doc.fontSize(18);
  doc.font('Helvetica-Bold');
  doc.fillColor('#0f172a');
  doc.text('8. Appendix', 50, 50);

  doc.fontSize(11);
  doc.font('Helvetica');
  doc.fillColor('#1e293b');

  const appendixItems = [
    'A. Detailed Financial Statements (3-5 years)',
    'B. Key Agreements & Contracts',
    'C. Customer & Supplier List',
    'D. IP & Asset Documentation',
    'E. Employment Agreements',
    'F. Regulatory Compliance Documentation',
  ];

  let y = 100;
  appendixItems.forEach((item) => {
    doc.text(`• ${item}`, 70, y);
    y += 20;
  });
}

function addWatermark(doc: PDFDocumentType, buyerEmail?: string): void {
  const pages = doc.bufferedPageRange().count;

  for (let i = 0; i < pages; i++) {
    doc.switchToPage(i);

    // Watermark text
    const now = new Date();
    const timestamp = now.toISOString();
    const watermarkText = `CONFIDENTIAL - ${buyerEmail || 'Authorized Recipient'} - ${timestamp}`;

    // Add semi-transparent watermark
    doc.opacity(0.08);
    doc.fontSize(40);
    doc.rotate(45, { origin: [doc.page.width / 2, doc.page.height / 2] });
    doc.text(watermarkText, 0, doc.page.height / 2 - 20, {
      width: doc.page.width * 2,
      align: 'center',
    });
    doc.rotate(-45, { origin: [doc.page.width / 2, doc.page.height / 2] });
    doc.opacity(1);

    // Footer line
    doc.opacity(0.3);
    doc.moveTo(50, doc.page.height - 40).lineTo(doc.page.width - 50, doc.page.height - 40).stroke();
    doc.opacity(1);

    // Page number
    doc.fontSize(10);
    doc.fillColor('#64748b');
    doc.text(`Page ${i + 1} of ${pages}`, 50, doc.page.height - 30);
  }
}
