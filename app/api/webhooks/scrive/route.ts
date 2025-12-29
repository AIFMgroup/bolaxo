import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Scrive Webhook Handler
 * 
 * Scrive skickar webhooks när dokument signeras/avvisas
 * 
 * Setup i Scrive:
 * 1. Settings → Webhooks
 * 2. URL: https://bolaxo.com/api/webhooks/scrive
 * 3. Events: document.signed, document.declined
 */

export async function POST(request: Request) {
  try {
    const payload = await request.json()
    
    console.log('Scrive webhook received:', payload.event)

    // Validera webhook signature (i produktion)
    // const signature = request.headers.get('x-scrive-signature')
    // if (!validateSignature(signature, payload)) {
    //   return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
    // }

    const { event, document } = payload

    // Hitta vilket dokument i vårt system som detta är
    const doc = await prisma.document.findFirst({
      where: {
        // Antag att vi sparar Scrive document ID i metadata
        // För demo: matcha på title
        title: { contains: document.title }
      },
      include: {
        transaction: true
      }
    })

    if (!doc) {
      console.log('Document not found in our system')
      return NextResponse.json({ received: true })
    }

    // Hantera olika events
    switch (event) {
      case 'document.signed':
        await handleDocumentSigned(doc, document)
        break
      
      case 'document.declined':
        await handleDocumentDeclined(doc, document)
        break
      
      default:
        console.log('Unknown event:', event)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Scrive webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handleDocumentSigned(doc: any, scriveDoc: any) {
  console.log(`✅ Document signed: ${doc.title}`)

  // Uppdatera dokument-status
  await prisma.document.update({
    where: { id: doc.id },
    data: {
      status: 'SIGNED',
      signedAt: new Date()
    }
  })

  // Log activity
  await prisma.activity.create({
    data: {
      transactionId: doc.transactionId,
      type: 'DOCUMENT_UPLOADED',
      title: 'Dokument signerat',
      description: `${doc.title} har signerats av alla parter`,
      actorId: 'system',
      actorName: 'System',
      actorRole: 'advisor'
    }
  })

  // AUTO-COMPLETE MILESTONE om det är SPA
  if (doc.type === 'SPA') {
    const spaMilestone = await prisma.milestone.findFirst({
      where: {
        transactionId: doc.transactionId,
        title: { contains: 'SPA signerad' },
        completed: false
      }
    })

    if (spaMilestone) {
      await prisma.milestone.update({
        where: { id: spaMilestone.id },
        data: {
          completed: true,
          completedAt: new Date(),
          completedBy: 'system'
        }
      })

      await prisma.activity.create({
        data: {
          transactionId: doc.transactionId,
          type: 'MILESTONE_COMPLETED',
          title: 'Milstolpe auto-klar: SPA signerad',
          description: 'Systemet detekterade signerad SPA via Scrive',
          actorId: 'system',
          actorName: 'System',
          actorRole: 'advisor'
        }
      })

      // Uppdatera transaction stage
      await prisma.transaction.update({
        where: { id: doc.transactionId },
        data: {
          stage: 'CLOSING'
        }
      })

      console.log('✅ Auto-completed milestone: SPA signerad')
      console.log('✅ Moved transaction to CLOSING stage')
    }
  }
}

async function handleDocumentDeclined(doc: any, scriveDoc: any) {
  console.log(`❌ Document declined: ${doc.title}`)

  await prisma.activity.create({
    data: {
      transactionId: doc.transactionId,
      type: 'NOTE_ADDED',
      title: 'Dokument avvisat',
      description: `${doc.title} avvisades av en part. Kontakta parterna för att lösa.`,
      actorId: 'system',
      actorName: 'System',
      actorRole: 'advisor'
    }
  })
}

