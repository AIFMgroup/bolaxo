import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/admin-auth'
import { 
  sendTestEmail,
  sendWelcomeEmail,
  sendNDAApprovalEmail,
  sendNDARejectionEmail,
  sendNewNDARequestEmail,
  sendNewMessageEmail,
  sendMatchNotificationEmail,
  sendPaymentConfirmationEmail,
  sendInvoiceReminderEmail,
  sendWeeklyDigestEmail,
  sendTransactionMilestoneEmail,
  sendNDAPendingReminderEmail
} from '@/lib/email'

const EMAIL_TYPES = {
  test: 'Grundläggande test',
  welcome: 'Välkommen-email',
  nda_approval: 'NDA godkänd',
  nda_rejection: 'NDA avslagen',
  nda_request: 'Ny NDA-förfrågan',
  new_message: 'Nytt meddelande',
  match_buyer: 'Matchning (köpare)',
  match_seller: 'Matchning (säljare)',
  payment_confirmation: 'Betalningsbekräftelse',
  invoice_reminder: 'Fakturapåminnelse',
  weekly_digest: 'Veckosammanfattning',
  transaction_milestone: 'Transaktions-milstolpe',
  nda_pending_reminder: 'NDA-påminnelse'
} as const

type EmailType = keyof typeof EMAIL_TYPES

/**
 * GET /api/admin/email-test
 * Get available email types for testing
 */
export async function GET(request: NextRequest) {
  try {
    const adminToken = await verifyAdminToken(request)
    
    if (!adminToken || adminToken.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    return NextResponse.json({
      emailTypes: Object.entries(EMAIL_TYPES).map(([key, name]) => ({
        type: key,
        name
      })),
      configured: !!process.env.BREVO_API_KEY
    })
  } catch (error) {
    console.error('Email test GET error:', error)
    return NextResponse.json({ error: 'Failed to get email types' }, { status: 500 })
  }
}

/**
 * POST /api/admin/email-test
 * Send a test email of specified type
 */
export async function POST(request: NextRequest) {
  try {
    const adminToken = await verifyAdminToken(request)
    
    if (!adminToken || adminToken.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    const { email, emailType } = body as { email: string; emailType: EmailType }
    
    if (!email || !emailType) {
      return NextResponse.json(
        { error: 'Email and emailType are required' },
        { status: 400 }
      )
    }
    
    if (!EMAIL_TYPES[emailType]) {
      return NextResponse.json(
        { error: 'Invalid email type' },
        { status: 400 }
      )
    }
    
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://bolaxo.com'
    let result: { success: boolean; messageId?: string; error?: string }
    
    switch (emailType) {
      case 'test':
        result = await sendTestEmail(email, 'admin-test')
        break
        
      case 'welcome':
        result = await sendWelcomeEmail(email, 'Test Användare', 'buyer', baseUrl)
        break
        
      case 'nda_approval':
        result = await sendNDAApprovalEmail(
          email,
          'Test Köpare',
          'Test IT-konsultbolag i Stockholm',
          'test-nda-id',
          baseUrl
        )
        break
        
      case 'nda_rejection':
        result = await sendNDARejectionEmail(
          email,
          'Test Köpare',
          'Test IT-konsultbolag i Stockholm',
          'Köparens profil matchade inte våra krav för tillfället.',
          baseUrl
        )
        break
        
      case 'nda_request':
        result = await sendNewNDARequestEmail(
          email,
          'Test Säljare',
          'Intresserad Köpare AB',
          'Test IT-konsultbolag i Stockholm',
          'test-nda-id',
          baseUrl
        )
        break
        
      case 'new_message':
        result = await sendNewMessageEmail(
          email,
          'Test Mottagare',
          'Anna Andersson',
          'Test IT-konsultbolag i Stockholm',
          'Hej! Jag är mycket intresserad av ert företag och skulle vilja veta mer om verksamheten och vad som ingår i försäljningen...',
          'test-listing-id',
          baseUrl
        )
        break
        
      case 'match_buyer':
        result = await sendMatchNotificationEmail(
          email,
          'Test Köpare',
          'buyer',
          'E-handelsbolag med hög tillväxt i Göteborg',
          87,
          'test-listing-id',
          baseUrl
        )
        break
        
      case 'match_seller':
        result = await sendMatchNotificationEmail(
          email,
          'Test Säljare',
          'seller',
          'Test IT-konsultbolag i Stockholm',
          92,
          'test-listing-id',
          baseUrl
        )
        break
        
      case 'payment_confirmation':
        result = await sendPaymentConfirmationEmail(
          email,
          'Test Användare',
          4990,
          'SEK',
          'PRO Annonspaket',
          `${baseUrl}/kvitto/test-invoice`,
          baseUrl
        )
        break
        
      case 'invoice_reminder':
        const dueDate = new Date()
        dueDate.setDate(dueDate.getDate() + 3) // 3 days from now
        result = await sendInvoiceReminderEmail(
          email,
          'Test Användare',
          4990,
          'SEK',
          dueDate,
          'INV-2025-00123',
          `${baseUrl}/betala/test-invoice`,
          baseUrl
        )
        break
        
      case 'weekly_digest':
        result = await sendWeeklyDigestEmail(
          email,
          'Test Användare',
          'buyer',
          {
            newMatches: 5,
            newListings: 12,
            unreadMessages: 3
          },
          [
            { title: 'IT-konsultbolag i Stockholm', matchScore: 94, industry: 'Tech & IT', listingId: 'test-1' },
            { title: 'E-handelsbolag i Göteborg', matchScore: 87, industry: 'E-handel', listingId: 'test-2' },
            { title: 'SaaS-företag med ARR', matchScore: 85, industry: 'Tech & IT', listingId: 'test-3' }
          ],
          baseUrl
        )
        break
        
      case 'transaction_milestone':
        result = await sendTransactionMilestoneEmail(
          email,
          'Test Användare',
          'Test IT-konsultbolag i Stockholm',
          'loi_accepted',
          'test-transaction-id',
          baseUrl
        )
        break
        
      case 'nda_pending_reminder':
        result = await sendNDAPendingReminderEmail(
          email,
          'Test Säljare',
          3,
          5,
          `${baseUrl}/dashboard/ndas`
        )
        break
        
      default:
        result = await sendTestEmail(email, emailType)
    }
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Test-email av typ "${EMAIL_TYPES[emailType]}" skickad till ${email}`,
        messageId: result.messageId
      })
    } else {
      return NextResponse.json({
        success: false,
        error: result.error || 'Failed to send email'
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('Email test POST error:', error)
    return NextResponse.json(
      { error: 'Failed to send test email' },
      { status: 500 }
    )
  }
}

