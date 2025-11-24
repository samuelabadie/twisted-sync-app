import Stripe from 'stripe';

export class StripeClient {
  private stripe: Stripe;

  constructor(secretKey: string) {
    this.stripe = new Stripe(secretKey, {
      apiVersion: '2025-11-17.clover' as any,
    });
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
