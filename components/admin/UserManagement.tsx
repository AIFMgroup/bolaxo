'use client'

import { useState, useEffect } from 'react'
import {
  Search, ChevronDown, Users, Mail, CheckCircle, XCircle,
  MoreVertical, Eye, Lock, Trash2, ZoomIn, RefreshCw, Filter,
  ChevronUp, ChevronLeft, ChevronRight, Copy, Send, Share2,
  Shield, Sparkles, User, Building, MapPin, Calendar, Activity, TrendingUp
} from 'lucide-react'
import { useAdminUsers } from '@/lib/api-hooks'
import AdminCustomSelect from './AdminCustomSelect'
import ModernSelect from './ModernSelect'

interface User {
  id: string
  email: string
  name: string | null
  role: string
  verified: boolean
  bankIdVerified: boolean
  phone: string | null
  companyName: string | null
  orgNumber: string | null
  region: string | null
  referralCode: string | null
  createdAt: string
  lastLoginAt: string | null
  _count: {
    listings: number
    valuations: number
  }
}

interface UserManagementProps {
  onUserSelect?: (user: User) => void
}

export default function UserManagement({ onUserSelect }: UserManagementProps) {
  const { fetchUsers, updateUser, deleteUser, resetPassword, bulkAction, loading, error } = useAdminUsers()
  
  const [users, setUsers] = useState<User[]>([])
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 })
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [verifiedFilter, setVerifiedFilter] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [showReferralModal, setShowReferralModal] = useState<User | null>(null)
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)

  // Load users
  useEffect(() => {
    const loadUsers = async () => {
      const result = await fetchUsers({
        page: pagination.page,
        limit: pagination.limit,
        search,
        role: roleFilter,
        verified: verifiedFilter === 'verified' ? true : verifiedFilter === 'unverified' ? false : undefined,
        sortBy,
        sortOrder
      })
      
      if (result) {
        setUsers(result.users)
        setPagination({
          page: result.page,
          limit: result.limit,
          total: result.total,
          pages: result.pages
        })
      }
    }
    
    loadUsers()
  }, [fetchUsers, pagination.page, search, roleFilter, verifiedFilter, sortBy, sortOrder])

  // Handle user actions
  const handleUpdateRole = async (userId: string, newRole: string) => {
    await updateUser(userId, { role: newRole })
    // Refresh users
    const updatedUsers = users.map(u => u.id === userId ? { ...u, role: newRole } : u)
    setUsers(updatedUsers)
  }

  const handleDeleteUser = async (userId: string) => {
    if (confirm('Är du säker på att du vill ta bort denna användare?')) {
      await deleteUser(userId)
      setUsers(users.filter(u => u.id !== userId))
    }
  }

  const handleResetPassword = async (userId: string) => {
    if (confirm('Skicka lösenordsåterställning till användaren?')) {
      await resetPassword(userId)
      alert('Lösenordsåterställning skickad!')
    }
  }

  const handleBulkDelete = async () => {
    if (selectedUsers.size === 0) return
    
    if (confirm(`Ta bort ${selectedUsers.size} användare?`)) {
      await bulkAction(Array.from(selectedUsers), 'delete')
      setUsers(users.filter(u => !selectedUsers.has(u.id)))
      setSelectedUsers(new Set())
    }
  }

  const toggleUserSelection = (userId: string) => {
    const newSelection = new Set(selectedUsers)
    if (newSelection.has(userId)) {
      newSelection.delete(userId)
    } else {
      newSelection.add(userId)
    }
    setSelectedUsers(newSelection)
  }

  const selectAllUsers = () => {
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set())
    } else {
      setSelectedUsers(new Set(users.map(u => u.id)))
    }
  }

  const formatDate = (date: string | null) => {
    if (!date) return 'Aldrig'
    return new Date(date).toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const roleOptions = [
    { value: '', label: 'Alla roller', icon: <Users className="w-4 h-4" /> },
    { value: 'buyer', label: 'Köpare', icon: <User className="w-4 h-4" />, description: 'Kan söka och köpa företag' },
    { value: 'seller', label: 'Säljare', icon: <Building className="w-4 h-4" />, description: 'Kan lista företag för försäljning' },
    { value: 'broker', label: 'Mäklare', icon: <Shield className="w-4 h-4" />, description: 'Professionell företagsmäklare' },
    { value: 'admin', label: 'Admin', icon: <Sparkles className="w-4 h-4" />, description: 'Full systemaccess' }
  ]

  const verifiedOptions = [
    { value: '', label: 'Alla användare' },
    { value: 'verified', label: 'Verifierade', icon: <CheckCircle className="w-4 h-4 text-green-500" /> },
    { value: 'unverified', label: 'Ej verifierade', icon: <XCircle className="w-4 h-4 text-gray-400" /> }
  ]

  const sortOptions = [
    { value: 'createdAt', label: 'Registreringsdatum' },
    { value: 'lastLoginAt', label: 'Senaste inloggning' },
    { value: 'email', label: 'E-post' },
    { value: 'name', label: 'Namn' }
  ]

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Totalt användare</p>
              <p className="text-2xl font-bold text-gray-900">{pagination.total}</p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Verifierade</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.verified).length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Aktiva säljare</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.role === 'seller' && u._count.listings > 0).length}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Nya idag</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => new Date(u.createdAt).toDateString() === new Date().toDateString()).length}
              </p>
            </div>
            <Activity className="w-8 h-8 text-amber-500" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Sök på namn, e-post, företag..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-3">
            <ModernSelect
              options={roleOptions}
              value={roleFilter}
              onChange={setRoleFilter}
              placeholder="Filtrera roll"
              className="w-48"
              searchable
            />
            
            <ModernSelect
              options={verifiedOptions}
              value={verifiedFilter}
              onChange={setVerifiedFilter}
              placeholder="Verifiering"
              className="w-48"
            />

            <ModernSelect
              options={sortOptions}
              value={sortBy}
              onChange={setSortBy}
              placeholder="Sortera efter"
              className="w-48"
            />

            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              {sortOrder === 'asc' ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedUsers.size > 0 && (
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl mb-4">
            <span className="text-sm font-medium text-blue-700">
              {selectedUsers.size} användare valda
            </span>
            <div className="flex gap-2">
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
              >
                Ta bort valda
              </button>
              <button
                onClick={() => setSelectedUsers(new Set())}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                Avmarkera alla
              </button>
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left p-4">
                  <input
                    type="checkbox"
                    checked={selectedUsers.size === users.length && users.length > 0}
                    onChange={selectAllUsers}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Användare</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Roll</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Aktivitet</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Registrerad</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Åtgärder</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center">
                    <div className="flex justify-center">
                      <div className="w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">
                    Inga användare hittades
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr 
                    key={user.id} 
                    className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                    onMouseEnter={() => setHoveredRow(user.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                  >
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedUsers.has(user.id)}
                        onChange={() => toggleUserSelection(user.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${
                          user.verified ? 'from-green-400 to-green-500' : 'from-gray-400 to-gray-500'
                        } flex items-center justify-center text-white font-semibold`}>
                          {user.name ? user.name[0].toUpperCase() : user.email[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{user.name || 'Ej angivet'}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                          {user.companyName && (
                            <div className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                              <Building className="w-3 h-3" />
                              {user.companyName}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <AdminCustomSelect
                        value={user.role}
                        onChange={(value) => handleUpdateRole(user.id, value)}
                        options={[
                          { value: 'buyer', label: 'Köpare' },
                          { value: 'seller', label: 'Säljare' },
                          { value: 'broker', label: 'Mäklare' },
                          { value: 'admin', label: 'Admin' }
                        ]}
                        placeholder="Välj roll"
                      />
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {user.verified ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                            <CheckCircle className="w-3 h-3" />
                            Verifierad
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                            <XCircle className="w-3 h-3" />
                            Ej verifierad
                          </span>
                        )}
                        {user.bankIdVerified && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                            <Shield className="w-3 h-3" />
                            BankID
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <div className="text-sm text-gray-600">
                          Annonser: <span className="font-medium text-gray-900">{user._count.listings}</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          Värderingar: <span className="font-medium text-gray-900">{user._count.valuations}</span>
                        </div>
                        {user.lastLoginAt && (
                          <div className="text-xs text-gray-400">
                            Senast: {formatDate(user.lastLoginAt)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-gray-600">{formatDate(user.createdAt)}</div>
                      {user.referralCode && (
                        <button
                          onClick={() => setShowReferralModal(user)}
                          className="text-xs text-blue-600 hover:text-blue-700 mt-1 flex items-center gap-1"
                        >
                          <Share2 className="w-3 h-3" />
                          Referenskod
                        </button>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="relative">
                        <button
                          onClick={() => setActiveMenu(activeMenu === user.id ? null : user.id)}
                          className={`p-2 hover:bg-gray-100 rounded-lg transition-all ${
                            hoveredRow === user.id ? 'opacity-100' : 'opacity-0'
                          }`}
                        >
                          <MoreVertical className="w-5 h-5 text-gray-500" />
                        </button>
                        
                        {activeMenu === user.id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-10">
                            <button
                              onClick={() => {
                                onUserSelect?.(user)
                                setActiveMenu(null)
                              }}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                            >
                              <Eye className="w-4 h-4" />
                              Visa detaljer
                            </button>
                            <button
                              onClick={() => {
                                handleResetPassword(user.id)
                                setActiveMenu(null)
                              }}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                            >
                              <Lock className="w-4 h-4" />
                              Återställ lösenord
                            </button>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(user.email)
                                setActiveMenu(null)
                              }}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                            >
                              <Copy className="w-4 h-4" />
                              Kopiera e-post
                            </button>
                            <hr className="my-1" />
                            <button
                              onClick={() => {
                                handleDeleteUser(user.id)
                                setActiveMenu(null)
                              }}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              Ta bort användare
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-500">
              Visar {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} av {pagination.total} användare
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                const pageNum = i + 1
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                    className={`px-4 py-2 rounded-lg transition-all ${
                      pagination.page === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
              
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.pages}
                className="px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Referral Modal */}
      {showReferralModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowReferralModal(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Referenskod</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-500">Användare</label>
                <p className="font-medium text-gray-900">{showReferralModal.name || showReferralModal.email}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Referenskod</label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="flex-1 px-4 py-2 bg-gray-100 rounded-lg font-mono">
                    {showReferralModal.referralCode}
                  </code>
                  <button
                    onClick={() => navigator.clipboard.writeText(showReferralModal.referralCode || '')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-500">Referenslänk</label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="flex-1 px-4 py-2 bg-gray-100 rounded-lg text-xs break-all">
                    https://afterfounder.se/ref/{showReferralModal.referralCode}
                  </code>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowReferralModal(null)}
              className="w-full mt-6 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Stäng
            </button>
          </div>
        </div>
      )}
    </div>
  )
}