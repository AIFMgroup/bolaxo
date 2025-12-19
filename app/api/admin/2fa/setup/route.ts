import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminToken } from '@/lib/admin-auth'
import { generateTOTPSecret, generateTOTPUri, generateBackupCodes, hashBackupCodes } from '@/lib/two-factor-auth'
import { createAuditLog } from '@/lib/audit-log'

// POST /api/admin/2fa/setup
// Initialize 2FA setup - returns secret and QR code URI
export async function POST(request: NextRequest) {
  try {
    const adminToken = await verifyAdminToken(request)
    
    if (!adminToken || adminToken.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if 2FA is already enabled
    const user = await prisma.user.findUnique({
      where: { id: adminToken.userId },
      select: { 
        id: true, 
        email: true, 
        totpEnabled: true,
        totpSecret: true 
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.totpEnabled) {
      return NextResponse.json(
        { error: '2FA is already enabled. Disable it first to set up again.' },
        { status: 400 }
      )
    }

    // Generate new secret
    const secret = generateTOTPSecret()
    const uri = generateTOTPUri(secret, user.email, 'BOLAXO Admin')

    // Store secret temporarily (not enabled yet)
    await prisma.user.update({
      where: { id: user.id },
      data: { totpSecret: secret }
    })

    // Log the setup initiation
    await createAuditLog({
      userId: user.id,
      userEmail: user.email,
      userRole: 'admin',
      action: '2fa_setup',
      category: 'auth',
      description: `2FA setup initiated for ${user.email}`,
    })

    return NextResponse.json({
      secret,
      uri,
      message: 'Scan the QR code with your authenticator app, then verify with a code'
    })
  } catch (error) {
    console.error('2FA setup error:', error)
    return NextResponse.json(
      { error: 'Failed to initialize 2FA setup' },
      { status: 500 }
    )
  }
}

