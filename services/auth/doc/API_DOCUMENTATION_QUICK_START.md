# API Documentation - Quick Start

## 🚀 Access Swagger Documentation

After starting the Auth Service, open your browser and navigate to:

```
http://localhost:4000/api
```

You'll see a comprehensive, interactive API documentation interface!

---

## ✨ What's Available

### 📚 Complete API Documentation
- All authentication endpoints
- All OAuth2/OIDC endpoints
- Request/response examples
- Error codes and descriptions
- Interactive "Try it out" functionality

### 🔐 Authentication Methods Supported
1. **Cookie Auth** - Session-based authentication
2. **Bearer Token** - JWT access tokens
3. **Basic Auth** - Client credentials

### 🏷️ Organized Endpoints

#### Auth Endpoints (`/auth/*`)
- `POST /auth/register` - Create new user
- `POST /auth/login` - Authenticate user
- `GET /auth/session` - Validate session
- `POST /auth/logout` - Destroy session

#### OIDC/OAuth2 Endpoints
- `GET /.well-known/openid-configuration` - OpenID Discovery
- `GET /.well-known/jwks.json` - Public keys (JWKS)
- `GET /authorize` - OAuth2 authorization
- `POST /token` - Token exchange/refresh
- `GET /userinfo` - User information
- `POST /introspect` - Token introspection
- `POST /revoke` - Token revocation

---

## 🎯 Quick Test (5 Minutes)

### 1. Start the Service
```bash
# Local development
cd services/auth
pnpm run start:dev

# Or using Docker
docker-compose up auth-service
```

### 2. Open Swagger UI
```
http://localhost:4000/api
```

### 3. Register a User
1. Scroll to **auth** section
2. Click on `POST /auth/register`
3. Click "Try it out"
4. Use this example:
```json
{
  "email": "demo@example.com",
  "password": "demo123",
  "name": "Demo User"
}
```
5. Click "Execute"
6. ✅ You should get a 201 response!

### 4. Login
1. Click on `POST /auth/login`
2. Click "Try it out"
3. Use the same credentials:
```json
{
  "email": "demo@example.com",
  "password": "demo123"
}
```
4. Click "Execute"
5. ✅ You should get a 200 response with session_id!

### 5. Check Session
1. Click on `GET /auth/session`
2. Click "Try it out"
3. Click "Execute"
4. ✅ You should see your session details!

---

## 📖 Key Features

### Interactive Testing
- **No Postman needed!** Test all APIs directly in the browser
- **Auto-cookie handling** - Session cookies are automatically managed
- **Request duration** - See how long each request takes
- **Syntax highlighting** - Beautiful JSON formatting

### Comprehensive Documentation
- **Error codes** - Every error is documented with code (AUTH001, OIDC003, etc.)
- **Examples** - Real request/response examples for every endpoint
- **Schemas** - Complete DTO definitions with validation rules
- **Security** - All authentication methods explained

### Developer Friendly
- **Filtering** - Search for specific endpoints
- **Sorting** - Alphabetically organized
- **Persistence** - Authorization persists across page reloads
- **Export** - Download OpenAPI spec as JSON

---

## 🔑 Authentication in Swagger

### Testing Protected Endpoints

1. **Login first** to get session cookie:
   - Use `POST /auth/login`
   - Cookie is automatically saved

2. **For Bearer token endpoints**:
   - First get access token from `POST /token`
   - Click the lock icon 🔒 next to endpoint
   - Select "bearer"
   - Paste your access_token
   - Click "Authorize"

3. **For Basic Auth endpoints**:
   - Click the lock icon 🔒
   - Select "basic"
   - Enter client_id as username
   - Enter client_secret as password
   - Click "Authorize"

---

## 📥 Download OpenAPI Specification

Get the machine-readable API spec:

```bash
# JSON format
curl http://localhost:4000/api-json > openapi.json

# Use for code generation
npx @openapitools/openapi-generator-cli generate \
  -i http://localhost:4000/api-json \
  -g typescript-axios \
  -o ./generated/auth-client
```

---

## 🎨 Swagger UI Features

### Persistence
✅ Your authorization tokens persist across page refreshes

### Request Duration
✅ See how long each API call takes

### Filter
✅ Type to search for specific endpoints

### Try It Out
✅ Test APIs with real data directly in browser

### Copy/Paste
✅ Easily copy curl commands or responses

---

## 🌍 Environment Servers

Switch between environments in the Swagger UI:

1. **Local Development** - `http://localhost:4000`
2. **Docker Internal** - `http://auth-service:4000`
3. **Production** - `https://api.example.com`

---

## 📊 Version Information

- **API Version**: 1.0.0
- **OpenAPI Version**: 3.0
- **Standards**: OAuth 2.0, OpenID Connect Core 1.0, PKCE
- **License**: MIT

---

## 🆘 Troubleshooting

### Can't access Swagger UI?
```bash
# Check if service is running
curl http://localhost:4000/api

# Check logs
docker logs ecom-auth-service
```

### Authentication not working?
1. Make sure cookies are enabled in browser
2. Check that you're logged in (use `/auth/login` first)
3. For Bearer tokens, click the lock icon and authorize

### CORS errors?
CORS is enabled by default in development. If you still see errors:
1. Check browser console for details
2. Verify the origin in request headers

---

## 📚 More Documentation

For detailed information, see:
- [SWAGGER_DOCUMENTATION.md](./SWAGGER_DOCUMENTATION.md) - Complete Swagger guide
- [ERROR_HANDLING_GUIDE.md](./ERROR_HANDLING_GUIDE.md) - All error codes
- [AUTH_SERVICE_ENHANCEMENTS.md](./AUTH_SERVICE_ENHANCEMENTS.md) - Feature details

---

## ✅ Production Ready

The Swagger documentation includes:
- ✅ Complete API coverage
- ✅ All error codes documented
- ✅ Security schemes configured
- ✅ Request/response examples
- ✅ Interactive testing capability
- ✅ OpenAPI 3.0 compliant
- ✅ Version information
- ✅ Multiple server environments

---

**Start the service and explore the API documentation at http://localhost:4000/api!** 🎉
