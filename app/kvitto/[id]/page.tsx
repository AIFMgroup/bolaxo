'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { usePaymentStore } from '@/store/paymentStore'
import { Printer, ArrowLeft } from 'lucide-react'

export default function ReceiptPage() {
  const params = useParams()
  const { subscription, invoices, customerDetails } = usePaymentStore()
  
  const invoiceId = params.id as string
  const invoice = invoices.find(inv => inv.id === invoiceId) || invoices[0]
  const price = subscription?.price ?? 0

  const handlePrint = () => {
    window.print()
  }

  return (
    <main className="min-h-screen bg-gray-50 py-6 sm:py-8 md:py-12">
      <div className="max-w-3xl mx-auto px-3 sm:px-4">
        {/* Actions */}
        <div className="flex justify-between items-center mb-6 print:hidden">
          <Link href="/dashboard" className="text-primary-blue hover:underline">
            ← Tillbaka till översikt
          </Link>
          <button onClick={handlePrint} className="btn-secondary flex items-center">
            <Printer className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            Skriv ut / Spara PDF
          </button>
        </div>

        {/* Receipt/Invoice */}
        <div className="bg-white p-12 rounded-2xl shadow-lg">
          {/* Header */}
          <div className="flex justify-between items-start mb-12">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-primary-blue mb-2">Afterfounder</h1>
              <p className="text-sm text-text-gray">
                Afterfounder AB<br />
                Org.nr: 559123-4567<br />
                Drottninggatan 33<br />
                111 51 Stockholm<br />
                Momsreg.nr: SE559123456701
              </p>
            </div>
            <div className="text-right">
              <h2 className="text-xl sm:text-2xl font-bold text-text-dark mb-2">
                {subscription?.paymentMethod === 'card' ? 'KVITTO' : 'FAKTURA'}
              </h2>
              {invoice && (
                <div className="text-sm text-text-gray">
                  <div>Nr: {invoice.invoiceNumber}</div>
                  <div>Datum: {new Date().toLocaleDateString('sv-SE')}</div>
                  {subscription?.paymentMethod === 'invoice' && (
                    <div>Förfallodatum: {invoice.dueDate.toLocaleDateString('sv-SE')}</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Customer Info */}
          <div className="mb-12">
            <h3 className="font-semibold text-sm text-text-gray mb-2">Kund:</h3>
            <div className="text-sm">
              <div className="font-semibold">{customerDetails?.companyName}</div>
              <div>Org.nr: {customerDetails?.orgNumber}</div>
              <div className="whitespace-pre-line">{customerDetails?.invoiceAddress}</div>
              {customerDetails?.peppolId && (
                <div>Peppol-ID: {customerDetails.peppolId}</div>
              )}
              {customerDetails?.reference && (
                <div>Referens: {customerDetails.reference}</div>
              )}
            </div>
          </div>

          {/* Line Items */}
          <table className="w-full mb-12">
            <thead className="border-b-2 border-gray-300">
              <tr>
                <th className="text-left py-3 text-sm font-semibold">Specifikation</th>
                <th className="text-right py-3 text-sm font-semibold">Antal</th>
                <th className="text-right py-3 text-sm font-semibold">à-pris</th>
                <th className="text-right py-3 text-sm font-semibold">Belopp</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-200">
                <td className="py-4">
                  <div className="font-semibold capitalize">{subscription?.plan} - {subscription?.billingPeriod}</div>
                  <div className="text-xs text-text-gray">
                    Period: {new Date().toLocaleDateString('sv-SE')} - 
                    {subscription?.nextBillingDate 
                      ? subscription.nextBillingDate.toLocaleDateString('sv-SE')
                      : ' Tills sålt'}
                  </div>
                </td>
                <td className="text-right">1</td>
                <td className="text-right">{price.toLocaleString('sv-SE')} kr</td>
                <td className="text-right font-semibold">{price.toLocaleString('sv-SE')} kr</td>
              </tr>
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end mb-12">
            <div className="w-64">
              <div className="flex justify-between mb-2 text-sm">
                <span className="text-text-gray">Summa exkl. moms:</span>
                <span className="font-semibold">{price.toLocaleString('sv-SE')} kr</span>
              </div>
              <div className="flex justify-between mb-4 text-sm">
                <span className="text-text-gray">Moms (25%):</span>
                <span className="font-semibold">{Math.round(price * 0.25).toLocaleString('sv-SE')} kr</span>
              </div>
              <div className="border-t-2 border-gray-300 pt-3">
                <div className="flex justify-between">
                  <span className="font-bold text-lg">Totalt:</span>
                  <span className="font-bold text-xl sm:text-2xl text-primary-blue">
                    {Math.round(price * 1.25).toLocaleString('sv-SE')} kr
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Info (Invoice only) */}
          {subscription?.paymentMethod === 'invoice' && invoice && (
            <div className="bg-gray-50 p-6 rounded-xl mb-8">
              <h3 className="font-semibold mb-3">Betalningsinstruktioner:</h3>
              <div className="text-sm space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-text-gray">Bankgiro:</span>
                    <div className="font-semibold">123-4567</div>
                  </div>
                  <div>
                    <span className="text-text-gray">OCR-nummer:</span>
                    <div className="font-semibold">{invoice.ocr}</div>
                  </div>
                </div>
                <div className="text-xs text-text-gray mt-3">
                  Ange alltid OCR-nummer vid betalning
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="text-center text-xs text-text-gray">
            <p>Tack för ditt köp!</p>
            <p className="mt-2">
              Frågor? Kontakta support@afterfounder.se
            </p>
          </div>
        </div>

        {/* Next Actions */}
        <div className="flex gap-3 mt-8 print:hidden">
          <Link href="/dashboard" className="btn-secondary flex-1 text-center">
            Till översikten
          </Link>
        </div>
      </div>
    </main>
  )
}

