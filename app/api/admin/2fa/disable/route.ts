import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminToken } from '@/lib/admin-auth'
import { verifyTOTP } from '@/lib/two-factor-auth'
import { createAuditLog } from '@/lib/audit-log'

// POST /api/admin/2fa/disable
// Disable 2FA (requires current TOTP code for verification)
export async function POST(request: NextRequest) {
  try {
    const adminToken = await verifyAdminToken(request)
    
    if (!adminToken || adminToken.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { code, password } = body

    // Require either TOTP code or password
    if (!code && !password) {
      return NextResponse.json(
        { error: 'Verification code or password required' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: adminToken.userId },
      select: { 
        id: true, 
        email: true, 
        totpSecret: true,
        totpEnabled: true,
        passwordHash: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!user.totpEnabled) {
      return NextResponse.json(
        { error: '2FA is not enabled' },
        { status: 400 }
      )
    }

    // Verify identity
    let verified = false
    
    if (code && user.totpSecret) {
      verified = verifyTOTP(user.totpSecret, code)
    }
    
    if (!verified && password && user.passwordHash) {
      // Verify password as fallback
      const bcrypt = require('bcryptjs')
      verified = await bcrypt.compare(password, user.passwordHash)
    }

    if (!verified) {
      await createAuditLog({
        userId: user.id,
        userEmail: user.email,
        userRole: 'admin',
        action: '2fa_disabled',
        category: 'auth',
        severity: 'critical',
        description: `Failed attempt to disable 2FA for ${user.email}`,
        success: false,
      })

      return NextResponse.json(
        { error: 'Invalid verification' },
        { status: 400 }
      )
    }

    // Disable 2FA
    await prisma.user.update({
      where: { id: user.id },
      data: {
        totpEnabled: false,
        totpSecret: null,
        backupCodes: [],
        twoFactorVerifiedAt: null
      }
    })

    // Log 2FA disabled
    await createAuditLog({
      userId: user.id,
      userEmail: user.email,
      userRole: 'admin',
      action: '2fa_disabled',
      category: 'auth',
      severity: 'critical',
      description: `2FA disabled for ${user.email}`,
    })

    return NextResponse.json({
      success: true,
      message: '2FA has been disabled'
    })
  } catch (error) {
    console.error('2FA disable error:', error)
    return NextResponse.json(
      { error: 'Failed to disable 2FA' },
      { status: 500 }
    )
  }
}

