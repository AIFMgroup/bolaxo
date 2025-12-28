import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/request-auth'
import { createAuditLog } from '@/lib/audit-log'

// POST /api/kyc/submit
// Marks the user's KYC as submitted (requires at least 1 uploaded document).
export async function POST(request: NextRequest) {
  const userId = getAuthenticatedUserId(request)
  if (!userId) return NextResponse.json({ error: 'Ej autentiserad' }, { status: 401 })

  const verification = await prisma.buyerKycVerification.findUnique({
    where: { userId },
    include: { documents: { select: { id: true } } },
  })

  if (!verification || verification.documents.length === 0) {
    return NextResponse.json({ error: 'Ladda upp minst ett dokument först' }, { status: 400 })
  }

  const updated = await prisma.buyerKycVerification.update({
    where: { userId },
    data: {
      status: 'SUBMITTED',
      submittedAt: new Date(),
      rejectionReason: null,
    },
    select: { id: true, status: true, submittedAt: true },
  })

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, role: true } })

  await createAuditLog({
    userId,
    userEmail: user?.email || undefined,
    userRole: user?.role || undefined,
    action: 'profile_updated',
    category: 'user',
    severity: 'info',
    targetType: 'buyer_kyc',
    targetId: updated.id,
    description: 'Buyer KYC submitted',
    metadata: { status: updated.status },
  })

  return NextResponse.json({ success: true, verification: updated })
}


