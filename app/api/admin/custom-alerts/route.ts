import { NextRequest, NextResponse } from 'next/server'

// Custom Alerts & Notifications API

const mockAlerts = [
  {
    id: 'alert-1',
    name: 'High Value Transactions',
    trigger: 'transaction_value_above',
    threshold: 500000,
    condition: '>=',
    status: 'active',
    notificationChannels: ['email', 'dashboard'],
    recipients: ['admin@bolaxo.se'],
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    lastTriggered: new Date(Date.now() - 2 * 60 * 60 * 1000),
    triggerCount: 47
  },
  {
    id: 'alert-2',
    name: 'Suspicious User Activity',
    trigger: 'multiple_failed_attempts',
    threshold: 5,
    condition: '>=',
    status: 'active',
    notificationChannels: ['email', 'sms'],
    recipients: ['security@bolaxo.se'],
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    lastTriggered: new Date(Date.now() - 12 * 60 * 60 * 1000),
    triggerCount: 12
  },
  {
    id: 'alert-3',
    name: 'New Listing Added',
    trigger: 'new_listing_created',
    threshold: null,
    condition: null,
    status: 'inactive',
    notificationChannels: ['dashboard'],
    recipients: ['team@bolaxo.se'],
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    lastTriggered: null,
    triggerCount: 0
  }
]

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')

    let filtered = [...mockAlerts]
    if (status) filtered = filtered.filter(a => a.status === status)

    return NextResponse.json({
      success: true,
      data: filtered,
      stats: {
        total: mockAlerts.length,
        active: mockAlerts.filter(a => a.status === 'active').length,
        inactive: mockAlerts.filter(a => a.status === 'inactive').length,
        totalTriggered: mockAlerts.reduce((sum, a) => sum + a.triggerCount, 0)
      },
      availableTriggers: [
        'transaction_value_above',
        'multiple_failed_attempts',
        'new_listing_created',
        'user_verification_failed',
        'payment_failed',
        'nda_expired',
        'suspicious_activity',
        'bulk_action_completed'
      ],
      availableChannels: ['email', 'sms', 'dashboard', 'slack', 'webhook']
    })
  } catch (error) {
    console.error('Error fetching alerts:', error)
    return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, trigger, threshold, condition, notificationChannels, recipients } = body

    const newAlert = {
      id: `alert-${Date.now()}`,
      name,
      trigger,
      threshold: threshold || null,
      condition: condition || null,
      status: 'active',
      notificationChannels,
      recipients,
      createdAt: new Date(),
      lastTriggered: null,
      triggerCount: 0
    }

    mockAlerts.push(newAlert)

    return NextResponse.json({
      success: true,
      message: 'Alert created successfully',
      data: newAlert
    })
  } catch (error) {
    console.error('Error creating alert:', error)
    return NextResponse.json({ error: 'Failed to create alert' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { alertId, ...updates } = body

    const alert = mockAlerts.find(a => a.id === alertId)
    if (!alert) return NextResponse.json({ error: 'Alert not found' }, { status: 404 })

    Object.assign(alert, updates)

    return NextResponse.json({ success: true, data: alert })
  } catch (error) {
    console.error('Error updating alert:', error)
    return NextResponse.json({ error: 'Failed to update alert' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const alertId = searchParams.get('id')

    if (!alertId) return NextResponse.json({ error: 'Alert ID required' }, { status: 400 })

    const index = mockAlerts.findIndex(a => a.id === alertId)
    if (index === -1) return NextResponse.json({ error: 'Alert not found' }, { status: 404 })

    mockAlerts.splice(index, 1)

    return NextResponse.json({ success: true, message: 'Alert deleted' })
  } catch (error) {
    console.error('Error deleting alert:', error)
    return NextResponse.json({ error: 'Failed to delete alert' }, { status: 500 })
  }
}
