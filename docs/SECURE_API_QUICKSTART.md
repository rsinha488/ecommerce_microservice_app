# 🔐 Secure API - Quick Reference

## 🚀 Quick Start (5 Minutes)

### What's Been Implemented

✅ **Secure API Client** - HTTP-only cookies, SSR/CSR support, auto-authentication
✅ **Route Protection** - Middleware for admin/user routes
✅ **Payment API Security** - Authentication required, admin-only refunds
✅ **Role-Based Access Control** - Admin vs User permissions

---

## 📖 Common Usage Patterns

### 1. Client Component API Call

```typescript
'use client';

import { paymentApi } from '@/lib/api/payment';
import { isAuthenticated } from '@/lib/api/client';

export default function MyComponent() {
  const handlePayment = async () => {
    // Check auth (optional - API will also check)
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    try {
      // API call with automatic auth headers
      const session = await paymentApi.createCheckout({...});
      window.location.href = session.url;
    } catch (error) {
      toast.error(error.message);
    }
  };

  return <button onClick={handlePayment}>Pay Now</button>;
}
```

### 2. Server Component API Call

```typescript
// app/orders/page.tsx
import { createServerClient } from '@/lib/api/client';
import { checkServerAuth } from '@/lib/middleware/auth';
import { redirect } from 'next/navigation';

export default async function OrdersPage() {
  // Check auth on server
  const { isAuthenticated, userId } = await checkServerAuth();
  if (!isAuthenticated) redirect('/login');

  // Make API call with auth
  const client = await createServerClient();
  const { data: orders } = await client.get('/order/orders');

  return <div>{/* Render orders */}</div>;
}
```

### 3. Admin-Only Component

```typescript
'use client';

import { checkRole } from '@/lib/api/client';
import { paymentApi } from '@/lib/api/payment';

export function RefundButton({ paymentIntentId }) {
  const handleRefund = async () => {
    try {
      // Client-side check + server-side validation
      const result = await paymentApi.refund({
        paymentIntent: paymentIntentId,
      });
      toast.success('Refund processed');
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Hide button for non-admins
  if (!checkRole('admin')) return null;

  return <button onClick={handleRefund}>Refund</button>;
}
```

### 4. Admin-Only Page

```typescript
// app/admin/dashboard/page.tsx
import { requireServerAdmin } from '@/lib/middleware/auth';

export default async function AdminDashboard() {
  // Automatically redirects if not admin
  await requireServerAdmin();

  return <div>Admin Dashboard</div>;
}
```

---

## 🔑 API Client Functions

```typescript
import {
  isAuthenticated,      // Check if user logged in
  checkRole,            // Check user role ('admin' | 'user')
  getCurrentRole,       // Get current user role
  createServerClient,   // Create auth client for SSR
} from '@/lib/api/client';

// Client-side usage
if (isAuthenticated()) { /* ... */ }
if (checkRole('admin')) { /* ... */ }
const role = getCurrentRole(); // 'admin' | 'user' | undefined

// Server-side usage (Server Components only)
const client = await createServerClient();
const response = await client.get('/api/endpoint');
```

---

## 🛡️ Middleware Functions

```typescript
import {
  checkServerAuth,      // Get auth status on server
  requireServerAdmin,   // Require admin (throws/redirects)
  requireServerUser,    // Require user (throws/redirects)
} from '@/lib/middleware/auth';

// Server Component usage
const { isAuthenticated, role, userId } = await checkServerAuth();

// Guard patterns
await requireServerAdmin();  // Admin only
await requireServerUser();   // Authenticated users
```

---

## 🔒 Protected Routes (Automatic)

The root `middleware.ts` automatically protects these routes:

| Route | Required Role | Redirect On Fail |
|-------|---------------|------------------|
| `/admin/*` | admin | `/login` or `/unauthorized` |
| `/orders` | user or admin | `/login` |
| `/checkout` | user or admin | `/login` |
| `/payment/success` | user or admin | `/login` |
| `/profile` | user or admin | `/login` |

**No code needed** - routes are automatically protected!

---

## 📝 Payment API Methods

```typescript
import { paymentApi } from '@/lib/api/payment';

// Create checkout (requires auth)
const session = await paymentApi.createCheckout({
  orderId: 'order-123',
  userId: 'user-456',
  items: [{name: 'Product', price: 99.99, quantity: 1}],
  successUrl: '/payment/success',
  cancelUrl: '/payment/cancel',
});

// Get session details (requires auth)
const session = await paymentApi.getSession('cs_test_...');

// Get payment status (requires auth)
const status = await paymentApi.getPaymentStatus('pi_...');

// Process refund (requires admin)
const refund = await paymentApi.refund({
  paymentIntent: 'pi_...',
  amount: 5000, // Optional for partial refund
  reason: 'requested_by_customer',
});
```

---

## ⚡ Quick Patterns

### Show Content Based on Role

```typescript
'use client';

import { getCurrentRole } from '@/lib/api/client';

export function ConditionalContent() {
  const role = getCurrentRole();

  return (
    <>
      {/* Everyone sees this */}
      <PublicContent />

      {/* Only authenticated users */}
      {role && <UserContent />}

      {/* Only admins */}
      {role === 'admin' && <AdminContent />}
    </>
  );
}
```

### Redirect After Login

```typescript
// Login page automatically redirects back
// URL: /login?redirect=/checkout

// After successful login, user goes to /checkout
```

### Server-Side Data Fetching with Auth

```typescript
// app/my-page/page.tsx
import { createServerClient } from '@/lib/api/client';

export default async function MyPage() {
  const client = await createServerClient();

  // All these calls include auth headers automatically
  const [orders, profile] = await Promise.all([
    client.get('/order/orders'),
    client.get('/user/profile'),
  ]);

  return <div>{/* Use data */}</div>;
}
```

---

## 🔧 Backend Setup Required

Your Auth Service must set these cookies on login:

```typescript
// Auth Service - Login Response
response.cookie('auth_token', jwtToken, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  maxAge: 86400000, // 24 hours
});

response.cookie('user_role', user.role, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  maxAge: 86400000,
});

response.cookie('user_id', user.id, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  maxAge: 86400000,
});
```

---

## 🧪 Testing

```bash
# Test login sets cookies
curl -X POST http://localhost:3008/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}' \
  -c cookies.txt

# Test authenticated request uses cookies
curl http://localhost:3008/order/orders \
  -b cookies.txt
```

---

## ✅ Checklist

- [ ] Auth Service sets HTTP-only cookies on login
- [ ] CORS enabled with `credentials: true`
- [ ] Test login flow
- [ ] Test protected routes redirect to login
- [ ] Test admin routes block regular users
- [ ] Test API calls include auth headers
- [ ] Test refund requires admin role

---

## 🆘 Common Issues

**Problem**: "Authentication required" error
**Fix**: Check cookies are being set and `withCredentials: true` in API calls

**Problem**: Admin routes not working
**Fix**: Verify `user_role` cookie is set to 'admin' exactly

**Problem**: SSR not seeing cookies
**Fix**: Use `createServerClient()` in Server Components

**Problem**: 401 after login
**Fix**: Check cookie domain and CORS settings

---

## 📚 Full Documentation

- **Complete Guide**: `SECURE_API_IMPLEMENTATION.md`
- **Payment Integration**: `STRIPE_PAYMENT_INTEGRATION_GUIDE.md`
- **Quick Start**: `QUICKSTART_PAYMENT.md`

---

**You're all set! Your API is secure with HTTP-only cookies, role-based access, and SSR support! 🔐**
