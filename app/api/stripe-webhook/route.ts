import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { BooklaClient } from '../../../src/lib/bookla'
import { GoogleSheetsService } from '../../../src/lib/google-sheets'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-11-17.clover',
  })
}

export async function POST(request: NextRequest) {
  const stripe = getStripe()
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const bookingId = session.metadata?.bookingId

      if (bookingId) {
        console.log(`Checkout session completed for booking ${bookingId}. Confirming...`)
        
        // 1. Confirm in Bookla (Best effort)
        try {
          const bookla = new BooklaClient(
            process.env.BOOKLA_API_KEY!,
            process.env.BOOKLA_COMPANY_ID!
          )
          await bookla.confirmBooking(bookingId)
          console.log(`Booking ${bookingId} confirmed in Bookla.`)
        } catch (booklaError: any) {
           console.error(`Failed to confirm in Bookla (maybe ID invalid or already confirmed): ${booklaError.message}`)
           // Continue to update Sheet anyway
        }
        
        // 2. Update Sheet status (Source of Truth)
        try {
          if (process.env.GOOGLE_SHEET_ID && process.env.GOOGLE_CREDS) {
            const sheets = new GoogleSheetsService(
              process.env.GOOGLE_SHEET_ID,
              process.env.GOOGLE_CREDS
            )
            await sheets.updateBookingStatus(bookingId, 'paid')
            console.log(`Booking ${bookingId} marked as PAID in Sheet.`)
          }
        } catch (sheetError: any) {
           console.error('Failed to update booking status in Sheet:', sheetError.message)
        }
      } else {
        console.warn('Checkout Session completed but no bookingId in metadata')
      }
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Stripe webhook processing failed:', error.message)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

