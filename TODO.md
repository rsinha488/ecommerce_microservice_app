# Production-Ready Fixes for E-commerce Microservices

## Issues to Fix
- [ ] ESLint anonymous default export warnings → Refactor to named exports
- [ ] TypeScript API response inconsistency → Update types and RTK slice
- [ ] Docker port conflicts → Fix port allocations
- [ ] Missing healthchecks → Add healthchecks and proper dependencies

## Files to Edit

### Client Side
- [ ] `client/app/login/page.tsx` - Refactor to named export
- [ ] `client/app/page.tsx` - Refactor to named export
- [ ] `client/app/products/page.tsx` - Refactor to named export
- [ ] `client/components/ProductsClient.tsx` - Refactor to named export
- [ ] `client/lib/redux/slices/productSlice.ts` - Update API response handling
- [ ] `client/lib/api/product.ts` - Update response types

### Docker/Infrastructure
- [ ] `docker-compose.yml` - Fix port conflicts, add healthchecks
- [ ] `services/inventory/docker-compose.yml` - Fix port conflicts, add healthchecks

## Testing
- [ ] Test API responses after changes
- [ ] Verify Docker services start without conflicts
- [ ] Run ESLint to confirm no warnings
