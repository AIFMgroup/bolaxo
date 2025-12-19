import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

const DD_STANDARD_CHECKLIST = [
  // Accounting
  { category: 'accounting', title: 'Review audited financials', priority: 'high', daysOut: 5 },
  { category: 'accounting', title: 'Tax returns analysis', priority: 'high', daysOut: 7 },
  { category: 'accounting', title: 'Accounts receivable aging', priority: 'medium', daysOut: 10 },
  { category: 'accounting', title: 'Inventory valuation', priority: 'medium', daysOut: 10 },
  
  // Legal
  { category: 'legal', title: 'Corporate governance review', priority: 'high', daysOut: 5 },
  { category: 'legal', title: 'Material contracts review', priority: 'high', daysOut: 7 },
  { category: 'legal', title: 'Litigation history check', priority: 'high', daysOut: 10 },
  { category: 'legal', title: 'Employment agreements review', priority: 'medium', daysOut: 12 },
  
  // IT
  { category: 'it', title: 'IT infrastructure assessment', priority: 'high', daysOut: 7 },
  { category: 'it', title: 'Cybersecurity review', priority: 'high', daysOut: 10 },
  { category: 'it', title: 'Software licensing audit', priority: 'medium', daysOut: 12 },
  
  // Financial
  { category: 'financial', title: 'Cash flow analysis', priority: 'high', daysOut: 5 },
  { category: 'financial', title: 'Debt obligations review', priority: 'high', daysOut: 7 },
  { category: 'financial', title: 'Working capital analysis', priority: 'high', daysOut: 10 },
  
  // Operations
  { category: 'operations', title: 'Supply chain assessment', priority: 'medium', daysOut: 10 },
  { category: 'operations', title: 'Key customer review', priority: 'high', daysOut: 12 },
  { category: 'operations', title: 'Key supplier review', priority: 'medium', daysOut: 12 },
  
  // HR
  { category: 'hr', title: 'Employee agreements', priority: 'medium', daysOut: 10 },
  { category: 'hr', title: 'Pension obligations', priority: 'medium', daysOut: 12 },
]

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('bolaxo_user_id')?.value

    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const { transactionId, targetCompleteDays = 30 } = await req.json()

    if (!transactionId) {
      return NextResponse.json(
        { error: 'transactionId is required' },
        { status: 400 }
      )
    }

    // Fetch transaction with related data
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        listing: {
          select: {
            id: true,
            userId: true
          }
        },
        buyer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        loi: {
          select: {
            id: true
          }
        }
      }
    })

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    // Verify user is buyer or seller
    const isBuyer = transaction.buyerId === userId
    const isSeller = transaction.sellerId === userId

    if (!isBuyer && !isSeller) {
      return NextResponse.json(
        { error: 'Unauthorized - Only buyer or seller can create DD from transaction' },
        { status: 403 }
      )
    }

    // Check if DD project already exists for this transaction
    const existingDD = await prisma.dDProject.findFirst({
      where: {
        transactionId: transactionId
      }
    })

    if (existingDD) {
      return NextResponse.json(
        { error: 'DD project already exists for this transaction', ddProject: existingDD },
        { status: 400 }
      )
    }

    // Calculate target completion date
    const targetCompleteDate = new Date()
    targetCompleteDate.setDate(targetCompleteDate.getDate() + targetCompleteDays)

    // Create DD Project
    const ddProject = await prisma.dDProject.create({
      data: {
        listingId: transaction.listingId,
        buyerId: transaction.buyerId,
        loiId: transaction.loiId,
        transactionId: transactionId,
        targetCompleteDate,
        status: 'in-progress',
      },
    })

    // Create tasks from standard checklist
    const tasks = await Promise.all(
      DD_STANDARD_CHECKLIST.map((item) => {
        const dueDate = new Date()
        dueDate.setDate(dueDate.getDate() + item.daysOut)

        return prisma.dDTask.create({
          data: {
            ddProjectId: ddProject.id,
            title: item.title,
            category: item.category,
            priority: item.priority,
            dueDate,
            status: 'open',
          },
        })
      })
    )

    // Update transaction stage if not already DD_IN_PROGRESS or later
    if (transaction.stage === 'LOI_SIGNED') {
      await prisma.transaction.update({
        where: { id: transactionId },
        data: {
          stage: 'DD_IN_PROGRESS'
        }
      })

      // Find and auto-complete "Due Diligence påbörjad" milestone
      const ddMilestone = await prisma.milestone.findFirst({
        where: {
          transactionId: transactionId,
          title: { contains: 'Due Diligence påbörjad' },
          completed: false
        }
      })

      if (ddMilestone) {
        await prisma.milestone.update({
          where: { id: ddMilestone.id },
          data: {
            completed: true,
            completedAt: new Date(),
            completedBy: userId
          }
        })

        await prisma.activity.create({
          data: {
            transactionId: transactionId,
            type: 'MILESTONE_COMPLETED',
            title: `Milstolpe slutförd: ${ddMilestone.title}`,
            description: 'Due Diligence projekt skapat',
            actorId: userId,
            actorName: isBuyer ? transaction.buyer.name || transaction.buyer.email : 'Säljare',
            actorRole: isBuyer ? 'buyer' : 'seller'
          }
        })
      }

      // Log activity
      await prisma.activity.create({
        data: {
          transactionId: transactionId,
          type: 'STAGE_CHANGE',
          title: 'Due Diligence påbörjad',
          description: `DD-projekt skapat av ${isBuyer ? 'köpare' : 'säljare'}`,
          actorId: userId,
          actorName: isBuyer ? transaction.buyer.name || transaction.buyer.email : 'Säljare',
          actorRole: isBuyer ? 'buyer' : 'seller'
        }
      })
    }

    return NextResponse.json({
      success: true,
      ddProject,
      tasks: tasks.length,
      transactionId: transactionId
    })
  } catch (error) {
    console.error('Create DD from transaction error:', error)
    return NextResponse.json(
      {
        error: 'Failed to create DD project from transaction',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

