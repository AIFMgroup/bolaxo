'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MessageSquare, User, Building } from 'lucide-react'
import Chat from '@/components/Chat'
import { useAuth } from '@/contexts/AuthContext'

interface Conversation {
  peerId: string
  peerName: string
  peerRole: string
  listingId: string
  listingTitle: string
  lastMessage?: string
  lastMessageTime?: string
  unread: number
}

function BuyerChatContent() {
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  
  // Fetch conversations from API
  useEffect(() => {
    if (!user) return

    const fetchConversations = async () => {
      try {
        const response = await fetch('/api/chat/conversations', { credentials: 'include' })

        if (response.ok) {
          const data = await response.json()
          setConversations(data.conversations || [])
          
          // If peerId in query params, select that conversation
          const peerId = searchParams.get('peerId')
          if (peerId && data.conversations) {
            const conv = data.conversations.find((c: Conversation) => c.peerId === peerId)
            if (conv) {
              setSelectedConversation(conv)
            }
          }
        }
      } catch (error) {
        console.error('Error fetching conversations:', error)
        // Fallback to empty if API fails
        setConversations([])
      }
    }

    fetchConversations()
  }, [user, searchParams])

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Du måste logga in för att chatta</p>
          <Link href="/login" className="text-primary-blue hover:underline">
            Gå till inloggning
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6">
          <Link href="/kopare/start" className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-primary-navy transition-colors mb-3">
            <ArrowLeft className="w-4 h-4" />
            Tillbaka till översikt
          </Link>
          <h1 className="text-2xl font-bold text-primary-navy">Meddelanden</h1>
          <p className="text-sm text-gray-500 mt-1">Chatta med säljare efter godkänd NDA</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Conversations list */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                <h2 className="font-semibold text-sm text-primary-navy">Konversationer</h2>
              </div>
              <div className="divide-y divide-gray-50">
                {conversations.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-gray-400" />
                    </div>
                    <p className="font-medium text-gray-700">Inga konversationer än</p>
                    <p className="text-xs text-gray-500 mt-1">Signera en NDA för att börja chatta</p>
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
                            {conv.unread > 0 && (
                              <span className="bg-primary-navy text-white text-[10px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0">
                                {conv.unread}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-gray-400 ml-9">
                            <Building className="w-3 h-3" />
                            <span className="truncate">{conv.listingTitle}</span>
                          </div>
                          {conv.lastMessage && (
                            <p className="text-xs text-gray-500 line-clamp-1 mt-1 ml-9">{conv.lastMessage}</p>
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
                )}
              </div>
            </div>
          </div>

          {/* Chat window */}
          <div className="lg:col-span-2">
            {selectedConversation ? (
              <Chat
                currentUserId={user.id}
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
                  <p className="text-sm text-gray-500 mt-1">för att börja chatta</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function BuyerChatPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BuyerChatContent />
    </Suspense>
  )
}
