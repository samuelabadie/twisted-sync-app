import { VercelRequest, VercelResponse } from '@vercel/node';
import { StripeClient } from '../lib/stripe';
import { validateEnv } from '../utils/validation';
import { emailService } from '../utils/email';
import { logger } from '../utils/logger';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const env = validateEnv();
  const stripe = new StripeClient(env.STRIPE_SECRET_KEY);

  try {
    const event = req.body;

    // Verify event type (assuming Bookla sends a type field)
    // if (event.type !== 'booking.created') return res.status(200).send('Ignored');

    logger.info('Received Bookla webhook', { event });

    const booking = event.data; // Assumption on payload structure
    if (!booking || !booking.id || !booking.price) {
      throw new Error('Invalid booking payload');
    }

    // Calculate 30% deposit
    const totalAmount = booking.price;
    const depositAmount = totalAmount * 0.30;

    // Create Stripe Checkout Session
    const successUrl = 'https://twisted-coiffure.webflow.io/succes-paiement'; // Replace with real URL
    const cancelUrl = 'https://twisted-coiffure.webflow.io/echec-paiement';   // Replace with real URL

    const checkoutUrl = await stripe.createCheckoutSession(
      depositAmount,
      {
        bookingId: booking.id,
        clientEmail: booking.client.email,
        serviceId: booking.service.id,
      },
      successUrl,
      cancelUrl
    );

    if (!checkoutUrl) {
        throw new Error('Failed to generate checkout URL');
    }

    logger.info(`Generated payment link for booking ${booking.id}: ${checkoutUrl}`);

    // Send Email with checkoutUrl
    if (booking.client && booking.client.email) {
      await emailService.sendPaymentLink(booking.client.email, checkoutUrl, booking.id);
    } else {
      logger.warn(`No client email found for booking ${booking.id}`);
    }

    res.status(200).json({ received: true });

  } catch (error: any) {
    logger.error('Bookla webhook failed', { error: error.message });
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
