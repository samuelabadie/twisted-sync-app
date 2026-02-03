import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { BooklaClient } from '../../../src/lib/bookla'
import { DatabaseService } from '../../../src/lib/database'
import { emailService } from '../../../src/utils/email'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-11-17.clover',
  })
}

export async function POST(request: NextRequest) {
  console.log('=== STRIPE WEBHOOK RECEIVED ===')

  const stripe = getStripe()
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  console.log('Stripe signature present:', !!sig)

  if (!sig) {
    console.error('No Stripe signature in request')
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
    console.log('Webhook signature verified successfully')
    console.log('Event type:', event.type)
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    console.error('STRIPE_WEBHOOK_SECRET configured:', !!process.env.STRIPE_WEBHOOK_SECRET)
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const bookingId = session.metadata?.bookingId

      console.log('Checkout session completed!')
      console.log('Session ID:', session.id)
      console.log('Metadata:', JSON.stringify(session.metadata))
      console.log('BookingId from metadata:', bookingId)

      if (bookingId) {
        console.log(`Processing payment confirmation for booking ${bookingId}...`)

        const bookla = new BooklaClient(
          process.env.BOOKLA_API_KEY!,
          process.env.BOOKLA_COMPANY_ID!
        )

        // 1. Confirm in Bookla (Best effort)
        try {
          await bookla.confirmBooking(bookingId)
          console.log(`✅ Booking ${bookingId} confirmed in Bookla.`)
        } catch (booklaError: any) {
           console.error(`❌ Failed to confirm in Bookla: ${booklaError.message}`)
           // Continue to update DB anyway
        }

        // 2. Update Database status (Source of Truth)
        try {
          const db = new DatabaseService()
          await db.updateBookingStatus(bookingId, 'paid')
          console.log(`✅ Booking ${bookingId} marked as PAID in database.`)
        } catch (dbError: any) {
           console.error(`❌ Failed to update booking status in database: ${dbError.message}`)
        }

        // 3. Send confirmation email with booking details
        try {
          const booking = await bookla.getBooking(bookingId)
          console.log('Booking details:', JSON.stringify(booking))

          // Extract booking info
          const clientEmail = booking.client?.email || session.customer_details?.email
          const serviceName = booking.service?.name || 'Prestation'
          const resourceName = booking.resource?.name
          const amountPaid = (session.amount_total || 0) / 100 // Convert cents to EUR

          // Format date/time
          let dateTime = 'Date à confirmer'
          if (booking.startTime) {
            const date = new Date(booking.startTime)
            dateTime = date.toLocaleDateString('fr-FR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })
          }

          if (clientEmail) {
            await emailService.sendPaymentConfirmation(clientEmail, {
              serviceName,
              dateTime,
              resourceName,
              amountPaid
            })
            console.log(`✅ Confirmation email sent to ${clientEmail}`)
          } else {
            console.warn('⚠️ No client email found, skipping confirmation email')
          }
        } catch (emailError: any) {
          console.error(`❌ Failed to send confirmation email: ${emailError.message}`)
          // Don't fail the webhook if email fails
        }
      } else {
        console.warn('⚠️ Checkout Session completed but no bookingId in metadata!')
        console.warn('This means the Stripe session was not created with booking metadata.')
      }
    } else {
      console.log(`Ignoring event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Stripe webhook processing failed:', error.message)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

