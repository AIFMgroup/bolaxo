'use client'

import { useState } from 'react'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import SelectDropdown from '@/components/dashboard/SelectDropdown'
import { Users, TrendingUp, Calendar, DollarSign, Award, Phone, Mail, MoreVertical } from 'lucide-react'

export default function TeamPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('month')
  
  const teamMembers = [
    {
      id: 'team-001',
      name: 'Johan Svensson',
      role: 'Senior M&A Advisor',
      email: 'johan.svensson@bolaxo.com',
      phone: '+46 70 123 45 67',
      activeDeals: 3,
      closedDeals: 12,
      totalVolume: 245000000,
      commission: 4900000,
      conversionRate: 68,
      avgDealSize: 20400000,
      status: 'active',
      performance: 'high',
      joinedDate: '2022-03-15'
    },
    {
      id: 'team-002',
      name: 'Anna Lindberg',
      role: 'M&A Advisor',
      email: 'anna.lindberg@bolaxo.com',
      phone: '+46 70 234 56 78',
      activeDeals: 2,
      closedDeals: 8,
      totalVolume: 180000000,
      commission: 3600000,
      conversionRate: 62,
      avgDealSize: 22500000,
      status: 'active',
      performance: 'high',
      joinedDate: '2022-06-01'
    },
    {
      id: 'team-003',
      name: 'Maria Eriksson',
      role: 'Junior M&A Advisor',
      email: 'maria.eriksson@bolaxo.com',
      phone: '+46 70 345 67 89',
      activeDeals: 2,
      closedDeals: 5,
      totalVolume: 85000000,
      commission: 1700000,
      conversionRate: 55,
      avgDealSize: 17000000,
      status: 'active',
      performance: 'medium',
      joinedDate: '2023-01-10'
    },
    {
      id: 'team-004',
      name: 'Erik Nilsson',
      role: 'M&A Analyst',
      email: 'erik.nilsson@bolaxo.com',
      phone: '+46 70 456 78 90',
      activeDeals: 0,
      closedDeals: 0,
      totalVolume: 0,
      commission: 0,
      conversionRate: 0,
      avgDealSize: 0,
      status: 'training',
      performance: 'new',
      joinedDate: '2024-05-01'
    }
  ]

  const getPerformanceBadge = (performance: string) => {
    switch (performance) {
      case 'high':
        return <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700">Hög prestation</span>
      case 'medium':
        return <span className="px-2 py-0.5 text-xs rounded-full bg-amber-100 text-amber-700">Bra prestation</span>
      case 'new':
        return <span className="px-2 py-0.5 text-xs rounded-full bg-accent-pink/10 text-accent-pink">Ny medarbetare</span>
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700">Aktiv</span>
      case 'training':
        return <span className="px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-700">Under träning</span>
      default:
        return null
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-primary-navy">Team</h1>
            <p className="text-sm text-gray-600 mt-1">Översikt över teamets prestationer och aktiviteter</p>
          </div>
          <button className="btn-primary flex items-center gap-2">
            <Users className="w-4 h-4" />
            Lägg till teammedlem
          </button>
        </div>

        {/* Team stats */}
        <div className="grid grid-cols-1 md:grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-accent-pink" />
            </div>
            <p className="text-xl sm:text-2xl font-bold text-primary-navy">{teamMembers.length}</p>
            <p className="text-xs text-gray-600">Teammedlemmar</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-accent-pink" />
            </div>
            <p className="text-xl sm:text-2xl font-bold text-primary-navy">
              {teamMembers.reduce((sum, m) => sum + m.activeDeals, 0)}
            </p>
            <p className="text-xs text-gray-600">Aktiva affärer</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-accent-pink" />
            </div>
            <p className="text-xl sm:text-2xl font-bold text-primary-navy">
              {(teamMembers.reduce((sum, m) => sum + m.totalVolume, 0) / 1000000).toFixed(0)} MSEK
            </p>
            <p className="text-xs text-gray-600">Total volym</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <Award className="w-4 h-4 sm:w-5 sm:h-5 text-accent-pink" />
            </div>
            <p className="text-xl sm:text-2xl font-bold text-primary-navy">
              {Math.round(teamMembers.filter(m => m.conversionRate > 0).reduce((sum, m) => sum + m.conversionRate, 0) / teamMembers.filter(m => m.conversionRate > 0).length)}%
            </p>
            <p className="text-xs text-gray-600">Genomsnittlig konvertering</p>
          </div>
        </div>

        {/* Period selector */}
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Visa data för:</span>
            <div className="flex items-center gap-1">
              {['week', 'month', 'quarter', 'year'].map((period) => (
                <button
                  key={period}
                  onClick={() => setSelectedPeriod(period)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    selectedPeriod === period
                      ? 'bg-accent-pink text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {period === 'week' ? 'Vecka' : 
                   period === 'month' ? 'Månad' :
                   period === 'quarter' ? 'Kvartal' : 'År'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Team members */}
        <div className="grid gap-3 sm:gap-4 md:gap-6">
          {teamMembers.map((member) => (
            <div key={member.id} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-12 h-12 bg-accent-pink/10 rounded-full flex items-center justify-center">
                    <span className="text-lg font-semibold text-accent-pink">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  
                  {/* Member info */}
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-semibold text-primary-navy">{member.name}</h3>
                      {getStatusBadge(member.status)}
                      {getPerformanceBadge(member.performance)}
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{member.role}</p>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <a href={`mailto:${member.email}`} className="flex items-center gap-1 hover:text-accent-pink">
                        <Mail className="w-4 h-4" />
                        {member.email}
                      </a>
                      <span className="flex items-center gap-1">
                        <Phone className="w-4 h-4" />
                        {member.phone}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Anställd {new Date(member.joinedDate).toLocaleDateString('sv-SE')}
                      </span>
                    </div>
                  </div>
                </div>
                
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <MoreVertical className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                </button>
              </div>

              {/* Performance metrics */}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mt-6 pt-6 border-t border-gray-100">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Aktiva affärer</p>
                  <p className="text-xl font-bold text-primary-navy">{member.activeDeals}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Avslutade affärer</p>
                  <p className="text-xl font-bold text-primary-navy">{member.closedDeals}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Total volym</p>
                  <p className="text-xl font-bold text-primary-navy">
                    {member.totalVolume > 0 ? `${(member.totalVolume / 1000000).toFixed(0)} MSEK` : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Provision</p>
                  <p className="text-xl font-bold text-accent-pink">
                    {member.commission > 0 ? `${(member.commission / 1000000).toFixed(1)} MSEK` : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Konvertering</p>
                  <p className="text-xl font-bold text-primary-navy">
                    {member.conversionRate > 0 ? `${member.conversionRate}%` : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Snitt affärsstorlek</p>
                  <p className="text-xl font-bold text-primary-navy">
                    {member.avgDealSize > 0 ? `${(member.avgDealSize / 1000000).toFixed(0)} MSEK` : '-'}
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              {member.status === 'active' && member.closedDeals > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                    <span>Årsmål: 300 MSEK</span>
                    <span>{Math.round((member.totalVolume / 300000000) * 100)}% uppnått</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-accent-pink h-2 rounded-full"
                      style={{ width: `${Math.min((member.totalVolume / 300000000) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Team comparison chart */}
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h2 className="text-lg font-semibold text-primary-navy mb-6">Teamjämförelse - Provision (MSEK)</h2>
          
          <div className="space-y-3">
            {teamMembers
              .filter(m => m.commission > 0)
              .sort((a, b) => b.commission - a.commission)
              .map((member) => {
                const maxCommission = Math.max(...teamMembers.map(m => m.commission))
                const percentage = (member.commission / maxCommission) * 100
                
                return (
                  <div key={member.id} className="flex items-center gap-4">
                    <div className="w-32 text-sm text-primary-navy">{member.name}</div>
                    <div className="flex-1">
                      <div className="w-full bg-gray-200 rounded-full h-6">
                        <div 
                          className="bg-accent-pink h-6 rounded-full flex items-center justify-end pr-2"
                          style={{ width: `${percentage}%` }}
                        >
                          <span className="text-xs text-white font-medium">
                            {(member.commission / 1000000).toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
