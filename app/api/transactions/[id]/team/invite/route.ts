import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { cookies } from 'next/headers'

const prisma = new PrismaClient()

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('bolaxo_user_id')?.value

    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const { email, name, role } = await request.json()

    if (!email || !name || !role) {
      return NextResponse.json(
        { error: 'Email, name and role required' },
        { status: 400 }
      )
    }

    // Verify access to transaction
    const transaction = await prisma.transaction.findUnique({
      where: { id: params.id }
    })

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    if (transaction.buyerId !== userId && 
        transaction.sellerId !== userId && 
        transaction.advisorId !== userId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Default permissions baserat på roll
    const defaultPermissions = {
      advisor: { canViewAll: true, canEditMilestones: true, canUploadDocuments: true },
      accountant: { canViewAll: false, canViewFinancials: true, canEditMilestones: false },
      lawyer: { canViewAll: false, canViewContracts: true, canEditMilestones: false },
      other: { canViewAll: false, canEditMilestones: false }
    }

    const permissions = defaultPermissions[role as keyof typeof defaultPermissions] || defaultPermissions.other

    // Skapa team member
    const teamMember = await prisma.teamMember.create({
      data: {
        transactionId: params.id,
        email,
        name,
        role,
        permissions,
        invitedBy: userId,
        status: 'PENDING'
      }
    })

    // Log activity
    const inviter = await prisma.user.findUnique({ where: { id: userId } })
    
    await prisma.activity.create({
      data: {
        transactionId: params.id,
        type: 'NOTE_ADDED',
        title: `Teammedlem inbjuden: ${name}`,
        description: `${role} (${email}) inbjuden att delta i transaktionen`,
        actorId: userId,
        actorName: inviter?.name || inviter?.email || 'Användare',
        actorRole: transaction.buyerId === userId ? 'buyer' : transaction.sellerId === userId ? 'seller' : 'advisor'
      }
    })

    // TODO: Skicka inbjudningsmail
    console.log(`Team invitation sent to ${email}`)

    return NextResponse.json({ teamMember })

  } catch (error) {
    console.error('Team invite error:', error)
    return NextResponse.json(
      { error: 'Failed to invite team member' },
      { status: 500 }
    )
  }
}

