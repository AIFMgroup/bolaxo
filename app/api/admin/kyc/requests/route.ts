import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminToken } from '@/lib/admin-auth'
import { logAdminAction } from '@/lib/audit-log'

// GET /api/admin/kyc/requests?status=SUBMITTED
export async function GET(request: NextRequest) {
  const admin = await verifyAdminToken(request)
  if (!admin || admin.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') || undefined

  const where: any = {}
  if (status) where.status = status

  const items = await prisma.buyerKycVerification.findMany({
    where,
    orderBy: [{ status: 'asc' }, { submittedAt: 'desc' }, { createdAt: 'desc' }],
    include: {
      user: { select: { id: true, email: true, name: true, role: true, createdAt: true } },
      documents: { select: { id: true, kind: true, fileName: true, fileSize: true, mimeType: true, createdAt: true } },
    },
    take: 200,
  })

  return NextResponse.json({
    requests: items.map((v) => ({
      id: v.id,
      status: v.status,
      submittedAt: v.submittedAt,
      reviewedAt: v.reviewedAt,
      reviewedBy: v.reviewedBy,
      rejectionReason: v.rejectionReason,
      user: v.user,
      documents: v.documents,
    })),
  })
}

// PATCH /api/admin/kyc/requests
// Body: { userId: string, decision: "approve" | "reject", rejectionReason?: string }
export async function PATCH(request: NextRequest) {
  const admin = await verifyAdminToken(request)
  if (!admin || admin.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const userId = body?.userId as string
  const decision = body?.decision as 'approve' | 'reject'
  const rejectionReason = (body?.rejectionReason as string | undefined) || undefined

  if (!userId || (decision !== 'approve' && decision !== 'reject')) {
    return NextResponse.json({ error: 'userId och decision krävs' }, { status: 400 })
  }

  const existing = await prisma.buyerKycVerification.findUnique({ where: { userId } })
  if (!existing) return NextResponse.json({ error: 'KYC saknas för användaren' }, { status: 404 })

  const nextStatus = decision === 'approve' ? 'APPROVED' : 'REJECTED'

  const updated = await prisma.buyerKycVerification.update({
    where: { userId },
    data: {
      status: nextStatus,
      reviewedAt: new Date(),
      reviewedBy: admin.userId,
      rejectionReason: decision === 'reject' ? (rejectionReason || 'Rejected') : null,
    },
    select: { id: true, status: true, reviewedAt: true },
  })

  await logAdminAction(
    'admin_user_edited',
    admin.userId,
    admin.email,
    'buyer_kyc',
    updated.id,
    `KYC ${decision === 'approve' ? 'approved' : 'rejected'} for user ${userId}`,
    { previous: existing, new: updated }
  )

  return NextResponse.json({ success: true, verification: updated })
}


