import { VercelRequest, VercelResponse } from '@vercel/node';
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

async function buffer(readable: any) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const env = validateEnv();
  const stripe = new StripeClient(env.STRIPE_SECRET_KEY);
  const bookla = new BooklaClient(env.BOOKLA_API_KEY, env.BOOKLA_COMPANY_ID);

  let event;
  try {
    const buf = await buffer(req);
    const sig = req.headers['stripe-signature'] as string;
    event = stripe.constructEvent(buf, sig, env.STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    logger.error(`Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as any;
      const bookingId = paymentIntent.metadata.bookingId;

      if (bookingId) {
        logger.info(`Payment succeeded for booking ${bookingId}. Confirming...`);
        await bookla.confirmBooking(bookingId);
        logger.info(`Booking ${bookingId} confirmed.`);

        // TODO: Update Google Sheet status if needed
      } else {
        logger.warn('PaymentIntent succeeded but no bookingId in metadata');
      }
    }

    res.status(200).json({ received: true });
  } catch (error: any) {
    logger.error('Stripe webhook processing failed', { error: error.message });
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
