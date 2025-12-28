import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminToken } from '@/lib/admin-auth'
import { logAdminAction } from '@/lib/audit-log'
import { createNotification } from '@/lib/notifications'
import { sendEmail } from '@/lib/email'

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

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, verified: true },
  })
  if (!user) return NextResponse.json({ error: 'Användare hittades inte' }, { status: 404 })

  const updated = await prisma.$transaction(async (tx) => {
    const verification = await tx.buyerKycVerification.update({
      where: { userId },
      data: {
        status: nextStatus,
        reviewedAt: new Date(),
        reviewedBy: admin.userId,
        rejectionReason: decision === 'reject' ? (rejectionReason || 'Rejected') : null,
      },
      select: { id: true, status: true, reviewedAt: true, rejectionReason: true },
    })

    if (decision === 'approve' && !user.verified) {
      await tx.user.update({
        where: { id: userId },
        data: { verified: true },
        select: { id: true },
      })
    }

    return verification
  })

  // Notify user (in-app + email). Best-effort; should not block admin action.
  const origin = new URL(request.url).origin
  const kycUrl = `${origin}/kopare/kyc`
  const title = decision === 'approve' ? 'Verifiering godkänd' : 'Verifiering nekad'
  const message =
    decision === 'approve'
      ? `Din KYC/verifiering har godkänts. Du kan nu fortsätta processen i datarum och chatt.\n\nÖppna: ${kycUrl}`
      : `Din KYC/verifiering har nekats.${updated.rejectionReason ? `\n\nAnledning: ${updated.rejectionReason}` : ''}\n\nDu kan ladda upp nya dokument här: ${kycUrl}`

  await createNotification({
    userId,
    type: 'system',
    title,
    message,
    listingId: null,
  })

  try {
    await sendEmail({
      to: user.email,
      subject: `BOLAXO: ${title}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #111827;">
          <h2 style="margin: 0 0 12px 0; color: #1F3C58;">${title}</h2>
          <p style="margin: 0 0 12px 0;">Hej ${user.name || 'där'},</p>
          <p style="margin: 0 0 12px 0;">${decision === 'approve' ? 'Din KYC/verifiering har godkänts.' : 'Din KYC/verifiering har nekats.'}</p>
          ${decision === 'reject' && updated.rejectionReason ? `<p style="margin: 0 0 12px 0;"><strong>Anledning:</strong> ${updated.rejectionReason}</p>` : ''}
          <p style="margin: 0 0 12px 0;">Öppna din verifieringssida här:</p>
          <p style="margin: 0 0 12px 0;"><a href="${kycUrl}" style="color: #1F3C58;">${kycUrl}</a></p>
          <p style="margin: 0; color: #6b7280; font-size: 12px;">BOLAXO</p>
        </div>
      `,
    })
  } catch (e) {
    console.error('KYC email send failed', e)
  }

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


