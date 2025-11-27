import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { emailService } from '../../../src/utils/email'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-11-17.clover',
  })
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

    // Create Stripe Checkout Session
    const successUrl = process.env.PAYMENT_SUCCESS_URL || 'https://twistedbraids.fr/succes-paiement'
    const cancelUrl = process.env.PAYMENT_CANCEL_URL || 'https://twistedbraids.fr/echec-paiement'

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Acompte Réservation',
              description: `Acompte de 30% pour votre réservation chez Twisted (${booking.service?.name || 'Service'})`,
            },
            unit_amount: Math.round(depositAmount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      metadata: {
        bookingId: booking.id,
        clientEmail: booking.client?.email || '',
        serviceId: booking.service?.id || '',
      },
      payment_intent_data: {
        metadata: {
          bookingId: booking.id,
        },
      },
      customer_email: booking.client?.email,
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

