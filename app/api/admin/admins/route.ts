import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkAdminAuth } from '@/lib/admin-auth'

// Admin User Management API

const mockAdmins = [
  {
    id: 'admin-1',
    name: 'Anna Svensson',
    email: 'anna@bolaxo.se',
    role: 'super_admin',
    permissions: ['all'],
    status: 'active',
    lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
    twoFactorEnabled: true,
    activityCount: 3421
  },
  {
    id: 'admin-2',
    name: 'Erik Nilsson',
    email: 'erik@bolaxo.se',
    role: 'admin',
    permissions: ['users', 'listings', 'transactions', 'moderation'],
    status: 'active',
    lastLogin: new Date(Date.now() - 8 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
    twoFactorEnabled: true,
    activityCount: 1256
  },
  {
    id: 'admin-3',
    name: 'Maria Garcia',
    email: 'maria@bolaxo.se',
    role: 'moderator',
    permissions: ['listings', 'moderation', 'messages'],
    status: 'active',
    lastLogin: new Date(Date.now() - 30 * 60 * 1000),
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    twoFactorEnabled: false,
    activityCount: 892
  },
  {
    id: 'admin-4',
    name: 'Johan Berg',
    email: 'johan@bolaxo.se',
    role: 'analyst',
    permissions: ['reports', 'analytics', 'financial'],
    status: 'active',
    lastLogin: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    twoFactorEnabled: true,
    activityCount: 456
  },
  {
    id: 'admin-5',
    name: 'Sofia Lundgren',
    email: 'sofia@bolaxo.se',
    role: 'support',
    permissions: ['tickets', 'messages', 'users'],
    status: 'inactive',
    lastLogin: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
    twoFactorEnabled: false,
    activityCount: 234
  }
]

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const auth = await checkAdminAuth(request)
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const role = searchParams.get('role')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    const skip = (page - 1) * limit
    let filtered = [...mockAdmins]

    if (role) filtered = filtered.filter(a => a.role === role)
    if (status) filtered = filtered.filter(a => a.status === status)
    if (search) {
      filtered = filtered.filter(a =>
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.email.toLowerCase().includes(search.toLowerCase())
      )
    }

    filtered.sort((a, b) => {
      if (a.role === 'super_admin') return -1
      if (b.role === 'super_admin') return 1
      return b.lastLogin!.getTime() - a.lastLogin!.getTime()
    })

    const total = filtered.length
    const paginated = filtered.slice(skip, skip + limit)

    const roleStats = {
      super_admin: filtered.filter(a => a.role === 'super_admin').length,
      admin: filtered.filter(a => a.role === 'admin').length,
      moderator: filtered.filter(a => a.role === 'moderator').length,
      analyst: filtered.filter(a => a.role === 'analyst').length,
      support: filtered.filter(a => a.role === 'support').length,
      active: filtered.filter(a => a.status === 'active').length,
      inactive: filtered.filter(a => a.status === 'inactive').length
    }

    return NextResponse.json({
      success: true,
      data: paginated,
      stats: roleStats,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    })
  } catch (error) {
    console.error('Error fetching admins:', error)
    return NextResponse.json({ error: 'Failed to fetch admins' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name, role, permissions } = body

    if (!email || !name || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const newAdmin = {
      id: `admin-${Date.now()}`,
      name,
      email,
      role,
      permissions: permissions || [],
      status: 'active',
      lastLogin: new Date(),
      createdAt: new Date(),
      twoFactorEnabled: false,
      activityCount: 0
    }

    mockAdmins.push(newAdmin)

    return NextResponse.json({
      success: true,
      message: 'Admin user created successfully',
      data: newAdmin
    })
  } catch (error) {
    console.error('Error creating admin:', error)
    return NextResponse.json({ error: 'Failed to create admin' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { adminId, role, status, permissions, twoFactorEnabled } = body

    if (!adminId) {
      return NextResponse.json({ error: 'Admin ID required' }, { status: 400 })
    }

    const admin = mockAdmins.find(a => a.id === adminId)
    if (!admin) return NextResponse.json({ error: 'Admin not found' }, { status: 404 })

    if (role !== undefined) admin.role = role
    if (status !== undefined) admin.status = status
    if (permissions !== undefined) admin.permissions = permissions
    if (twoFactorEnabled !== undefined) admin.twoFactorEnabled = twoFactorEnabled

    return NextResponse.json({ success: true, data: admin })
  } catch (error) {
    console.error('Error updating admin:', error)
    return NextResponse.json({ error: 'Failed to update admin' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const adminId = searchParams.get('id')

    if (!adminId) {
      return NextResponse.json({ error: 'Admin ID required' }, { status: 400 })
    }

    const index = mockAdmins.findIndex(a => a.id === adminId)
    if (index === -1) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 })
    }

    const deleted = mockAdmins.splice(index, 1)[0]

    return NextResponse.json({ success: true, message: 'Admin deleted', data: deleted })
  } catch (error) {
    console.error('Error deleting admin:', error)
    return NextResponse.json({ error: 'Failed to delete admin' }, { status: 500 })
  }
}
