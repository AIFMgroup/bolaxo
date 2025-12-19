import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Email Notification Tracking API

// GET - Fetch all email notifications with delivery status
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status') // pending, sent, delivered, opened, failed, bounced
    const type = searchParams.get('type') // nda, payment, notification, reminder, alert
    const searchQuery = searchParams.get('search')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const skip = (page - 1) * limit

    // Mock email notifications (in production, would fetch from database)
    const mockEmails = [
      {
        id: 'email-1',
        recipient: 'buyer@example.com',
        subject: 'NDA Request Received',
        type: 'nda',
        status: 'opened',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        sentAt: new Date(Date.now() - 1.9 * 60 * 60 * 1000),
        deliveredAt: new Date(Date.now() - 1.8 * 60 * 60 * 1000),
        openedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
        clickCount: 2,
        bounceReason: null
      },
      {
        id: 'email-2',
        recipient: 'seller@company.se',
        subject: 'Payment Confirmed',
        type: 'payment',
        status: 'delivered',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        sentAt: new Date(Date.now() - 24 * 60 * 60 * 1000 + 1000),
        deliveredAt: new Date(Date.now() - 24 * 60 * 60 * 1000 + 2000),
        openedAt: null,
        clickCount: 0,
        bounceReason: null
      },
      {
        id: 'email-3',
        recipient: 'inactive@domain.com',
        subject: 'Platform Update',
        type: 'notification',
        status: 'bounced',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        sentAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 1000),
        deliveredAt: null,
        openedAt: null,
        clickCount: 0,
        bounceReason: 'Mailbox does not exist'
      },
      {
        id: 'email-4',
        recipient: 'buyer2@example.com',
        subject: 'Reminder: NDA Expiring Soon',
        type: 'reminder',
        status: 'sent',
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
        sentAt: new Date(Date.now() - 5 * 60 * 60 * 1000 + 1000),
        deliveredAt: null,
        openedAt: null,
        clickCount: 0,
        bounceReason: null
      },
      {
        id: 'email-5',
        recipient: 'admin@bolaxo.se',
        subject: 'Alert: Suspicious Activity Detected',
        type: 'alert',
        status: 'opened',
        createdAt: new Date(Date.now() - 30 * 60 * 1000),
        sentAt: new Date(Date.now() - 30 * 60 * 1000 + 500),
        deliveredAt: new Date(Date.now() - 30 * 60 * 1000 + 1000),
        openedAt: new Date(Date.now() - 10 * 60 * 1000),
        clickCount: 1,
        bounceReason: null
      }
    ]

    // Filter and search
    let filtered = mockEmails
    if (searchQuery) {
      filtered = filtered.filter(e =>
        e.recipient.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.subject.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    if (status) filtered = filtered.filter(e => e.status === status)
    if (type) filtered = filtered.filter(e => e.type === type)

    // Sort
    filtered.sort((a, b) => {
      const aVal = sortBy === 'createdAt' ? a.createdAt.getTime() : 0
      const bVal = sortBy === 'createdAt' ? b.createdAt.getTime() : 0
      return sortOrder === 'desc' ? bVal - aVal : aVal - bVal
    })

    const total = filtered.length
    const paginated = filtered.slice(skip, skip + limit)

    // Enrich with calculated fields
    const enriched = paginated.map(email => {
      const deliveryTime = email.deliveredAt && email.sentAt
        ? Math.round((email.deliveredAt.getTime() - email.sentAt.getTime()) / 1000)
        : null

      const openTime = email.openedAt && email.deliveredAt
        ? Math.round((email.openedAt.getTime() - email.deliveredAt.getTime()) / 1000 / 60)
        : null

      return {
        ...email,
        deliveryTime,
        openTime,
        isOpened: !!email.openedAt,
        isDelivered: email.status === 'delivered' || email.status === 'opened',
        daysSinceSent: Math.floor((Date.now() - email.sentAt.getTime()) / (1000 * 60 * 60 * 24))
      }
    })

    // Calculate stats
    const allEmails = filtered
    const sent = allEmails.filter(e => e.status === 'sent').length
    const delivered = allEmails.filter(e => e.status === 'delivered' || e.status === 'opened').length
    const opened = allEmails.filter(e => e.status === 'opened').length
    const failed = allEmails.filter(e => e.status === 'failed' || e.status === 'bounced').length
    const deliveryRate = total > 0 ? Math.round((delivered / total) * 100) : 0
    const openRate = delivered > 0 ? Math.round((opened / delivered) * 100) : 0

    return NextResponse.json({
      success: true,
      data: enriched,
      stats: {
        total,
        sent,
        delivered,
        opened,
        failed,
        deliveryRate,
        openRate,
        avgDeliveryTime: Math.round(
          enriched
            .filter(e => e.deliveryTime)
            .reduce((sum, e) => sum + (e.deliveryTime || 0), 0) /
            enriched.filter(e => e.deliveryTime).length
        )
      },
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching email tracking:', error)
    return NextResponse.json(
      { error: 'Failed to fetch email tracking data' },
      { status: 500 }
    )
  }
}

// PATCH - Update email status (mark as opened, etc)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { emailId, action } = body

    if (!emailId || !action) {
      return NextResponse.json(
        { error: 'emailId and action are required' },
        { status: 400 }
      )
    }

    // In production, would update database
    console.log(`Email ${emailId} marked as ${action}`)

    return NextResponse.json({
      success: true,
      message: `Email marked as ${action}`
    })
  } catch (error) {
    console.error('Error updating email:', error)
    return NextResponse.json(
      { error: 'Failed to update email' },
      { status: 500 }
    )
  }
}

// POST - Resend email or perform email action
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { emailId, action } = body

    if (!emailId || !action) {
      return NextResponse.json(
        { error: 'emailId and action are required' },
        { status: 400 }
      )
    }

    if (action === 'resend') {
      console.log(`Email ${emailId} resent`)
      return NextResponse.json({
        success: true,
        message: 'Email resent successfully'
      })
    } else if (action === 'unsubscribe') {
      console.log(`Email recipient unsubscribed from email ${emailId}`)
      return NextResponse.json({
        success: true,
        message: 'Email recipient unsubscribed'
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error handling email action:', error)
    return NextResponse.json(
      { error: 'Failed to handle email action' },
      { status: 500 }
    )
  }
}
