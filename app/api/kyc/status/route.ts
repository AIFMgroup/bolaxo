import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/request-auth'

// GET /api/kyc/status
// Returns current user's KYC status + uploaded documents metadata
export async function GET(request: NextRequest) {
  const userId = getAuthenticatedUserId(request)
  if (!userId) return NextResponse.json({ error: 'Ej autentiserad' }, { status: 401 })

  const verification = await prisma.buyerKycVerification.findUnique({
    where: { userId },
    include: {
      documents: { orderBy: { createdAt: 'desc' } },
    },
  })

  return NextResponse.json({
    verification: verification
      ? {
          id: verification.id,
          status: verification.status,
          submittedAt: verification.submittedAt,
          reviewedAt: verification.reviewedAt,
          rejectionReason: verification.rejectionReason,
          documents: verification.documents.map((d) => ({
            id: d.id,
            kind: d.kind,
            fileName: d.fileName,
            fileSize: d.fileSize,
            mimeType: d.mimeType,
            createdAt: d.createdAt,
          })),
        }
      : {
          status: 'UNVERIFIED',
          documents: [],
        },
  })
}


