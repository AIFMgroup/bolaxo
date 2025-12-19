import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as bcrypt from 'bcrypt'

/**
 * Create a new admin user with password
 * Requires ADMIN_SETUP_TOKEN for security
 */
export async function POST(request: NextRequest) {
  try {
    const { email, password, name, setupToken } = await request.json()

    // Validate required fields
    if (!email || !password || !setupToken) {
      return NextResponse.json(
        { error: 'E-post, lösenord och setupToken krävs' },
        { status: 400 }
      )
    }

    // Verify setup token
    if (setupToken !== process.env.ADMIN_SETUP_TOKEN) {
      return NextResponse.json(
        { error: 'Ogiltig setup-token' },
        { status: 403 }
      )
    }

    // Validate password strength
    if (password.length < 12) {
      return NextResponse.json(
        { error: 'Lösenordet måste vara minst 12 tecken långt' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Användare med denna e-postadress finns redan' },
        { status: 409 }
      )
    }

    // Hash password
    const saltRounds = 12
    const passwordHash = await bcrypt.hash(password, saltRounds)

    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        email,
        name: name || email.split('@')[0],
        role: 'admin',
        passwordHash,
        verified: true,
        bankIdVerified: true,
        createdAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Admin-användare skapad framgångsrikt!',
      user: {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role
      },
      loginUrl: '/admin/login',
      credentials: {
        email: adminUser.email,
        password: '(lösenordet du angav)'
      }
    })
  } catch (error) {
    console.error('Error creating admin user:', error)
    return NextResponse.json(
      { error: 'Ett fel uppstod när admin-användaren skulle skapas' },
      { status: 500 }
    )
  }
}

/**
 * GET - Show instructions
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'POST för att skapa admin-användare',
    instructions: {
      endpoint: 'POST /api/admin/create',
      required_headers: {
        'Content-Type': 'application/json'
      },
      body: {
        email: 'admin@bolaxo.se',
        password: 'StrongPassword123!Min12Chars',
        name: 'Admin User (optional)',
        setupToken: 'your_admin_setup_token_here'
      },
      example_curl: `curl -X POST http://localhost:3000/api/admin/create \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "StrongPassword123!",
    "name": "Admin Name",
    "setupToken": "your_token_here"
  }'`
    }
  })
}
