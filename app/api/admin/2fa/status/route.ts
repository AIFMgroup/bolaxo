import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminToken } from '@/lib/admin-auth'

// GET /api/admin/2fa/status
// Get current 2FA status for the admin user
export async function GET(request: NextRequest) {
  try {
    const adminToken = await verifyAdminToken(request)
    
    if (!adminToken || adminToken.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: adminToken.userId },
      select: { 
        id: true, 
        email: true, 
        totpEnabled: true,
        twoFactorVerifiedAt: true,
        backupCodes: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      enabled: user.totpEnabled,
      lastVerified: user.twoFactorVerifiedAt,
      backupCodesRemaining: user.backupCodes?.length || 0,
      requiresSetup: !user.totpEnabled,
    })
  } catch (error) {
    console.error('2FA status error:', error)
    return NextResponse.json(
      { error: 'Failed to get 2FA status' },
      { status: 500 }
    )
  }
}

