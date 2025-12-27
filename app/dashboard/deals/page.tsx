'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { MessageSquare, FileText, ClipboardCheck, Scale, Signature, CheckCircle, DollarSign, Target, ArrowRight } from 'lucide-react'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { DEMO_DEALS } from '@/lib/demo-data'

const DEMO_MODE = true // Set to true to show demo data

export default function MyDealsPage() {
  const [deals, setDeals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDeals()
  }, [])

  const fetchDeals = async () => {
    try {
      if (DEMO_MODE) {
        // Use demo data
        setDeals(DEMO_DEALS)
      } else {
        // Fetch from API
        const response = await fetch('/api/nda-requests?role=buyer', {
          credentials: 'include'
        })
        if (response.ok) {
          const data = await response.json()
          setDeals(data.requests?.filter((r: any) => r.status === 'approved') || [])
        }
      }
    } catch (error) {
      console.error('Error fetching deals:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-primary-blue border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 p-6 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary-navy mb-2">Mina affärer</h1>
          <p className="text-gray-600">Hantera alla steg i köpprocessen för dina aktiva affärer</p>
        </div>

        {deals.length === 0 ? (
          <div className="bg-white rounded-lg border-2 border-gray-200 p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Inga aktiva affärer</h2>
            <p className="text-gray-600 mb-4">Du behöver godkända NDAs för att komma igång</p>
            <Link href="/dashboard/nda-status" className="text-primary-blue hover:underline">
              Visa mina NDA-förfrågningar →
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {deals.map((deal) => (
              <div key={deal.id} className="bg-white rounded-lg border-2 border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                {/* Deal Header */}
                <div className="bg-gradient-to-r from-primary-navy/5 to-accent-pink/5 p-6 border-b border-gray-200">
                  <h2 className="text-xl font-bold text-primary-navy">
                    {deal.listing?.anonymousTitle || 'Företag'}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Godkänd NDA: {new Date(deal.approvedAt).toLocaleDateString('sv-SE')}
                  </p>
                </div>

                {/* Deal Actions */}
                <div className="p-6">
                  <p className="text-sm font-semibold text-gray-700 mb-4">Tillgängliga åtgärder:</p>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Q&A Center */}
                    <Link 
                      href={`/kopare/qa/${deal.listingId}`}
                      className="group flex items-start gap-4 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all"
                    >
                      <div className="flex-shrink-0">
                        <MessageSquare className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">Q&A Center</h3>
                        <p className="text-sm text-gray-600">Ställ frågor till säljaren (48h SLA)</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                    </Link>

                    {/* LoI Editor */}
                    <Link 
                      href={`/kopare/loi/${deal.listingId}`}
                      className="group flex items-start gap-4 p-4 border-2 border-gray-200 rounded-lg hover:border-green-400 hover:bg-green-50 transition-all"
                    >
                      <div className="flex-shrink-0">
                        <FileText className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">LoI Editor</h3>
                        <p className="text-sm text-gray-600">Skapa & förhandla Letter of Intent</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors" />
                    </Link>

                    {/* DD Manager */}
                    <Link 
                      href={`/kopare/dd/${deal.listingId}`}
                      className="group flex items-start gap-4 p-4 border-2 border-gray-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-all"
                    >
                      <div className="flex-shrink-0">
                        <ClipboardCheck className="w-6 h-6 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">DD Manager</h3>
                        <p className="text-sm text-gray-600">Due Diligence checklist (17 tasks)</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
                    </Link>

                    {/* SPA Editor */}
                    <Link 
                      href={`/kopare/spa/${deal.listingId}`}
                      className="group flex items-start gap-4 p-4 border-2 border-gray-200 rounded-lg hover:border-amber-400 hover:bg-amber-50 transition-all"
                    >
                      <div className="flex-shrink-0">
                        <Scale className="w-6 h-6 text-amber-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">SPA Editor</h3>
                        <p className="text-sm text-gray-600">Share Purchase Agreement</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-amber-600 transition-colors" />
                    </Link>

                    {/* Digital Signing */}
                    <Link 
                      href={`/kopare/signing/${deal.listingId}`}
                      className="group flex items-start gap-4 p-4 border-2 border-gray-200 rounded-lg hover:border-red-400 hover:bg-red-50 transition-all"
                    >
                      <div className="flex-shrink-0">
                        <Signature className="w-6 h-6 text-red-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">Digital Signing</h3>
                        <p className="text-sm text-gray-600">Signera SPA med BankID</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-red-600 transition-colors" />
                    </Link>

                    {/* Closing Checklist */}
                    <Link 
                      href={`/kopare/closing/${deal.listingId}`}
                      className="group flex items-start gap-4 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-all"
                    >
                      <div className="flex-shrink-0">
                        <CheckCircle className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">Closing Checklist</h3>
                        <p className="text-sm text-gray-600">Final verification innan betalning</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                    </Link>

                    {/* Payment & Closing */}
                    <Link 
                      href={`/kopare/payment/${deal.listingId}`}
                      className="group flex items-start gap-4 p-4 border-2 border-gray-200 rounded-lg hover:border-green-600 hover:bg-green-50 transition-all"
                    >
                      <div className="flex-shrink-0">
                        <DollarSign className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">Payment & Closing</h3>
                        <p className="text-sm text-gray-600">Processera betalning & överföring</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors" />
                    </Link>

                    {/* Earnout Tracker */}
                    <Link 
                      href={`/salja/earnout/${deal.listingId}`}
                      className="group flex items-start gap-4 p-4 border-2 border-gray-200 rounded-lg hover:border-purple-600 hover:bg-purple-50 transition-all"
                    >
                      <div className="flex-shrink-0">
                        <Target className="w-6 h-6 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">Earnout Tracker</h3>
                        <p className="text-sm text-gray-600">Spåra KPI-performance (3 år)</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Complete Flow Info */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mt-8">
          <h3 className="font-bold text-blue-900 mb-3">🚀 Komplett M&A Flöde</h3>
          <p className="text-sm text-blue-800 mb-3">
            Här kan du se alla steg från frågor till faktisk köp:
          </p>
          <ol className="text-sm text-blue-800 space-y-1 ml-4 list-decimal">
            <li><strong>Q&A Center</strong> - Ställ frågor till säljaren</li>
            <li><strong>LoI Editor</strong> - Skapa initialt bud</li>
            <li><strong>DD Manager</strong> - Genomför due diligence</li>
            <li><strong>SPA Editor</strong> - Förhandla Share Purchase Agreement</li>
            <li><strong>Digital Signing</strong> - Signera avtalet juridiskt bindande</li>
            <li><strong>Closing Checklist</strong> - Verifiera allt innan betalning</li>
            <li><strong>Payment & Closing</strong> - Processera betalning & aktieöverlåtelse</li>
            <li><strong>Earnout Tracker</strong> - Spåra KPI efter köp (3 år)</li>
          </ol>
        </div>
      </div>
    </DashboardLayout>
  )
}
