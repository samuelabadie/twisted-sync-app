import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-11-17.clover',
  })
}

// CORS headers for frontend calls from Webflow
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

export async function POST(request: NextRequest) {
  const stripe = getStripe()
  
  try {
    const booking = await request.json()
    
    console.log('Creating checkout for booking:', JSON.stringify(booking, null, 2))

    // Extract booking data - adapt field names based on actual Bookla response
    const bookingId = booking.id || booking.bookingId
    const clientEmail = booking.client?.email || booking.email || booking.guestEmail
    const serviceName = booking.service?.name || booking.serviceName || 'Service'
    
    // Get price - Bookla may return it in different formats
    // Price could be in cents or euros, check the actual response
    let totalPrice = 0
    
    if (booking.totalPrice !== undefined) {
      totalPrice = booking.totalPrice
    } else if (booking.price !== undefined) {
      totalPrice = booking.price
    } else if (booking.tickets && Array.isArray(booking.tickets)) {
      // Sum up ticket prices
      totalPrice = booking.tickets.reduce((sum: number, ticket: any) => {
        return sum + (ticket.price || 0)
      }, 0)
    }

    // If price is in cents (> 1000 for a typical service), convert to euros
    if (totalPrice > 1000) {
      totalPrice = totalPrice / 100
    }

    if (!bookingId) {
      return NextResponse.json(
        { error: 'Missing booking ID' },
        { status: 400, headers: corsHeaders }
      )
    }

    if (totalPrice <= 0) {
      console.warn(`Booking ${bookingId} has no price`)
      return NextResponse.json(
        { error: 'No price found for booking' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Calculate 30% deposit
    const depositAmount = totalPrice * 0.30
    const depositCents = Math.round(depositAmount * 100)

    console.log(`Booking ${bookingId}: Total ${totalPrice}€, Deposit 30% = ${depositAmount}€ (${depositCents} cents)`)

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
              description: `Acompte de 30% pour "${serviceName}" chez Twisted`,
            },
            unit_amount: depositCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      metadata: {
        bookingId: bookingId,
        clientEmail: clientEmail || '',
        totalPrice: totalPrice.toString(),
        depositAmount: depositAmount.toString(),
      },
      payment_intent_data: {
        metadata: {
          bookingId: bookingId,
        },
      },
      customer_email: clientEmail || undefined,
      success_url: successUrl,
      cancel_url: cancelUrl,
      // Session expires in 15 minutes
      expires_at: Math.floor(Date.now() / 1000) + (15 * 60),
    })

    console.log(`Checkout session created for booking ${bookingId}: ${session.url}`)

    return NextResponse.json(
      { 
        checkoutUrl: session.url,
        sessionId: session.id,
        bookingId: bookingId,
        depositAmount: depositAmount,
      },
      { headers: corsHeaders }
    )

  } catch (error: any) {
    console.error('Create checkout failed:', error.message)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500, headers: corsHeaders }
    )
  }
}
