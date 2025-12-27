import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createNotification } from '@/lib/notifications'
import { getAuthenticatedUserId } from '@/lib/request-auth'

// GET /api/notifications
export async function GET(request: NextRequest) {
  try {
    const userId = getAuthenticatedUserId(request)

    if (!userId) {
      return NextResponse.json({ notifications: [], unreadCount: 0 })
    }

    const [notifications, unreadCount] = await Promise.all([
      prisma.message.findMany({
        where: {
          recipientId: userId,
          senderId: 'system'
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: {
          id: true,
          subject: true,
          content: true,
          createdAt: true,
          read: true,
          listingId: true
        }
      }),
      prisma.message.count({
        where: {
          recipientId: userId,
          senderId: 'system',
          read: false
        }
      })
    ])

    return NextResponse.json({ 
      notifications, 
      unreadCount 
    })
  } catch (error) {
    console.error('Fetch notifications error:', error)
    return NextResponse.json({ notifications: [], unreadCount: 0 })
  }
}

// POST /api/notifications - Create a notification (internal)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, type, title, message, listingId } = body

    await createNotification({
      userId,
      type: (type || 'system') as any,
      title: title || 'Notifiering',
      message: message || '',
      listingId
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Create notification error:', error)
    return NextResponse.json({ success: true })
  }
}

// PATCH /api/notifications - Mark as read
export async function PATCH(request: NextRequest) {
  try {
    const userId = getAuthenticatedUserId(request)
    const body = await request.json()
    const { notificationIds } = body

    if (!Array.isArray(notificationIds) || !userId) {
      return NextResponse.json({ success: false }, { status: 400 })
    }

    const updated = await prisma.message.updateMany({
      where: {
        id: { in: notificationIds },
        recipientId: userId,
        senderId: 'system'
      },
      data: { read: true }
    })

    return NextResponse.json({ success: true, updated: updated.count })
  } catch (error) {
    console.error('Mark notification read error:', error)
    return NextResponse.json({ success: true })
  }
}
