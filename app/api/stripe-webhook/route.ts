import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { BooklaClient } from '../../../src/lib/bookla'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
})

export async function POST(request: NextRequest) {
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
        
        const bookla = new BooklaClient(
          process.env.BOOKLA_API_KEY!,
          process.env.BOOKLA_COMPANY_ID!
        )
        
        await bookla.confirmBooking(bookingId)
        console.log(`Booking ${bookingId} confirmed.`)
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

