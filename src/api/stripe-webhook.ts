import { VercelRequest, VercelResponse } from '@vercel/node';
import { buffer } from 'micro';
import { StripeClient } from '../lib/stripe';
import { BooklaClient } from '../lib/bookla';
import { validateEnv } from '../utils/validation';
import { logger } from '../utils/logger';

// Disable body parsing for Stripe webhook signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const env = validateEnv();
  const stripe = new StripeClient(env.STRIPE_SECRET_KEY);
  const bookla = new BooklaClient(env.BOOKLA_API_KEY, env.BOOKLA_COMPANY_ID);

  let event;
  try {
    // Use micro to get the raw buffer safely
    const buf = await buffer(req);
    const sig = req.headers['stripe-signature'] as string;
    
    if (!sig) throw new Error('No Stripe signature found');

    event = stripe.constructEvent(buf, sig, env.STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    logger.error(`Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }


  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;
      const bookingId = session.metadata?.bookingId;

      if (bookingId) {
        logger.info(`Checkout session completed for booking ${bookingId}. Confirming...`);
        await bookla.confirmBooking(bookingId);
        logger.info(`Booking ${bookingId} confirmed.`);
        
        // Note: Sheet update skipped as per TECHNICAL_NOTES.md (No Bookings sheet)
      } else {
        logger.warn('Checkout Session completed but no bookingId in metadata');
      }
    } else if (event.type === 'payment_intent.succeeded') {
      // Legacy / Backup handler
      const paymentIntent = event.data.object as any;
      const bookingId = paymentIntent.metadata?.bookingId;
      if (bookingId) {
         logger.info(`PaymentIntent succeeded for ${bookingId}. (Handled via session usually)`);
      }
    }

    res.status(200).json({ received: true });
  } catch (error: any) {
    logger.error('Stripe webhook processing failed', { error: error.message });
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
