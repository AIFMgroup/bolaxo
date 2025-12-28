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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/kopare/start" className="inline-flex items-center gap-2 text-primary-navy hover:text-primary-blue mb-4">
            <ArrowLeft className="w-4 h-4" />
            Tillbaka till översikt
          </Link>
          <h1 className="text-3xl font-bold text-primary-navy">Meddelanden</h1>
          <p className="text-gray-600 mt-2">Chatta med säljare efter godkänd NDA</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Conversations list */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-4 border-b border-gray-200">
                <h2 className="font-semibold text-primary-navy">Konversationer</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {conversations.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>Inga konversationer än</p>
                    <p className="text-sm mt-2">Signera en NDA för att börja chatta med säljare</p>
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
                            {conv.unread > 0 && (
                              <span className="bg-primary-blue text-white text-xs px-2 py-0.5 rounded-full">
                                {conv.unread}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                            <Building className="w-3 h-3" />
                            <span>{conv.listingTitle}</span>
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
              <div className="bg-white rounded-lg shadow-sm h-[600px] flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg">Välj en konversation för att börja chatta</p>
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
