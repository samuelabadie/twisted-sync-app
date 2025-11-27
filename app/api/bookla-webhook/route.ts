import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { emailService } from '../../../src/utils/email'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-11-17.clover',
  })
}

// GET handler for webhook verification/health check
export async function GET() {
  console.log('Bookla webhook GET - health check')
  return NextResponse.json({ status: 'ok', message: 'Bookla webhook is active' })
}

export async function POST(request: NextRequest) {
  const stripe = getStripe()
  try {
    const event = await request.json()

    console.log('Received Bookla webhook', JSON.stringify(event, null, 2))

    // Bookla webhook payload structure - adjust based on actual payload
    const booking = event.data || event
    
    if (!booking || !booking.id) {
      return NextResponse.json({ error: 'Invalid booking payload' }, { status: 400 })
    }

    // Get price from booking - adjust field name based on actual Bookla payload
    const totalAmount = booking.price || booking.totalPrice || booking.amount || 0
    
    if (totalAmount <= 0) {
      console.warn(`Booking ${booking.id} has no price, skipping payment link`)
      return NextResponse.json({ received: true, skipped: 'no_price' })
    }

    // Calculate 30% deposit
    const depositAmount = totalAmount * 0.30

    // Create Stripe Checkout Session with 15-minute expiration
    const successUrl = process.env.PAYMENT_SUCCESS_URL || 'https://twistedbraids.fr/succes-paiement'
    const cancelUrl = process.env.PAYMENT_CANCEL_URL || 'https://twistedbraids.fr/echec-paiement'
    
    // Expire in 15 minutes (must be at least 30 minutes in the future for Stripe)
    // Stripe requires expires_at to be between 30 minutes and 24 hours
    // So we use 30 minutes as minimum, but our cleanup job will cancel after 15 min
    const expiresAt = Math.floor(Date.now() / 1000) + (30 * 60) // 30 minutes from now

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Acompte Réservation Twisted',
              description: `Acompte de 30% pour votre réservation (${booking.service?.name || booking.serviceName || 'Service'})`,
            },
            unit_amount: Math.round(depositAmount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      expires_at: expiresAt,
      metadata: {
        bookingId: booking.id,
        clientEmail: booking.client?.email || booking.clientEmail || '',
        serviceId: booking.service?.id || booking.serviceID || '',
        totalPrice: String(totalAmount),
        depositAmount: String(depositAmount),
      },
      payment_intent_data: {
        metadata: {
          bookingId: booking.id,
        },
      },
      customer_email: booking.client?.email || booking.clientEmail,
      success_url: successUrl,
      cancel_url: cancelUrl,
    })

    const checkoutUrl = session.url

    if (!checkoutUrl) {
      throw new Error('Failed to generate checkout URL')
    }

    console.log(`Generated payment link for booking ${booking.id}: ${checkoutUrl}`)

    // Send Email with checkoutUrl
    if (booking.client?.email) {
      await emailService.sendPaymentLink(booking.client.email, checkoutUrl, booking.id)
      console.log(`Payment link email sent to ${booking.client.email}`)
    } else {
      console.warn(`No client email found for booking ${booking.id}`)
    }

    return NextResponse.json({ received: true, checkoutUrl })

  } catch (error: any) {
    console.error('Bookla webhook failed:', error.message)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

