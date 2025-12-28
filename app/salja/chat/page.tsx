'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MessageSquare, User, Building, Shield, CheckCircle, XCircle, Clock } from 'lucide-react'
import Chat from '@/components/Chat'
import { useAuth } from '@/contexts/AuthContext'
import VerifiedBuyerBadge, { VerifiedBuyerIcon } from '@/components/VerifiedBuyerBadge'

interface ContactRequest {
  buyerId: string
  buyerName: string
  buyerEmail: string
  buyerKycVerified?: boolean
  listingId: string
  listingTitle: string
  ndaStatus: 'pending' | 'approved' | 'signed' | 'rejected'
  requestDate: string
  message?: string
}

interface Conversation {
  peerId: string
  peerName: string
  peerRole: string
  peerKycVerified?: boolean
  listingId: string
  listingTitle: string
  lastMessage?: string
  lastMessageTime?: string
  unread: number
  approved: boolean
}

function SellerChatContent() {
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [contactRequests, setContactRequests] = useState<ContactRequest[]>([])
  const [activeTab, setActiveTab] = useState<'conversations' | 'requests'>('conversations')
  
  // Fetch conversations and contact requests from API
  useEffect(() => {
    if (!user) return

    const fetchData = async () => {
      try {
        const response = await fetch('/api/chat/conversations', { credentials: 'include' })

        if (response.ok) {
          const data = await response.json()
          setConversations(data.conversations || [])
          setContactRequests(data.contactRequests || [])
        }
      } catch (error) {
        console.error('Error fetching conversations:', error)
        setConversations([])
        setContactRequests([])
      }
    }

    fetchData()
  }, [user])

  const handleApproveContact = async (request: ContactRequest) => {
    try {
      // Find the NDA request and approve it
      const ndaRequests = await fetch('/api/nda-requests', { credentials: 'include' })
      
      const ndaData = await ndaRequests.json()
      const ndaRequest = ndaData.requests?.find(
        (n: any) => n.buyerId === request.buyerId && n.listingId === request.listingId
      )

      if (ndaRequest) {
        // Approve the NDA
        await fetch('/api/nda-requests', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({
            id: ndaRequest.id,
            status: 'approved'
          })
        })
      }

      // Move to conversations
      const newConv: Conversation = {
        peerId: request.buyerId,
        peerName: request.buyerName,
        peerRole: 'buyer',
        listingId: request.listingId,
        listingTitle: request.listingTitle,
        unread: 0,
        approved: true
      }
      
      setConversations([...conversations, newConv])
      setContactRequests(contactRequests.filter(r => r.buyerId !== request.buyerId))
      setSelectedConversation(newConv)
      setActiveTab('conversations')
    } catch (error) {
      console.error('Error approving contact:', error)
    }
  }

  const handleRejectContact = async (request: ContactRequest) => {
    try {
      // Find the NDA request and reject it
      const ndaRequests = await fetch('/api/nda-requests', { credentials: 'include' })
      
      const ndaData = await ndaRequests.json()
      const ndaRequest = ndaData.requests?.find(
        (n: any) => n.buyerId === request.buyerId && n.listingId === request.listingId
      )

      if (ndaRequest) {
        // Reject the NDA
        await fetch('/api/nda-requests', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({
            id: ndaRequest.id,
            status: 'rejected'
          })
        })
      }

      setContactRequests(contactRequests.filter(r => r.buyerId !== request.buyerId))
    } catch (error) {
      console.error('Error rejecting contact:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/salja/start" className="inline-flex items-center gap-2 text-primary-navy hover:text-primary-blue mb-4">
            <ArrowLeft className="w-4 h-4" />
            Tillbaka till försäljningssidan
          </Link>
          <h1 className="text-3xl font-bold text-primary-navy">Köparkommunikation</h1>
          <p className="text-gray-600 mt-2">Hantera förfrågningar och chatta med intresserade köpare</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm">
              {/* Tabs */}
              <div className="flex border-b border-gray-200">
                <button
                  onClick={() => setActiveTab('conversations')}
                  className={`flex-1 px-4 py-3 text-sm font-medium ${
                    activeTab === 'conversations'
                      ? 'text-primary-navy border-b-2 border-primary-navy'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Konversationer ({conversations.length})
                </button>
                <button
                  onClick={() => setActiveTab('requests')}
                  className={`flex-1 px-4 py-3 text-sm font-medium relative ${
                    activeTab === 'requests'
                      ? 'text-primary-navy border-b-2 border-primary-navy'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Förfrågningar ({contactRequests.length})
                  {contactRequests.length > 0 && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-accent-pink rounded-full"></span>
                  )}
                </button>
              </div>

              {/* Content */}
              <div className="divide-y divide-gray-100">
                {activeTab === 'conversations' ? (
                  conversations.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>Inga aktiva konversationer</p>
                    </div>
                  ) : (
                    conversations.map((conv) => (
                      <button
                        key={conv.peerId}
                        onClick={() => setSelectedConversation(conv)}
                        className={`w-full p-4 hover:bg-gray-50 transition-colors text-left ${
                          selectedConversation?.peerId === conv.peerId ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <User className="w-4 h-4 text-gray-400" />
                              <h3 className="font-medium text-primary-navy">{conv.peerName}</h3>
                              <VerifiedBuyerIcon verified={conv.peerKycVerified} size="sm" />
                              {conv.unread > 0 && (
                                <span className="bg-primary-blue text-white text-xs px-2 py-0.5 rounded-full">
                                  {conv.unread}
                                </span>
                              )}
                            </div>
                            {conv.lastMessage && (
                              <p className="text-sm text-gray-600 line-clamp-1">{conv.lastMessage}</p>
                            )}
                          </div>
                          {conv.lastMessageTime && (
                            <span className="text-xs text-gray-400">
                              {new Date(conv.lastMessageTime).toLocaleDateString('sv-SE')}
                            </span>
                          )}
                        </div>
                      </button>
                    ))
                  )
                ) : (
                  contactRequests.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <Shield className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>Inga nya förfrågningar</p>
                    </div>
                  ) : (
                    contactRequests.map((request) => (
                      <div key={request.buyerId} className="p-4 hover:bg-gray-50">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-primary-navy">{request.buyerName}</h3>
                            <VerifiedBuyerBadge verified={request.buyerKycVerified} size="sm" />
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(request.requestDate).toLocaleDateString('sv-SE')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{request.buyerEmail}</p>
                        <div className="flex items-center gap-2 mb-3">
                          <Building className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500">{request.listingTitle}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            request.ndaStatus === 'signed' 
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            NDA {request.ndaStatus === 'signed' ? 'Signerad' : 'Väntar'}
                          </span>
                        </div>
                        {request.message && (
                          <p className="text-sm text-gray-600 italic mb-3">"{request.message}"</p>
                        )}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApproveContact(request)}
                            className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-1"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Godkänn
                          </button>
                          <button
                            onClick={() => handleRejectContact(request)}
                            className="flex-1 px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-1"
                          >
                            <XCircle className="w-4 h-4" />
                            Avslå
                          </button>
                        </div>
                      </div>
                    ))
                  )
                )}
              </div>
            </div>
          </div>

          {/* Chat window */}
          <div className="lg:col-span-2">
            {selectedConversation ? (
              <Chat
                currentUserId={user?.id || 'seller-123'}
                peerId={selectedConversation.peerId}
                peerName={selectedConversation.peerName}
                peerRole={selectedConversation.peerRole}
                listingId={selectedConversation.listingId}
                listingTitle={selectedConversation.listingTitle}
              />
            ) : (
              <div className="bg-white rounded-lg shadow-sm h-[600px] flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg">Välj en konversation eller godkänn en förfrågan</p>
                  <p className="text-sm mt-2">Du kan bara chatta med köpare som har signerat NDA</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SellerChatPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SellerChatContent />
    </Suspense>
  )
}
