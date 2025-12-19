import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { email, source } = await request.json()
    
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    }
    
    // Check if email already exists in waitlist
    const existing = await prisma.waitlist.findUnique({
      where: { email }
    })
    
    if (existing) {
      return NextResponse.json({ 
        success: true, 
        message: 'Du är redan på väntelistan!' 
      })
    }
    
    // Save to database
    const waitlistEntry = await prisma.waitlist.create({
      data: {
        email,
        source: source || 'website',
        status: 'pending'
      }
    })
    
    // Send confirmation email
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://bolaxo.com'
    
    try {
      await sendEmail({
        to: email,
        subject: 'Välkommen till BOLAXOs väntelista! 🎉',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f3f4f6;">
              <tr>
                <td align="center" style="padding: 40px 20px;">
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <!-- Header -->
                    <tr>
                      <td style="background-color: #1F3C58; padding: 40px 30px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700;">
                          BOLAXO
                        </h1>
                        <p style="color: #94a3b8; margin: 10px 0 0 0; font-size: 14px;">
                          Sveriges marknadsplats för företagsöverlåtelser
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                      <td style="padding: 40px 30px;">
                        <h2 style="color: #1F3C58; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">
                          Tack för att du anmält dig! 🎉
                        </h2>
                        
                        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                          Du är nu på väntelistan för BOLAXO. Vi kommer att kontakta dig så snart vi har nyheter eller exklusiva erbjudanden.
                        </p>
                        
                        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                          Under tiden kan du utforska vår plattform:
                        </p>
                        
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                          <tr>
                            <td align="center" style="padding: 0 0 30px 0;">
                              <a href="${baseUrl}/sok" style="display: inline-block; background-color: #1F3C58; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                                Se företag till salu
                              </a>
                            </td>
                          </tr>
                        </table>
                        
                        <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0;">
                          Har du frågor? Svara gärna på detta mail så hjälper vi dig.
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="padding: 30px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
                        <p style="color: #9ca3af; font-size: 12px; margin: 0 0 5px 0;">
                          <strong style="color: #1F3C58;">BOLAXO</strong> © 2025 | Sveriges moderna marknadsplats för företagsöverlåtelser
                        </p>
                        <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                          <a href="${baseUrl}/juridiskt/integritetspolicy" style="color: #9ca3af; text-decoration: underline;">Integritetspolicy</a>
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `,
        fromName: 'BOLAXO',
        from: 'noreply@bolaxo.com'
      })
    } catch (emailError) {
      console.error('Error sending waitlist confirmation email:', emailError)
      // Don't fail the request if email fails
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Tack! Du är nu på väntelistan.',
      id: waitlistEntry.id
    })
  } catch (error) {
    console.error('Waitlist error:', error)
    
    // Handle unique constraint violation (email already exists)
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json({ 
        success: true, 
        message: 'Du är redan på väntelistan!' 
      })
    }
    
    return NextResponse.json(
      { error: 'Något gick fel. Försök igen.' }, 
      { status: 500 }
    )
  }
}

// GET - Admin endpoint to list waitlist entries
export async function GET(request: NextRequest) {
  try {
    // Simple auth check (in production, use proper admin auth)
    const adminToken = request.cookies.get('adminToken')?.value
    if (!adminToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const entries = await prisma.waitlist.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100
    })
    
    return NextResponse.json({ entries })
  } catch (error) {
    console.error('Error fetching waitlist:', error)
    return NextResponse.json(
      { error: 'Failed to fetch waitlist' },
      { status: 500 }
    )
  }
}
