import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { BooklaClient } from '../../../src/lib/bookla'

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
    const bookla = new BooklaClient(
      process.env.BOOKLA_API_KEY!,
      process.env.BOOKLA_COMPANY_ID!
    )

    // Handle successful payment
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const bookingId = session.metadata?.bookingId

      if (bookingId) {
        console.log(`✅ Payment completed for booking ${bookingId}. Confirming on Bookla...`)
        await bookla.confirmBooking(bookingId)
        console.log(`✅ Booking ${bookingId} confirmed on Bookla.`)
      } else {
        console.warn('⚠️ Checkout Session completed but no bookingId in metadata')
      }
    }

    // Handle expired checkout session (payment not completed in time)
    if (event.type === 'checkout.session.expired') {
      const session = event.data.object as Stripe.Checkout.Session
      const bookingId = session.metadata?.bookingId

      if (bookingId) {
        console.log(`⏰ Checkout session EXPIRED for booking ${bookingId}. Cancelling on Bookla...`)
        try {
          await bookla.cancelBooking(bookingId)
          console.log(`🗑️ Booking ${bookingId} cancelled on Bookla (payment expired).`)
        } catch (cancelError: any) {
          // Booking might already be cancelled or confirmed
          console.warn(`⚠️ Could not cancel booking ${bookingId}: ${cancelError.message}`)
        }
      } else {
        console.warn('⚠️ Checkout Session expired but no bookingId in metadata')
      }
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Stripe webhook processing failed:', error.message)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

