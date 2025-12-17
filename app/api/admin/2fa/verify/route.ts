import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminToken } from '@/lib/admin-auth'
import { verifyTOTP, generateBackupCodes, hashBackupCodes, verifyBackupCode } from '@/lib/two-factor-auth'
import { createAuditLog } from '@/lib/audit-log'

// POST /api/admin/2fa/verify
// Verify TOTP code and enable 2FA (during setup) or verify session (during login)
export async function POST(request: NextRequest) {
  try {
    const adminToken = await verifyAdminToken(request)
    
    if (!adminToken || adminToken.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { code, action } = body // action: 'setup' or 'login'

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: adminToken.userId },
      select: { 
        id: true, 
        email: true, 
        totpSecret: true,
        totpEnabled: true,
        backupCodes: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!user.totpSecret) {
      return NextResponse.json(
        { error: '2FA not set up. Call /api/admin/2fa/setup first.' },
        { status: 400 }
      )
    }

    // Verify the TOTP code
    const isValidTOTP = verifyTOTP(user.totpSecret, code)
    
    // If TOTP fails, try backup code (only if 2FA is already enabled)
    let usedBackupCode = false
    let remainingBackupCodes = user.backupCodes
    
    if (!isValidTOTP && user.totpEnabled && user.backupCodes.length > 0) {
      const backupResult = verifyBackupCode(code, user.backupCodes)
      if (backupResult.valid) {
        usedBackupCode = true
        remainingBackupCodes = backupResult.remainingCodes
      }
    }

    if (!isValidTOTP && !usedBackupCode) {
      // Log failed attempt
      await createAuditLog({
        userId: user.id,
        userEmail: user.email,
        userRole: 'admin',
        action: '2fa_failed',
        category: 'auth',
        description: `Failed 2FA verification attempt for ${user.email}`,
        success: false,
      })

      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      )
    }

    // If this is setup verification (enabling 2FA)
    if (action === 'setup' && !user.totpEnabled) {
      // Generate backup codes
      const backupCodes = generateBackupCodes()
      const hashedBackupCodes = hashBackupCodes(backupCodes)

      await prisma.user.update({
        where: { id: user.id },
        data: {
          totpEnabled: true,
          backupCodes: hashedBackupCodes,
          twoFactorVerifiedAt: new Date()
        }
      })

      // Log 2FA enabled
      await createAuditLog({
        userId: user.id,
        userEmail: user.email,
        userRole: 'admin',
        action: '2fa_enabled',
        category: 'auth',
        severity: 'warning',
        description: `2FA enabled for ${user.email}`,
      })

      return NextResponse.json({
        success: true,
        message: '2FA enabled successfully',
        backupCodes, // Return plain backup codes ONCE for user to save
        warning: 'Save these backup codes securely. They will not be shown again.'
      })
    }

    // Regular login verification
    const updateData: any = {
      twoFactorVerifiedAt: new Date()
    }
    
    if (usedBackupCode) {
      updateData.backupCodes = remainingBackupCodes
      
      // Log backup code usage
      await createAuditLog({
        userId: user.id,
        userEmail: user.email,
        userRole: 'admin',
        action: 'backup_code_used',
        category: 'auth',
        severity: 'warning',
        description: `Backup code used for ${user.email}. ${remainingBackupCodes.length} codes remaining.`,
        metadata: { remainingCodes: remainingBackupCodes.length }
      })
    } else {
      // Log successful 2FA verification
      await createAuditLog({
        userId: user.id,
        userEmail: user.email,
        userRole: 'admin',
        action: '2fa_verified',
        category: 'auth',
        description: `2FA verified for ${user.email}`,
      })
    }

    await prisma.user.update({
      where: { id: user.id },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      message: usedBackupCode 
        ? `Verified with backup code. ${remainingBackupCodes.length} codes remaining.`
        : '2FA verified successfully',
      usedBackupCode,
      remainingBackupCodes: usedBackupCode ? remainingBackupCodes.length : undefined
    })
  } catch (error) {
    console.error('2FA verify error:', error)
    return NextResponse.json(
      { error: 'Failed to verify 2FA code' },
      { status: 500 }
    )
  }
}

