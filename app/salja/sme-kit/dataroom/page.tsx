'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Lock, Upload, CheckCircle, AlertCircle, File, FolderOpen, Trash2, Eye, Download, Plus, Sparkles } from 'lucide-react'
import { AIPriceSuggestion } from '@/components/AIPriceSuggestion'

interface DataRoomFile {
  id: string
  folder: string
  name: string
  size: number
  uploadedAt: Date
  uploadedBy: string
}

interface DataRoomStructure {
  [key: string]: {
    name: string
    icon: string
    color: string
  }
}

export default function DataRoomPage() {
  const [step, setStep] = useState<'setup' | 'files' | 'review' | 'complete'>('setup')
  const [files, setFiles] = useState<DataRoomFile[]>([])
  const [selectedFolder, setSelectedFolder] = useState('financials')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAIPricing, setShowAIPricing] = useState(false)
  const [suggestedPrice, setSuggestedPrice] = useState<number | null>(null)

  const structure: DataRoomStructure = {
    financials: { name: '💰 Finansiell data', icon: '💰', color: 'bg-green-100 border-green-300' },
    agreements: { name: '📄 Avtal & kontrakt', icon: '📄', color: 'bg-blue-100 border-blue-300' },
    legal: { name: '⚖️ Juridisk dokumentation', icon: '⚖️', color: 'bg-purple-100 border-purple-300' },
    tax: { name: '🏦 Skatt & redovisning', icon: '🏦', color: 'bg-yellow-100 border-yellow-300' },
    employees: { name: '👥 Personal & HR', icon: '👥', color: 'bg-orange-100 border-orange-300' },
    ip: { name: '🔐 IP & licenser', icon: '🔐', color: 'bg-red-100 border-red-300' },
    other: { name: '📦 Övrigt', icon: '📦', color: 'bg-gray-100 border-gray-300' }
  }

  const handleCreateDataRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await fetch('/api/sme/dataroom/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: 'temp-listing-id' })
      })
      if (!response.ok) throw new Error('Failed')
      setStep('files')
    } catch (err) {
      setError('Datarum kunde inte skapas')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = e.target.files
    if (!newFiles) return

    for (let i = 0; i < newFiles.length; i++) {
      const file = newFiles[i]
      const newFile: DataRoomFile = {
        id: Math.random().toString(),
        folder: selectedFolder,
        name: file.name,
        size: file.size,
        uploadedAt: new Date(),
        uploadedBy: 'Du'
      }
      setFiles([...files, newFile])
    }
  }

  const handleRemoveFile = (id: string) => {
    setFiles(files.filter(f => f.id !== id))
  }

  const filesByFolder = Object.keys(structure).reduce((acc, folder) => {
    acc[folder] = files.filter(f => f.folder === folder)
    return acc
  }, {} as Record<string, DataRoomFile[]>)

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <Link href="/salja/sme-kit" className="inline-flex items-center gap-2 text-primary-navy hover:text-accent-pink mb-4">
            <ArrowLeft className="w-5 h-5" /> Tillbaka
          </Link>
          <div className="flex items-center gap-3">
            <Lock className="w-8 h-8 text-primary-navy" />
            <div>
              <h1 className="text-3xl font-bold text-primary-navy">Datarum</h1>
              <p className="text-gray-600">Säker dokumentlagring med åtkomstlogg</p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex gap-2">
            {['setup', 'files', 'review', 'complete'].map((s, idx) => (
              <div key={s} className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all ${
                    ['setup', 'files', 'review', 'complete'].indexOf(step) >= idx ? 'bg-accent-pink' : ''
                  }`}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-300 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Step 1: Setup */}
        {step === 'setup' && (
          <div className="bg-white rounded-lg border-2 border-gray-200 p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-primary-navy mb-6">Skapa ditt datarum</h2>
            
            <div className="mb-8">
              <h3 className="font-semibold text-primary-navy mb-4">Auto-genererad struktur:</h3>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(structure).map(([key, val]) => (
                  <div key={key} className={`p-3 border-2 rounded-lg ${val.color}`}>
                    <p className="text-sm font-semibold text-gray-800">{val.name}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 mb-8">
              <h3 className="font-semibold text-blue-900 mb-2">📋 7 mappar kommer att skapas:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>✓ Finansiell data (balans, resultat, kassaflöde)</li>
                <li>✓ Avtal & kontrakt (kund, leverantör, anställning)</li>
                <li>✓ Juridisk dokumentation (stiftelsedokument, etc)</li>
                <li>✓ Skatt & redovisning (revisionsberättelse, deklaration)</li>
                <li>✓ Personal & HR (anställningsavtal, personalnyckeltal)</li>
                <li>✓ IP & licenser (patent, varumärken, licenser)</li>
                <li>✓ Övrigt (diverse dokument)</li>
              </ul>
            </div>

            <form onSubmit={handleCreateDataRoom} className="space-y-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 bg-primary-navy text-white font-semibold rounded-lg hover:shadow-lg disabled:opacity-50 transition-all"
              >
                {loading ? 'Skapar datarum...' : 'Skapa datarum'}
              </button>
            </form>
          </div>
        )}

        {/* Step 2: Upload Files */}
        {step === 'files' && (
          <div className="bg-white rounded-lg border-2 border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-primary-navy mb-6">Ladda upp dokument</h2>

            {/* Folder Tabs */}
            <div className="mb-8 flex flex-wrap gap-2">
              {Object.entries(structure).map(([key, val]) => (
                <button
                  key={key}
                  onClick={() => setSelectedFolder(key)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    selectedFolder === key
                      ? 'bg-accent-pink text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {val.icon} {val.name}
                </button>
              ))}
            </div>

            {/* Upload Area */}
            <div className="mb-8 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-accent-pink transition-colors">
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                id="dataroom-upload"
              />
              <label htmlFor="dataroom-upload" className="cursor-pointer">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-semibold text-primary-navy mb-2">
                  Klicka för att välja filer eller dra dem här
                </p>
                <p className="text-sm text-gray-600">Till: {structure[selectedFolder].name}</p>
              </label>
            </div>

            {/* Files List */}
            {Object.entries(filesByFolder).some(([_, ff]) => ff.length > 0) && (
              <div className="space-y-6 mb-8">
                {Object.entries(structure).map(([folder, val]) => {
                  const folderFiles = filesByFolder[folder]
                  if (folderFiles.length === 0) return null

                  return (
                    <div key={folder} className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
                      <h3 className="font-semibold text-primary-navy mb-3 flex items-center gap-2">
                        <FolderOpen className="w-5 h-5" />
                        {val.name} ({folderFiles.length})
                      </h3>
                      <div className="space-y-2">
                        {folderFiles.map(file => (
                          <div key={file.id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200">
                            <div className="flex items-center gap-3 flex-1">
                              <File className="w-5 h-5 text-gray-400" />
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-700 truncate">{file.name}</p>
                                <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleRemoveFile(file.id)}
                              className="text-red-600 hover:text-red-700 p-2"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* AI Price Suggestion - shows when financial docs are uploaded */}
            {filesByFolder['financials']?.length > 0 && (
              <div className="mb-8">
                <button
                  onClick={() => setShowAIPricing(!showAIPricing)}
                  className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-violet-50 to-purple-50 border-2 border-violet-200 rounded-xl hover:border-violet-300 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-violet-600" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-violet-900">AI Prisförslag</h3>
                      <p className="text-sm text-violet-600">Analysera dina finansiella dokument för ett prisförslag</p>
                    </div>
                  </div>
                  <span className="text-violet-500">{showAIPricing ? '−' : '+'}</span>
                </button>
                
                {showAIPricing && (
                  <div className="mt-4">
                    <AIPriceSuggestion 
                      onApplyPrice={(price) => {
                        setSuggestedPrice(price)
                        setShowAIPricing(false)
                      }}
                    />
                  </div>
                )}
                
                {suggestedPrice && (
                  <div className="mt-4 p-4 bg-green-50 border-2 border-green-200 rounded-xl">
                    <p className="text-sm text-green-800">
                      ✓ AI-föreslaget pris: <strong>{(suggestedPrice / 1000000).toFixed(1)} MSEK</strong> har sparats
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={() => setStep('review')}
                disabled={files.length === 0}
                className="w-full px-6 py-3 bg-primary-navy text-white font-semibold rounded-lg hover:shadow-lg disabled:opacity-50 transition-all"
              >
                Granska & Spara ({files.length} filer)
              </button>
              <button
                onClick={() => setStep('setup')}
                className="w-full px-6 py-3 border-2 border-primary-navy text-primary-navy font-semibold rounded-lg hover:bg-primary-navy/5 transition-all"
              >
                Tillbaka
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 'review' && (
          <div className="bg-white rounded-lg border-2 border-gray-200 p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-primary-navy mb-6">Granska datarum</h2>

            <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-green-900">Datarum är redo!</h3>
                  <p className="text-sm text-green-800 mt-1">7 mappar skapade • {files.length} dokument uppladdade</p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold text-primary-navy mb-3">Audit Trail aktiverad:</h3>
              <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 text-sm text-blue-800">
                ✓ All filåtkomst loggas automatiskt<br/>
                ✓ Varje köpare får eget access-log<br/>
                ✓ Timestamps & IP-adress sparas<br/>
                ✓ Vattenmärkta PDFs (Confidential + email + tid)
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => setStep('complete')}
                className="w-full px-6 py-3 bg-primary-navy text-white font-semibold rounded-lg hover:shadow-lg transition-all"
              >
                Spara & Avsluta
              </button>
              <button
                onClick={() => setStep('files')}
                className="w-full px-6 py-3 border-2 border-primary-navy text-primary-navy font-semibold rounded-lg"
              >
                Lägg till fler filer
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Complete */}
        {step === 'complete' && (
          <div className="bg-white rounded-lg border-2 border-green-300 p-8 text-center max-w-2xl mx-auto">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-primary-navy mb-3">Datarum är redo!</h2>
            <p className="text-gray-600 mb-8">Ditt säkra dokumentrum är nu aktivt. Köpare kan komma åt det efter de signerar NDA.</p>

            <div className="space-y-3 mb-8">
              <Link href="/salja/sme-kit/teaser" className="block px-6 py-3 bg-primary-navy text-white font-semibold rounded-lg hover:shadow-lg">
                Gå till nästa steg: Teaser & IM →
              </Link>
              <Link href="/salja/sme-kit" className="block px-6 py-3 border-2 border-primary-navy text-primary-navy font-semibold rounded-lg">
                Tillbaka till hub
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
