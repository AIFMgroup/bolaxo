import { prisma } from '@/lib/prisma'

const DEFAULT_FROM_EMAIL = process.env.EMAIL_FROM || 'noreply@bolaxo.com'
const DEFAULT_FROM_NAME = process.env.EMAIL_FROM_NAME || 'BOLAXO'

export interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  from?: string
  fromName?: string
}

async function logEmailResult({
  to,
  subject,
  status,
  providerMessageId,
  error,
  payload
}: {
  to: string[]
  subject: string
  status: 'success' | 'failed'
  providerMessageId?: string
  error?: string
  payload?: Record<string, unknown>
}) {
  try {
    await prisma.emailLog.create({
      data: {
        to: to.join(', '),
        subject,
        status,
        providerMessageId,
        errorMessage: error,
        payload: payload ? JSON.parse(JSON.stringify(payload)) : null
      }
    })
  } catch (logError) {
    console.error('Email log error:', logError)
  }
}

/**
 * Send email via Sendinblue (Brevo) API
 */
export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!process.env.BREVO_API_KEY) {
    console.warn('BREVO_API_KEY not configured, email will not be sent')
    console.log('Email would be sent to:', options.to)
    console.log('Subject:', options.subject)
    return { success: false, error: 'Email service not configured' }
  }

  try {
    const recipients = Array.isArray(options.to) ? options.to : [options.to]
    
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: options.fromName || DEFAULT_FROM_NAME,
          email: options.from || DEFAULT_FROM_EMAIL,
        },
        to: recipients.map(email => ({ email })),
        subject: options.subject,
        htmlContent: options.html,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Sendinblue API error:', errorText)
      await logEmailResult({
        to: recipients,
        subject: options.subject,
        status: 'failed',
        error: `Sendinblue API error: ${response.status} ${errorText}`,
        payload: { preview: options.html.slice(0, 200) }
      })
      return { 
        success: false, 
        error: `Sendinblue API error: ${response.status} ${errorText}` 
      }
    }

    const data = await response.json()
    await logEmailResult({
      to: recipients,
      subject: options.subject,
      status: 'success',
      providerMessageId: data.messageId,
      payload: { preview: options.html.slice(0, 200) }
    })
    return { 
      success: true, 
      messageId: data.messageId 
    }
  } catch (error) {
    console.error('Email send error:', error)
    await logEmailResult({
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      payload: { preview: options.html.slice(0, 200) }
    })
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Send magic link email
 */
export async function sendMagicLinkEmail(
  email: string,
  magicLink: string,
  name: string = 'där'
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  return sendEmail({
    to: email,
    subject: 'Din inloggningslänk till BOLAXO',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background-color: #f9fafb;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <!-- Header -->
                <tr>
                  <td style="background-color: #1F3C58; padding: 40px 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">
                      BOLAXO
                    </h1>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="color: #1F3C58; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">
                      Välkommen till BOLAXO
                    </h2>
                    
                    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                      Hej ${name},
                    </p>
                    
                    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                      Klicka på knappen nedan för att logga in på ditt konto:
                    </p>
                    
                    <!-- Button -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding: 0 0 30px 0;">
                          <a href="${magicLink}" style="display: inline-block; background-color: #1F3C58; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; letter-spacing: 0.3px;">
                            Logga in på BOLAXO
                          </a>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Info -->
                    <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
                      <strong>Länken är giltig i 1 timme.</strong> Om du inte begärt denna länk, ignorera detta mail.
                    </p>
                    
                    <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0 0 15px 0;">
                      Om knappen inte fungerar, kopiera och klistra in denna länk i din webbläsare:
                    </p>
                    
                    <p style="color: #1F3C58; font-size: 12px; word-break: break-all; background-color: #f3f4f6; padding: 12px; border-radius: 6px; margin: 0; font-family: monospace;">
                      ${magicLink}
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 30px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
                    <p style="color: #9ca3af; font-size: 12px; margin: 0 0 5px 0;">
                      <strong style="color: #1F3C58;">BOLAXO</strong> (C) 2025 | Sveriges moderna marknadsplats för företagsöverlåtelser
                    </p>
                    <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                      Verifierade uppgifter • NDA innan detaljer • Kvalificerade köpare
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
    fromName: DEFAULT_FROM_NAME,
    from: DEFAULT_FROM_EMAIL
  })
}

/**
 * Send LOI notification email to seller
 */
export async function sendLOINotificationEmail(
  sellerEmail: string,
  sellerName: string,
  buyerName: string,
  listingTitle: string,
  loiId: string,
  baseUrl: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const loiUrl = `${baseUrl}/loi/${loiId}`
  
  return sendEmail({
    to: sellerEmail,
    subject: `Ny indikativt bud (LOI) från ${buyerName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background-color: #f9fafb;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <!-- Header -->
                <tr>
                  <td style="background-color: #1F3C58; padding: 40px 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">
                      BOLAXO
                    </h1>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="color: #1F3C58; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">
                      Ny LOI mottagen
                    </h2>
                    
                    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                      Hej ${sellerName},
                    </p>
                    
                    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                      Du har fått ett nytt indikativt bud (LOI) från <strong>${buyerName}</strong> för ditt objekt:
                    </p>
                    
                    <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1F3C58;">
                      <p style="margin: 0; font-weight: 600; color: #1F3C58; font-size: 18px;">${listingTitle}</p>
                    </div>
                    
                    <!-- Button -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding: 0 0 30px 0;">
                          <a href="${loiUrl}" style="display: inline-block; background-color: #1F3C58; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; letter-spacing: 0.3px;">
                            Se LOI och hantera
                          </a>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0;">
                      Logga in på BOLAXO för att se detaljer och godkänna eller avslå budet.
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 30px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
                    <p style="color: #9ca3af; font-size: 12px; margin: 0 0 5px 0;">
                      <strong style="color: #1F3C58;">BOLAXO</strong> (C) 2025 | Sveriges moderna marknadsplats för företagsöverlåtelser
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
}

/**
 * Send LOI approval email to buyer
 */
export async function sendLOIApprovalEmail(
  buyerEmail: string,
  buyerName: string,
  listingTitle: string,
  transactionId: string,
  baseUrl: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const transactionUrl = `${baseUrl}/transaktion/${transactionId}`
  
  return sendEmail({
    to: buyerEmail,
    subject: `Din LOI har godkänts för ${listingTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background-color: #f9fafb;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <!-- Header -->
                <tr>
                  <td style="background-color: #1F3C58; padding: 40px 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">
                      BOLAXO
                    </h1>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="color: #1F3C58; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">
                      LOI godkänd! 
                    </h2>
                    
                    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                      Hej ${buyerName},
                    </p>
                    
                    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                      Vi har glada nyheter! Din LOI för <strong>${listingTitle}</strong> har godkänts av säljaren.
                    </p>
                    
                    <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #22c55e;">
                      <p style="margin: 0; font-weight: 600; color: #065f46; font-size: 16px;">Transaktionen är nu skapad och redo att börja!</p>
                    </div>
                    
                    <!-- Button -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding: 0 0 30px 0;">
                          <a href="${transactionUrl}" style="display: inline-block; background-color: #1F3C58; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; letter-spacing: 0.3px;">
                            Gå till transaktion
                          </a>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0;">
                      <strong>Nästa steg:</strong> Logga in på BOLAXO för att se transaktionsdashboarden och börja med Due Diligence.
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 30px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
                    <p style="color: #9ca3af; font-size: 12px; margin: 0 0 5px 0;">
                      <strong style="color: #1F3C58;">BOLAXO</strong> (C) 2025 | Sveriges moderna marknadsplats för företagsöverlåtelser
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
}

/**
 * Send NDA approval email to buyer
 */
export async function sendNDAApprovalEmail(
  buyerEmail: string,
  buyerName: string,
  listingTitle: string,
  ndaId: string,
  baseUrl: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const ndaUrl = `${baseUrl}/dashboard/ndas`
  
  return sendEmail({
    to: buyerEmail,
    subject: `Din NDA-förfrågan har godkänts för ${listingTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background-color: #f9fafb;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <!-- Header -->
                <tr>
                  <td style="background-color: #1F3C58; padding: 40px 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">
                      BOLAXO
                    </h1>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="color: #1F3C58; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">
                      NDA godkänd! 
                    </h2>
                    
                    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                      Hej ${buyerName},
                    </p>
                    
                    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                      Vi har glada nyheter! Din NDA-förfrågan för <strong>${listingTitle}</strong> har godkänts av säljaren.
                    </p>
                    
                    <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #22c55e;">
                      <p style="margin: 0; font-weight: 600; color: #065f46; font-size: 16px;">Du kan nu se all information om företaget och börja diskutera möjligheterna!</p>
                    </div>
                    
                    <!-- Button -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding: 0 0 30px 0;">
                          <a href="${ndaUrl}" style="display: inline-block; background-color: #1F3C58; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; letter-spacing: 0.3px;">
                            Se objekt och kontakta säljare
                          </a>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0;">
                      <strong>Nästa steg:</strong> Logga in på BOLAXO för att se all information om företaget och skicka meddelanden till säljaren.
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 30px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
                    <p style="color: #9ca3af; font-size: 12px; margin: 0 0 5px 0;">
                      <strong style="color: #1F3C58;">BOLAXO</strong> (C) 2025 | Sveriges moderna marknadsplats för företagsöverlåtelser
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
}

/**
 * Send NDA rejection email to buyer
 */
export async function sendNDARejectionEmail(
  buyerEmail: string,
  buyerName: string,
  listingTitle: string,
  rejectionReason: string | null,
  baseUrl: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const searchUrl = `${baseUrl}/sok`
  
  return sendEmail({
    to: buyerEmail,
    subject: `Din NDA-förfrågan för ${listingTitle} har avslagits`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background-color: #f9fafb;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <!-- Header -->
                <tr>
                  <td style="background-color: #1F3C58; padding: 40px 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">
                      BOLAXO
                    </h1>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="color: #1F3C58; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">
                      NDA-förfrågan avslagen
                    </h2>
                    
                    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                      Hej ${buyerName},
                    </p>
                    
                    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                      Tyvärr har säljaren avslagit din NDA-förfrågan för <strong>${listingTitle}</strong>.
                    </p>
                    
                    ${rejectionReason ? `
                    <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
                      <p style="margin: 0; color: #991b1b; font-size: 14px;"><strong>Anledning:</strong> ${rejectionReason}</p>
                    </div>
                    ` : ''}
                    
                    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                      Det finns många andra spännande företag att utforska på BOLAXO. Fortsätt söka efter ditt nästa möjlighet!
                    </p>
                    
                    <!-- Button -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding: 0 0 30px 0;">
                          <a href="${searchUrl}" style="display: inline-block; background-color: #1F3C58; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; letter-spacing: 0.3px;">
                            Sök efter fler företag
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 30px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
                    <p style="color: #9ca3af; font-size: 12px; margin: 0 0 5px 0;">
                      <strong style="color: #1F3C58;">BOLAXO</strong> (C) 2025 | Sveriges moderna marknadsplats för företagsöverlåtelser
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
}

/**
 * Send new NDA request email to seller
 */
export async function sendNewNDARequestEmail(
  sellerEmail: string,
  sellerName: string,
  buyerName: string,
  listingTitle: string,
  ndaId: string,
  baseUrl: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const ndaUrl = `${baseUrl}/dashboard/ndas`
  
  return sendEmail({
    to: sellerEmail,
    subject: `Ny NDA-förfrågan från ${buyerName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background-color: #f9fafb;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <!-- Header -->
                <tr>
                  <td style="background-color: #1F3C58; padding: 40px 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">
                      BOLAXO
                    </h1>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="color: #1F3C58; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">
                      Ny NDA-förfrågan
                    </h2>
                    
                    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                      Hej ${sellerName},
                    </p>
                    
                    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                      Du har fått en ny NDA-förfrågan från <strong>${buyerName}</strong> för ditt objekt:
                    </p>
                    
                    <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1F3C58;">
                      <p style="margin: 0; font-weight: 600; color: #1F3C58; font-size: 18px;">${listingTitle}</p>
                    </div>
                    
                    <!-- Button -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding: 0 0 30px 0;">
                          <a href="${ndaUrl}" style="display: inline-block; background-color: #1F3C58; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; letter-spacing: 0.3px;">
                            Se och hantera NDA-förfrågan
                          </a>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0;">
                      Logga in på BOLAXO för att se köparens profil och godkänna eller avslå förfrågan.
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 30px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
                    <p style="color: #9ca3af; font-size: 12px; margin: 0 0 5px 0;">
                      <strong style="color: #1F3C58;">BOLAXO</strong> (C) 2025 | Sveriges moderna marknadsplats för företagsöverlåtelser
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
}

/**
 * Send new message email to recipient
 */
export async function sendNewMessageEmail(
  recipientEmail: string,
  recipientName: string,
  senderName: string,
  listingTitle: string,
  messagePreview: string,
  listingId: string,
  baseUrl: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const messageUrl = `${baseUrl}/dashboard/messages?listingId=${listingId}`
  
  return sendEmail({
    to: recipientEmail,
    subject: `Nytt meddelande från ${senderName} om ${listingTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background-color: #f9fafb;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <!-- Header -->
                <tr>
                  <td style="background-color: #1F3C58; padding: 40px 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">
                      BOLAXO
                    </h1>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="color: #1F3C58; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">
                      Nytt meddelande
                    </h2>
                    
                    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                      Hej ${recipientName},
                    </p>
                    
                    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                      Du har fått ett nytt meddelande från <strong>${senderName}</strong> om objektet <strong>${listingTitle}</strong>:
                    </p>
                    
                    <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1F3C58;">
                      <p style="margin: 0; color: #374151; font-size: 14px; line-height: 1.6; font-style: italic;">
                        "${messagePreview.length > 200 ? messagePreview.substring(0, 200) + '...' : messagePreview}"
                      </p>
                    </div>
                    
                    <!-- Button -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding: 0 0 30px 0;">
                          <a href="${messageUrl}" style="display: inline-block; background-color: #1F3C58; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; letter-spacing: 0.3px;">
                            Svara på meddelandet
                          </a>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0;">
                      Logga in på BOLAXO för att läsa hela meddelandet och svara.
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 30px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
                    <p style="color: #9ca3af; font-size: 12px; margin: 0 0 5px 0;">
                      <strong style="color: #1F3C58;">BOLAXO</strong> (C) 2025 | Sveriges moderna marknadsplats för företagsöverlåtelser
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
}

/**
 * Send match notification email to buyer and seller
 */
export async function sendMatchNotificationEmail(
  recipientEmail: string,
  recipientName: string,
  recipientRole: 'buyer' | 'seller',
  listingTitle: string,
  matchScore: number,
  listingId: string,
  baseUrl: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const listingUrl = `${baseUrl}/objekt/${listingId}`
  const dashboardUrl = `${baseUrl}/dashboard/matches`
  
  const isBuyer = recipientRole === 'buyer'
  const subject = isBuyer 
    ? `Ny matchning hittad: ${listingTitle}`
    : `Ny matchning för ditt objekt: ${listingTitle}`
  
  const introText = isBuyer
    ? `Vi har hittat ett objekt som matchar dina preferenser perfekt!`
    : `Vi har hittat en köpare som matchar ditt objekt perfekt!`
  
  const actionText = isBuyer
    ? `Se objektet`
    : `Se matchningar`
  
  const actionUrl = isBuyer ? listingUrl : dashboardUrl
  
  return sendEmail({
    to: recipientEmail,
    subject,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background-color: #f9fafb;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <!-- Header -->
                <tr>
                  <td style="background-color: #1F3C58; padding: 40px 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">
                      BOLAXO
                    </h1>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="color: #1F3C58; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">
                      Ny matchning! 
                    </h2>
                    
                    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                      Hej ${recipientName},
                    </p>
                    
                    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                      ${introText}
                    </p>
                    
                    <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1F3C58;">
                      <p style="margin: 0 0 10px 0; font-weight: 600; color: #1F3C58; font-size: 18px;">${listingTitle}</p>
                      <p style="margin: 0; color: #6b7280; font-size: 14px;">Matchningspoäng: <strong style="color: #1F3C58;">${matchScore}%</strong></p>
                    </div>
                    
                    <!-- Button -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding: 0 0 30px 0;">
                          <a href="${actionUrl}" style="display: inline-block; background-color: #1F3C58; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; letter-spacing: 0.3px;">
                            ${actionText}
                          </a>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0;">
                      ${isBuyer ? 'Logga in på BOLAXO för att se objektet och skicka en NDA-förfrågan.' : 'Logga in på BOLAXO för att se alla matchningar och kontakta köpare.'}
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 30px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
                    <p style="color: #9ca3af; font-size: 12px; margin: 0 0 5px 0;">
                      <strong style="color: #1F3C58;">BOLAXO</strong> (C) 2025 | Sveriges moderna marknadsplats för företagsöverlåtelser
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
}

/**
 * Send welcome email after successful registration/verification
 */
export async function sendWelcomeEmail(
  email: string,
  name: string,
  role: string,
  baseUrl: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const dashboardUrl = `${baseUrl}/dashboard`
  
  const isSeller = role.includes('seller')
  const isBuyer = role.includes('buyer')
  
  let roleSpecificContent = ''
  let ctaText = 'Gå till Dashboard'
  let ctaUrl = dashboardUrl
  
  if (isSeller) {
    roleSpecificContent = `
      <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #22c55e;">
        <h3 style="margin: 0 0 10px 0; color: #065f46; font-size: 16px;">Som säljare kan du:</h3>
        <ul style="margin: 0; padding-left: 20px; color: #374151; font-size: 14px; line-height: 1.8;">
          <li>Skapa en professionell annons för ditt företag</li>
          <li>Få en AI-driven värdering</li>
          <li>Hantera NDA-förfrågningar från kvalificerade köpare</li>
          <li>Kommunicera säkert med intressenter</li>
        </ul>
      </div>
    `
    ctaText = 'Skapa din första annons'
    ctaUrl = `${baseUrl}/salja`
  } else if (isBuyer) {
    roleSpecificContent = `
      <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
        <h3 style="margin: 0 0 10px 0; color: #1e40af; font-size: 16px;">Som köpare kan du:</h3>
        <ul style="margin: 0; padding-left: 20px; color: #374151; font-size: 14px; line-height: 1.8;">
          <li>Skapa en köparprofil med dina preferenser</li>
          <li>Få AI-matchade förslag på företag</li>
          <li>Begära NDA för att se detaljerad information</li>
          <li>Kommunicera direkt med säljare</li>
        </ul>
      </div>
    `
    ctaText = 'Skapa din köparprofil'
    ctaUrl = `${baseUrl}/dashboard/profile`
  }
  
  return sendEmail({
    to: email,
    subject: 'Välkommen till BOLAXO - Din resa börjar här!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background-color: #f9fafb;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <!-- Header -->
                <tr>
                  <td style="background-color: #1F3C58; padding: 40px 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">
                      BOLAXO
                    </h1>
                    <p style="color: #94a3b8; margin: 10px 0 0 0; font-size: 14px;">
                      Sveriges moderna marknadsplats för företagsöverlåtelser
                    </p>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="color: #1F3C58; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">
                      Välkommen till BOLAXO! 🎉
                    </h2>
                    
                    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                      Hej ${name},
                    </p>
                    
                    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                      Ditt konto är nu verifierat och redo att användas! Vi är glada att ha dig med på Sveriges ledande plattform för företagsöverlåtelser.
                    </p>
                    
                    ${roleSpecificContent}
                    
                    <!-- Button -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding: 20px 0;">
                          <a href="${ctaUrl}" style="display: inline-block; background-color: #1F3C58; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; letter-spacing: 0.3px;">
                            ${ctaText}
                          </a>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Help section -->
                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                      <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0;">
                        <strong>Behöver du hjälp?</strong> Besök vår <a href="${baseUrl}/hjalp" style="color: #1F3C58;">hjälpcentral</a> eller kontakta oss på <a href="mailto:support@bolaxo.com" style="color: #1F3C58;">support@bolaxo.com</a>
                      </p>
                    </div>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 30px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
                    <p style="color: #9ca3af; font-size: 12px; margin: 0 0 5px 0;">
                      <strong style="color: #1F3C58;">BOLAXO</strong> © 2025 | Sveriges moderna marknadsplats för företagsöverlåtelser
                    </p>
                    <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                      Verifierade uppgifter • NDA innan detaljer • Kvalificerade köpare
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
}

/**
 * Send payment confirmation email
 */
export async function sendPaymentConfirmationEmail(
  email: string,
  name: string,
  amount: number,
  currency: string,
  packageName: string,
  invoiceUrl: string | null,
  baseUrl: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const formattedAmount = new Intl.NumberFormat('sv-SE', { 
    style: 'currency', 
    currency: currency || 'SEK' 
  }).format(amount)
  
  return sendEmail({
    to: email,
    subject: `Betalning bekräftad - ${packageName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background-color: #f9fafb;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <!-- Header -->
                <tr>
                  <td style="background-color: #1F3C58; padding: 40px 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">
                      BOLAXO
                    </h1>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                      <div style="display: inline-block; background-color: #f0fdf4; border-radius: 50%; padding: 15px;">
                        <span style="font-size: 40px;">✓</span>
                      </div>
                    </div>
                    
                    <h2 style="color: #1F3C58; margin: 0 0 20px 0; font-size: 24px; font-weight: 600; text-align: center;">
                      Betalning bekräftad!
                    </h2>
                    
                    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                      Hej ${name},
                    </p>
                    
                    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                      Tack för din betalning! Din beställning har bekräftats.
                    </p>
                    
                    <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Paket:</td>
                          <td style="padding: 8px 0; color: #1F3C58; font-size: 14px; font-weight: 600; text-align: right;">${packageName}</td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">Belopp:</td>
                          <td style="padding: 8px 0; border-top: 1px solid #e5e7eb; color: #1F3C58; font-size: 14px; font-weight: 600; text-align: right;">${formattedAmount}</td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">Datum:</td>
                          <td style="padding: 8px 0; border-top: 1px solid #e5e7eb; color: #1F3C58; font-size: 14px; font-weight: 600; text-align: right;">${new Date().toLocaleDateString('sv-SE')}</td>
                        </tr>
                      </table>
                    </div>
                    
                    ${invoiceUrl ? `
                    <!-- Invoice Button -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding: 20px 0;">
                          <a href="${invoiceUrl}" style="display: inline-block; background-color: #1F3C58; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; letter-spacing: 0.3px;">
                            Ladda ner kvitto
                          </a>
                        </td>
                      </tr>
                    </table>
                    ` : ''}
                    
                    <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                      Om du har frågor om din betalning, kontakta oss på <a href="mailto:faktura@bolaxo.com" style="color: #1F3C58;">faktura@bolaxo.com</a>
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 30px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
                    <p style="color: #9ca3af; font-size: 12px; margin: 0 0 5px 0;">
                      <strong style="color: #1F3C58;">BOLAXO</strong> © 2025 | Sveriges moderna marknadsplats för företagsöverlåtelser
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
    fromName: 'BOLAXO Faktura',
    from: 'faktura@bolaxo.com'
  })
}

/**
 * Send invoice reminder email
 */
export async function sendInvoiceReminderEmail(
  email: string,
  name: string,
  amount: number,
  currency: string,
  dueDate: Date,
  invoiceNumber: string,
  paymentUrl: string,
  baseUrl: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const formattedAmount = new Intl.NumberFormat('sv-SE', { 
    style: 'currency', 
    currency: currency || 'SEK' 
  }).format(amount)
  
  const formattedDueDate = dueDate.toLocaleDateString('sv-SE')
  const daysUntilDue = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  
  const urgencyStyle = daysUntilDue <= 0 
    ? 'background-color: #fef2f2; border-left: 4px solid #ef4444;'
    : daysUntilDue <= 3
    ? 'background-color: #fffbeb; border-left: 4px solid #f59e0b;'
    : 'background-color: #f9fafb; border-left: 4px solid #1F3C58;'
  
  const urgencyText = daysUntilDue <= 0
    ? 'Fakturan har förfallit till betalning.'
    : daysUntilDue === 1
    ? 'Fakturan förfaller imorgon.'
    : `Fakturan förfaller om ${daysUntilDue} dagar.`
  
  return sendEmail({
    to: email,
    subject: daysUntilDue <= 0 
      ? `Påminnelse: Förfallen faktura ${invoiceNumber}`
      : `Påminnelse: Faktura ${invoiceNumber} förfaller ${formattedDueDate}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background-color: #f9fafb;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <!-- Header -->
                <tr>
                  <td style="background-color: #1F3C58; padding: 40px 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">
                      BOLAXO
                    </h1>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="color: #1F3C58; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">
                      Betalningspåminnelse
                    </h2>
                    
                    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                      Hej ${name},
                    </p>
                    
                    <div style="${urgencyStyle} padding: 20px; border-radius: 8px; margin: 20px 0;">
                      <p style="margin: 0; color: #374151; font-size: 14px; font-weight: 500;">${urgencyText}</p>
                    </div>
                    
                    <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Fakturanummer:</td>
                          <td style="padding: 8px 0; color: #1F3C58; font-size: 14px; font-weight: 600; text-align: right;">${invoiceNumber}</td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">Belopp:</td>
                          <td style="padding: 8px 0; border-top: 1px solid #e5e7eb; color: #1F3C58; font-size: 14px; font-weight: 600; text-align: right;">${formattedAmount}</td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">Förfallodatum:</td>
                          <td style="padding: 8px 0; border-top: 1px solid #e5e7eb; color: #1F3C58; font-size: 14px; font-weight: 600; text-align: right;">${formattedDueDate}</td>
                        </tr>
                      </table>
                    </div>
                    
                    <!-- Payment Button -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding: 20px 0;">
                          <a href="${paymentUrl}" style="display: inline-block; background-color: #1F3C58; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; letter-spacing: 0.3px;">
                            Betala nu
                          </a>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                      Om du redan har betalat, vänligen ignorera detta meddelande. Vid frågor, kontakta oss på <a href="mailto:faktura@bolaxo.com" style="color: #1F3C58;">faktura@bolaxo.com</a>
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 30px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
                    <p style="color: #9ca3af; font-size: 12px; margin: 0 0 5px 0;">
                      <strong style="color: #1F3C58;">BOLAXO</strong> © 2025 | Sveriges moderna marknadsplats för företagsöverlåtelser
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
    fromName: 'BOLAXO Faktura',
    from: 'faktura@bolaxo.com'
  })
}

/**
 * Send NDA pending reminder email to seller
 */
export async function sendNDAPendingReminderEmail(
  sellerEmail: string,
  sellerName: string,
  pendingCount: number,
  oldestPendingDays: number,
  dashboardUrl: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  return sendEmail({
    to: sellerEmail,
    subject: `Du har ${pendingCount} väntande NDA-förfrågan${pendingCount > 1 ? 'ar' : ''}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background-color: #f9fafb;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <!-- Header -->
                <tr>
                  <td style="background-color: #1F3C58; padding: 40px 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">
                      BOLAXO
                    </h1>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="color: #1F3C58; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">
                      Vänta inte för länge! ⏰
                    </h2>
                    
                    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                      Hej ${sellerName},
                    </p>
                    
                    <div style="background-color: #fffbeb; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                      <p style="margin: 0; color: #374151; font-size: 16px;">
                        Du har <strong>${pendingCount} väntande NDA-förfrågan${pendingCount > 1 ? 'ar' : ''}</strong> som väntar på ditt svar.
                        ${oldestPendingDays > 2 ? `<br><br>Den äldsta har väntat i <strong>${oldestPendingDays} dagar</strong>.` : ''}
                      </p>
                    </div>
                    
                    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                      Snabba svar ökar chansen att hitta rätt köpare. Köpare uppskattar säljare som svarar snabbt!
                    </p>
                    
                    <!-- Button -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding: 20px 0;">
                          <a href="${dashboardUrl}" style="display: inline-block; background-color: #1F3C58; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; letter-spacing: 0.3px;">
                            Granska NDA-förfrågningar
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 30px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
                    <p style="color: #9ca3af; font-size: 12px; margin: 0 0 5px 0;">
                      <strong style="color: #1F3C58;">BOLAXO</strong> © 2025 | Sveriges moderna marknadsplats för företagsöverlåtelser
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
}

/**
 * Send weekly digest email
 */
export async function sendWeeklyDigestEmail(
  email: string,
  name: string,
  role: string,
  stats: {
    newMatches?: number
    newListings?: number
    pendingNDAs?: number
    unreadMessages?: number
    profileViews?: number
  },
  topMatches: Array<{
    title: string
    matchScore: number
    industry: string
    listingId: string
  }>,
  baseUrl: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const isBuyer = role.includes('buyer')
  const dashboardUrl = `${baseUrl}/dashboard`
  
  let statsHtml = ''
  if (stats.newMatches && stats.newMatches > 0) {
    statsHtml += `<li style="margin-bottom: 8px;"><strong>${stats.newMatches}</strong> nya matchningar</li>`
  }
  if (stats.newListings && stats.newListings > 0) {
    statsHtml += `<li style="margin-bottom: 8px;"><strong>${stats.newListings}</strong> nya objekt</li>`
  }
  if (stats.pendingNDAs && stats.pendingNDAs > 0) {
    statsHtml += `<li style="margin-bottom: 8px;"><strong>${stats.pendingNDAs}</strong> väntande NDA-förfrågningar</li>`
  }
  if (stats.unreadMessages && stats.unreadMessages > 0) {
    statsHtml += `<li style="margin-bottom: 8px;"><strong>${stats.unreadMessages}</strong> olästa meddelanden</li>`
  }
  if (stats.profileViews && stats.profileViews > 0) {
    statsHtml += `<li style="margin-bottom: 8px;"><strong>${stats.profileViews}</strong> visningar av din annons</li>`
  }
  
  let matchesHtml = ''
  if (topMatches.length > 0) {
    matchesHtml = `
      <h3 style="color: #1F3C58; margin: 30px 0 15px 0; font-size: 18px; font-weight: 600;">
        ${isBuyer ? 'Toppmatchar för dig' : 'Intresserade köpare'}
      </h3>
    `
    topMatches.forEach(match => {
      matchesHtml += `
        <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 10px; border-left: 4px solid #1F3C58;">
          <p style="margin: 0 0 5px 0; font-weight: 600; color: #1F3C58; font-size: 15px;">${match.title}</p>
          <p style="margin: 0; color: #6b7280; font-size: 13px;">
            ${match.industry} • Matchningspoäng: <strong>${match.matchScore}%</strong>
          </p>
        </div>
      `
    })
  }
  
  return sendEmail({
    to: email,
    subject: `Din veckosammanfattning från BOLAXO`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background-color: #f9fafb;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <!-- Header -->
                <tr>
                  <td style="background-color: #1F3C58; padding: 40px 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">
                      BOLAXO
                    </h1>
                    <p style="color: #94a3b8; margin: 10px 0 0 0; font-size: 14px;">
                      Veckosammanfattning
                    </p>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="color: #1F3C58; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">
                      Hej ${name}! 👋
                    </h2>
                    
                    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                      Här är din veckosammanfattning från BOLAXO:
                    </p>
                    
                    ${statsHtml ? `
                    <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #22c55e;">
                      <h3 style="margin: 0 0 10px 0; color: #065f46; font-size: 16px;">Denna vecka:</h3>
                      <ul style="margin: 0; padding-left: 20px; color: #374151; font-size: 14px;">
                        ${statsHtml}
                      </ul>
                    </div>
                    ` : `
                    <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                      <p style="margin: 0; color: #6b7280; font-size: 14px;">Inga nya händelser denna vecka, men håll utkik!</p>
                    </div>
                    `}
                    
                    ${matchesHtml}
                    
                    <!-- Button -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding: 30px 0 20px 0;">
                          <a href="${dashboardUrl}" style="display: inline-block; background-color: #1F3C58; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; letter-spacing: 0.3px;">
                            Gå till Dashboard
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 30px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
                    <p style="color: #9ca3af; font-size: 12px; margin: 0 0 10px 0;">
                      <strong style="color: #1F3C58;">BOLAXO</strong> © 2025 | Sveriges moderna marknadsplats för företagsöverlåtelser
                    </p>
                    <p style="color: #9ca3af; font-size: 11px; margin: 0;">
                      <a href="${baseUrl}/installningar/notifikationer" style="color: #6b7280;">Hantera email-inställningar</a>
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
}

/**
 * Send transaction milestone email
 */
export async function sendTransactionMilestoneEmail(
  email: string,
  name: string,
  listingTitle: string,
  milestone: 'nda_signed' | 'loi_submitted' | 'loi_accepted' | 'dd_started' | 'dd_completed' | 'spa_signed' | 'deal_closed',
  transactionId: string,
  baseUrl: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const transactionUrl = `${baseUrl}/transaktion/${transactionId}`
  
  const milestoneConfig: Record<string, { title: string; message: string; icon: string; color: string }> = {
    nda_signed: {
      title: 'NDA Signerad',
      message: 'NDA har signerats och du kan nu se all information om företaget.',
      icon: '📝',
      color: '#3b82f6'
    },
    loi_submitted: {
      title: 'LOI Skickad',
      message: 'Ditt indikativa bud (LOI) har skickats till säljaren för granskning.',
      icon: '📤',
      color: '#8b5cf6'
    },
    loi_accepted: {
      title: 'LOI Godkänd!',
      message: 'Grattis! Säljaren har godkänt ditt indikativa bud. Due Diligence kan nu påbörjas.',
      icon: '🎉',
      color: '#22c55e'
    },
    dd_started: {
      title: 'Due Diligence Påbörjad',
      message: 'Due Diligence-processen har startats. Alla dokument finns i datarummet.',
      icon: '🔍',
      color: '#f59e0b'
    },
    dd_completed: {
      title: 'Due Diligence Klar',
      message: 'Due Diligence har slutförts. Nästa steg är att färdigställa köpeavtalet (SPA).',
      icon: '✅',
      color: '#22c55e'
    },
    spa_signed: {
      title: 'Köpeavtal Signerat',
      message: 'Köpeavtalet (SPA) har signerats av båda parter. Affären närmar sig slutförande!',
      icon: '✍️',
      color: '#22c55e'
    },
    deal_closed: {
      title: 'Affären Avslutad! 🎊',
      message: 'Grattis! Affären är nu officiellt avslutad. Tack för att du använde BOLAXO!',
      icon: '🏆',
      color: '#22c55e'
    }
  }
  
  const config = milestoneConfig[milestone] || {
    title: 'Uppdatering',
    message: 'Det har skett en uppdatering i din transaktion.',
    icon: '📌',
    color: '#1F3C58'
  }
  
  return sendEmail({
    to: email,
    subject: `${config.icon} ${config.title} - ${listingTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background-color: #f9fafb;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <!-- Header -->
                <tr>
                  <td style="background-color: #1F3C58; padding: 40px 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">
                      BOLAXO
                    </h1>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                      <span style="font-size: 48px;">${config.icon}</span>
                    </div>
                    
                    <h2 style="color: ${config.color}; margin: 0 0 20px 0; font-size: 24px; font-weight: 600; text-align: center;">
                      ${config.title}
                    </h2>
                    
                    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                      Hej ${name},
                    </p>
                    
                    <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${config.color};">
                      <p style="margin: 0 0 10px 0; font-weight: 600; color: #1F3C58; font-size: 16px;">${listingTitle}</p>
                      <p style="margin: 0; color: #374151; font-size: 14px;">${config.message}</p>
                    </div>
                    
                    <!-- Button -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding: 20px 0;">
                          <a href="${transactionUrl}" style="display: inline-block; background-color: #1F3C58; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; letter-spacing: 0.3px;">
                            Se transaktionen
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 30px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
                    <p style="color: #9ca3af; font-size: 12px; margin: 0 0 5px 0;">
                      <strong style="color: #1F3C58;">BOLAXO</strong> © 2025 | Sveriges moderna marknadsplats för företagsöverlåtelser
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
}

/**
 * Send test email (for admin testing)
 */
export async function sendTestEmail(
  email: string,
  testType: string = 'basic'
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  return sendEmail({
    to: email,
    subject: `[TEST] BOLAXO Email Test - ${testType}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background-color: #f9fafb;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <!-- Header -->
                <tr>
                  <td style="background-color: #1F3C58; padding: 40px 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">
                      BOLAXO
                    </h1>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                      <span style="font-size: 48px;">🧪</span>
                    </div>
                    
                    <h2 style="color: #1F3C58; margin: 0 0 20px 0; font-size: 24px; font-weight: 600; text-align: center;">
                      Test Email
                    </h2>
                    
                    <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #22c55e;">
                      <p style="margin: 0; color: #065f46; font-size: 16px; font-weight: 600;">
                        ✓ Email-systemet fungerar!
                      </p>
                    </div>
                    
                    <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Testtyp:</td>
                          <td style="padding: 8px 0; color: #1F3C58; font-size: 14px; font-weight: 600; text-align: right;">${testType}</td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">Tidpunkt:</td>
                          <td style="padding: 8px 0; border-top: 1px solid #e5e7eb; color: #1F3C58; font-size: 14px; font-weight: 600; text-align: right;">${new Date().toLocaleString('sv-SE')}</td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">Provider:</td>
                          <td style="padding: 8px 0; border-top: 1px solid #e5e7eb; color: #1F3C58; font-size: 14px; font-weight: 600; text-align: right;">Brevo (Sendinblue)</td>
                        </tr>
                      </table>
                    </div>
                    
                    <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0; text-align: center;">
                      Detta är ett testmail skickat från BOLAXO admin.
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 30px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
                    <p style="color: #9ca3af; font-size: 12px; margin: 0 0 5px 0;">
                      <strong style="color: #1F3C58;">BOLAXO</strong> © 2025 | Sveriges moderna marknadsplats för företagsöverlåtelser
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
    fromName: 'BOLAXO Test',
    from: 'noreply@bolaxo.com'
  })
}

