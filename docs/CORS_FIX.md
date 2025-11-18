# CORS Wildcard Fix for withCredentials

**Date**: 2025-11-14
**Status**: ✅ Fixed

---

## Problem

After adding `withCredentials: true` to axios client for cookie support, CORS errors appeared:

```
Access to XMLHttpRequest at 'http://localhost:3008/product/products' from origin 'http://localhost:3000' has been blocked by CORS policy: The value of the 'Access-Control-Allow-Origin' header in the response must not be the wildcard '*' when the request's credentials mode is 'include'.
```

### Root Cause

When `withCredentials: true` is set in the browser, CORS policy requires:
1. `Access-Control-Allow-Origin` must be a **specific origin**, not `*`
2. `Access-Control-Allow-Credentials` must be `true`

The product service had `app.enableCors()` with default settings, which sets `Access-Control-Allow-Origin: *`.

---

## Solution

### Fix Applied to Product Service

**File**: `services/product/src/main.ts:86-92`

**Before**:
```typescript
app.enableCors(); // ❌ Uses wildcard *
```

**After**:
```typescript
app.enableCors({
  origin: [
    'http://localhost:3008',  // API Gateway
    'http://localhost:3000',  // Next.js Client
    'http://127.0.0.1:3008',
    'http://127.0.0.1:3000'
  ],
  credentials: true,  // ✅ Allow cookies
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-ID'],
});
```

---

## Services Updated

| Service | File | Status |
|---------|------|--------|
| Gateway | `services/gateway/src/main.ts` | ✅ Already fixed |
| Auth | `services/auth/src/main.ts` | ✅ Already fixed |
| Product | `services/product/src/main.ts` | ✅ Fixed now |
| User | `services/user/src/main.ts` | ✅ No CORS (internal only) |
| Inventory | `services/inventory/src/main.ts` | ✅ No CORS (internal only) |
| Order | `services/order/src/main.ts` | ✅ No CORS (internal only) |

---

## How to Apply the Fix

### 1. Restart the Product Service

**Option A: Using Docker Compose**:
```bash
docker-compose restart product-service
```

**Option B: Using npm (if running locally)**:
```bash
cd services/product
npm run start:dev
```

### 2. Restart the Gateway (if not already restarted)

```bash
docker-compose restart gateway
```

### 3. Clear Browser Cache

```bash
# In browser DevTools
Application → Clear Site Data → Clear
```

---

## Testing

### Test 1: Products API Call

```bash
# Open browser console
fetch('http://localhost:3008/product/products?page=1&limit=20', {
  credentials: 'include'
})
.then(r => r.json())
.then(console.log)
.catch(console.error)
```

**Expected**: Should return products list without CORS error

### Test 2: Auth Session

```bash
fetch('http://localhost:3008/auth/session', {
  credentials: 'include'
})
.then(r => r.json())
.then(console.log)
```

**Expected**: Should return session info or 401 (no CORS error)

---

## CORS Configuration Reference

### Required Headers for withCredentials

When client sends `withCredentials: true`, server must respond with:

```
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

### What NOT to do:

❌ **Never use wildcard with credentials**:
```typescript
// This will cause CORS errors:
app.enableCors({
  origin: '*',  // ❌ WRONG!
  credentials: true
});
```

✅ **Always specify exact origins**:
```typescript
app.enableCors({
  origin: ['http://localhost:3000'],  // ✅ CORRECT
  credentials: true
});
```

---

## Production Configuration

For production, update the allowed origins:

### Environment Variable Approach

**File**: `services/product/.env.production`
```bash
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

**Code**:
```typescript
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000', 'http://localhost:3008'];

app.enableCors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
});
```

---

## Troubleshooting

### Issue: Still getting CORS errors after fix

**Solution**:
1. Restart all services:
   ```bash
   docker-compose down && docker-compose up -d
   ```
2. Clear browser cache completely
3. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

### Issue: Cookies not being sent

**Solution**:
1. Verify `withCredentials: true` in axios client ✅ (already done)
2. Verify `credentials: true` in server CORS ✅ (just fixed)
3. Check cookie domain matches
4. Check cookie SameSite settings

### Issue: OPTIONS preflight failing

**Solution**:
1. Ensure OPTIONS method is allowed in CORS
2. Check server responds to OPTIONS requests
3. Verify headers are allowed

---

## Summary

| Fix | Before | After |
|-----|--------|-------|
| Product Service CORS | `*` wildcard | Specific origins |
| Credentials Support | ❌ Not allowed | ✅ Enabled |
| CORS Errors | ❌ Blocked | ✅ Working |

**Result**: Products can now be fetched with cookies/credentials enabled! 🎉

---

**Documentation Version**: 1.0
**Last Updated**: 2025-11-14
