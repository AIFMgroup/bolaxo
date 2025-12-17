/**
 * Playwright prod smoke test (manual-run) covering:
 * - Buyer magic-link login
 * - Buyer requests NDA on an existing listing
 * - Seller approves NDA
 * - Buyer sees unlocked info and sends a message
 * - Seller replies; Buyer sees reply
 *
 * Prereqs (set as env when running):
 *  - PROD_BASE_URL=https://afterfounder.com
 *  - LOCALE=sv (or en)
 *  - BUYER_MAGIC_LINK_URL=<full magic link URL for test buyer>
 *  - SELLER_MAGIC_LINK_URL=<full magic link URL for test seller>
 *  - LISTING_ID=<an existing listing id used for the test>
 *
 * Run example:
 *   npx playwright test e2e/prod-smoke.spec.ts --project=chromium --headed
 *
 * Notes:
 * - This uses real prod; only run with disposable test accounts/listings.
 * - Selectors are text-based; adjust if your UI differs.
 */

import { test, expect, Page } from '@playwright/test'

const BASE = process.env.PROD_BASE_URL || 'https://afterfounder.com'
const LOCALE = process.env.LOCALE || 'sv'
const LISTING_ID = process.env.LISTING_ID
const BUYER_MAGIC_LINK_URL = process.env.BUYER_MAGIC_LINK_URL
const SELLER_MAGIC_LINK_URL = process.env.SELLER_MAGIC_LINK_URL

if (!LISTING_ID || !BUYER_MAGIC_LINK_URL || !SELLER_MAGIC_LINK_URL) {
  throw new Error('Missing env: LISTING_ID, BUYER_MAGIC_LINK_URL, SELLER_MAGIC_LINK_URL')
}

async function loginWithMagicLink(page: Page, magicLink: string) {
  await page.goto(magicLink, { waitUntil: 'networkidle' })
  // Verify logged in by checking dashboard link presence
  await expect(page.getByText(/dashboard/i)).toBeVisible({ timeout: 15_000 })
}

test.describe('Prod smoke: buyer/seller NDA + messaging', () => {
  test('NDA flow and messaging', async ({ browser }) => {
    // Buyer context
    const buyerContext = await browser.newContext()
    const buyerPage = await buyerContext.newPage()
    await loginWithMagicLink(buyerPage, BUYER_MAGIC_LINK_URL!)

    // Seller context
    const sellerContext = await browser.newContext()
    const sellerPage = await sellerContext.newPage()
    await loginWithMagicLink(sellerPage, SELLER_MAGIC_LINK_URL!)

    // Buyer: go to listing and request NDA
    await buyerPage.goto(`${BASE}/${LOCALE}/objekt/${LISTING_ID}`, { waitUntil: 'networkidle' })
    // Click request NDA button (adjust text if different)
    const ndaBtn = buyerPage.getByRole('button', { name: /nda/i })
    await ndaBtn.click()
    // Fill reason if required (adjust selector)
    const reason = buyerPage.getByLabel(/varför/i).or(buyerPage.getByRole('textbox'))
    await reason.fill('Automatiskt test: begär NDA')
    const submitNda = buyerPage.getByRole('button', { name: /skicka|signera|begär/i })
    await submitNda.click()
    await expect(buyerPage.getByText(/förfrågan.*skickad/i)).toBeVisible({ timeout: 10_000 })

    // Seller: approve NDA in dashboard
    await sellerPage.goto(`${BASE}/${LOCALE}/dashboard/ndas`, { waitUntil: 'networkidle' })
    // Open first pending NDA (adjust selector to your table/button)
    const firstApprove = sellerPage.getByRole('button', { name: /godkänn/i }).first()
    await firstApprove.click()
    await expect(sellerPage.getByText(/godkänd/i)).toBeVisible({ timeout: 10_000 })

    // Buyer: verify unlocked info
    await buyerPage.reload({ waitUntil: 'networkidle' })
    await expect(buyerPage.getByText(/fullständig information|omsättning|adress/i)).toBeVisible({ timeout: 10_000 })

    // Buyer: send message to seller
    await buyerPage.goto(`${BASE}/${LOCALE}/dashboard/messages`, { waitUntil: 'networkidle' })
    const newMsgBtn = buyerPage.getByRole('button', { name: /nytt meddelande|skriv/i }).first()
    await newMsgBtn.click()
    const msgBox = buyerPage.getByRole('textbox')
    await msgBox.fill('Automatiskt test: hej från köpare')
    const sendBtn = buyerPage.getByRole('button', { name: /skicka/i }).first()
    await sendBtn.click()
    await expect(buyerPage.getByText(/skickat|sent/i)).toBeVisible({ timeout: 10_000 })

    // Seller: read and reply
    await sellerPage.goto(`${BASE}/${LOCALE}/dashboard/messages`, { waitUntil: 'networkidle' })
    await sellerPage.getByText(/hej från köpare/i).first().click()
    const replyBox = sellerPage.getByRole('textbox')
    await replyBox.fill('Automatiskt test: svar från säljare')
    const replyBtn = sellerPage.getByRole('button', { name: /skicka|svara/i }).first()
    await replyBtn.click()
    await expect(sellerPage.getByText(/svar från säljare/i)).toBeVisible({ timeout: 10_000 })

    // Buyer: confirm reply visible
    await buyerPage.reload({ waitUntil: 'networkidle' })
    await buyerPage.getByText(/svar från säljare/i).first().click()
    await expect(buyerPage.getByText(/svar från säljare/i)).toBeVisible({ timeout: 10_000 })

    await buyerContext.close()
    await sellerContext.close()
  })
})

