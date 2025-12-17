import archiver from 'archiver';
import { Readable, PassThrough } from 'stream';
import PDFDocument from 'pdfkit';

export interface HandoffPackageContent {
  listingId: string;
  companyName: string;
  fileName: string;
  createdAt: Date;
  
  // Content URLs/buffers
  teaserPdfBuffer?: Buffer;
  imPdfBuffer?: Buffer;
  financialExcelBuffer?: Buffer;
  financialPdfBuffer?: Buffer;
  agreementsData?: AgreementData[];
  dataroomIndex?: DataroomIndexData;
  ndaReportData?: NDAReportData;
}

export interface AgreementData {
  name: string;
  type: string;
  importance: string;
  riskLevel: string;
  fileUrl?: string;
  counterparty?: string;
  description?: string;
}

export interface DataroomIndexData {
  folders: Array<{
    name: string;
    description: string;
    fileCount: number;
    files: Array<{ name: string; size: number; url?: string }>;
  }>;
}

export interface NDAReportData {
  sent: number;
  viewed: number;
  signed: number;
  rejected: number;
  pending: number;
  signedNDAs: Array<{
    buyerId: string;
    buyerName?: string;
    signedAt: Date;
  }>;
}

export async function generateHandoffPackageZip(content: HandoffPackageContent): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const output = new PassThrough();
      const archive = archiver('zip', {
        zlib: { level: 9 }, // Maximum compression
      });

      const chunks: Buffer[] = [];

      output.on('data', (chunk) => chunks.push(chunk));
      output.on('end', () => resolve(Buffer.concat(chunks)));
      output.on('error', reject);

      archive.on('error', reject);

      // Pipe archive to output
      archive.pipe(output);

      // 1. Add cover page / README
      const readmePage = generateReadmePage(content);
      archive.append(readmePage, { name: '00_README.txt' });

      // 2. Add index PDF
      const indexPdf = generateIndexPdf(content);
      archive.append(indexPdf, { name: '01_INDEX.pdf' });

      // 3. Add Teaser PDF (if available)
      if (content.teaserPdfBuffer) {
        archive.append(content.teaserPdfBuffer, {
          name: `02_TEASER_${content.companyName.replace(/[^a-z0-9]/gi, '_')}.pdf`,
        });
      }

      // 4. Add IM PDF (if available)
      if (content.imPdfBuffer) {
        archive.append(content.imPdfBuffer, {
          name: `03_INFORMATION_MEMORANDUM_${content.companyName.replace(/[^a-z0-9]/gi, '_')}.pdf`,
        });
      }

      // 5. Add Financial Data (Excel if available, else PDF)
      if (content.financialExcelBuffer) {
        archive.append(content.financialExcelBuffer, {
          name: `04_FINANCIAL_DATA_${new Date().getFullYear()}.xlsx`,
        });
      } else if (content.financialPdfBuffer) {
        archive.append(content.financialPdfBuffer, {
          name: `04_FINANCIAL_DATA_${new Date().getFullYear()}.pdf`,
        });
      }

      // 6. Add Agreements CSV
      if (content.agreementsData && content.agreementsData.length > 0) {
        const agreementsCsv = generateAgreementsCsv(content.agreementsData);
        archive.append(agreementsCsv, { name: '05_AGREEMENTS_INDEX.csv' });
      }

      // 7. Add Dataroom Index
      if (content.dataroomIndex) {
        const dataroomCsv = generateDataroomIndexCsv(content.dataroomIndex);
        archive.append(dataroomCsv, { name: '06_DATAROOM_INDEX.csv' });
      }

      // 8. Add NDA Report
      if (content.ndaReportData) {
        const ndaReport = generateNDAReport(content.ndaReportData);
        archive.append(ndaReport, { name: '07_NDA_STATUS_REPORT.txt' });
      }

      // 9. Add metadata JSON
      const metadata = {
        packageVersion: '1.0',
        createdAt: new Date().toISOString(),
        listingId: content.listingId,
        companyName: content.companyName,
        includedDocuments: {
          teaser: !!content.teaserPdfBuffer,
          informationMemorandum: !!content.imPdfBuffer,
          financialData: !!content.financialExcelBuffer || !!content.financialPdfBuffer,
          agreements: (content.agreementsData?.length || 0) > 0,
          dataroom: !!content.dataroomIndex,
          nda: !!content.ndaReportData,
        },
      };

      archive.append(JSON.stringify(metadata, null, 2), {
        name: 'METADATA.json',
      });

      // 10. Create a simple HTML index for easy browsing
      const htmlIndex = generateHtmlIndex(content);
      archive.append(htmlIndex, { name: 'index.html' });

      // Finalize
      archive.finalize();
    } catch (error) {
      reject(error);
    }
  });
}

function generateReadmePage(content: HandoffPackageContent): Buffer {
  const readme = `
╔════════════════════════════════════════════════════════════════╗
║          ADVISOR HANDOFF PACKAGE - ${content.companyName.toUpperCase()}             ║
╚════════════════════════════════════════════════════════════════╝

Package Created: ${content.createdAt.toLocaleDateString('sv-SE')} ${content.createdAt.toLocaleTimeString('sv-SE')}
Listing ID: ${content.listingId}

CONTENTS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

00_README.txt (this file)
01_INDEX.pdf - Comprehensive index of all documents
02_TEASER_*.pdf - Business overview (anonymized, 2-3 pages)
03_INFORMATION_MEMORANDUM_*.pdf - Full IM (10-15 pages)
04_FINANCIAL_DATA_*.xlsx - Financial statements (3-5 years)
05_AGREEMENTS_INDEX.csv - List of key agreements
06_DATAROOM_INDEX.csv - Document storage inventory
07_NDA_STATUS_REPORT.txt - NDA signature tracking
index.html - Browse this package in a web browser
METADATA.json - Package metadata

QUICK START:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Start with 01_INDEX.pdf for an overview
2. Review 02_TEASER_*.pdf for a quick pitch
3. Read 03_INFORMATION_MEMORANDUM_*.pdf for full details
4. Analyze 04_FINANCIAL_DATA_*.xlsx for numbers
5. Cross-reference with 05_AGREEMENTS_INDEX.csv
6. Check 07_NDA_STATUS_REPORT.txt for buyer list

IMPORTANT NOTES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• All documents marked as CONFIDENTIAL
• Teaser is anonymized for initial distribution
• Financial data includes normalized EBITDA calculations
• Agreements show risk classification and key terms
• NDA report tracks who has signed and access rights

SUPPORT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Questions about documents? Contact the seller through Afterfounder.
Questions about Afterfounder? Visit support.afterfounder.se
`;

  return Buffer.from(readme, 'utf-8');
}

function generateIndexPdf(content: HandoffPackageContent): Buffer {
  let indexContent = `HANDOFF PACKAGE INDEX\n`;
  indexContent += `================================\n\n`;
  indexContent += `Company: ${content.companyName}\n`;
  indexContent += `Created: ${content.createdAt.toLocaleDateString('sv-SE')}\n`;
  indexContent += `Package ID: ${content.listingId}\n\n`;
  
  indexContent += `DOCUMENTS INCLUDED:\n`;
  indexContent += `-----------------\n`;
  indexContent += `1. README.txt - This package overview\n`;
  
  if (content.teaserPdfBuffer) {
    indexContent += `2. TEASER - Anonymized company overview\n`;
  }
  
  if (content.imPdfBuffer) {
    indexContent += `3. INFORMATION MEMORANDUM - Full company details\n`;
  }
  
  if (content.financialExcelBuffer) {
    indexContent += `4. FINANCIAL_DATA.xlsx - Historical financial statements\n`;
  } else if (content.financialPdfBuffer) {
    indexContent += `4. FINANCIAL_DATA.pdf - Historical financial statements\n`;
  }
  
  if (content.agreementsData && content.agreementsData.length > 0) {
    indexContent += `5. AGREEMENTS - Key contracts (${content.agreementsData.length} files)\n`;
  }
  
  if (content.dataroomIndex) {
    indexContent += `6. DATAROOM - Full data room index\n`;
  }
  
  if (content.ndaReportData) {
    indexContent += `7. NDA_REPORT - NDA status summary\n`;
  }
  
  indexContent += `\nCONFIDENTIAL - For Authorized Recipients Only\n`;
  
  return Buffer.from(indexContent, 'utf-8');
}

function generateAgreementsCsv(agreements: AgreementData[]): Buffer {
  let csv = 'Name,Type,Importance,Risk Level,Counterparty,Description\n';

  agreements.forEach((agreement) => {
    const fields = [
      `"${agreement.name}"`,
      `"${agreement.type}"`,
      `"${agreement.importance}"`,
      `"${agreement.riskLevel}"`,
      `"${agreement.counterparty || 'N/A'}"`,
      `"${agreement.description || ''}"`,
    ];
    csv += fields.join(',') + '\n';
  });

  return Buffer.from(csv, 'utf-8');
}

function generateDataroomIndexCsv(dataroom: DataroomIndexData): Buffer {
  let csv = 'Folder,Description,Files,File Names\n';

  dataroom.folders.forEach((folder) => {
    const fileNames = folder.files.map((f) => f.name).join('; ');
    const fields = [
      `"${folder.name}"`,
      `"${folder.description}"`,
      folder.fileCount.toString(),
      `"${fileNames}"`,
    ];
    csv += fields.join(',') + '\n';
  });

  return Buffer.from(csv, 'utf-8');
}

function generateNDAReport(ndaData: NDAReportData): Buffer {
  const report = `
╔════════════════════════════════════════════════╗
║         NDA STATUS REPORT                      ║
╚════════════════════════════════════════════════╝

Summary:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Total Sent:        ${ndaData.sent}
Viewed:            ${ndaData.viewed}
Signed:            ${ndaData.signed}
Rejected:          ${ndaData.rejected}
Pending:           ${ndaData.pending}

Signed NDAs:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${
  ndaData.signedNDAs.length > 0
    ? ndaData.signedNDAs
        .map(
          (nda) =>
            `• ${nda.buyerName || nda.buyerId} - Signed: ${new Date(nda.signedAt).toLocaleDateString('sv-SE')}`
        )
        .join('\n')
    : 'No NDAs signed yet'
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Generated: ${new Date().toISOString()}
`;

  return Buffer.from(report, 'utf-8');
}

function generateHtmlIndex(content: HandoffPackageContent): Buffer {
  const html = `
<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${content.companyName} - Advisor Handoff Package</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      max-width: 800px;
      width: 100%;
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px;
      text-align: center;
    }
    .header h1 {
      font-size: 32px;
      margin-bottom: 10px;
    }
    .header p {
      font-size: 14px;
      opacity: 0.9;
    }
    .content {
      padding: 40px;
    }
    .section {
      margin-bottom: 30px;
    }
    .section h2 {
      font-size: 18px;
      color: #0f172a;
      margin-bottom: 15px;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 10px;
    }
    .document-list {
      display: grid;
      gap: 12px;
    }
    .document-item {
      background: #f8fafc;
      border-left: 4px solid #667eea;
      padding: 15px;
      border-radius: 4px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .document-item.available {
      border-left-color: #10b981;
    }
    .document-item.unavailable {
      border-left-color: #ef4444;
      opacity: 0.6;
    }
    .document-item-name {
      font-weight: 500;
      color: #1e293b;
    }
    .document-item-status {
      font-size: 12px;
      padding: 4px 8px;
      border-radius: 4px;
      font-weight: 600;
    }
    .status-available {
      background: #d1fae5;
      color: #065f46;
    }
    .status-unavailable {
      background: #fee2e2;
      color: #991b1b;
    }
    .info-box {
      background: #eff6ff;
      border-left: 4px solid #3b82f6;
      padding: 15px;
      border-radius: 4px;
      margin-top: 20px;
      font-size: 14px;
      color: #1e40af;
    }
    .footer {
      background: #f1f5f9;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${content.companyName}</h1>
      <p>Advisor Handoff Package</p>
      <p>Created: ${new Date(content.createdAt).toLocaleDateString('sv-SE')}</p>
    </div>
    
    <div class="content">
      <div class="section">
        <h2>📋 Included Documents</h2>
        <div class="document-list">
          <div class="document-item ${content.teaserPdfBuffer ? 'available' : 'unavailable'}">
            <span class="document-item-name">Business Overview (Teaser)</span>
            <span class="document-item-status ${content.teaserPdfBuffer ? 'status-available' : 'status-unavailable'}">
              ${content.teaserPdfBuffer ? '✓ Available' : '✗ Not Available'}
            </span>
          </div>
          
          <div class="document-item ${content.imPdfBuffer ? 'available' : 'unavailable'}">
            <span class="document-item-name">Information Memorandum</span>
            <span class="document-item-status ${content.imPdfBuffer ? 'status-available' : 'status-unavailable'}">
              ${content.imPdfBuffer ? '✓ Available' : '✗ Not Available'}
            </span>
          </div>
          
          <div class="document-item ${content.financialExcelBuffer || content.financialPdfBuffer ? 'available' : 'unavailable'}">
            <span class="document-item-name">Financial Statements</span>
            <span class="document-item-status ${content.financialExcelBuffer || content.financialPdfBuffer ? 'status-available' : 'status-unavailable'}">
              ${content.financialExcelBuffer || content.financialPdfBuffer ? '✓ Available' : '✗ Not Available'}
            </span>
          </div>
          
          <div class="document-item ${content.agreementsData && content.agreementsData.length > 0 ? 'available' : 'unavailable'}">
            <span class="document-item-name">Key Agreements (${content.agreementsData?.length || 0} items)</span>
            <span class="document-item-status ${content.agreementsData && content.agreementsData.length > 0 ? 'status-available' : 'status-unavailable'}">
              ${content.agreementsData && content.agreementsData.length > 0 ? '✓ Available' : '✗ Not Available'}
            </span>
          </div>
          
          <div class="document-item ${content.dataroomIndex ? 'available' : 'unavailable'}">
            <span class="document-item-name">Data Room Index</span>
            <span class="document-item-status ${content.dataroomIndex ? 'status-available' : 'status-unavailable'}">
              ${content.dataroomIndex ? '✓ Available' : '✗ Not Available'}
            </span>
          </div>
          
          <div class="document-item ${content.ndaReportData ? 'available' : 'unavailable'}">
            <span class="document-item-name">NDA Status Report</span>
            <span class="document-item-status ${content.ndaReportData ? 'status-available' : 'status-unavailable'}">
              ${content.ndaReportData ? '✓ Available' : '✗ Not Available'}
            </span>
          </div>
        </div>
      </div>
      
      <div class="info-box">
        <strong>Note:</strong> All documents in this package are marked CONFIDENTIAL and intended for authorized advisors and potential buyers only.
      </div>
    </div>
    
    <div class="footer">
      <p>Advisor Handoff Package v1.0 | Afterfounder SME Automation</p>
      <p>Listing ID: ${content.listingId}</p>
    </div>
  </div>
</body>
</html>
`;

  return Buffer.from(html, 'utf-8');
}
