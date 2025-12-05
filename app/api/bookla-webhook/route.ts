import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import axios from 'axios'
import { emailService } from '../../../src/utils/email'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-11-17.clover',
  })
}

// Fetch booking details from Bookla API to get client info
async function getBookingDetailsFromBookla(bookingId: string): Promise<{ email: string; firstName: string } | null> {
  try {
    // First, try to get the booking with client details
    const response = await axios.get(
      `https://eu.bookla.com/api/v1/companies/${process.env.BOOKLA_COMPANY_ID}/bookings/${bookingId}`,
      {
        headers: {
          'x-api-key': process.env.BOOKLA_API_KEY!,
          'Content-Type': 'application/json',
        },
      }
    )
    
    const booking = response.data
    console.log('📦 Booking details from Bookla:', JSON.stringify(booking, null, 2))
    
    // Check if client info is included
    if (booking.client?.email) {
      return {
        email: booking.client.email,
        firstName: booking.client.firstName || 'Client',
      }
    }
    
    // If we have a clientID, try to fetch client separately
    if (booking.clientID) {
      try {
        const clientResponse = await axios.get(
          `https://eu.bookla.com/api/v1/companies/${process.env.BOOKLA_COMPANY_ID}/clients/search`,
          {
            params: { clientID: booking.clientID },
            headers: {
              'x-api-key': process.env.BOOKLA_API_KEY!,
              'Content-Type': 'application/json',
            },
          }
        )
        
        const clients = clientResponse.data
        if (Array.isArray(clients) && clients.length > 0) {
          return {
            email: clients[0].email || null,
            firstName: clients[0].firstName || 'Client',
          }
        }
      } catch (clientError: any) {
        console.log('Could not fetch client directly:', clientError.message)
      }
    }
    
    return null
  } catch (error: any) {
    console.error('Error fetching booking from Bookla:', error.message)
    return null
  }
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

    console.log('=== BOOKLA WEBHOOK RECEIVED ===')
    console.log('Full payload:', JSON.stringify(event, null, 2))

    // Bookla webhook payload structure - try multiple locations
    const booking = event.data || event.booking || event
    
    if (!booking || !booking.id) {
      console.error('Invalid booking payload - no ID found')
      return NextResponse.json({ error: 'Invalid booking payload' }, { status: 400 })
    }

    console.log('Booking ID:', booking.id)

    // Try to find client email in various locations
    let clientEmail = 
      booking.client?.email || 
      booking.clientEmail || 
      booking.email ||
      booking.guest?.email ||
      booking.guestEmail ||
      event.client?.email ||
      event.email ||
      null

    let clientName = 
      booking.client?.firstName ||
      booking.clientName ||
      booking.guest?.firstName ||
      booking.firstName ||
      'Client'

    // If no email found, fetch booking details from Bookla API
    if (!clientEmail && booking.id) {
      console.log(`📡 Fetching booking details from Bookla for bookingId: ${booking.id}`)
      const bookingDetails = await getBookingDetailsFromBookla(booking.id)
      if (bookingDetails?.email) {
        clientEmail = bookingDetails.email
        clientName = bookingDetails.firstName || clientName
        console.log(`✅ Got client from Bookla: ${clientEmail} (${clientName})`)
      }
    }

    console.log('Client email found:', clientEmail)
    console.log('Client name:', clientName)

    // Get price from booking - try multiple field names
    // Bookla prices are usually in cents
    const priceInCents = 
      booking.price || 
      booking.totalPrice || 
      booking.amount || 
      booking.total ||
      event.price ||
      0
    
    // Convert to euros (assuming price is in cents)
    const totalAmount = priceInCents > 100 ? priceInCents / 100 : priceInCents
    
    console.log('Price (raw):', priceInCents, '-> Total amount (EUR):', totalAmount)

    if (totalAmount <= 0) {
      console.warn(`Booking ${booking.id} has no price, skipping payment link`)
      return NextResponse.json({ received: true, skipped: 'no_price' })
    }

    if (!clientEmail) {
      console.warn(`No client email found for booking ${booking.id}`)
      // Still create the Stripe session, but we won't be able to send an email
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
      customer_email: clientEmail || undefined,
      success_url: successUrl,
      cancel_url: cancelUrl,
    })

    const checkoutUrl = session.url

    if (!checkoutUrl) {
      throw new Error('Failed to generate checkout URL')
    }

    console.log(`✅ Generated payment link for booking ${booking.id}: ${checkoutUrl}`)

    // Send Email with checkoutUrl
    if (clientEmail) {
      try {
        await emailService.sendPaymentLink(clientEmail, checkoutUrl, booking.id)
        console.log(`📧 Payment link email sent to ${clientEmail}`)
      } catch (emailError: any) {
        console.error(`❌ Failed to send email to ${clientEmail}:`, emailError.message)
        // Don't fail the webhook, just log the error
      }
    } else {
      console.warn(`⚠️ No client email - cannot send payment link for booking ${booking.id}`)
      console.warn(`💡 Checkout URL (manual): ${checkoutUrl}`)
    }

    return NextResponse.json({ 
      received: true, 
      checkoutUrl,
      emailSent: !!clientEmail,
      bookingId: booking.id
    })

  } catch (error: any) {
    console.error('Bookla webhook failed:', error.message)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

