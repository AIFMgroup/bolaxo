'use client'
import { useState, useEffect } from 'react'
import { Bell, Plus, RefreshCw, Trash2, Edit, ToggleLeft, ToggleRight } from 'lucide-react'

export default function CustomAlerts() {
  const [alerts, setAlerts] = useState<any[]>([])
  const [stats, setStats] = useState<any>({ total: 0, active: 0, triggered: 0 })
  const [showForm, setShowForm] = useState(false)
  const [metadata, setMetadata] = useState<any>(null)
  const [formData, setFormData] = useState<any>({ name: '', trigger: '', threshold: '', channels: [] as string[] })

  useEffect(() => {
    loadAlerts()
  }, [])

  const loadAlerts = async () => {
    try {
      const response = await fetch('/api/admin/custom-alerts', {
        credentials: 'include'
      })
      const data = await response.json()
      setAlerts(data.data)
      setStats(data.stats)
      setMetadata(data)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleCreateAlert = async () => {
    try {
      await fetch('/api/admin/custom-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name,
          trigger: formData.trigger,
          threshold: formData.threshold ? parseInt(formData.threshold) : null,
          condition: '>=',
          notificationChannels: formData.channels,
          recipients: ['admin@afterfounder.se']
        })
      })
      loadAlerts()
      setShowForm(false)
      setFormData({ name: '', trigger: '', threshold: '', channels: [] })
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleToggleStatus = async (alertId: string, currentStatus: string) => {
    try {
      await fetch('/api/admin/custom-alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          alertId,
          status: currentStatus === 'active' ? 'inactive' : 'active'
        })
      })
      loadAlerts()
    } catch (error) {
      console.error('Error:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-primary-navy flex items-center gap-2 mb-2">
          <Bell className="w-6 h-6" /> Custom Alerts & Notifications
        </h2>
        <p className="text-gray-600 text-sm">Configure custom alerts and notification rules</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-xs text-blue-700 font-semibold mb-1">TOTAL ALERTS</div>
          <div className="text-3xl font-bold text-blue-900">{stats.total}</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-xs text-green-700 font-semibold mb-1">ACTIVE</div>
          <div className="text-3xl font-bold text-green-900">{stats.active}</div>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="text-xs text-gray-700 font-semibold mb-1">INACTIVE</div>
          <div className="text-3xl font-bold text-gray-900">{stats.inactive}</div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="text-xs text-orange-700 font-semibold mb-1">TOTAL TRIGGERED</div>
          <div className="text-3xl font-bold text-orange-900">{stats.totalTriggered}</div>
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-accent-pink text-white rounded-lg hover:shadow-md flex items-center gap-2 font-medium text-sm">
          <Plus className="w-4 h-4" /> New Alert
        </button>
        <button onClick={loadAlerts} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2 font-medium text-sm">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {showForm && metadata && (
        <div className="bg-gradient-to-br from-accent-pink/10 to-primary-navy/10 border-2 border-accent-pink rounded-lg p-6 space-y-4">
          <h3 className="text-lg font-bold text-primary-navy">Create New Alert</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Alert Name</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="e.g. High Value Transactions" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Trigger</label>
              <select value={formData.trigger} onChange={(e) => setFormData({...formData, trigger: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                <option value="">Select trigger...</option>
                {metadata.availableTriggers?.map((t: string) => (
                  <option key={t} value={t}>{t.replace(/_/g, ' ').toUpperCase()}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Threshold (if applicable)</label>
              <input type="number" value={formData.threshold} onChange={(e) => setFormData({...formData, threshold: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="e.g. 500000" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Notification Channels</label>
              <div className="flex gap-2 flex-wrap">
                {metadata.availableChannels?.map((channel: string) => (
                  <label key={channel} className="flex items-center gap-2">
                    <input type="checkbox" checked={formData.channels.includes(channel)} onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({...formData, channels: [...formData.channels, channel]})
                      } else {
                        setFormData({...formData, channels: formData.channels.filter((c: string) => c !== channel)})
                      }
                    }} className="w-4 h-4" />
                    <span className="text-sm text-gray-700">{channel.toUpperCase()}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-2 pt-4">
            <button onClick={handleCreateAlert} className="flex-1 px-4 py-2 bg-primary-navy text-white rounded-lg hover:bg-opacity-90 font-medium">Create Alert</button>
            <button onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {alerts.map(alert => (
          <div key={alert.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-gray-900">{alert.name}</p>
                  <span className={`text-xs font-semibold px-2 py-1 rounded ${alert.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {alert.status.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-gray-600">Trigger: {alert.trigger.replace(/_/g, ' ').toUpperCase()}</p>
                <div className="flex gap-4 mt-2 text-xs text-gray-600">
                  <span>🔔 {alert.notificationChannels.join(', ').toUpperCase()}</span>
                  <span>📊 Triggered {alert.triggerCount} times</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleToggleStatus(alert.id, alert.status)} className={`p-2 rounded ${alert.status === 'active' ? 'hover:bg-red-100 text-red-600' : 'hover:bg-green-100 text-green-600'}`}>
                  {alert.status === 'active' ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                </button>
                <button className="p-2 hover:bg-gray-100 rounded text-gray-600"><Edit className="w-4 h-4" /></button>
                <button className="p-2 hover:bg-red-100 rounded text-red-600"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
