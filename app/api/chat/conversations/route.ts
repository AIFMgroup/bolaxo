import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getAuthenticatedUserId } from '@/lib/request-auth'

const prisma = new PrismaClient()

/**
 * GET /api/chat/conversations
 * Fetches conversations for the authenticated user
 * Based on approved NDAs and existing messages
 */
export async function GET(request: NextRequest) {
  try {
    const userId = getAuthenticatedUserId(request)

    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Get user's role
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // For buyers: find approved NDAs and conversations
    if (user.role === 'buyer') {
      const approvedNdas = await prisma.nDARequest.findMany({
        where: {
          buyerId: userId,
          status: 'approved'
        },
        include: {
          listing: {
            include: {
              user: true
            }
          }
        }
      })

      const conversations = await Promise.all(
        approvedNdas.map(async (nda) => {
          // Get last message between buyer and seller
          const lastMessage = await prisma.message.findFirst({
            where: {
              OR: [
                { senderId: userId, recipientId: nda.listing.user.id },
                { senderId: nda.listing.user.id, recipientId: userId }
              ]
            },
            orderBy: { createdAt: 'desc' }
          })

          // Count unread messages
          const unreadCount = await prisma.message.count({
            where: {
              recipientId: userId,
              senderId: nda.listing.user.id,
              read: false
            }
          })

          return {
            peerId: nda.listing.user.id,
            peerName: nda.listing.user.name || nda.listing.user.email,
            peerRole: nda.listing.user.role,
            listingId: nda.listing.id,
            listingTitle: nda.listing.companyName || nda.listing.anonymousTitle,
            lastMessage: lastMessage?.content,
            lastMessageTime: lastMessage?.createdAt.toISOString(),
            unread: unreadCount
          }
        })
      )

      return NextResponse.json({ conversations })
    }

    // For sellers: find approved NDAs (as seller) and conversations
    if (user.role === 'seller') {
      const approvedNdas = await prisma.nDARequest.findMany({
        where: {
          sellerId: userId,
          status: 'approved'
        },
        include: {
          buyer: {
            include: {
              buyerKycVerification: {
                select: { status: true }
              }
            }
          },
          listing: true
        }
      })

      const conversations = await Promise.all(
        approvedNdas.map(async (nda) => {
          // Get last message
          const lastMessage = await prisma.message.findFirst({
            where: {
              OR: [
                { senderId: userId, recipientId: nda.buyer.id },
                { senderId: nda.buyer.id, recipientId: userId }
              ]
            },
            orderBy: { createdAt: 'desc' }
          })

          // Count unread messages
          const unreadCount = await prisma.message.count({
            where: {
              recipientId: userId,
              senderId: nda.buyer.id,
              read: false
            }
          })

          return {
            peerId: nda.buyer.id,
            peerName: nda.buyer.name || nda.buyer.email,
            peerRole: nda.buyer.role,
            peerKycVerified: nda.buyer.buyerKycVerification?.status === 'APPROVED',
            listingId: nda.listing.id,
            listingTitle: nda.listing.companyName || nda.listing.anonymousTitle,
            lastMessage: lastMessage?.content,
            lastMessageTime: lastMessage?.createdAt.toISOString(),
            unread: unreadCount,
            approved: true
          }
        })
      )

      // Also get pending/unsigned NDA requests
      const pendingRequests = await prisma.nDARequest.findMany({
        where: {
          sellerId: userId,
          status: { in: ['pending', 'signed'] }
        },
        include: {
          buyer: {
            include: {
              buyerKycVerification: {
                select: { status: true }
              }
            }
          },
          listing: true
        }
      })

      const contactRequests = pendingRequests.map((nda) => ({
        buyerId: nda.buyer.id,
        buyerName: nda.buyer.name || nda.buyer.email,
        buyerEmail: nda.buyer.email,
        buyerKycVerified: nda.buyer.buyerKycVerification?.status === 'APPROVED',
        listingId: nda.listing.id,
        listingTitle: nda.listing.companyName || nda.listing.anonymousTitle,
        ndaStatus: nda.status,
        requestDate: nda.createdAt.toISOString(),
        message: nda.message || undefined
      }))

      return NextResponse.json({ conversations, contactRequests })
    }

    return NextResponse.json(
      { error: 'Invalid user role' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error fetching conversations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    )
  }
}
