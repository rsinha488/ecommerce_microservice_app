import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

/**
 * Bootstrap function for initializing the Auth Service
 *
 * This function sets up:
 * - NestJS application instance with CORS enabled
 * - Security middleware (Helmet)
 * - Cookie parser for session management
 * - Global validation pipes for DTO validation
 * - Swagger/OpenAPI documentation at /api
 * - API versioning support
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });

  // Security middleware - Helmet provides security headers
  app.use(helmet({
    contentSecurityPolicy: false, // Disable for development to allow Swagger UI
  }));

  // Cookie parser for session management (required for OAuth2/OIDC flows)
  app.use(cookieParser());

  // Global validation pipe - validates all DTOs automatically
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that don't have decorators
      forbidNonWhitelisted: true, // Throw error if non-whitelisted properties exist
      transform: true, // Automatically transform payloads to DTO instances
    }),
  );

  // ========================================
  // Swagger/OpenAPI Documentation Setup
  // ========================================

  const config = new DocumentBuilder()
    .setTitle('E-Commerce Auth Service API')
    .setDescription(`
# Authentication & Authorization Service

This service provides comprehensive authentication and authorization capabilities for the e-commerce microservices platform.

## Features

### 🔐 Authentication
- Email/password authentication
- Secure session management with Redis
- HTTP-only cookie-based sessions
- Password hashing with bcrypt

### 🎫 OAuth 2.0 & OpenID Connect
- Authorization Code Flow with PKCE support
- Access token and refresh token generation
- JWT-based tokens (RS256 signing)
- OpenID Connect Discovery
- UserInfo endpoint
- Token introspection (RFC 7662)
- Token revocation (RFC 7009)

### 🛡️ Security
- Secure HTTP-only cookies
- CSRF protection with SameSite
- Generic error messages (prevents user enumeration)
- Rate limiting support
- Helmet security headers

## Error Handling

All endpoints return standardized error responses with specific error codes:

### Authentication Error Codes (AUTH00X)
- **AUTH001**: Invalid email or password (401)
- **AUTH002**: Missing required fields (400)
- **AUTH003**: User already exists (409)
- **AUTH004**: Validation failed (400)
- **AUTH005**: Session not found (401)

### OIDC Error Codes (OIDC00X)
- **OIDC001**: Discovery config error (500)
- **OIDC002**: JWKS retrieval error (500)
- **OIDC003**: Invalid authorization parameters (400)
- **OIDC004**: Authorization flow error (500)
- **OIDC005**: Invalid token request (400)
- **OIDC006**: Token exchange error (500)
- **OIDC007**: Missing/invalid access token (401)
- **OIDC008**: UserInfo retrieval error (500)
- **OIDC009**: Invalid introspection request (400)
- **OIDC010**: Introspection error (500)
- **OIDC011**: Invalid revocation request (400)

## Standards Compliance

- OAuth 2.0 (RFC 6749)
- OpenID Connect Core 1.0
- PKCE (RFC 7636)
- Token Introspection (RFC 7662)
- Token Revocation (RFC 7009)
- JSON Web Token (RFC 7519)
- JSON Web Key (RFC 7517)

## Getting Started

1. **Register a user**: \`POST /auth/register\`
2. **Login**: \`POST /auth/login\`
3. **Check session**: \`GET /auth/session\`
4. **OAuth2 Flow**: Start at \`GET /authorize\`

For detailed error handling documentation, see the ERROR_HANDLING_GUIDE.md
    `)
    .setVersion('1.0.0')
    .setContact(
      'Auth Service Team',
      'https://github.com/your-org/ecom-microservices',
      'auth-team@example.com'
    )
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .addServer('http://localhost:4000', 'Local Development Server')
    .addServer('http://auth-service:4000', 'Docker Internal Network')
    .addServer('https://api.example.com', 'Production Server')
    .addTag('auth', 'Authentication endpoints (login, register, session, logout)')
    .addTag('oidc', 'OpenID Connect & OAuth2 endpoints (authorization, token, userinfo)')
    .addTag('oauth2', 'OAuth 2.0 endpoints (introspection, revocation)')
    .addTag('admin', 'Administrative endpoints (client management)')
    .addCookieAuth(
      'session_id',
      {
        type: 'apiKey',
        in: 'cookie',
        name: 'session_id',
        description: 'Session ID stored in HTTP-only cookie after successful login'
      },
      'session_id'
    )
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'JWT access token obtained from /token endpoint',
        in: 'header',
      },
      'bearer'
    )
    .addBasicAuth(
      {
        type: 'http',
        scheme: 'basic',
        name: 'Authorization',
        description: 'Client credentials for introspection and revocation endpoints',
        in: 'header',
      },
      'basic'
    )
    .addGlobalParameters({
      name: 'X-Request-ID',
      in: 'header',
      required: false,
      description: 'Unique request identifier for tracing',
      schema: { type: 'string', example: 'req-123-456-789' }
    })
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
  });

  // Setup Swagger UI at /api endpoint
  SwaggerModule.setup('api', app, document, {
    customSiteTitle: 'Auth Service API Documentation',
    customfavIcon: 'https://nestjs.com/img/logo-small.svg',
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info { margin: 20px 0; }
      .swagger-ui .info .title { font-size: 2.5rem; color: #333; }
    `,
    swaggerOptions: {
      persistAuthorization: true, // Keep authorization data after page refresh
      displayRequestDuration: true, // Show request duration
      filter: true, // Enable filtering operations
      tryItOutEnabled: true, // Enable "Try it out" by default
      syntaxHighlight: {
        activate: true,
        theme: 'monokai'
      },
      docExpansion: 'list', // Expand/collapse operations: 'list', 'full', or 'none'
      defaultModelsExpandDepth: 3,
      defaultModelExpandDepth: 3,
      tagsSorter: 'alpha', // Sort tags alphabetically
      operationsSorter: 'alpha', // Sort operations alphabetically
    },
  });

  // Get port from environment or use default
  const port = process.env.PORT || process.env.AUTH_PORT || 4000;
  const host = '::'; // Listen on all interfaces (IPv4 and IPv6)

  await app.listen(port, host);

  // Log startup information
  Logger.log(`🚀 Auth Service started successfully`, 'Bootstrap');
  Logger.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`, 'Bootstrap');
  Logger.log(`🌐 Server listening on: http://localhost:${port}`, 'Bootstrap');
  Logger.log(`📚 Swagger API Documentation: http://localhost:${port}/api`, 'Bootstrap');
  Logger.log(`🔍 OpenID Discovery: http://localhost:${port}/.well-known/openid-configuration`, 'Bootstrap');
  Logger.log(`🔑 JWKS Endpoint: http://localhost:${port}/.well-known/jwks.json`, 'Bootstrap');
  Logger.log(``, 'Bootstrap');
  Logger.log(`📖 Available Endpoints:`, 'Bootstrap');
  Logger.log(`   - POST   /auth/register       - Create new user account`, 'Bootstrap');
  Logger.log(`   - POST   /auth/login          - Authenticate user`, 'Bootstrap');
  Logger.log(`   - GET    /auth/session        - Validate session`, 'Bootstrap');
  Logger.log(`   - POST   /auth/logout         - Destroy session`, 'Bootstrap');
  Logger.log(`   - GET    /authorize           - OAuth2 authorization`, 'Bootstrap');
  Logger.log(`   - POST   /token               - Token exchange/refresh`, 'Bootstrap');
  Logger.log(`   - GET    /userinfo            - Get user information`, 'Bootstrap');
  Logger.log(`   - POST   /introspect          - Token introspection`, 'Bootstrap');
  Logger.log(`   - POST   /revoke              - Token revocation`, 'Bootstrap');
  Logger.log(``, 'Bootstrap');
}

bootstrap().catch(err => {
  Logger.error(`❌ Failed to start Auth Service: ${err.message}`, err.stack, 'Bootstrap');
  process.exit(1);
});