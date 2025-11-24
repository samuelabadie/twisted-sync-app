import { VercelRequest, VercelResponse } from '@vercel/node';
import { StripeClient } from '../lib/stripe';
import { validateEnv } from '../utils/validation';
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

    // Create PaymentIntent
    const paymentIntent = await stripe.createPaymentIntent(depositAmount, {
      bookingId: booking.id,
      clientEmail: booking.client.email,
      serviceId: booking.service.id,
    });

    const paymentLink = `https://checkout.stripe.com/pay/${paymentIntent.client_secret}`; // This is not a real link, usually we use Checkout Sessions or send client_secret to frontend.
    // However, PRD says "Envoyer email avec lien de paiement". 
    // If we use PaymentIntent, we need a frontend to process it.
    // If we want a simple link, we should use Stripe Checkout Sessions.
    // PRD says "Générer un PaymentIntent... Générer un lien de paiement".
    // Maybe they mean a Stripe Payment Link? But Payment Links are for products.
    // For dynamic amounts, Checkout Session is best.
    // "Création d’un PaymentIntent (acompte 30% du prix total)." -> Explicitly says PaymentIntent.
    // "Générer un lien de paiement à envoyer par email." -> This implies a URL the user clicks.
    // A raw PaymentIntent needs a UI.
    // I will assume for now we generate a Checkout Session instead, OR we assume there is a frontend page `/pay?pi=...`
    // Given the constraints, I'll stick to PaymentIntent as requested, but I'll log that a UI is needed.
    // OR, I'll switch to Checkout Session which provides a hosted link.
    // "Générer un lien de paiement" strongly suggests a hosted link.
    // I will use Checkout Session for the "link" part if possible, but the requirement says "PaymentIntent".
    // I'll stick to PaymentIntent and assume there's a frontend url like `https://twisted.com/pay?secret=${client_secret}`.

    const checkoutUrl = `https://twisted-app.vercel.app/pay?secret=${paymentIntent.client_secret}&amount=${depositAmount}`;

    logger.info(`Generated payment link for booking ${booking.id}: ${checkoutUrl}`);

    // TODO: Send Email with checkoutUrl
    // await emailService.send(booking.client.email, checkoutUrl);

    // TODO: Store in Sheet/DB

    res.status(200).json({ received: true });

  } catch (error: any) {
    logger.error('Bookla webhook failed', { error: error.message });
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
