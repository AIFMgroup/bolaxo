import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getClientIp, checkRateLimit, RATE_LIMIT_CONFIGS } from '@/app/lib/rate-limiter'
import { sendNewMessageEmail } from '@/lib/email'
import { createNotification } from '@/lib/notifications'

// Helper to verify user authentication
async function verifyUserAuth(request: NextRequest) {
  try {
    // In production, verify JWT/session token
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return { isValid: false, error: 'Unauthorized - No user ID', userId: null }
    }
    return { isValid: true, userId }
  } catch (error) {
    return { isValid: false, error: 'Authentication failed', userId: null }
  }
}

// Check if buyer has permission to contact seller
async function checkContactPermission(buyerId: string, sellerId: string, listingId?: string) {
  // Check if there's an approved NDA between buyer and seller for this listing
  const approvedNDA = await prisma.nDARequest.findFirst({
    where: {
      buyerId,
      sellerId,
      listingId,
      status: { in: ['approved', 'signed'] }
    }
  })
  
  return !!approvedNDA
}

// GET /api/messages?listingId=&peerId=&page=&limit=
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIp(request)
    const rateLimitCheck = checkRateLimit(ip, RATE_LIMIT_CONFIGS.general)
    
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        {
          error: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil((rateLimitCheck.resetTime - Date.now()) / 1000)
        },
        { status: 429 }
      )
    }
    
    const { searchParams } = new URL(request.url)
    const listingId = searchParams.get('listingId') || undefined
    const peerId = searchParams.get('peerId') || undefined
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '50'))
    
    // Verify auth
    const auth = await verifyUserAuth(request)
    if (!auth.isValid || !auth.userId) {
      return NextResponse.json({
        messages: [],
        pagination: {
          page,
          limit,
          total: 0,
          pages: 0,
          hasMore: false
        },
        unreadCount: 0,
        error: auth.error,
      })
    }
    
    const userId = auth.userId

    // Build where clause for conversation
    const where: any = {
      listingId,
      OR: [
        { senderId: userId },
        { recipientId: userId }
      ]
    }
    
    if (peerId) {
      where.AND = [
        { OR: [{ senderId: userId }, { recipientId: userId }] },
        { OR: [{ senderId: peerId }, { recipientId: peerId }] }
      ]
    }
    
    // Get total count and messages
    const [total, messages] = await Promise.all([
      prisma.message.count({ where }),
      prisma.message.findMany({
        where,
        select: {
          id: true,
          listingId: true,
          senderId: true,
          recipientId: true,
          subject: true,
          content: true,
          read: true,
          createdAt: true,
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              avatarUrl: true
            }
          },
          recipient: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              avatarUrl: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      })
    ])
    
    // Get unread count
    const unreadCount = await prisma.message.count({
      where: {
        ...where,
        recipientId: userId,
        read: false
      }
    })
    
    const pages = Math.ceil(total / limit)
    
    return NextResponse.json({
      messages: messages.reverse(), // Reverse to show oldest first
      pagination: {
        page,
        limit,
        total,
        pages,
        hasMore: page < pages
      },
      unreadCount
    })
  } catch (error) {
    console.error('Fetch messages error:', error)
    return NextResponse.json({ messages: [] })
  }
}

// POST /api/messages -> send message
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIp(request)
    const rateLimitCheck = checkRateLimit(ip, RATE_LIMIT_CONFIGS.general)
    
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        {
          error: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil((rateLimitCheck.resetTime - Date.now()) / 1000)
        },
        { status: 429 }
      )
    }
    
    // Verify auth
    const auth = await verifyUserAuth(request)
    if (!auth.isValid || !auth.userId) {
      return NextResponse.json({ error: auth.error }, { status: 401 })
    }
    
    const body = await request.json()
    const { listingId, recipientId, subject, content } = body
    const senderId = auth.userId

    if (!recipientId || !content) {
      return NextResponse.json(
        { error: 'recipientId and content are required' },
        { status: 400 }
      )
    }
    
    // Check if sender has permission to contact recipient
    const hasPermission = await checkContactPermission(senderId, recipientId, listingId)
    if (!hasPermission) {
      // Check reverse permission (maybe recipient is the buyer)
      const reversePermission = await checkContactPermission(recipientId, senderId, listingId)
      if (!reversePermission) {
        return NextResponse.json(
          { error: 'Du har inte tillstånd att kontakta denna användare. NDA måste godkännas först.' },
          { status: 403 }
        )
      }
    }

    const created = await prisma.message.create({
      data: {
        listingId: listingId || '',
        senderId,
        recipientId,
        subject: subject || null,
        content,
        read: false
      },
      select: {
        id: true,
        listingId: true,
        senderId: true,
        recipientId: true,
        subject: true,
        content: true,
        read: true,
        createdAt: true,
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatarUrl: true
          }
        },
        recipient: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatarUrl: true
          }
        },
        listing: {
          select: {
            id: true,
            anonymousTitle: true,
            companyName: true
          }
        }
      }
    })

    // Send email notification to recipient
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://bolaxo.com'
      const listingTitle = created.listing?.anonymousTitle || created.listing?.companyName || 'Objektet'
      await sendNewMessageEmail(
        created.recipient.email,
        created.recipient.name || 'Användare',
        created.sender.name || 'Användare',
        listingTitle,
        created.content.substring(0, 200),
        created.listingId || '',
        baseUrl
      )
    } catch (emailError) {
      console.error('Error sending new message email:', emailError)
      // Don't fail the request if email fails
    }

    await createNotification({
      userId: recipientId,
      type: 'message',
      title: `Nytt meddelande om ${created.listing?.anonymousTitle || 'ditt objekt'}`,
      message: created.content.substring(0, 160),
      listingId: created.listingId || undefined
    })
    
    return NextResponse.json({ message: created }, { status: 201 })
  } catch (error) {
    console.error('Send message error:', error)
    return NextResponse.json({ success: true })
  }
}

// PATCH /api/messages -> mark as read
export async function PATCH(request: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIp(request)
    const rateLimitCheck = checkRateLimit(ip, RATE_LIMIT_CONFIGS.general)
    
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        {
          error: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil((rateLimitCheck.resetTime - Date.now()) / 1000)
        },
        { status: 429 }
      )
    }
    
    // Verify auth
    const auth = await verifyUserAuth(request)
    if (!auth.isValid || !auth.userId) {
      return NextResponse.json({ error: auth.error }, { status: 401 })
    }
    
    const body = await request.json()
    const { ids } = body as { ids: string[] }

    if (!ids || ids.length === 0) {
      return NextResponse.json(
        { error: 'Message IDs are required' },
        { status: 400 }
      )
    }

    // Only mark messages as read where current user is the recipient
    const updated = await prisma.message.updateMany({
      where: {
        id: { in: ids },
        recipientId: auth.userId
      },
      data: { read: true }
    })

    return NextResponse.json({
      success: true,
      updated: updated.count
    })
  } catch (error) {
    console.error('Mark read error:', error)
    return NextResponse.json(
      { error: 'Failed to mark messages as read' },
      { status: 500 }
    )
  }
}

