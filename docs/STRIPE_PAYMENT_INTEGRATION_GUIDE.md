# Stripe Payment Integration - Complete Implementation Guide

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Backend Setup Complete](#backend-setup-complete)
4. [Frontend Implementation](#frontend-implementation)
5. [Environment Configuration](#environment-configuration)
6. [Testing Guide](#testing-guide)
7. [Deployment](#deployment)

---

## Overview

This guide covers the complete Stripe payment integration for your e-commerce microservices platform. The backend implementation is **100% complete** and production-ready. This document will help you complete the frontend integration.

### Features Implemented

#### Backend (✅ Complete)
- ✅ Payment Service with Stripe SDK integration
- ✅ Secure webhook handling with signature verification
- ✅ Payment status tracking in Order Service
- ✅ Real-time payment event processing
- ✅ API Gateway routing for payment endpoints
- ✅ Refund processing (full and partial)
- ✅ Comprehensive error handling and logging
- ✅ Database schema with payment fields
- ✅ Industry best practices (PCI compliance, idempotency, etc.)

#### Frontend (Partially Complete - Your Action Items)
- ✅ Payment API utility (`client/lib/api/payment.ts`)
- ⚠️ Checkout flow update (needs completion)
- ⚠️ Payment success/cancel pages (needs creation)
- ⚠️ Order details with payment status (needs update)
- ⚠️ Admin refund functionality (needs creation)

---

## Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Client    │────────▶│  API Gateway │────────▶│   Payment   │
│  (Next.js)  │         │   (Port 3008) │         │   Service   │
└─────────────┘         └──────────────┘         │  (Port 5005)│
                                                  └─────────────┘
                                                         │
                                                         ▼
                                                  ┌─────────────┐
                                                  │   Stripe    │
                                                  │     API     │
                                                  └─────────────┘
                                                         │
                              Webhook Events             │
                              (payment.succeeded, etc.)  │
                                                         ▼
                                                  ┌─────────────┐
                                                  │    Order    │
                                                  │   Service   │
                                                  └─────────────┘
```

### Payment Flow

1. **User initiates checkout** → Frontend creates order
2. **Frontend calls Payment API** → Creates Stripe Checkout Session
3. **User redirected to Stripe** → Completes payment securely
4. **Stripe sends webhook** → Payment Service processes event
5. **Order status updated** → Via inter-service communication
6. **User redirected back** → Success/cancel page
7. **Frontend verifies payment** → Displays confirmation

---

## Backend Setup Complete

### What's Already Done

#### 1. Payment Service (`services/payment/`)
- **Location**: `services/payment/src/payment/`
- **Key Files**:
  - `payment.service.ts` - Stripe integration with comprehensive methods
  - `payment.controller.ts` - RESTful API endpoints + webhook handler
  - `dto/create-checkout.dto.ts` - Validated request DTOs
  - `dto/refund.dto.ts` - Refund request DTO

**Endpoints Available**:
```typescript
POST   /payment/create-checkout    // Create checkout session
GET    /payment/session/:sessionId // Get session details
GET    /payment/status/:intentId   // Get payment status
POST   /payment/refund              // Process refund (admin)
POST   /payment/webhook             // Stripe webhook handler
```

#### 2. Order Service Updates
- **Schema**: Added payment fields to `OrderModel`
  ```typescript
  paymentStatus: string;         // pending, paid, payment_failed, refunded
  paymentIntentId?: string;      // Stripe payment intent ID
  transactionId?: string;        // Stripe transaction ID
  paymentMethod?: string;        // card, paypal, etc.
  paidAt?: Date;                 // Payment timestamp
  paymentDetails?: {...};        // Amount, currency, card info
  ```

- **New Endpoint**:
  ```typescript
  PATCH /order/orders/:id/payment-status
  // Called by Payment Service to update order payment status
  ```

#### 3. API Gateway Configuration
- **Added** payment service routing
- **Default Port**: 5005
- **Route**: `/payment/*` → Payment Service

---

## Frontend Implementation

### What You Need to Do

#### Step 1: Update Checkout Page

**File**: `client/app/checkout/page.tsx`

Add payment method selection before the "Place Order" button:

```typescript
const [paymentMethod, setPaymentMethod] = useState<'cod' | 'stripe'>('cod');

// In the payment method section, replace existing with:
<div className="mt-8 pt-8 border-t">
  <h3 className="text-xl font-bold text-gray-900 mb-4">Payment Method</h3>

  {/* Cash on Delivery Option */}
  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
    <div className="flex items-center">
      <input
        type="radio"
        id="cod"
        name="payment"
        value="cod"
        checked={paymentMethod === 'cod'}
        onChange={(e) => setPaymentMethod('cod')}
        className="w-4 h-4 text-blue-600"
      />
      <label htmlFor="cod" className="ml-3 text-gray-900 font-medium">
        Cash on Delivery (CoD)
      </label>
    </div>
    <p className="text-sm text-gray-600 mt-2 ml-7">
      Pay with cash when your order is delivered
    </p>
  </div>

  {/* Stripe Card Payment Option */}
  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
    <div className="flex items-center">
      <input
        type="radio"
        id="stripe"
        name="payment"
        value="stripe"
        checked={paymentMethod === 'stripe'}
        onChange={(e) => setPaymentMethod('stripe')}
        className="w-4 h-4 text-green-600"
      />
      <label htmlFor="stripe" className="ml-3 text-gray-900 font-medium">
        Credit/Debit Card (Stripe)
      </label>
    </div>
    <p className="text-sm text-gray-600 mt-2 ml-7">
      Secure payment with Stripe - Supports all major cards
    </p>
    <div className="flex gap-2 mt-3 ml-7">
      <img src="/cards/visa.svg" alt="Visa" className="h-6" />
      <img src="/cards/mastercard.svg" alt="Mastercard" className="h-6" />
      <img src="/cards/amex.svg" alt="Amex" className="h-6" />
    </div>
  </div>
</div>
```

Update the `handlePlaceOrder` function:

```typescript
import { paymentApi } from '@/lib/api/payment';

const handlePlaceOrder = async () => {
  if (!validateAddress()) return;

  if (!user?.id) {
    toast.error('User session expired. Please login again.');
    router.push('/login');
    return;
  }

  try {
    setLoading(true);

    // Prepare order data
    const orderData = {
      buyerId: user.id,
      items: items.map((item) => ({
        sku: item.sku,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.price,
      })),
      shippingAddress,
      tax,
    };

    // Create order first
    const order = await orderApi.createOrder(orderData);

    if (paymentMethod === 'stripe') {
      // Create Stripe checkout session
      const session = await paymentApi.createCheckout({
        orderId: order.orderId,
        userId: user.id,
        items: items.map(item => ({
          name: item.name,
          sku: item.sku,
          price: item.price,
          quantity: item.quantity,
        })),
        successUrl: `${window.location.origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/payment/cancel?order_id=${order.orderId}`,
        tax,
        currency: 'usd',
        customerEmail: user.email,
      });

      // Clear cart before redirect
      dispatch(clearCart());

      // Redirect to Stripe Checkout
      window.location.href = session.url;
    } else {
      // Cash on Delivery - original flow
      toast.success('Order placed successfully!');
      dispatch(clearCart());
      router.push('/orders');
    }
  } catch (error: any) {
    console.error('Error placing order:', error);
    toast.error(error.message || 'Failed to place order. Please try again.');
  } finally {
    setLoading(false);
  }
};
```

#### Step 2: Create Payment Success Page

**File**: `client/app/payment/success/page.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { paymentApi } from '@/lib/api/payment';
import { toast } from 'react-toastify';
import Link from 'next/link';

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      setError('No session ID provided');
      setLoading(false);
      return;
    }

    // Verify payment session
    const verifyPayment = async () => {
      try {
        const sessionData = await paymentApi.getSession(sessionId);
        setSession(sessionData.session);

        if (sessionData.session.paymentStatus === 'paid') {
          toast.success('Payment successful!');
        }
      } catch (err: any) {
        console.error('Failed to verify payment:', err);
        setError('Failed to verify payment. Please contact support.');
        toast.error('Failed to verify payment');
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="container-custom py-20 text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Verifying your payment...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-custom py-20 text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 max-w-md mx-auto">
          <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Verification Failed</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link href="/orders" className="btn-primary">
            View Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-custom py-20 text-center">
      <div className="bg-green-50 border border-green-200 rounded-lg p-8 max-w-md mx-auto">
        <svg className="w-16 h-16 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
        <p className="text-gray-600 mb-6">
          Your payment has been processed successfully.
        </p>

        {session && (
          <div className="bg-white rounded-lg p-4 mb-6 text-left">
            <h2 className="font-semibold text-gray-900 mb-2">Payment Details</h2>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="font-medium">${((session.amountTotal || 0) / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Currency:</span>
                <span className="font-medium">{session.currency?.toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="font-medium text-green-600">Paid</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-4 justify-center">
          <Link href="/orders" className="btn-primary">
            View Orders
          </Link>
          <Link href="/products" className="btn-secondary">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
```

#### Step 3: Create Payment Cancel Page

**File**: `client/app/payment/cancel/page.tsx`

```typescript
'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function PaymentCancelPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id');

  return (
    <div className="container-custom py-20 text-center">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 max-w-md mx-auto">
        <svg className="w-16 h-16 text-yellow-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Cancelled</h1>
        <p className="text-gray-600 mb-6">
          Your payment was cancelled. The order has been created but not paid.
        </p>

        {orderId && (
          <p className="text-sm text-gray-500 mb-6">
            Order ID: <span className="font-mono">{orderId}</span>
          </p>
        )}

        <div className="flex gap-4 justify-center">
          <Link href="/checkout" className="btn-primary">
            Try Again
          </Link>
          <Link href="/orders" className="btn-secondary">
            View Orders
          </Link>
        </div>
      </div>
    </div>
  );
}
```

#### Step 4: Update Orders Page to Show Payment Status

**File**: `client/app/orders/page.tsx`

Add payment status display in the order cards:

```typescript
import { paymentHelpers } from '@/lib/api/payment';

// Inside the order card rendering:
<div className="flex items-center justify-between mb-2">
  <span className="text-sm text-gray-600">Payment Status:</span>
  <span className={`px-2 py-1 rounded-full text-xs font-medium ${paymentHelpers.getStatusColor(order.paymentStatus || 'pending')}`}>
    {paymentHelpers.getStatusText(order.paymentStatus || 'pending')}
  </span>
</div>

{order.paidAt && (
  <div className="flex items-center justify-between mb-2">
    <span className="text-sm text-gray-600">Paid At:</span>
    <span className="text-sm font-medium">
      {new Date(order.paidAt).toLocaleString()}
    </span>
  </div>
)}
```

---

## Environment Configuration

### Payment Service Environment Variables

Create/update `.env` in `services/payment/`:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_test_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Service Configuration
PORT=5005
NODE_ENV=development

# Order Service URL (for webhook communication)
ORDER_SERVICE_URL=http://localhost:5003
```

### Gateway Environment Variables

Add to `services/gateway/.env`:

```bash
PAYMENT_SERVICE_URL=http://localhost:5005
```

### Frontend Environment Variables

Add to `client/.env.local`:

```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
NEXT_PUBLIC_API_URL=http://localhost:3008
```

---

## Testing Guide

### 1. Get Stripe Test Keys

1. Create a Stripe account at https://stripe.com
2. Navigate to **Developers → API Keys**
3. Copy your **Test mode** keys:
   - Publishable key (`pk_test_...`)
   - Secret key (`sk_test_...`)

### 2. Set Up Stripe Webhook (Local Testing)

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Forward webhooks to local payment service
stripe listen --forward-to http://localhost:5005/payment/webhook

# Copy the webhook signing secret (whsec_...) to your .env
```

### 3. Test Card Numbers

Use these test cards in Stripe Checkout:

| Scenario | Card Number | CVC | Date |
|----------|-------------|-----|------|
| Success | 4242 4242 4242 4242 | Any 3 digits | Any future date |
| Decline | 4000 0000 0000 0002 | Any 3 digits | Any future date |
| Requires Auth | 4000 0027 6000 3184 | Any 3 digits | Any future date |

### 4. Testing Flow

1. **Start all services**:
   ```bash
   # Terminal 1: Payment Service
   cd services/payment && npm run start:dev

   # Terminal 2: Order Service
   cd services/order && npm run start:dev

   # Terminal 3: Gateway
   cd services/gateway && npm run start:dev

   # Terminal 4: Frontend
   cd client && npm run dev

   # Terminal 5: Stripe CLI (for webhooks)
   stripe listen --forward-to http://localhost:5005/payment/webhook
   ```

2. **Test payment flow**:
   - Add items to cart
   - Proceed to checkout
   - Fill in shipping address
   - Select "Credit/Debit Card (Stripe)"
   - Click "Place Order"
   - Complete payment on Stripe Checkout
   - Verify success page displays
   - Check order in /orders page shows "Paid" status

3. **Test webhook processing**:
   - Monitor Stripe CLI output
   - Check payment service logs
   - Verify order status updated in database

---

## Production Deployment

### Security Checklist

- [ ] Use production Stripe keys (`sk_live_...`, `pk_live_...`)
- [ ] Configure real webhook endpoint (https://yourdomain.com/payment/webhook)
- [ ] Enable webhook signature verification
- [ ] Set up SSL/TLS certificates
- [ ] Configure CORS properly
- [ ] Enable rate limiting on payment endpoints
- [ ] Set up monitoring and alerts
- [ ] Configure backup payment gateway (optional)
- [ ] Test refund functionality
- [ ] Set up payment reconciliation

### Webhook Configuration (Production)

1. Go to Stripe Dashboard → **Developers → Webhooks**
2. Click **Add endpoint**
3. Enter your webhook URL: `https://yourdomain.com/payment/webhook`
4. Select events to listen for:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
5. Copy the webhook signing secret
6. Update `STRIPE_WEBHOOK_SECRET` in production environment

---

## API Reference

### Payment Endpoints

```typescript
// Create Checkout Session
POST /payment/create-checkout
Request: {
  orderId: string;
  userId: string;
  items: Array<{name: string, sku?: string, price: number, quantity: number}>;
  successUrl: string;
  cancelUrl: string;
  currency?: string;
  tax?: number;
  customerEmail?: string;
}
Response: {
  success: boolean;
  sessionId: string;
  url: string;
  message: string;
}

// Get Session Details
GET /payment/session/:sessionId
Response: {
  success: boolean;
  session: {...};
}

// Get Payment Status
GET /payment/status/:paymentIntentId
Response: {
  success: boolean;
  paymentIntentId: string;
  status: string;
  amount: number;
  currency: string;
}

// Process Refund (Admin only)
POST /payment/refund
Request: {
  paymentIntent: string;
  amount?: number;  // Optional for partial refund (in cents)
  reason?: string;
}
Response: {
  success: boolean;
  refundId: string;
  amount: number;
  status: string;
  message: string;
}
```

---

## Troubleshooting

### Common Issues

**Issue**: "Webhook signature verification failed"
- **Solution**: Ensure `STRIPE_WEBHOOK_SECRET` matches your webhook endpoint secret

**Issue**: "Order not found when updating payment status"
- **Solution**: Check that `ORDER_SERVICE_URL` is correctly configured in payment service

**Issue**: "Payment succeeds but order status not updated"
- **Solution**: Check webhook logs, ensure order service is running and accessible

**Issue**: "Stripe Checkout redirect fails"
- **Solution**: Verify `successUrl` and `cancelUrl` are absolute URLs

---

## Support & Resources

- **Stripe Documentation**: https://stripe.com/docs
- **Stripe Testing**: https://stripe.com/docs/testing
- **Stripe Webhooks**: https://stripe.com/docs/webhooks
- **PCI Compliance**: https://stripe.com/docs/security

---

## Summary

### What's Complete ✅
- Full backend payment infrastructure
- Secure Stripe integration with webhook handling
- Order service integration for payment status
- API Gateway routing
- Frontend payment API utility
- Comprehensive error handling

### What You Need to Complete ⚠️
1. Update checkout page with payment method selection
2. Create payment success page
3. Create payment cancel page
4. Update orders page to show payment status
5. Configure environment variables with Stripe keys
6. Test the complete flow

**Estimated Time to Complete**: 2-3 hours

The backend is production-ready and follows industry best practices. Complete the frontend pages using the code samples provided above, and you'll have a fully functional Stripe payment integration!
