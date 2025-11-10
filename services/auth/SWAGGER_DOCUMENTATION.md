# Swagger API Documentation Guide

## Overview

The Auth Service provides comprehensive API documentation using Swagger/OpenAPI 3.0. The interactive documentation is available at `/api` endpoint and includes all authentication and OAuth2/OIDC endpoints.

---

## Accessing the Documentation

### Local Development
```
http://localhost:4000/api
```

### Docker Environment
```
http://auth-service:4000/api
```

### Production
```
https://api.example.com/api
```

---

## Features

### 📚 Interactive API Documentation
- **Try It Out**: Test all endpoints directly from the browser
- **Request/Response Examples**: See real examples for every endpoint
- **Schema Definitions**: View all DTO structures and validation rules
- **Error Codes**: Complete error code reference with descriptions

### 🔐 Authentication Schemes
The documentation supports three authentication methods:

1. **Cookie Authentication** (`session_id`)
   - HTTP-only session cookie
   - Automatically set after successful login
   - Used for session-based endpoints

2. **Bearer Token** (JWT)
   - OAuth2 access tokens
   - Used for UserInfo endpoint
   - Format: `Authorization: Bearer <token>`

3. **Basic Authentication**
   - Client credentials (client_id:client_secret)
   - Used for introspection and revocation
   - Format: `Authorization: Basic <base64>`

### 🏷️ Organized by Tags

- **auth**: Authentication endpoints (login, register, session, logout)
- **oidc**: OpenID Connect & OAuth2 endpoints (authorization, token, userinfo)
- **oauth2**: OAuth 2.0 endpoints (introspection, revocation)
- **admin**: Administrative endpoints (client management)

---

## API Version Information

- **Version**: 1.0.0
- **License**: MIT
- **Contact**: auth-team@example.com
- **Standards**: OAuth 2.0, OpenID Connect Core 1.0, PKCE, RFC 7662, RFC 7009

---

## Using the Swagger UI

### 1. Testing Authentication Flow

#### Step 1: Register a New User
1. Navigate to **auth** section
2. Expand `POST /auth/register`
3. Click "Try it out"
4. Fill in the request body:
```json
{
  "email": "test@example.com",
  "password": "password123",
  "name": "Test User"
}
```
5. Click "Execute"
6. Expect 201 response with user details

#### Step 2: Login
1. Expand `POST /auth/login`
2. Click "Try it out"
3. Enter credentials:
```json
{
  "email": "test@example.com",
  "password": "password123"
}
```
4. Click "Execute"
5. Expect 200 response with session_id
6. **Note**: Session cookie is automatically set in browser

#### Step 3: Check Session
1. Expand `GET /auth/session`
2. Click "Try it out"
3. Click "Execute"
4. Expect 200 response with session details (cookie is automatically included)

### 2. Testing OAuth2 Flow

#### Step 1: Get Authorization Code
1. Navigate to **oidc** section
2. Expand `GET /authorize`
3. Fill in parameters:
   - `client_id`: ecom-web
   - `redirect_uri`: http://localhost:3000/callback
   - `response_type`: code
   - `scope`: openid profile email
   - `state`: random-state-123
4. Click "Execute"
5. You'll be redirected to login page (if not authenticated)
6. After login, authorization code is returned in redirect

#### Step 2: Exchange Code for Tokens
1. Expand `POST /token`
2. Click "Try it out"
3. Fill in request body:
```json
{
  "grant_type": "authorization_code",
  "code": "<authorization_code_from_step_1>",
  "code_verifier": ""
}
```
4. Click "Execute"
5. Expect 200 response with access_token, refresh_token, and id_token

#### Step 3: Get User Information
1. Expand `GET /userinfo`
2. Click the lock icon to authorize
3. Select "bearer" authorization
4. Paste the access_token from Step 2
5. Click "Authorize"
6. Click "Try it out" and "Execute"
7. Expect 200 response with user claims

### 3. Testing Token Introspection

1. Navigate to **oauth2** section
2. Expand `POST /introspect`
3. Click the lock icon and authorize with basic auth:
   - Username: your_client_id
   - Password: your_client_secret
4. Fill in request body:
```json
{
  "token": "<access_token>",
  "token_type_hint": "access_token"
}
```
5. Click "Execute"
6. Expect 200 response with token metadata

---

## Error Codes Reference

All error responses are documented in Swagger with examples. Here's a quick reference:

### Authentication Errors (AUTH00X)
| Code | Status | Description |
|------|--------|-------------|
| AUTH001 | 401 | Invalid email or password |
| AUTH002 | 400 | Missing required fields |
| AUTH003 | 409 | User already exists |
| AUTH004 | 400 | Validation failed |
| AUTH005 | 401 | Session not found |

### OIDC Errors (OIDC00X)
| Code | Status | Description |
|------|--------|-------------|
| OIDC001 | 500 | Discovery config error |
| OIDC002 | 500 | JWKS retrieval error |
| OIDC003 | 400 | Invalid authorization parameters |
| OIDC004 | 500 | Authorization flow error |
| OIDC005 | 400 | Invalid token request |
| OIDC006 | 500 | Token exchange error |
| OIDC007 | 401 | Missing/invalid access token |
| OIDC008 | 500 | UserInfo retrieval error |
| OIDC009 | 400 | Invalid introspection request |
| OIDC010 | 500 | Introspection error |
| OIDC011 | 400 | Invalid revocation request |

---

## Swagger Configuration

### Persistence
Authorization data is persisted across page refreshes. You don't need to re-authenticate every time you reload the page.

### Filtering
Use the filter box at the top to quickly find specific endpoints or operations.

### Request Duration
Each request displays the time taken, useful for performance analysis.

### Syntax Highlighting
Request and response bodies are syntax-highlighted using the Monokai theme.

### Expansion
- **list**: Shows operation summaries (default)
- **full**: Expands all operations
- **none**: Collapses all operations

---

## OpenAPI Specification

### Download OpenAPI JSON
The complete OpenAPI 3.0 specification is available at:
```
http://localhost:4000/api-json
```

### Use with Code Generation
You can use the OpenAPI spec to generate client SDKs:

```bash
# Generate TypeScript client
npx @openapitools/openapi-generator-cli generate \
  -i http://localhost:4000/api-json \
  -g typescript-axios \
  -o ./generated/auth-client

# Generate Python client
npx @openapitools/openapi-generator-cli generate \
  -i http://localhost:4000/api-json \
  -g python \
  -o ./generated/auth-client-python

# Generate Java client
npx @openapitools/openapi-generator-cli generate \
  -i http://localhost:4000/api-json \
  -g java \
  -o ./generated/auth-client-java
```

---

## Custom Swagger Options

The Swagger UI is configured with the following custom options:

```typescript
{
  customSiteTitle: 'Auth Service API Documentation',
  customfavIcon: 'https://nestjs.com/img/logo-small.svg',
  persistAuthorization: true,
  displayRequestDuration: true,
  filter: true,
  tryItOutEnabled: true,
  docExpansion: 'list',
  tagsSorter: 'alpha',
  operationsSorter: 'alpha'
}
```

---

## API Versioning

### Current Version: v1.0.0

The API follows semantic versioning:
- **Major version** (1.x.x): Breaking changes
- **Minor version** (x.1.x): New features (backward compatible)
- **Patch version** (x.x.1): Bug fixes

### Version Headers
Future versions may support version negotiation via headers:
```
Accept: application/vnd.auth.v1+json
```

---

## Server Environments

The documentation includes three server environments:

1. **Local Development**: `http://localhost:4000`
   - For local development and testing
   - Uses local MongoDB, Redis, Kafka

2. **Docker Internal**: `http://auth-service:4000`
   - For Docker Compose environment
   - Uses containerized services

3. **Production**: `https://api.example.com`
   - Production environment
   - HTTPS required
   - Rate limiting enabled

---

## Security Considerations

### 1. CORS Configuration
In production, configure CORS to only allow trusted origins:
```typescript
app.enableCors({
  origin: ['https://yourapp.com'],
  credentials: true
});
```

### 2. Rate Limiting
Implement rate limiting on Swagger endpoints in production:
```typescript
// Limit documentation access
app.use('/api', rateLimiter({ windowMs: 15 * 60 * 1000, max: 100 }));
```

### 3. Authentication
In production, consider requiring authentication to access Swagger UI:
```typescript
if (process.env.NODE_ENV === 'production') {
  app.use('/api', basicAuth({ users: { 'admin': 'secret' } }));
}
```

### 4. Disable in Production
Alternatively, completely disable Swagger in production:
```typescript
if (process.env.NODE_ENV !== 'production') {
  SwaggerModule.setup('api', app, document);
}
```

---

## Troubleshooting

### Issue: Swagger UI not loading

**Solution:**
1. Check that the service is running: `curl http://localhost:4000/api`
2. Verify Helmet CSP is disabled for development:
```typescript
app.use(helmet({ contentSecurityPolicy: false }));
```

### Issue: Authentication not persisting

**Solution:**
1. Ensure browser allows cookies
2. Check that `persistAuthorization: true` is set
3. Clear browser cache and try again

### Issue: CORS errors in browser

**Solution:**
1. Verify CORS is enabled: `NestFactory.create(AppModule, { cors: true })`
2. Or configure specific origins:
```typescript
app.enableCors({
  origin: 'http://localhost:3000',
  credentials: true
});
```

### Issue: Try It Out not working

**Solution:**
1. Check network tab for errors
2. Verify request format matches schema
3. Ensure required fields are filled
4. Check authentication is configured correctly

---

## Best Practices

### 1. Always Test with Swagger First
Before writing client code, test all endpoints in Swagger to understand request/response formats.

### 2. Use the "Try It Out" Feature
Swagger's interactive testing saves time compared to manual curl commands or Postman.

### 3. Export OpenAPI Spec
Export the OpenAPI JSON and commit it to your repository for version control:
```bash
curl http://localhost:4000/api-json > openapi.json
```

### 4. Generate Type-Safe Clients
Use the OpenAPI spec to generate type-safe client libraries for your frontend.

### 5. Document Everything
Add comprehensive JSDoc comments to all controllers and DTOs for better Swagger docs.

---

## Additional Resources

- [OpenAPI Specification](https://swagger.io/specification/)
- [NestJS Swagger Module](https://docs.nestjs.com/openapi/introduction)
- [OAuth 2.0 RFC 6749](https://tools.ietf.org/html/rfc6749)
- [OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html)
- [PKCE RFC 7636](https://tools.ietf.org/html/rfc7636)

---

## Support

For questions or issues with the API documentation:
- Check the ERROR_HANDLING_GUIDE.md for error codes
- Review AUTH_SERVICE_ENHANCEMENTS.md for enhancement details
- Contact the Auth Team at auth-team@example.com

**Your Auth Service now has production-ready Swagger documentation!** 📚
