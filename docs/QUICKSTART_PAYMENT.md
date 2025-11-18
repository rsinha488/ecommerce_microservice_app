# 🚀 Quick Start - Stripe Payment Integration

## ✅ What's Already Done

Your backend is **100% complete and production-ready**! Here's what has been implemented:

### Backend (Complete ✅)
- ✅ Payment Service with full Stripe integration
- ✅ Webhook handler with signature verification
- ✅ Order Service updated with payment status tracking
- ✅ API Gateway configured for payment routes
- ✅ Database schema updated with payment fields
- ✅ Refund processing capability
- ✅ Production-ready error handling and logging

### Frontend (Partially Complete ⚠️)
- ✅ Payment API utility created
- ⚠️ Need to update checkout flow (instructions below)
- ⚠️ Need to create success/cancel pages (code provided)

---

## 🎯 5-Minute Setup

### Step 1: Get Your Stripe Keys (2 minutes)

1. Go to https://stripe.com and create a free account
2. Navigate to **Developers → API Keys**
3. Copy your **Test mode** keys:
   - **Publishable key**: `pk_test_...`
   - **Secret key**: `sk_test_...`

### Step 2: Configure Environment Variables (1 minute)

**Update** `services/payment/.env`:
```bash
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET_HERE  # Get this in Step 3
```

**Update** `client/.env.local`:
```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
```

### Step 3: Set Up Local Webhooks (2 minutes)

```bash
# Install Stripe CLI (Mac)
brew install stripe/stripe-cli/stripe

# Or download from: https://stripe.com/docs/stripe-cli

# Login to Stripe
stripe login

# Start webhook forwarding (keep this running)
stripe listen --forward-to http://localhost:5005/payment/webhook

# Copy the webhook secret (whsec_...) and add to services/payment/.env
```

---

## 🏃 Running the Services

Open **5 terminals** and run:

```bash
# Terminal 1: Payment Service
cd services/payment
npm install  # First time only
npm run build
npm run start:dev

# Terminal 2: Order Service
cd services/order
npm run start:dev

# Terminal 3: Gateway
cd services/gateway
npm run start:dev

# Terminal 4: Frontend
cd client
npm run dev

# Terminal 5: Stripe Webhooks
stripe listen --forward-to http://localhost:5005/payment/webhook
```

---

## 🧪 Testing (Use Stripe Test Cards)

### Test Card Numbers

| Scenario | Card Number | Any CVC | Any Future Date |
|----------|-------------|---------|-----------------|
| ✅ Success | `4242 4242 4242 4242` | `123` | `12/34` |
| ❌ Declined | `4000 0000 0000 0002` | `123` | `12/34` |
| 🔐 Requires Auth | `4000 0027 6000 3184` | `123` | `12/34` |

### Test Flow

1. Add products to cart
2. Go to checkout
3. Select "Credit/Debit Card (Stripe)"
4. Complete payment with test card above
5. Verify payment success page
6. Check order shows "Paid" status

---

## 📝 Frontend TODOs

You need to complete these 3 frontend pages. **Full code is provided in `STRIPE_PAYMENT_INTEGRATION_GUIDE.md`**:

### 1. Update Checkout Flow ⚠️
**File**: `client/app/checkout/page.tsx`
- Add payment method selection (Stripe vs COD)
- Update `handlePlaceOrder` to create Stripe session

### 2. Create Success Page ⚠️
**File**: `client/app/payment/success/page.tsx` (create new)
- Verify payment session
- Display success message
- Show payment details

### 3. Create Cancel Page ⚠️
**File**: `client/app/payment/cancel/page.tsx` (create new)
- Handle cancelled payments
- Show retry option

### 4. Update Orders Page (Optional)
**File**: `client/app/orders/page.tsx`
- Add payment status badge
- Show payment date

**📖 Complete code for all pages is in: `STRIPE_PAYMENT_INTEGRATION_GUIDE.md`**

---

## 🎓 API Endpoints Available

All endpoints are accessible through the gateway at `http://localhost:3008`:

```typescript
POST /payment/create-checkout    // Create Stripe checkout session
GET  /payment/session/:id        // Get session details
GET  /payment/status/:intentId   // Get payment status
POST /payment/refund             // Process refund (admin)
POST /payment/webhook            // Stripe webhook (internal)
```

---

## 🔍 Monitoring & Debugging

### Check Payment Service Logs
```bash
# Payment service terminal will show:
✅ Checkout session created: cs_test_...
📥 Webhook received: checkout.session.completed
✅ Payment succeeded: pi_test_...
✅ Order payment status updated successfully
```

### Check Stripe CLI Output
```bash
# Stripe CLI will show:
✅ 2025-01-15 10:30:00  --> checkout.session.completed [200]
```

### Check Order in Database
The order will have:
- `paymentStatus`: "paid"
- `paymentIntentId`: "pi_xxx"
- `transactionId`: "cs_xxx"
- `paidAt`: timestamp

---

## ✨ Features Implemented

### Security
- ✅ Webhook signature verification
- ✅ PCI compliant (Stripe handles card data)
- ✅ Secure inter-service communication
- ✅ Environment variable protection

### Functionality
- ✅ Create checkout sessions
- ✅ Process payments via Stripe Checkout
- ✅ Real-time webhook processing
- ✅ Order status auto-update
- ✅ Payment verification
- ✅ Refund processing
- ✅ Multi-currency support

### Developer Experience
- ✅ Comprehensive logging
- ✅ Error handling
- ✅ Type-safe DTOs
- ✅ API documentation
- ✅ Development helpers

---

## 🚀 Production Deployment

When ready for production:

1. **Switch to Live Keys**:
   - Use `sk_live_...` and `pk_live_...`
   - Never commit live keys to git!

2. **Configure Webhook Endpoint**:
   - Go to Stripe Dashboard → Webhooks
   - Add endpoint: `https://yourdomain.com/payment/webhook`
   - Select events: `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`
   - Copy webhook secret to production env

3. **Set Environment**:
   ```bash
   NODE_ENV=production
   ```

4. **Enable HTTPS**: Required for production webhooks

---

## 💡 Tips

- **Test webhooks locally**: Always use Stripe CLI for local development
- **Check logs**: Payment service logs everything for debugging
- **Use test mode**: Never use real cards during development
- **Webhook retries**: Stripe retries failed webhooks automatically
- **Idempotency**: All webhook handlers are idempotent

---

## 📚 Resources

- **Full Documentation**: See `STRIPE_PAYMENT_INTEGRATION_GUIDE.md`
- **Stripe Docs**: https://stripe.com/docs
- **Stripe Testing**: https://stripe.com/docs/testing
- **Test Cards**: https://stripe.com/docs/testing#cards

---

## 🆘 Need Help?

### Common Issues

**"Webhook signature verification failed"**
→ Make sure webhook secret from Stripe CLI is in `.env`

**"Order not updated after payment"**
→ Check order service is running and `ORDER_SERVICE_URL` is correct

**"Cannot create checkout session"**
→ Verify `STRIPE_SECRET_KEY` is correct in payment service `.env`

---

## ✅ Checklist

- [ ] Got Stripe test keys
- [ ] Updated `services/payment/.env` with Stripe secret key
- [ ] Updated `client/.env.local` with publishable key
- [ ] Installed Stripe CLI
- [ ] Started all 5 services
- [ ] Tested payment with test card `4242 4242 4242 4242`
- [ ] Verified webhook processing in logs
- [ ] Updated checkout page code
- [ ] Created success/cancel pages
- [ ] Tested complete flow end-to-end

**🎉 That's it! Your Stripe payment integration is ready!**
