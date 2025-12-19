/**
 * Test script for BOLAXO email system
 * Run with: npx ts-node scripts/test-emails.ts
 * 
 * Requires BREVO_API_KEY to be set in environment
 */

import * as dotenv from 'dotenv'
dotenv.config()

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
  sendNDAPendingReminderEmail,
  sendMagicLinkEmail
} from '../lib/email'

const TEST_EMAIL = process.env.TEST_EMAIL || 'test@example.com'
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://bolaxo.com'

async function runTests() {
  console.log('🧪 Starting BOLAXO Email System Tests')
  console.log('====================================')
  console.log(`📧 Test email: ${TEST_EMAIL}`)
  console.log(`🌐 Base URL: ${BASE_URL}`)
  console.log(`🔑 Brevo API Key: ${process.env.BREVO_API_KEY ? '✅ Set' : '❌ Not set'}`)
  console.log('')

  if (!process.env.BREVO_API_KEY) {
    console.error('❌ BREVO_API_KEY is not set. Emails will not be sent.')
    process.exit(1)
  }

  const results: { name: string; success: boolean; error?: string }[] = []

  // Test 1: Basic test email
  console.log('1. Testing: Basic test email...')
  const test1 = await sendTestEmail(TEST_EMAIL, 'script-test')
  results.push({ name: 'Basic test', success: test1.success, error: test1.error })
  console.log(test1.success ? '   ✅ Success' : `   ❌ Failed: ${test1.error}`)

  // Test 2: Magic link email
  console.log('2. Testing: Magic link email...')
  const test2 = await sendMagicLinkEmail(TEST_EMAIL, `${BASE_URL}/auth/verify?token=test123`, 'Test User')
  results.push({ name: 'Magic link', success: test2.success, error: test2.error })
  console.log(test2.success ? '   ✅ Success' : `   ❌ Failed: ${test2.error}`)

  // Test 3: Welcome email
  console.log('3. Testing: Welcome email...')
  const test3 = await sendWelcomeEmail(TEST_EMAIL, 'Test User', 'buyer', BASE_URL)
  results.push({ name: 'Welcome', success: test3.success, error: test3.error })
  console.log(test3.success ? '   ✅ Success' : `   ❌ Failed: ${test3.error}`)

  // Test 4: NDA Approval email
  console.log('4. Testing: NDA Approval email...')
  const test4 = await sendNDAApprovalEmail(TEST_EMAIL, 'Test Buyer', 'Test Company AB', 'test-nda-id', BASE_URL)
  results.push({ name: 'NDA Approval', success: test4.success, error: test4.error })
  console.log(test4.success ? '   ✅ Success' : `   ❌ Failed: ${test4.error}`)

  // Test 5: NDA Rejection email
  console.log('5. Testing: NDA Rejection email...')
  const test5 = await sendNDARejectionEmail(TEST_EMAIL, 'Test Buyer', 'Test Company AB', 'Not a good fit', BASE_URL)
  results.push({ name: 'NDA Rejection', success: test5.success, error: test5.error })
  console.log(test5.success ? '   ✅ Success' : `   ❌ Failed: ${test5.error}`)

  // Test 6: New NDA Request email
  console.log('6. Testing: New NDA Request email...')
  const test6 = await sendNewNDARequestEmail(TEST_EMAIL, 'Test Seller', 'Interested Buyer', 'Test Company AB', 'test-nda-id', BASE_URL)
  results.push({ name: 'New NDA Request', success: test6.success, error: test6.error })
  console.log(test6.success ? '   ✅ Success' : `   ❌ Failed: ${test6.error}`)

  // Test 7: New Message email
  console.log('7. Testing: New Message email...')
  const test7 = await sendNewMessageEmail(TEST_EMAIL, 'Test Recipient', 'Test Sender', 'Test Company AB', 'Hello, I am interested in your company...', 'test-listing-id', BASE_URL)
  results.push({ name: 'New Message', success: test7.success, error: test7.error })
  console.log(test7.success ? '   ✅ Success' : `   ❌ Failed: ${test7.error}`)

  // Test 8: Match notification (buyer)
  console.log('8. Testing: Match notification (buyer)...')
  const test8 = await sendMatchNotificationEmail(TEST_EMAIL, 'Test Buyer', 'buyer', 'Tech Company in Stockholm', 92, 'test-listing-id', BASE_URL)
  results.push({ name: 'Match (buyer)', success: test8.success, error: test8.error })
  console.log(test8.success ? '   ✅ Success' : `   ❌ Failed: ${test8.error}`)

  // Test 9: Match notification (seller)
  console.log('9. Testing: Match notification (seller)...')
  const test9 = await sendMatchNotificationEmail(TEST_EMAIL, 'Test Seller', 'seller', 'Tech Company in Stockholm', 85, 'test-listing-id', BASE_URL)
  results.push({ name: 'Match (seller)', success: test9.success, error: test9.error })
  console.log(test9.success ? '   ✅ Success' : `   ❌ Failed: ${test9.error}`)

  // Test 10: Payment confirmation
  console.log('10. Testing: Payment confirmation email...')
  const test10 = await sendPaymentConfirmationEmail(TEST_EMAIL, 'Test User', 4990, 'SEK', 'PRO Package', `${BASE_URL}/receipt/test`, BASE_URL)
  results.push({ name: 'Payment confirmation', success: test10.success, error: test10.error })
  console.log(test10.success ? '   ✅ Success' : `   ❌ Failed: ${test10.error}`)

  // Test 11: Invoice reminder
  console.log('11. Testing: Invoice reminder email...')
  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + 3)
  const test11 = await sendInvoiceReminderEmail(TEST_EMAIL, 'Test User', 4990, 'SEK', dueDate, 'INV-2025-001', `${BASE_URL}/pay/test`, BASE_URL)
  results.push({ name: 'Invoice reminder', success: test11.success, error: test11.error })
  console.log(test11.success ? '   ✅ Success' : `   ❌ Failed: ${test11.error}`)

  // Test 12: Weekly digest
  console.log('12. Testing: Weekly digest email...')
  const test12 = await sendWeeklyDigestEmail(
    TEST_EMAIL,
    'Test User',
    'buyer',
    { newMatches: 5, newListings: 12, unreadMessages: 3 },
    [
      { title: 'IT Company Stockholm', matchScore: 94, industry: 'Tech', listingId: 'test-1' },
      { title: 'E-commerce Göteborg', matchScore: 87, industry: 'Retail', listingId: 'test-2' }
    ],
    BASE_URL
  )
  results.push({ name: 'Weekly digest', success: test12.success, error: test12.error })
  console.log(test12.success ? '   ✅ Success' : `   ❌ Failed: ${test12.error}`)

  // Test 13: Transaction milestone
  console.log('13. Testing: Transaction milestone email...')
  const test13 = await sendTransactionMilestoneEmail(TEST_EMAIL, 'Test User', 'Test Company AB', 'loi_accepted', 'test-transaction-id', BASE_URL)
  results.push({ name: 'Transaction milestone', success: test13.success, error: test13.error })
  console.log(test13.success ? '   ✅ Success' : `   ❌ Failed: ${test13.error}`)

  // Test 14: NDA pending reminder
  console.log('14. Testing: NDA pending reminder email...')
  const test14 = await sendNDAPendingReminderEmail(TEST_EMAIL, 'Test Seller', 3, 5, `${BASE_URL}/dashboard/ndas`)
  results.push({ name: 'NDA pending reminder', success: test14.success, error: test14.error })
  console.log(test14.success ? '   ✅ Success' : `   ❌ Failed: ${test14.error}`)

  // Summary
  console.log('')
  console.log('====================================')
  console.log('📊 Test Summary')
  console.log('====================================')
  
  const passed = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success).length
  
  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`📧 Total emails sent: ${passed}`)
  
  if (failed > 0) {
    console.log('')
    console.log('Failed tests:')
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.name}: ${r.error}`)
    })
  }
  
  console.log('')
  console.log(`📬 Check ${TEST_EMAIL} inbox for test emails!`)
}

runTests().catch(console.error)

