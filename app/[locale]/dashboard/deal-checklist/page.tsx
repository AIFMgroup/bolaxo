'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  CheckCircle2, Circle, AlertCircle, Users, Calendar,
  ArrowRight, Clock
} from 'lucide-react'

interface ChecklistItem {
  id: string
  title: string
  description: string
  responsible: 'buyer' | 'seller' | 'joint'
  status: 'completed' | 'in-progress' | 'pending' | 'blocked'
  dueDate?: string
  phase: 'discovery' | 'due-diligence' | 'negotiation' | 'legal' | 'closing'
  notes?: string
}

const PHASES = [
  { id: 'discovery', label: 'Discovery', icon: '🔍', color: 'blue' },
  { id: 'due-diligence', label: 'Due Diligence', icon: '📊', color: 'cyan' },
  { id: 'negotiation', label: 'Negotiation', icon: '🤝', color: 'purple' },
  { id: 'legal', label: 'Legal Review', icon: '⚖️', color: 'orange' },
  { id: 'closing', label: 'Closing', icon: '✅', color: 'green' }
]

const DEMO_CHECKLIST: ChecklistItem[] = [
  {
    id: 'c1',
    title: 'NDA Signed',
    description: 'Both parties have executed the Non-Disclosure Agreement',
    responsible: 'joint',
    status: 'completed',
    phase: 'discovery',
    dueDate: 'Oct 29, 2024',
    notes: 'Completed on Oct 29 - both parties signed digitally'
  },
  {
    id: 'c2',
    title: 'Dataroom Access Granted',
    description: 'Buyer has been granted access to seller dataroom with all documents',
    responsible: 'seller',
    status: 'completed',
    phase: 'discovery',
    dueDate: 'Oct 29, 2024',
    notes: 'Access granted 1 hour after NDA signature'
  },
  {
    id: 'c3',
    title: 'Initial Management Presentation',
    description: 'Seller provides overview of business, strategy, and key metrics',
    responsible: 'seller',
    status: 'completed',
    phase: 'discovery',
    dueDate: 'Oct 30, 2024',
    notes: 'Presentation delivered - 60 slides covering business overview'
  },
  {
    id: 'c4',
    title: 'DD Report Generated',
    description: 'Automated due diligence report created from seller data',
    responsible: 'seller',
    status: 'completed',
    phase: 'due-diligence',
    dueDate: 'Oct 30, 2024',
    notes: '25+ page professional DD report auto-generated'
  },
  {
    id: 'c5',
    title: 'Buyer DD Review Started',
    description: 'Buyer begins comprehensive review of due diligence findings',
    responsible: 'buyer',
    status: 'in-progress',
    phase: 'due-diligence',
    dueDate: 'Nov 3, 2024',
    notes: 'Buyer team reviewing financial statements and customer contracts'
  }
]

interface Phase {
  id: string
  label: string
  icon: string
  color: string
  items: ChecklistItem[]
  completed: number
  total: number
}

function DealChecklistContent() {
  const searchParams = useSearchParams()
  const dealId = searchParams.get('dealId') || 'listing-1'
  
  const [phases, setPhases] = useState<Phase[]>([])
  const [overallProgress, setOverallProgress] = useState(0)
  const [completedCount, setCompletedCount] = useState(0)
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    const phasesData = PHASES.map(p => {
      const items = DEMO_CHECKLIST.filter(item => item.phase === p.id)
      const completed = items.filter(item => item.status === 'completed').length

      return {
        ...p,
        items,
        completed,
        total: items.length
      }
    })

    setPhases(phasesData)

    const total = DEMO_CHECKLIST.length
    const completed = DEMO_CHECKLIST.filter(item => item.status === 'completed').length
    
    setTotalCount(total)
    setCompletedCount(completed)
    setOverallProgress((completed / total) * 100)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-primary-navy mb-2">
                📋 Shared Deal Checklist
              </h1>
              <p className="text-gray-600">
                Follow the complete M&A journey from discovery to closing
              </p>
            </div>
            <Link href="../deal-pipeline">
              <button className="flex items-center gap-2 px-4 py-2 bg-primary-navy text-white rounded-lg hover:bg-opacity-90">
                <ArrowRight className="w-4 h-4" />
                Back to Pipeline
              </button>
            </Link>
          </div>
        </div>

        <div className="bg-gradient-to-r from-primary-navy to-blue-600 text-white rounded-lg p-8 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-lg opacity-90">Overall Progress</p>
              <p className="text-4xl font-bold mt-2">
                {completedCount} of {totalCount} tasks completed
              </p>
            </div>
            <div className="text-right">
              <p className="text-5xl font-bold">{overallProgress.toFixed(0)}%</p>
            </div>
          </div>

          <div className="w-full bg-white bg-opacity-20 rounded-full h-4">
            <div
              className="bg-white h-4 rounded-full transition-all"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>

        <div className="text-center py-8">
          <p className="text-gray-600">Deal checklist loaded successfully!</p>
        </div>
      </div>
    </div>
  )
}

export default function DealChecklistPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center"><p>Loading...</p></div>}>
      <DealChecklistContent />
    </Suspense>
  )
}
