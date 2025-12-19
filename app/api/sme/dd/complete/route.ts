import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

export async function PATCH(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('bolaxo_user_id')?.value

    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const { ddProjectId, summary, overallRiskLevel, goNogo } = await req.json()

    if (!ddProjectId) {
      return NextResponse.json(
        { error: 'ddProjectId is required' },
        { status: 400 }
      )
    }

    // Fetch DD project with transaction
    const ddProject = await prisma.dDProject.findUnique({
      where: { id: ddProjectId },
      include: {
        transaction: {
          select: {
            id: true,
            stage: true,
            milestones: {
              where: {
                title: {
                  contains: 'DD-rapport klar'
                }
              },
              orderBy: {
                order: 'asc'
              }
            }
          }
        },
        buyer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!ddProject) {
      return NextResponse.json(
        { error: 'DD project not found' },
        { status: 404 }
      )
    }

    // Verify user is buyer
    if (ddProject.buyerId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized - Only buyer can complete DD project' },
        { status: 403 }
      )
    }

    // Update DD project status to complete
    const updated = await prisma.dDProject.update({
      where: { id: ddProjectId },
      data: {
        status: 'complete',
        actualCompleteDate: new Date(),
        completionPercent: 100,
        summary: summary || undefined,
        overallRiskLevel: overallRiskLevel || undefined,
        goNogo: goNogo || undefined
      }
    })

    // If DD is connected to a transaction, update milestone
    if (ddProject.transaction && ddProject.transaction.milestones.length > 0) {
      const ddMilestone = ddProject.transaction.milestones[0] // Should be "DD-rapport klar" milestone

      if (ddMilestone && !ddMilestone.completed) {
        await prisma.milestone.update({
          where: { id: ddMilestone.id },
          data: {
            completed: true,
            completedAt: new Date(),
            completedBy: userId
          }
        })

        // Log activity
        await prisma.activity.create({
          data: {
            transactionId: ddProject.transaction.id,
            type: 'MILESTONE_COMPLETED',
            title: `Milstolpe slutförd: ${ddMilestone.title}`,
            description: `Due Diligence slutförd. Risknivå: ${overallRiskLevel || 'Ej angiven'}, Go/No-Go: ${goNogo || 'Ej angiven'}`,
            actorId: userId,
            actorName: ddProject.buyer.name || ddProject.buyer.email,
            actorRole: 'buyer'
          }
        })

        // Update transaction stage if not already SPA_NEGOTIATION or later
        if (ddProject.transaction.stage === 'DD_IN_PROGRESS' || ddProject.transaction.stage === 'LOI_SIGNED') {
          await prisma.transaction.update({
            where: { id: ddProject.transaction.id },
            data: {
              stage: 'SPA_NEGOTIATION'
            }
          })

          await prisma.activity.create({
            data: {
              transactionId: ddProject.transaction.id,
              type: 'STAGE_CHANGE',
              title: 'DD klar - Går vidare till SPA-förhandling',
              description: 'Due Diligence är slutförd, affären går vidare till SPA-förhandling',
              actorId: userId,
              actorName: ddProject.buyer.name || ddProject.buyer.email,
              actorRole: 'buyer'
            }
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      ddProject: updated,
      transactionId: ddProject.transaction?.id
    })
  } catch (error) {
    console.error('Complete DD project error:', error)
    return NextResponse.json(
      {
        error: 'Failed to complete DD project',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

