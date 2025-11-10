# Auth Service - Error Handling Guide

## Overview

This document provides comprehensive information about error handling in the Auth Service, including error codes, status codes, and best practices for developers.

---

## Error Code System

All errors in the Auth Service use a standardized format with specific error codes for easy troubleshooting and client-side handling.

### Error Response Format

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "errorCode": "AUTH001",
  "message": "Invalid email or password provided"
}
```

---

## Authentication Errors (AUTH00X)

### AUTH001 - Invalid Credentials
- **HTTP Status**: 401 Unauthorized
- **Endpoint**: POST /auth/login
- **Cause**: Email or password is incorrect
- **Message**: "Invalid email or password provided"
- **Resolution**: Verify credentials and try again
- **Security Note**: Generic message prevents user enumeration attacks

```typescript
throw new AuthUnauthorizedException(
  'Invalid email or password provided',
  'AUTH001'
);
```

### AUTH002 - Missing Required Fields
- **HTTP Status**: 400 Bad Request
- **Endpoint**: POST /auth/login
- **Cause**: Email or password field is missing
- **Message**: "Email and password are required"
- **Resolution**: Include both email and password in request body

```typescript
if (!email || !password) {
  throw new AuthException(
    'Email and password are required',
    'AUTH002'
  );
}
```

### AUTH003 - User Already Exists
- **HTTP Status**: 409 Conflict
- **Endpoint**: POST /auth/register
- **Cause**: Attempting to register with an email that already exists
- **Message**: "User with this email already exists"
- **Resolution**: Use a different email address or log in instead

```typescript
throw new AuthConflictException(
  'User with this email already exists',
  'AUTH003'
);
```

### AUTH004 - Validation Failed
- **HTTP Status**: 400 Bad Request
- **Endpoint**: POST /auth/register
- **Cause**: Email format is invalid or password too weak
- **Message**: "Email format is invalid or password too weak"
- **Resolution**: Provide valid email and password (min 6 characters)

```typescript
if (!emailRegex.test(email) || password.length < 6) {
  throw new AuthException(
    'Email format is invalid or password too weak',
    'AUTH004'
  );
}
```

### AUTH005 - Session Not Found
- **HTTP Status**: 401 Unauthorized
- **Endpoint**: GET /auth/session
- **Cause**: No session cookie provided or session expired
- **Message**: "No session found" or "Invalid session"
- **Resolution**: Login again to create new session

---

## OIDC Errors (OIDC00X)

### OIDC001 - Discovery Configuration Error
- **HTTP Status**: 500 Internal Server Error
- **Endpoint**: GET /.well-known/openid-configuration
- **Cause**: Failed to generate OpenID provider configuration
- **Message**: "Failed to generate OpenID provider configuration"
- **Resolution**: Check server logs, verify environment variables

### OIDC002 - JWKS Retrieval Error
- **HTTP Status**: 500 Internal Server Error
- **Endpoint**: GET /.well-known/jwks.json
- **Cause**: JWKS not available or failed to retrieve
- **Message**: "Failed to retrieve JWKS" or "JWKS not available"
- **Resolution**: Verify JWKS service is initialized correctly

### OIDC003 - Invalid Authorization Parameters
- **HTTP Status**: 400 Bad Request
- **Endpoint**: GET /authorize
- **Cause**: Missing or invalid OAuth2 parameters
- **Message**: Various (e.g., "client_id is required", "response_type must be 'code'")
- **Resolution**: Include all required OAuth2 parameters

**Required Parameters:**
- `client_id` (string, non-empty)
- `redirect_uri` (string, valid URL)
- `response_type` (must be "code")

**Optional Parameters:**
- `scope` (string, space-separated)
- `state` (string, CSRF protection)
- `code_challenge` (string, PKCE)
- `code_challenge_method` (S256 or plain)

### OIDC004 - Authorization Flow Error
- **HTTP Status**: 500 Internal Server Error
- **Endpoint**: GET /authorize
- **Cause**: Unexpected error during authorization flow
- **Message**: "Authorization request failed"
- **Resolution**: Check server logs for detailed error

### OIDC005 - Invalid Token Request
- **HTTP Status**: 400 Bad Request
- **Endpoint**: POST /token
- **Cause**: Missing grant_type, code, or refresh_token
- **Message**: Various based on missing parameter
- **Resolution**: Include required parameters based on grant type

**Authorization Code Grant:**
```json
{
  "grant_type": "authorization_code",
  "code": "auth_code_xyz",
  "code_verifier": "verifier123" // if PKCE used
}
```

**Refresh Token Grant:**
```json
{
  "grant_type": "refresh_token",
  "refresh_token": "refresh_token_xyz"
}
```

### OIDC006 - Token Exchange Error
- **HTTP Status**: 500 Internal Server Error
- **Endpoint**: POST /token
- **Cause**: Unexpected error during token exchange
- **Message**: "Token request failed"
- **Resolution**: Check server logs, verify token/code validity

### OIDC007 - Missing or Invalid Access Token
- **HTTP Status**: 401 Unauthorized
- **Endpoint**: GET/POST /userinfo
- **Cause**: Authorization header missing or invalid
- **Message**: "Bearer token required" or "Authorization header required"
- **Resolution**: Include valid Bearer token in Authorization header

**Correct Format:**
```
Authorization: Bearer eyJhbGciOiJSUzI1NiIs...
```

### OIDC008 - UserInfo Retrieval Error
- **HTTP Status**: 500 Internal Server Error
- **Endpoint**: GET/POST /userinfo
- **Cause**: Unexpected error retrieving user information
- **Message**: "UserInfo request failed"
- **Resolution**: Check token validity and server logs

### OIDC009 - Invalid Introspection Request
- **HTTP Status**: 400 Bad Request
- **Endpoint**: POST /introspect
- **Cause**: Missing token parameter
- **Message**: "token parameter is required"
- **Resolution**: Include token in request body

### OIDC010 - Introspection Error
- **HTTP Status**: 500 Internal Server Error
- **Endpoint**: POST /introspect
- **Cause**: Unexpected error during introspection
- **Message**: "Token introspection failed"
- **Resolution**: Check server logs

### OIDC011 - Invalid Revocation Request
- **HTTP Status**: 400 Bad Request (but may return 200 per RFC)
- **Endpoint**: POST /revoke
- **Cause**: Missing token parameter
- **Message**: "token parameter is required"
- **Resolution**: Include token in request body

**Note**: Per RFC 7009, revocation endpoint returns 200 OK even if token doesn't exist

---

## HTTP Status Codes Reference

| Status Code | Meaning | When Used |
|-------------|---------|-----------|
| 200 OK | Success | Successful login, token exchange, introspection, revocation |
| 201 Created | Resource Created | Successful user registration |
| 302 Found | Redirect | OAuth authorization flow redirects |
| 400 Bad Request | Invalid Request | Missing parameters, validation errors |
| 401 Unauthorized | Authentication Failed | Invalid credentials, missing/invalid tokens |
| 403 Forbidden | Access Denied | User doesn't have required permissions |
| 404 Not Found | Resource Not Found | Endpoint doesn't exist |
| 409 Conflict | Resource Conflict | User already exists (registration) |
| 500 Internal Server Error | Server Error | Unexpected errors, system failures |

---

## Error Handling Best Practices for Developers

### 1. Always Use Specific Error Codes

```typescript
// ✅ Good - Specific error code
throw new BadRequestException({
  statusCode: 400,
  message: 'Email format is invalid',
  errorCode: 'AUTH004',
});

// ❌ Bad - Generic error
throw new BadRequestException('Invalid input');
```

### 2. Validate Input Early

```typescript
// Validate at the beginning of use case
if (!email || typeof email !== 'string' || email.trim().length === 0) {
  throw new BadRequestException({
    statusCode: 400,
    message: 'Email is required and must be a non-empty string',
    errorCode: 'AUTH002',
  });
}
```

### 3. Use Generic Messages for Security

```typescript
// ✅ Good - Generic message prevents user enumeration
if (!user || !isPasswordValid) {
  throw new UnauthorizedException('Invalid email or password');
}

// ❌ Bad - Reveals whether email exists
if (!user) {
  throw new NotFoundException('Email not found');
}
if (!isPasswordValid) {
  throw new UnauthorizedException('Wrong password');
}
```

### 4. Log Errors for Debugging

```typescript
try {
  // ... operation
} catch (error) {
  // Log detailed error for developers
  console.error('[UseCase] Operation failed:', error);

  // Throw user-friendly error
  throw new InternalServerErrorException({
    statusCode: 500,
    message: 'Operation failed',
    errorCode: 'AUTH999',
  });
}
```

### 5. Handle Async Errors Properly

```typescript
async execute(data: any) {
  try {
    const result = await this.repository.save(data);
    return result;
  } catch (error) {
    if (error.code === 'DUPLICATE_KEY') {
      throw new ConflictException({
        message: 'Resource already exists',
        errorCode: 'AUTH003',
      });
    }
    throw error; // Re-throw unknown errors
  }
}
```

### 6. Validate DTOs with class-validator

```typescript
import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}
```

### 7. Use Guards for Authentication

```typescript
@Get('protected')
@UseGuards(JwtAuthGuard)
async protectedRoute() {
  // Route only accessible with valid JWT
}
```

---

## Client-Side Error Handling Examples

### JavaScript/TypeScript Client

```typescript
async function login(email: string, password: string) {
  try {
    const response = await fetch('http://localhost:4000/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include', // Include cookies
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle specific error codes
      switch (data.errorCode) {
        case 'AUTH001':
          alert('Invalid email or password');
          break;
        case 'AUTH002':
          alert('Please provide both email and password');
          break;
        default:
          alert(`Error: ${data.message}`);
      }
      return null;
    }

    return data; // Success
  } catch (error) {
    console.error('Network error:', error);
    alert('Network error - please try again');
    return null;
  }
}
```

### React Error Handling

```tsx
function LoginForm() {
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await api.login(email, password);

      if (response.success) {
        navigate('/dashboard');
      }
    } catch (err: any) {
      // Handle different error codes
      if (err.errorCode === 'AUTH001') {
        setError('Invalid email or password');
      } else if (err.errorCode === 'AUTH002') {
        setError('Please fill in all fields');
      } else {
        setError(err.message || 'Login failed');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}
      {/* form fields */}
    </form>
  );
}
```

---

## Testing Error Scenarios

### Unit Tests

```typescript
describe('LoginUseCase', () => {
  it('should throw AUTH001 for invalid credentials', async () => {
    // Arrange
    mockRepository.findUserByEmail.mockResolvedValue(null);

    // Act & Assert
    await expect(
      useCase.execute('test@example.com', 'wrongpass')
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should throw AUTH002 for missing email', async () => {
    await expect(
      useCase.execute('', 'password123')
    ).rejects.toThrow(BadRequestException);
  });
});
```

### Integration Tests

```typescript
describe('POST /auth/login', () => {
  it('returns 401 with AUTH001 for invalid credentials', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'wrong' });

    expect(response.status).toBe(401);
    expect(response.body.errorCode).toBe('AUTH001');
    expect(response.body.message).toBe('Invalid email or password provided');
  });
});
```

---

## Monitoring and Logging

### Error Metrics to Track

1. **Error Rate by Code**: Track frequency of each error code
2. **AUTH001 (Invalid Credentials)**: High rate may indicate brute force attempts
3. **OIDC Errors**: Monitor for integration issues
4. **500 Errors**: Critical - investigate immediately

### Logging Best Practices

```typescript
// Structure logs for easy parsing
console.error({
  timestamp: new Date().toISOString(),
  level: 'ERROR',
  service: 'auth-service',
  endpoint: '/auth/login',
  errorCode: 'AUTH001',
  message: 'Login attempt failed',
  userId: email, // Sanitize PII in production
  ip: req.ip,
});
```

### Alert Thresholds

- **AUTH001**: Alert if >100 failures/minute (possible attack)
- **500 Errors**: Alert if >5 errors/minute
- **OIDC003**: Alert if >50 bad requests/minute

---

## Security Considerations

### 1. Rate Limiting

Implement rate limiting for authentication endpoints:
- Login: 5 attempts per IP per 15 minutes
- Register: 3 attempts per IP per hour
- Token: 10 requests per client per minute

### 2. Prevent User Enumeration

Always use generic error messages for authentication:
```typescript
// Don't reveal if email exists
throw new UnauthorizedException('Invalid email or password');
```

### 3. Secure Error Responses

Never expose:
- Internal stack traces
- Database errors
- File paths
- Environment details

### 4. Audit Logging

Log all authentication events:
- Login attempts (success and failure)
- Registration attempts
- Token issuance
- Token revocation

---

## Summary

This error handling system provides:
- ✅ Consistent error format across all endpoints
- ✅ Specific error codes for easy troubleshooting
- ✅ Security-conscious error messages
- ✅ Client-friendly error responses
- ✅ Comprehensive logging for debugging
- ✅ Standards-compliant OAuth2/OIDC errors

For questions or to report issues, contact the Auth Team.
