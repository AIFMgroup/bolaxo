import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { isValidIP, isValidCIDR, NORDIC_COUNTRIES, EU_COUNTRIES } from '@/lib/ip-restriction'
import { createAuditLog } from '@/lib/audit-log'

// GET /api/dataroom/security-settings?dataRoomId=xxx
// Get security settings for a dataroom
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('afterfounder_user_id')?.value

    if (!userId) {
      return NextResponse.json({ error: 'Ej autentiserad' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const dataRoomId = searchParams.get('dataRoomId')

    if (!dataRoomId) {
      return NextResponse.json({ error: 'dataRoomId krävs' }, { status: 400 })
    }

    // Check permission (must be OWNER or EDITOR)
    const permission = await prisma.dataRoomPermission.findFirst({
      where: {
        dataRoomId,
        userId,
        role: { in: ['OWNER', 'EDITOR'] }
      }
    })

    if (!permission) {
      return NextResponse.json(
        { error: 'Ingen behörighet att hantera säkerhetsinställningar' },
        { status: 403 }
      )
    }

    const dataRoom = await prisma.dataRoom.findUnique({
      where: { id: dataRoomId },
      select: {
        id: true,
        ipRestrictionEnabled: true,
        allowedIPs: true,
        allowedCountries: true,
        requireVPN: true,
        downloadEnabled: true,
        printEnabled: true,
        watermarkDownloads: true,
        sessionTimeout: true,
        maxConcurrentSessions: true,
      }
    })

    if (!dataRoom) {
      return NextResponse.json({ error: 'Datarum hittades inte' }, { status: 404 })
    }

    return NextResponse.json({
      settings: dataRoom,
      presets: {
        nordicCountries: NORDIC_COUNTRIES,
        euCountries: EU_COUNTRIES,
      }
    })
  } catch (error) {
    console.error('Error fetching security settings:', error)
    return NextResponse.json(
      { error: 'Kunde inte hämta säkerhetsinställningar' },
      { status: 500 }
    )
  }
}

// PATCH /api/dataroom/security-settings
// Update security settings for a dataroom
export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('afterfounder_user_id')?.value

    if (!userId) {
      return NextResponse.json({ error: 'Ej autentiserad' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      dataRoomId,
      ipRestrictionEnabled,
      allowedIPs,
      allowedCountries,
      requireVPN,
      downloadEnabled,
      printEnabled,
      watermarkDownloads,
      sessionTimeout,
      maxConcurrentSessions,
    } = body

    if (!dataRoomId) {
      return NextResponse.json({ error: 'dataRoomId krävs' }, { status: 400 })
    }

    // Check permission (must be OWNER)
    const permission = await prisma.dataRoomPermission.findFirst({
      where: {
        dataRoomId,
        userId,
        role: 'OWNER'
      }
    })

    if (!permission) {
      return NextResponse.json(
        { error: 'Endast ägaren kan ändra säkerhetsinställningar' },
        { status: 403 }
      )
    }

    // Get current settings for audit log
    const currentSettings = await prisma.dataRoom.findUnique({
      where: { id: dataRoomId },
      select: {
        ipRestrictionEnabled: true,
        allowedIPs: true,
        allowedCountries: true,
        requireVPN: true,
        downloadEnabled: true,
        printEnabled: true,
        watermarkDownloads: true,
        sessionTimeout: true,
        maxConcurrentSessions: true,
      }
    })

    // Validate IPs if provided
    if (allowedIPs && Array.isArray(allowedIPs)) {
      for (const ip of allowedIPs) {
        const isValid = ip.includes('/') ? isValidCIDR(ip) : isValidIP(ip)
        if (!isValid) {
          return NextResponse.json(
            { error: `Ogiltig IP-adress eller CIDR: ${ip}` },
            { status: 400 }
          )
        }
      }
    }

    // Validate countries if provided
    if (allowedCountries && Array.isArray(allowedCountries)) {
      const validCountries = [...NORDIC_COUNTRIES, ...EU_COUNTRIES, 'US', 'GB', 'CH']
      for (const country of allowedCountries) {
        if (!validCountries.includes(country)) {
          return NextResponse.json(
            { error: `Ogiltig landskod: ${country}` },
            { status: 400 }
          )
        }
      }
    }

    // Build update data
    const updateData: any = {}
    
    if (ipRestrictionEnabled !== undefined) {
      updateData.ipRestrictionEnabled = ipRestrictionEnabled
    }
    if (allowedIPs !== undefined) {
      updateData.allowedIPs = allowedIPs
    }
    if (allowedCountries !== undefined) {
      updateData.allowedCountries = allowedCountries
    }
    if (requireVPN !== undefined) {
      updateData.requireVPN = requireVPN
    }
    if (downloadEnabled !== undefined) {
      updateData.downloadEnabled = downloadEnabled
    }
    if (printEnabled !== undefined) {
      updateData.printEnabled = printEnabled
    }
    if (watermarkDownloads !== undefined) {
      updateData.watermarkDownloads = watermarkDownloads
    }
    if (sessionTimeout !== undefined) {
      updateData.sessionTimeout = Math.max(5, Math.min(120, sessionTimeout)) // 5-120 min
    }
    if (maxConcurrentSessions !== undefined) {
      updateData.maxConcurrentSessions = Math.max(1, Math.min(10, maxConcurrentSessions)) // 1-10
    }

    // Update settings
    const updatedDataRoom = await prisma.dataRoom.update({
      where: { id: dataRoomId },
      data: updateData,
      select: {
        id: true,
        ipRestrictionEnabled: true,
        allowedIPs: true,
        allowedCountries: true,
        requireVPN: true,
        downloadEnabled: true,
        printEnabled: true,
        watermarkDownloads: true,
        sessionTimeout: true,
        maxConcurrentSessions: true,
      }
    })

    // Get user email for audit log
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true }
    })

    // Create audit log
    await createAuditLog({
      userId,
      userEmail: user?.email,
      action: 'dataroom_settings_changed',
      category: 'dataroom',
      severity: 'warning',
      targetType: 'dataroom',
      targetId: dataRoomId,
      description: `Säkerhetsinställningar uppdaterade för datarum`,
      previousValue: currentSettings,
      newValue: updateData,
    })

    return NextResponse.json({
      success: true,
      settings: updatedDataRoom
    })
  } catch (error) {
    console.error('Error updating security settings:', error)
    return NextResponse.json(
      { error: 'Kunde inte uppdatera säkerhetsinställningar' },
      { status: 500 }
    )
  }
}

