import Stripe from 'stripe';

export class StripeClient {
  private stripe: Stripe;

  constructor(secretKey: string) {
    this.stripe = new Stripe(secretKey, {
      apiVersion: '2025-11-17.clover' as any,
    });
  }

  async createCheckoutSession(amount: number, metadata: Record<string, string>, successUrl: string, cancelUrl: string): Promise<string | null> {
    try {
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'eur',
              product_data: {
                name: 'Acompte Réservation',
                description: 'Acompte de 30% pour votre réservation chez Twisted',
              },
              unit_amount: Math.round(amount * 100),
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        metadata, // Important: Metadata is attached to the Session, not directly PaymentIntent here initially, but Stripe copies it over if configured or we read from Session webhook.
        payment_intent_data: {
          metadata, // This ensures metadata is on the PaymentIntent too
        },
        success_url: successUrl,
        cancel_url: cancelUrl,
      });

      return session.url;
    } catch (error) {
      console.error('Error creating Stripe Checkout Session:', error);
      throw error;
    }
  }

  async createPaymentIntent(amount: number, metadata: Record<string, string>): Promise<{ id: string; client_secret: string | null }> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'eur',
        metadata,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return {
        id: paymentIntent.id,
        client_secret: paymentIntent.client_secret,
      };
    } catch (error) {
      console.error('Error creating Stripe PaymentIntent:', error);
      throw error;
    }
  }

  // Helper to verify webhook signature
  constructEvent(payload: string | Buffer, signature: string, secret: string): Stripe.Event {
    return this.stripe.webhooks.constructEvent(payload, signature, secret);
  }
}
