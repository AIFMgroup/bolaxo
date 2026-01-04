'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useBuyerStore } from '@/store/buyerStore'
import { MessageCircle, Folder } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { getMessages, sendMessage } from '@/lib/api-client'

export default function DataroomPage() {
  const params = useParams()
  const router = useRouter()
  const { ndaRequestedObjects } = useBuyerStore()
  const { user } = useAuth()
  
  const objectId = params.id as string
  const [object, setObject] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const hasNDA = ndaRequestedObjects.includes(objectId)

  const [activeTab, setActiveTab] = useState<'dataroom' | 'qa'>('qa')
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState<any[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        // Fetch listing from API
        const response = await fetch(`/api/listings/${objectId}`, { credentials: 'include' })
        if (response.ok) {
          const listing = await response.json()
          setObject(listing)
          
          // Load existing Q&A messages between buyer and seller for this listing
          if (user && listing?.user?.id) {
            try {
              const res = await getMessages({ userId: user.id, listingId: objectId, peerId: listing.user.id })
              setMessages(res.messages || [])
            } catch (msgError) {
              console.error('Error loading messages:', msgError)
            }
          }
        } else {
          console.error('Failed to fetch listing')
        }
      } catch (e) {
        console.error('Error loading datarum:', e)
      } finally {
        setLoading(false)
      }
    }
    
    if (objectId) {
      load()
    }
  }, [objectId, user])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-blue"></div>
      </div>
    )
  }

  if (!object) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text-dark mb-2">Objekt hittades inte</h1>
          <Link href="/sok" className="text-primary-blue hover:underline">
            Tillbaka till sök
          </Link>
        </div>
      </div>
    )
  }

  if (!hasNDA) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-light-blue/20 flex items-center justify-center py-6 sm:py-8 md:py-12 px-3 sm:px-4">
        <div className="max-w-2xl w-full card text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          <h1 className="text-2xl sm:text-3xl font-bold text-text-dark mb-4">
            NDA krävs för tillgång
          </h1>
          <p className="text-text-gray mb-8">
            Du behöver signera NDA innan du kan komma åt datarummet och Q&A.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href={`/objekt/${objectId}`} className="btn-ghost">
              ← Tillbaka
            </Link>
            <Link href={`/nda/${objectId}`} className="btn-primary">
              Be om NDA
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const mockQA = [
    {
      id: 1,
      question: 'Vad är kundernas genomsnittliga kontrakt stid?',
      answer: 'Majoriteten av våra kunder har 12-24 månaders avtal. Renewal rate är cirka 95%.',
      askedBy: 'Verifierad köpare',
      answeredBy: 'Säljaren',
      date: '2024-01-15',
      pinned: true
    },
    {
      id: 2,
      question: 'Hur ser personalstrukturen ut? Finns det risk för nyckelpersonsberoende?',
      answer: 'Vi har 8 konsulter + 2 i admin/försäljning. Ingen enskild person ansvarar för >20% av omsättningen.',
      askedBy: 'Verifierad köpare',
      answeredBy: 'Säljaren',
      date: '2024-01-14'
    }
  ]

  const dataroomFolders = [
    {
      name: 'Ekonomi',
      files: [
        { name: 'Årsredovisning 2023.pdf', size: '2.4 MB', date: '2024-01-10' },
        { name: 'Årsredovisning 2022.pdf', size: '2.1 MB', date: '2024-01-10' },
        { name: 'Månadrapporter 2024.xlsx', size: '845 KB', date: '2024-01-15' },
        { name: 'Budget & Prognos.xlsx', size: '512 KB', date: '2024-01-12' }
      ]
    },
    {
      name: 'Avtal',
      files: [
        { name: 'Kundkontrakt - anonymiserade.pdf', size: '4.2 MB', date: '2024-01-10' },
        { name: 'Leverantörsavtal.pdf', size: '1.8 MB', date: '2024-01-10' },
        { name: 'Hyresavtal lokaler.pdf', size: '650 KB', date: '2024-01-10' }
      ]
    },
    {
      name: 'Personal',
      files: [
        { name: 'Org-schema.pdf', size: '120 KB', date: '2024-01-12' },
        { name: 'Anställningsavtal (anonymiserade).pdf', size: '2.1 MB', date: '2024-01-10' }
      ]
    }
  ]

  const handleAskQuestion = async () => {
    if (!question.trim() || !user || !object?.user?.id) return
    try {
      await sendMessage({
        listingId: objectId,
        senderId: user.id,
        recipientId: object.user.id,
        subject: 'Q&A fråga',
        content: question.trim(),
      })
      setQuestion('')
      // Refresh thread after sending
      const res = await getMessages({ userId: user.id, listingId: objectId, peerId: object.user.id })
      setMessages(res.messages || [])
    } catch (e) {}
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-light-blue/20 py-8">
      <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Link href={`/objekt/${objectId}`} className="text-primary-blue hover:underline inline-block mb-4">
            ← Tillbaka till objektet
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-text-dark mb-2">
            Datarum & Q&A
          </h1>
          <p className="text-text-gray">
            {object.companyName || object.anonymousTitle}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('qa')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center ${
              activeTab === 'qa'
                ? 'bg-primary-blue text-white'
                : 'bg-gray-100 text-text-gray hover:bg-gray-200'
            }`}
          >
            <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            Q&A
          </button>
          <button
            onClick={() => setActiveTab('dataroom')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center ${
              activeTab === 'dataroom'
                ? 'bg-primary-blue text-white'
                : 'bg-gray-100 text-text-gray hover:bg-gray-200'
            }`}
          >
            <Folder className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            Datarum
          </button>
        </div>

        {/* Content */}
        {activeTab === 'qa' && (
          <div className="space-y-6">
            {/* Ask Question */}
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Ställ en fråga</h2>
              <div className="space-y-3">
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Skriv din fråga här..."
                  rows={4}
                  className="w-full px-3 sm:px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-blue focus:outline-none"
                />
                <button
                  onClick={handleAskQuestion}
                  disabled={!question.trim()}
                  className={`btn-primary w-full ${!question.trim() && 'opacity-50 cursor-not-allowed'}`}
                >
                  Skicka fråga
                </button>
              </div>
              <p className="text-xs text-text-gray mt-3">
                Frågor och svar blir synliga för alla som signerat NDA
              </p>
            </div>

            {/* Q&A Thread */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Tidigare frågor & svar</h2>
              
              {messages.map((m) => (
                <div key={m.id} className={`card`}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm font-semibold text-text-dark">{m.senderId === user?.id ? 'Du' : 'Säljaren'}</span>
                    <span className="text-xs text-text-gray">{new Date(m.createdAt).toLocaleString('sv-SE')}</span>
                  </div>
                  <p className="text-text-dark whitespace-pre-wrap">{m.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'dataroom' && (
          <div className="space-y-6">
            {/* Info Banner */}
            <div className="card bg-light-blue">
              <div className="flex items-start">
                <svg className="w-6 h-6 text-primary-blue mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div>
                  <h3 className="font-semibold mb-1">Vattenmärkning & loggning</h3>
                  <p className="text-sm text-text-gray">
                    Alla dokument är vattenmärkta med ditt användar-ID. Säljaren ser vem som laddat ner vad och när.
                  </p>
                </div>
              </div>
            </div>

            {/* Folders */}
            {dataroomFolders.map((folder, index) => (
              <div key={index} className="card">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <svg className="w-6 h-6 text-primary-blue mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                  </svg>
                  {folder.name}
                </h2>

                <div className="space-y-2">
                  {folder.files.map((file, fileIndex) => (
                    <div
                      key={fileIndex}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center flex-1">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                        </svg>
                        <div>
                          <div className="font-medium text-sm">{file.name}</div>
                          <div className="text-xs text-text-gray">
                            {file.size} • Uppladdad {file.date}
                          </div>
                        </div>
                      </div>
                      <button className="btn-secondary text-sm px-3 sm:px-3 sm:px-4 py-2 min-h-10 sm:min-h-auto">
                        Ladda ner
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Request More */}
            <div className="card bg-gray-50 text-center">
              <h3 className="font-semibold mb-2">Saknar du något dokument?</h3>
              <p className="text-sm text-text-gray mb-4">
                Be säljaren om fler dokument via Q&A-sektionen
              </p>
              <button
                onClick={() => setActiveTab('qa')}
                className="btn-secondary"
              >
                Gå till Q&A →
              </button>
            </div>
          </div>
        )}

        {/* Bottom CTA */}
        <div className="card bg-primary-blue text-white mt-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg mb-1">Redo att lämna ett bud?</h3>
              <p className="text-sm opacity-90">
                Skapa ett indikativt bud (LOI) direkt i plattformen
              </p>
            </div>
            <Link href={`/objekt/${objectId}/loi`} className="btn-secondary ml-4">
              Skapa LOI →
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}

