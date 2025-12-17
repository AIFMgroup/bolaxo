import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as bcrypt from 'bcrypt'

export async function POST(request: NextRequest) {
  try {
    // Security check - this should only run once or with proper auth
    const authHeader = request.headers.get('authorization')
    if (authHeader !== 'Bearer admin-reset-secret-key') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log(' Starting admin account reset...')

    // Delete old admin account
    const oldEmail = 'admin@afterfounder.se'
    console.log(` Deleting ${oldEmail}...`)
    
    const deleted = await prisma.user.deleteMany({
      where: { email: oldEmail }
    })
    
    console.log(`OK Deleted ${deleted.count} old account(s)`)

    // Create new admin account
    const newEmail = 'admin@afterfounder.com'
    const password = 'Password123'
    
    console.log(` Creating new admin account...`)
    
    const saltRounds = 12
    const passwordHash = await bcrypt.hash(password, saltRounds)

    const adminUser = await prisma.user.create({
      data: {
        email: newEmail,
        name: 'Administrator',
        role: 'admin',
        passwordHash,
        verified: true,
        bankIdVerified: true,
        createdAt: new Date()
      }
    })

    console.log('OK Admin account created successfully!')
    
    return NextResponse.json({
      success: true,
      message: 'Admin account reset completed',
      email: adminUser.email,
      password: password,
      loginUrl: process.env.NEXT_PUBLIC_BASE_URL ? `${process.env.NEXT_PUBLIC_BASE_URL}/admin/login` : 'https://afterfounder.com/admin/login'
    })

  } catch (error) {
    console.error('X Error resetting admin:', error)
    return NextResponse.json(
      { error: 'Failed to reset admin account', details: String(error) },
      { status: 500 }
    )
  }
}
