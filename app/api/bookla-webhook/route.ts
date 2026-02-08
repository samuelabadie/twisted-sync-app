import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import axios from 'axios'
import { emailService } from '../../../src/utils/email'
import { DatabaseService } from '../../../src/lib/database'
import { withRetry } from '../../../src/utils/retry'
import { sendAlert } from '../../../src/utils/alerts'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-11-17.clover',
  })
}

// Fetch booking details from Bookla API to get client info
async function getBookingDetailsFromBookla(bookingId: string): Promise<{ email: string; firstName: string; lastName: string; phone: string } | null> {
  try {
    // First, try to get the booking with client details
    const response = await axios.get(
      `https://eu.bookla.com/api/v1/companies/${process.env.BOOKLA_COMPANY_ID}/bookings/${bookingId}`,
      {
        timeout: 15000,
        headers: {
          'x-api-key': process.env.BOOKLA_API_KEY!,
          'Content-Type': 'application/json',
        },
      }
    )

    const booking = response.data
    console.log('Booking details from Bookla:', JSON.stringify(booking, null, 2))

    // Check if client info is included
    if (booking.client?.email) {
      return {
        email: booking.client.email,
        firstName: booking.client.firstName || '',
        lastName: booking.client.lastName || '',
        phone: booking.client.phone || booking.client.phoneNumber || '',
      }
    }

    // If we have a clientID, try to fetch client separately
    if (booking.clientID) {
      try {
        const clientResponse = await axios.get(
          `https://eu.bookla.com/api/v1/companies/${process.env.BOOKLA_COMPANY_ID}/clients/search`,
          {
            params: { clientID: booking.clientID },
            timeout: 15000,
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
            firstName: clients[0].firstName || '',
            lastName: clients[0].lastName || '',
            phone: clients[0].phone || clients[0].phoneNumber || '',
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

    // Idempotency check: if this booking already exists, skip duplicate processing
    const db = new DatabaseService()
    const existingBooking = await db.getBookingByBookingId(booking.id)

    if (existingBooking) {
      console.log(`Booking ${booking.id} already exists with status: ${existingBooking.status}`)

      if (existingBooking.status === 'paid') {
        return NextResponse.json({ received: true, skipped: 'already_paid' })
      }

      if (existingBooking.status === 'pending' && existingBooking.checkoutUrl) {
        return NextResponse.json({
          received: true,
          skipped: 'already_pending',
          checkoutUrl: existingBooking.checkoutUrl,
        })
      }

      // If status is 'cancelled', allow re-creation (booking was retried)
    }

    // Extract client info from metaData (custom form fields)
    const metaData = booking.metaData || {}
    let clientEmail =
      metaData.email_1 ||
      booking.client?.email ||
      booking.clientEmail ||
      booking.email ||
      booking.guest?.email ||
      booking.guestEmail ||
      event.client?.email ||
      event.email ||
      null

    let clientPhone =
      metaData['numéro_de_téléphone_0'] ||
      booking.client?.phone ||
      booking.client?.phoneNumber ||
      null

    let clientFirstName =
      booking.client?.firstName ||
      booking.clientName ||
      booking.guest?.firstName ||
      booking.firstName ||
      ''

    let clientLastName =
      booking.client?.lastName ||
      booking.guest?.lastName ||
      booking.lastName ||
      ''

    // If missing info, fetch from Bookla API using clientID
    if ((!clientEmail || !clientFirstName) && (booking.clientID || booking.id)) {
      console.log(`Fetching booking details from Bookla for bookingId: ${booking.id}`)
      const bookingDetails = await getBookingDetailsFromBookla(booking.id)
      if (bookingDetails) {
        clientEmail = clientEmail || bookingDetails.email
        clientFirstName = clientFirstName || bookingDetails.firstName
        clientLastName = clientLastName || bookingDetails.lastName
        clientPhone = clientPhone || bookingDetails.phone
        console.log(`Got client from Bookla: ${clientEmail} (${clientFirstName} ${clientLastName})`)
      }
    }

    const clientFullName = [clientFirstName, clientLastName].filter(Boolean).join(' ') || null

    console.log('Client email found:', clientEmail)
    console.log('Client name:', clientFullName)
    console.log('Client phone:', clientPhone)

    // Get price from booking - try multiple field names
    // Bookla prices are in fractional units (cents)
    const priceInCents =
      booking.price ||
      booking.totalPrice ||
      booking.amount ||
      booking.total ||
      event.price ||
      0

    // Bookla prices are always in fractional units (cents)
    const totalAmount = priceInCents / 100

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

    // Create Stripe Checkout Session
    const successUrl = process.env.PAYMENT_SUCCESS_URL || 'https://twistedbraids.fr'
    const cancelUrl = process.env.PAYMENT_CANCEL_URL || 'https://twistedbraids.fr/echec-paiement'

    // Stripe requires expires_at to be between 30 minutes and 24 hours
    const expiresAt = Math.floor(Date.now() / 1000) + (30 * 60)

    const session = await withRetry(
      () => stripe.checkout.sessions.create({
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
      }),
      { maxRetries: 2 }
    )

    const checkoutUrl = session.url

    if (!checkoutUrl) {
      throw new Error('Failed to generate checkout URL')
    }

    console.log(`Generated payment link for booking ${booking.id}: ${checkoutUrl}`)

    // Send Email with checkoutUrl
    if (clientEmail) {
      try {
        await withRetry(
          () => emailService.sendPaymentLink(clientEmail, checkoutUrl, booking.id),
          { maxRetries: 2 }
        )
        console.log(`Payment link email sent to ${clientEmail}`)
      } catch (emailError: any) {
        console.error(`Failed to send email to ${clientEmail}:`, emailError.message)
        await sendAlert({
          subject: 'Payment link email failed',
          context: `bookingId: ${booking.id}, clientEmail: ${clientEmail}`,
          error: emailError.message,
          route: '/api/bookla-webhook',
        })
      }
    } else {
      console.warn(`No client email - cannot send payment link for booking ${booking.id}`)
      console.warn(`Checkout URL (manual): ${checkoutUrl}`)
    }

    // Store in Database for tracking
    try {
      await withRetry(
        () => db.addBooking({
          bookingId: booking.id,
          clientEmail: clientEmail || '',
          clientName: clientFullName || undefined,
          clientPhone: clientPhone || undefined,
          amount: totalAmount,
          status: 'pending',
          createdAt: new Date().toISOString(),
          checkoutUrl: checkoutUrl
        }),
        { maxRetries: 2 }
      )
      console.log(`Booking saved to database`)
    } catch (dbError: any) {
      console.error('Failed to save booking to database:', dbError.message)
      await sendAlert({
        subject: 'Booking DB save failed',
        context: `bookingId: ${booking.id}, checkoutUrl: ${checkoutUrl}`,
        error: dbError.message,
        route: '/api/bookla-webhook',
      })
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
