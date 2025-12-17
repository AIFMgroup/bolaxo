import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { cookies } from 'next/headers'

const prisma = new PrismaClient()

// GDPR Article 17: Right to Erasure ("Right to be Forgotten")
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('afterfounder_user_id')?.value

    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const { confirmation } = await request.json()

    if (confirmation !== 'DELETE_MY_ACCOUNT') {
      return NextResponse.json(
        { error: 'Bekräftelse krävs. Skicka { "confirmation": "DELETE_MY_ACCOUNT" }' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        valuations: true,
        listings: { where: { status: 'active' } }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Kolla om användaren har aktiva listings
    if (user.listings.length > 0) {
      return NextResponse.json(
        { 
          error: 'Kan inte radera konto med aktiva annonser',
          message: 'Pausa eller ta bort dina annonser först.'
        },
        { status: 400 }
      )
    }

    // Soft delete: anonymisera istället för att radera (bevara transaktionshistorik)
    await prisma.user.update({
      where: { id: userId },
      data: {
        email: `deleted_${userId}@afterfounder.com`,
        name: 'Raderad användare',
        phone: null,
        companyName: null,
        orgNumber: null,
        region: null,
        magicLinkToken: null,
        tokenExpiresAt: null,
        // Behåll valuations för statistik (de-identified)
      }
    })

    // Anonymisera valuations (ta bort personlig koppling)
    await prisma.valuation.updateMany({
      where: { userId },
      data: {
        userId: null,
        email: null // Ta bort email från valuation
      }
    })

    // Logga deletion (compliance audit trail)
    console.log(`GDPR Account Deletion: User ${user.email} (ID: ${userId}) deleted at ${new Date().toISOString()}`)

    // Rensa cookies
    cookieStore.delete('afterfounder_user_id')
    cookieStore.delete('afterfounder_user_email')
    cookieStore.delete('afterfounder_user_role')

    return NextResponse.json({ 
      success: true,
      message: 'Ditt konto har raderats. All personlig data är borttagen.',
      deletedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Account deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    )
  }
}

