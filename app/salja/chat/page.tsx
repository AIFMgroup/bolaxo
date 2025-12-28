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
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6">
          <Link href="/salja/start" className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-primary-navy transition-colors mb-3">
            <ArrowLeft className="w-4 h-4" />
            Tillbaka till försäljningssidan
          </Link>
          <h1 className="text-2xl font-bold text-primary-navy">Köparkommunikation</h1>
          <p className="text-sm text-gray-500 mt-1">Hantera förfrågningar och chatta med intresserade köpare</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Left sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              {/* Tabs */}
              <div className="flex border-b border-gray-100">
                <button
                  onClick={() => setActiveTab('conversations')}
                  className={`flex-1 px-3 py-2.5 text-xs font-medium transition-colors ${
                    activeTab === 'conversations'
                      ? 'text-primary-navy border-b-2 border-primary-navy bg-gray-50/50'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Konversationer ({conversations.length})
                </button>
                <button
                  onClick={() => setActiveTab('requests')}
                  className={`flex-1 px-3 py-2.5 text-xs font-medium relative transition-colors ${
                    activeTab === 'requests'
                      ? 'text-primary-navy border-b-2 border-primary-navy bg-gray-50/50'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Förfrågningar ({contactRequests.length})
                  {contactRequests.length > 0 && (
                    <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
                  )}
                </button>
              </div>

              {/* Content */}
              <div className="divide-y divide-gray-50">
                {activeTab === 'conversations' ? (
                  conversations.length === 0 ? (
                    <div className="p-8 text-center">
                      <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                        <MessageSquare className="w-5 h-5 text-gray-400" />
                      </div>
                      <p className="font-medium text-gray-700">Inga aktiva konversationer</p>
                    </div>
                  ) : (
                    conversations.map((conv) => (
                      <button
                        key={conv.peerId}
                        onClick={() => setSelectedConversation(conv)}
                        className={`w-full p-3 hover:bg-gray-50 transition-colors text-left ${
                          selectedConversation?.peerId === conv.peerId ? 'bg-primary-navy/5 border-l-2 border-l-primary-navy' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                                <User className="w-3.5 h-3.5 text-gray-500" />
                              </div>
                              <h3 className="font-medium text-sm text-primary-navy truncate">{conv.peerName}</h3>
                              <VerifiedBuyerIcon verified={conv.peerKycVerified} size="sm" />
                              {conv.unread > 0 && (
                                <span className="bg-primary-navy text-white text-[10px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0">
                                  {conv.unread}
                                </span>
                              )}
                            </div>
                            {conv.lastMessage && (
                              <p className="text-xs text-gray-500 line-clamp-1 ml-9">{conv.lastMessage}</p>
                            )}
                          </div>
                          {conv.lastMessageTime && (
                            <span className="text-[10px] text-gray-400 flex-shrink-0">
                              {new Date(conv.lastMessageTime).toLocaleDateString('sv-SE')}
                            </span>
                          )}
                        </div>
                      </button>
                    ))
                  )
                ) : (
                  contactRequests.length === 0 ? (
                    <div className="p-8 text-center">
                      <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                        <Shield className="w-5 h-5 text-gray-400" />
                      </div>
                      <p className="font-medium text-gray-700">Inga nya förfrågningar</p>
                    </div>
                  ) : (
                    contactRequests.map((request) => (
                      <div key={request.buyerId} className="p-3 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-sm text-primary-navy">{request.buyerName}</h3>
                            <VerifiedBuyerBadge verified={request.buyerKycVerified} size="sm" />
                          </div>
                          <span className="text-[10px] text-gray-400">
                            {new Date(request.requestDate).toLocaleDateString('sv-SE')}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mb-1">{request.buyerEmail}</p>
                        <div className="flex items-center gap-1.5 mb-2">
                          <Building className="w-3 h-3 text-gray-400" />
                          <span className="text-[11px] text-gray-500">{request.listingTitle}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                            request.ndaStatus === 'signed' 
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}>
                            {request.ndaStatus === 'signed' ? 'NDA Signerad' : 'NDA Väntar'}
                          </span>
                        </div>
                        {request.message && (
                          <p className="text-xs text-gray-500 italic mb-2 bg-gray-50 rounded p-2">"{request.message}"</p>
                        )}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApproveContact(request)}
                            className="flex-1 px-2.5 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            Godkänn
                          </button>
                          <button
                            onClick={() => handleRejectContact(request)}
                            className="flex-1 px-2.5 py-1.5 bg-rose-600 text-white text-xs font-medium rounded-lg hover:bg-rose-700 transition-colors flex items-center justify-center gap-1"
                          >
                            <XCircle className="w-3.5 h-3.5" />
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
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm h-[600px] flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <MessageSquare className="w-7 h-7 text-gray-400" />
                  </div>
                  <p className="font-medium text-gray-700">Välj en konversation</p>
                  <p className="text-sm text-gray-500 mt-1">eller godkänn en förfrågan för att börja chatta</p>
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
