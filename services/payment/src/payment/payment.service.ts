import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PaymentService {
  stripe: Stripe;

  constructor(private config: ConfigService) {
    this.stripe = new Stripe(this.config.get('STRIPE_SECRET_KEY'), {
      apiVersion: '2024-06-20',
    });
  }

  async createCheckoutSession(order: any) {
    return await this.stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],

      line_items: order.items.map((item) => ({
        price_data: {
          currency: 'usd',
          product_data: { name: item.name },
          unit_amount: item.price * 100,
        },
        quantity: item.quantity,
      })),

      success_url: `${order.successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: order.cancelUrl,

      metadata: {
        orderId: order.orderId,
        userId: order.userId,
      },
    });
  }

  async refund(paymentIntent: string) {
    return await this.stripe.refunds.create({
      payment_intent: paymentIntent,
    });
  }
}
