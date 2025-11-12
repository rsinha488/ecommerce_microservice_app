import {
  Controller,
  Post,
  Body,
  Req,
  Res,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { RefundDto } from './dto/refund.dto';

@Controller('payment')
export class PaymentController {
  constructor(
    private paymentService: PaymentService,
    private config: ConfigService,
  ) {}

  @Post('create-checkout')
  async createCheckout(@Body() dto: CreateCheckoutDto) {
    const session = await this.paymentService.createCheckoutSession(dto);
    return { id: session.id, url: session.url };
  }

  @Post('refund')
  async refund(@Body() dto: RefundDto) {
    return await this.paymentService.refund(dto.paymentIntent);
  }

  // ✅ Stripe webhook
  @Post('webhook')
  async handleWebhook(@Req() req, @Res() res) {
    let event: Stripe.Event;

    try {
      const signature = req.headers['stripe-signature'];
      const webhookSecret = this.config.get('STRIPE_WEBHOOK_SECRET');

      event = this.paymentService.stripe.webhooks.constructEvent(
        req.rawBody,
        signature,
        webhookSecret,
      );
    } catch (error) {
      return res.status(400).send(`Webhook error: ${error.message}`);
    }

    // ✅ handle events
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        console.log('✅ Payment completed for order:', session.metadata.orderId);
        // Call Order Service here
        break;

      case 'payment_intent.payment_failed':
        console.log('❌ Payment failed');
        break;
    }

    res.status(200).send('ok');
  }
}
