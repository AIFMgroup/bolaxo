import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateHandoffPackageZip, HandoffPackageContent } from '@/lib/zip-generator';
import { generateTeaserPDF, generateIMPDF } from '@/lib/pdf-generator';

export async function POST(req: NextRequest) {
  try {
    const { listingId } = await req.json();

    if (!listingId) {
      return NextResponse.json({ error: 'Missing listingId' }, { status: 400 });
    }

    // Fetch listing
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: { user: true },
    });

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    // Fetch teaser data
    const teaser = await prisma.teaserIM.findFirst({
      where: { listingId, type: 'teaser' },
    });

    // Fetch IM data
    const im = await prisma.teaserIM.findFirst({
      where: { listingId, type: 'im' },
    });

    // Fetch financial data
    const financialData = await prisma.financialData.findUnique({
      where: { listingId },
      include: { years: { orderBy: { year: 'asc' } } },
    });

    // Fetch agreements
    const agreements = await prisma.agreement.findMany({
      where: { listingId },
    });

    // Fetch dataroom
    const dataroom = await prisma.dataRoom.findUnique({
      where: { listingId },
    });

    // Fetch NDA signatures
    const ndaSignatures = await prisma.nDASignature.findMany({
      where: { listingId },
    });

    // Generate PDFs
    let teaserPdfBuffer: Buffer | undefined;
    let imPdfBuffer: Buffer | undefined;

    const teaserQuestions = (teaser?.questionnaire as any) || {};
    const imQuestions = (im?.questionnaire as any) || {};

    if (teaser) {
      try {
        teaserPdfBuffer = await generateTeaserPDF({
          companyName: listing.companyName || teaserQuestions.companyName || 'Company',
          industry: teaserQuestions.industry || listing.industry || 'Unknown',
          founded: parseInt(teaserQuestions.founded) || new Date().getFullYear(),
          employees: parseInt(teaserQuestions.employees) || 1,
          revenue: teaserQuestions.revenue || listing.revenue || 'N/A',
          ebitdaMargin: teaserQuestions.ebitdaMargin || '15-25%',
          products: teaserQuestions.products || listing.description || 'Product/Service',
          geography: teaserQuestions.geography || 'Sweden',
          whySelling: teaserQuestions.whySelling || 'Growth opportunity',
          futureNutential: teaserQuestions.futureNutential || 'Strong potential',
          normalizedEBITDA: financialData?.normalizedEBITDA || undefined,
          yearlyFinancials: financialData?.years.map((y) => ({
            year: y.year,
            revenue: y.revenue,
            ebitda: y.ebitda,
            ebit: y.ebit,
          })),
          createdAt: new Date(),
        });
      } catch (error) {
        console.warn('Failed to generate teaser PDF:', error);
      }
    }

    if (im) {
      try {
        imPdfBuffer = await generateIMPDF({
          companyName: listing.companyName || imQuestions.companyName || 'Company',
          industry: imQuestions.industry || listing.industry || 'Unknown',
          founded: parseInt(imQuestions.founded) || new Date().getFullYear(),
          employees: parseInt(imQuestions.employees) || 1,
          revenue: imQuestions.revenue || listing.revenue || 'N/A',
          ebitdaMargin: imQuestions.ebitdaMargin || '15-25%',
          products: imQuestions.products || listing.description || 'Product/Service',
          geography: imQuestions.geography || 'Sweden',
          whySelling: imQuestions.whySelling || 'Growth opportunity',
          futureNutential: imQuestions.futureNutential || 'Strong potential',
          marketSize: imQuestions.marketSize,
          competitiveAdvantage: imQuestions.competitiveAdvantage,
          teamDescription: imQuestions.teamDescription,
          risks: imQuestions.risks,
          opportunities: imQuestions.opportunities,
          normalizedEBITDA: financialData?.normalizedEBITDA || undefined,
          yearlyFinancials: financialData?.years.map((y) => ({
            year: y.year,
            revenue: y.revenue,
            ebitda: y.ebitda,
            ebit: y.ebit,
          })),
          createdAt: new Date(),
        });
      } catch (error) {
        console.warn('Failed to generate IM PDF:', error);
      }
    }

    // Prepare handoff package content
    const handoffContent: HandoffPackageContent = {
      listingId,
      companyName: listing.companyName || 'Company',
      fileName: `handoff_${listing.companyName?.replace(/[^a-z0-9]/gi, '_')}_${new Date().getTime()}.zip`,
      createdAt: new Date(),
      teaserPdfBuffer,
      imPdfBuffer,
      agreementsData: agreements.map((a) => ({
        name: a.name,
        type: a.type,
        importance: a.importance,
        riskLevel: a.riskLevel,
        counterparty: a.counterparty || undefined,
        description: a.description || undefined,
      })),
      dataroomIndex: dataroom
        ? {
            folders: [],
          }
        : undefined,
      ndaReportData: {
        sent: ndaSignatures.length,
        viewed: ndaSignatures.filter((n) => n.viewedAt).length,
        signed: ndaSignatures.filter((n) => n.status === 'signed').length,
        rejected: ndaSignatures.filter((n) => n.status === 'rejected').length,
        pending: ndaSignatures.filter((n) => n.status === 'sent' || n.status === 'pending').length,
        signedNDAs: ndaSignatures
          .filter((n) => n.status === 'signed')
          .map((n) => ({
            buyerId: n.buyerId,
            buyerName: n.buyerName || undefined,
            signedAt: n.signedAt || new Date(),
          })),
      },
    };

    // Generate ZIP
    const zipBuffer = await generateHandoffPackageZip(handoffContent);

    // Save handoff pack info to database
    await prisma.handoffPack.upsert({
      where: { listingId },
      update: {
        zipUrl: `s3://bucket/${handoffContent.fileName}`,
        zipGeneratedAt: new Date(),
        status: 'ready',
      },
      create: {
        listingId,
        overview: {
          teaser: !!teaserPdfBuffer,
          im: !!imPdfBuffer,
          financial: !!financialData,
          agreements: agreements.length,
          agreements_list: agreements.map((a) => a.name),
          nda_signatures: ndaSignatures.length,
        },
        zipUrl: `s3://bucket/${handoffContent.fileName}`,
        zipGeneratedAt: new Date(),
        status: 'ready',
      },
    });

    // Return ZIP
    return new NextResponse(new Uint8Array(zipBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${handoffContent.fileName}"`,
      },
    });
  } catch (error) {
    console.error('Handoff ZIP generation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate handoff package',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
