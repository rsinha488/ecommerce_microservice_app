
import {
  Controller,
  Get,
  Query,
  Res,
  Post,
  Body,
  BadRequestException,
  Req,
  Headers,
  UnauthorizedException,
  HttpCode,
  UseGuards,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
  ApiSecurity,
} from '@nestjs/swagger';

import type { Request, Response } from 'express';
import type { AuthorizeDto } from '../../application/dto/authorize.dto';
import type { TokenDto } from '../../application/dto/token.dto';

import { AuthorizeUseCase } from '../../application/use-cases/authorize.usecase';
import { TokenUseCase } from '../../application/use-cases/token.usecase';
import { UserInfoUseCase } from '../../application/use-cases/userinfo.usecase';
import { IntrospectUseCase } from '../../application/use-cases/introspect.usecase';
import { RevokeUseCase } from '../../application/use-cases/revoke.usecase';
import { LoginUseCase } from '../../application/use-cases/login.usecase';
import { JwksService } from '../../infrastructure/jwks/jwks.service';
import { IntrospectDto } from '../../application/dto/introspect.dto';
import { RevokeDto } from '../../application/dto/revoke.dto';
import { ClientAuthGuard } from '../../shared/guards/client-auth.guard';

/**
 * OIDC (OpenID Connect) Controller
 *
 * This controller implements OAuth 2.0 and OpenID Connect endpoints for secure authentication
 * and authorization. It provides a complete OAuth2/OIDC provider implementation supporting:
 * - Authorization Code Flow with PKCE (Proof Key for Code Exchange)
 * - Token exchange and refresh
 * - User information retrieval
 * - Token introspection and revocation
 * - OpenID Connect discovery
 *
 * Security Features:
 * - PKCE support for enhanced security in public clients
 * - Secure token storage with Redis
 * - Session-based authorization flow
 * - JWT-based access and ID tokens
 * - Refresh token rotation for improved security
 *
 * Standards Compliance:
 * - OAuth 2.0 (RFC 6749)
 * - OpenID Connect Core 1.0
 * - OAuth 2.0 Token Introspection (RFC 7662)
 * - OAuth 2.0 Token Revocation (RFC 7009)
 * - PKCE (RFC 7636)
 *
 * @author Auth Team
 * @version 1.0.0
 */
@ApiTags('oidc', 'oauth2')
@Controller()
export class OidcController {
  constructor(
    private readonly authorizeUC: AuthorizeUseCase,
    private readonly tokenUC: TokenUseCase,
    private readonly userInfoUC: UserInfoUseCase,
    private readonly introspectUC: IntrospectUseCase,
    private readonly revokeUC: RevokeUseCase,
    private readonly loginUC: LoginUseCase,
    private readonly jwksService: JwksService,
  ) {}

  /**
   * OpenID Provider Discovery Document
   *
   * Returns the OpenID Provider metadata document containing information about the
   * authorization server's configuration, including supported endpoints, grant types,
   * scopes, and authentication methods.
   *
   * This endpoint is crucial for client applications to discover the server's capabilities
   * and configure themselves accordingly.
   *
   * Standards: OpenID Connect Discovery 1.0
   *
   * @param res - Express response object for sending JSON metadata
   * @returns OpenID Provider Configuration JSON
   *
   * @example
   * GET /.well-known/openid-configuration
   *
   * Response:
   * {
   *   "issuer": "http://localhost:4000",
   *   "authorization_endpoint": "http://localhost:4000/authorize",
   *   "token_endpoint": "http://localhost:4000/token",
   *   ...
   * }
   */
  @Get('.well-known/openid-configuration')
  @ApiOperation({
    summary: 'OpenID Provider Discovery',
    description: 'Returns OpenID Connect provider metadata for client configuration and discovery',
  })
  @ApiResponse({
    status: 200,
    description: 'OpenID Provider metadata document',
    schema: {
      type: 'object',
      properties: {
        issuer: { type: 'string', example: 'http://localhost:4000' },
        authorization_endpoint: { type: 'string', example: 'http://localhost:4000/authorize' },
        token_endpoint: { type: 'string', example: 'http://localhost:4000/token' },
        userinfo_endpoint: { type: 'string', example: 'http://localhost:4000/userinfo' },
        jwks_uri: { type: 'string', example: 'http://localhost:4000/.well-known/jwks.json' },
        scopes_supported: { type: 'array', items: { type: 'string' } },
        response_types_supported: { type: 'array', items: { type: 'string' } },
        grant_types_supported: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  discovery(@Res() res: Response) {
    try {
      // Get issuer URL from environment, fallback to localhost for development
      const issuer = process.env.JWT_ISS || 'http://localhost:4000';

      // Return OpenID Provider Configuration as per spec
      return res.json({
        issuer,
        authorization_endpoint: `${issuer}/authorize`,
        token_endpoint: `${issuer}/token`,
        userinfo_endpoint: `${issuer}/userinfo`,
        jwks_uri: `${issuer}/.well-known/jwks.json`,
        introspection_endpoint: `${issuer}/introspect`,
        revocation_endpoint: `${issuer}/revoke`,
        registration_endpoint: `${issuer}/auth/register`,

        // Supported OAuth 2.0 scopes
        scopes_supported: ['openid', 'profile', 'email', 'address', 'phone'],

        // Supported response types (we support authorization code flow)
        response_types_supported: ['code'],

        // Supported response modes
        response_modes_supported: ['query', 'fragment'],

        // Supported grant types
        grant_types_supported: ['authorization_code', 'refresh_token'],

        // Subject identifier types
        subject_types_supported: ['public'],

        // ID Token signing algorithms
        id_token_signing_alg_values_supported: ['RS256'],

        // Client authentication methods at token endpoint
        token_endpoint_auth_methods_supported: [
          'client_secret_basic',
          'client_secret_post',
        ],

        // Supported claims
        claims_supported: [
          'sub', 'iss', 'aud', 'exp', 'iat',
          'name', 'given_name', 'family_name', 'middle_name',
          'nickname', 'preferred_username',
          'profile', 'picture', 'website',
          'email', 'email_verified',
          'gender', 'birthdate',
          'zoneinfo', 'locale',
          'phone_number', 'phone_number_verified',
          'address',
        ],

        // PKCE support
        code_challenge_methods_supported: ['S256', 'plain'],
      });
    } catch (error) {
      // Log error for debugging (in production, use proper logging service)
      console.error('[OidcController] Error in discovery endpoint:', error);

      throw new InternalServerErrorException({
        statusCode: 500,
        message: 'Failed to generate OpenID provider configuration',
        errorCode: 'OIDC001',
      });
    }
  }

  /**
   * JSON Web Key Set (JWKS) Endpoint
   *
   * Returns the public keys used to verify JWT signatures. Clients use these keys
   * to validate access tokens and ID tokens issued by this authorization server.
   *
   * This endpoint is essential for distributed systems where clients need to verify
   * tokens without contacting the authorization server for each validation.
   *
   * Standards: RFC 7517 (JSON Web Key), RFC 7518 (JSON Web Algorithms)
   *
   * @param res - Express response object for sending JWKS JSON
   * @returns JSON Web Key Set containing public keys
   *
   * @example
   * GET /.well-known/jwks.json
   *
   * Response:
   * {
   *   "keys": [
   *     {
   *       "kty": "RSA",
   *       "use": "sig",
   *       "kid": "key-id-123",
   *       "n": "modulus...",
   *       "e": "AQAB"
   *     }
   *   ]
   * }
   */
  @Get('.well-known/jwks.json')
  @ApiOperation({
    summary: 'JSON Web Key Set',
    description: 'Returns public keys for JWT signature verification',
  })
  @ApiResponse({
    status: 200,
    description: 'JWKS document containing public keys',
    schema: {
      type: 'object',
      properties: {
        keys: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              kty: { type: 'string', example: 'RSA' },
              use: { type: 'string', example: 'sig' },
              kid: { type: 'string', example: 'key-id-123' },
              n: { type: 'string', description: 'RSA modulus' },
              e: { type: 'string', example: 'AQAB', description: 'RSA exponent' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error while retrieving JWKS',
    schema: {
      example: {
        statusCode: 500,
        message: 'Failed to retrieve JWKS',
        errorCode: 'OIDC002',
      },
    },
  })
  getJwks(@Res() res: Response) {
    try {
      // Retrieve public JWKS from service
      const jwks = this.jwksService.getPublicJwks();

      if (!jwks || !jwks.keys || jwks.keys.length === 0) {
        throw new InternalServerErrorException({
          statusCode: 500,
          message: 'JWKS not available',
          errorCode: 'OIDC002',
        });
      }

      return res.json(jwks);
    } catch (error) {
      console.error('[OidcController] Error in JWKS endpoint:', error);

      if (error instanceof InternalServerErrorException) {
        throw error;
      }

      throw new InternalServerErrorException({
        statusCode: 500,
        message: 'Failed to retrieve JWKS',
        errorCode: 'OIDC002',
      });
    }
  }

  /**
   * Authorization Endpoint (OAuth2 / OIDC Authorization Code Flow)
   *
   * Initiates the OAuth 2.0 authorization code flow. This is the first step in the
   * three-legged OAuth flow where the user authenticates and authorizes the client
   * application to access their resources.
   *
   * Flow:
   * 1. Client redirects user to this endpoint with client_id, redirect_uri, scope, etc.
   * 2. Server checks if user is authenticated (has valid session)
   * 3. If not authenticated, redirects to login page
   * 4. After authentication, shows consent screen (currently auto-approved)
   * 5. Generates authorization code and redirects back to client with code
   * 6. Client exchanges code for tokens at /token endpoint
   *
   * Security Features:
   * - Session-based authentication check
   * - PKCE support for public clients
   * - State parameter for CSRF protection
   * - Short-lived authorization codes (10 minutes)
   *
   * Standards: OAuth 2.0 (RFC 6749), PKCE (RFC 7636)
   *
   * @param q - Authorization request query parameters
   * @param req - Express request object for session cookies
   * @param res - Express response object for redirects
   *
   * @throws BadRequestException - When required parameters are missing or invalid
   * @throws UnauthorizedException - When session is invalid or expired
   *
   * @example
   * GET /authorize?client_id=app123&redirect_uri=https://app.com/callback&response_type=code&scope=openid%20profile%20email&state=random123&code_challenge=xyz&code_challenge_method=S256
   *
   * Success Response: HTTP 302 redirect to redirect_uri?code=auth_code_xyz&state=random123
   */
  @Get('authorize')
  @ApiOperation({
    summary: 'OAuth2 Authorization Endpoint',
    description: 'Initiates OAuth 2.0 authorization code flow with optional PKCE support',
  })
  @ApiQuery({ name: 'client_id', required: true, description: 'OAuth2 client identifier', example: 'ecom-web' })
  @ApiQuery({ name: 'redirect_uri', required: true, description: 'Client redirect URI after authorization', example: 'http://localhost:3000/callback' })
  @ApiQuery({ name: 'response_type', required: true, description: 'Must be "code" for authorization code flow', example: 'code' })
  @ApiQuery({ name: 'scope', required: false, description: 'Space-separated scopes', example: 'openid profile email' })
  @ApiQuery({ name: 'state', required: false, description: 'CSRF protection state parameter', example: 'random-state-123' })
  @ApiQuery({ name: 'code_challenge', required: false, description: 'PKCE code challenge', example: 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM' })
  @ApiQuery({ name: 'code_challenge_method', required: false, description: 'PKCE challenge method (S256 or plain)', example: 'S256' })
  @ApiResponse({
    status: 302,
    description: 'Redirect to login page (if unauthenticated) or redirect_uri with authorization code',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid or missing parameters',
    schema: {
      example: {
        statusCode: 400,
        message: 'Invalid request parameters',
        errorCode: 'OIDC003',
      },
    },
  })
  async authorize(
    @Query() q: AuthorizeDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      // Validate required parameters
      if (!q.client_id || typeof q.client_id !== 'string' || q.client_id.trim().length === 0) {
        throw new BadRequestException({
          statusCode: 400,
          message: 'client_id is required',
          errorCode: 'OIDC003',
        });
      }

      if (!q.redirect_uri || typeof q.redirect_uri !== 'string' || q.redirect_uri.trim().length === 0) {
        throw new BadRequestException({
          statusCode: 400,
          message: 'redirect_uri is required',
          errorCode: 'OIDC003',
        });
      }

      if (!q.response_type || q.response_type !== 'code') {
        throw new BadRequestException({
          statusCode: 400,
          message: 'response_type must be "code"',
          errorCode: 'OIDC003',
        });
      }

      // Validate PKCE parameters if provided
      if (q.code_challenge_method && !['S256', 'plain'].includes(q.code_challenge_method)) {
        throw new BadRequestException({
          statusCode: 400,
          message: 'code_challenge_method must be S256 or plain',
          errorCode: 'OIDC003',
        });
      }

      if (q.code_challenge && !q.code_challenge_method) {
        // Default to plain if code_challenge provided without method
        q.code_challenge_method = 'plain';
      }

      // Check if user is logged in via session cookie
      const sessionId = req.cookies?.session_id;

      if (!sessionId || typeof sessionId !== 'string') {
        // No session - redirect to login page with OAuth parameters
        const loginUrl = this.buildLoginRedirectUrl(q);
        return res.redirect(loginUrl);
      }

      // Validate session
      const session = await this.loginUC.getSession(sessionId);

      if (!session || !session.userId) {
        // Session invalid or expired - redirect to login
        const loginUrl = this.buildLoginRedirectUrl(q);
        return res.redirect(loginUrl);
      }

      // User is authenticated - proceed with authorization
      const userId = session.userId;

      // In a full implementation, show consent screen here
      // For now, auto-approve the authorization request

      // Generate authorization code (10-minute expiration)
      const code = await this.authorizeUC.createAuthCode({
        clientId: q.client_id,
        userId,
        redirectUri: q.redirect_uri,
        scope: q.scope || 'openid profile email',
        codeChallenge: q.code_challenge,
        codeChallengeMethod: q.code_challenge_method,
      });

      // Build redirect URL with authorization code
      const redirectUrl = new URL(q.redirect_uri);
      redirectUrl.searchParams.append('code', code);

      // Include state parameter if provided (CSRF protection)
      if (q.state) {
        redirectUrl.searchParams.append('state', q.state);
      }

      return res.redirect(redirectUrl.toString());
    } catch (error) {
      console.error('[OidcController] Error in authorize endpoint:', error);

      // Pass through known exceptions
      if (error instanceof BadRequestException || error instanceof UnauthorizedException) {
        throw error;
      }

      // Handle unexpected errors
      throw new InternalServerErrorException({
        statusCode: 500,
        message: 'Authorization request failed',
        errorCode: 'OIDC004',
      });
    }
  }

  /**
   * Helper method to build login page redirect URL with OAuth parameters
   *
   * @param params - Authorization request parameters to preserve
   * @returns Formatted login URL with query parameters
   * @private
   */
  private buildLoginRedirectUrl(params: AuthorizeDto): string {
    const loginParams = new URLSearchParams();
    loginParams.append('client_id', params.client_id);
    loginParams.append('redirect_uri', params.redirect_uri);

    if (params.state) {
      loginParams.append('state', params.state);
    }

    loginParams.append('scope', params.scope || 'openid profile email');

    if (params.code_challenge) {
      loginParams.append('code_challenge', params.code_challenge);
    }

    if (params.code_challenge_method) {
      loginParams.append('code_challenge_method', params.code_challenge_method);
    }

    return `/auth/login-page?${loginParams.toString()}`;
  }

  /**
   * Token Endpoint (OAuth2 Token Exchange)
   *
   * Exchanges authorization codes for access tokens, or refreshes access tokens
   * using refresh tokens. This is a critical endpoint in the OAuth 2.0 flow where
   * clients obtain credentials to access protected resources.
   *
   * Supported Grant Types:
   * 1. authorization_code - Exchange auth code for tokens (with PKCE verification)
   * 2. refresh_token - Exchange refresh token for new access token
   *
   * Security Features:
   * - PKCE verification for authorization code grant
   * - Refresh token rotation (one-time use)
   * - Short-lived access tokens (15 minutes)
   * - Long-lived refresh tokens (30 days)
   * - Hash-based refresh token storage
   *
   * Standards: OAuth 2.0 (RFC 6749), PKCE (RFC 7636)
   *
   * @param body - Token request parameters
   * @returns Token response with access_token, refresh_token, and optional id_token
   * @throws BadRequestException - For invalid grant, missing parameters, or PKCE failures
   *
   * @example Authorization Code Grant:
   * POST /token
   * Content-Type: application/x-www-form-urlencoded
   *
   * grant_type=authorization_code&code=auth_code_xyz&code_verifier=verifier123
   *
   * Response:
   * {
   *   "access_token": "eyJhbGc...",
   *   "token_type": "Bearer",
   *   "expires_in": 900,
   *   "refresh_token": "refresh_token_xyz",
   *   "id_token": "eyJhbGc..." (if openid scope)
   * }
   *
   * @example Refresh Token Grant:
   * POST /token
   * Content-Type: application/x-www-form-urlencoded
   *
   * grant_type=refresh_token&refresh_token=refresh_token_xyz
   */
  @Post('token')
  @HttpCode(200)
  @ApiOperation({
    summary: 'OAuth2 Token Endpoint',
    description: 'Exchange authorization code for tokens or refresh access token',
  })
  @ApiBody({
    description: 'Token request parameters',
    schema: {
      type: 'object',
      required: ['grant_type'],
      properties: {
        grant_type: {
          type: 'string',
          enum: ['authorization_code', 'refresh_token'],
          description: 'OAuth 2.0 grant type',
        },
        code: {
          type: 'string',
          description: 'Authorization code (required for authorization_code grant)',
        },
        code_verifier: {
          type: 'string',
          description: 'PKCE code verifier (required if code_challenge was used)',
        },
        refresh_token: {
          type: 'string',
          description: 'Refresh token (required for refresh_token grant)',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Token response',
    schema: {
      type: 'object',
      properties: {
        access_token: { type: 'string', description: 'JWT access token' },
        token_type: { type: 'string', example: 'Bearer' },
        expires_in: { type: 'number', example: 900, description: 'Access token lifetime in seconds' },
        refresh_token: { type: 'string', description: 'Refresh token for obtaining new access tokens' },
        id_token: { type: 'string', description: 'OpenID Connect ID token (if openid scope requested)' },
        scope: { type: 'string', example: 'openid profile email' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid grant, missing parameters, or PKCE verification failure',
    schema: {
      example: {
        statusCode: 400,
        message: 'invalid_grant',
        errorCode: 'OIDC005',
      },
    },
  })
  async token(@Body() body: TokenDto) {
    try {
      // Validate grant_type parameter
      if (!body.grant_type || typeof body.grant_type !== 'string') {
        throw new BadRequestException({
          statusCode: 400,
          message: 'grant_type is required',
          errorCode: 'OIDC005',
        });
      }

      // Handle authorization_code grant type
      if (body.grant_type === 'authorization_code') {
        // Validate required parameters for authorization code grant
        if (!body.code || typeof body.code !== 'string' || body.code.trim().length === 0) {
          throw new BadRequestException({
            statusCode: 400,
            message: 'code is required for authorization_code grant',
            errorCode: 'OIDC005',
          });
        }

        // Exchange authorization code for tokens
        // PKCE verification happens inside tokenUC.exchangeCode if code_verifier provided
        return await this.tokenUC.exchangeCode(
          body.code,
          body.code_verifier || '', // Empty string if no PKCE
        );
      }

      // Handle refresh_token grant type
      if (body.grant_type === 'refresh_token') {
        // Validate required parameters for refresh token grant
        if (!body.refresh_token || typeof body.refresh_token !== 'string' || body.refresh_token.trim().length === 0) {
          throw new BadRequestException({
            statusCode: 400,
            message: 'refresh_token is required for refresh_token grant',
            errorCode: 'OIDC005',
          });
        }

        // Exchange refresh token for new access token
        return await this.tokenUC.refreshToken(body.refresh_token);
      }

      // Unsupported grant type
      throw new BadRequestException({
        statusCode: 400,
        message: 'unsupported_grant_type',
        error: 'Bad Request',
        errorCode: 'OIDC005',
      });
    } catch (error) {
      console.error('[OidcController] Error in token endpoint:', error);

      // Pass through known exceptions
      if (error instanceof BadRequestException) {
        throw error;
      }

      // Handle unexpected errors
      throw new InternalServerErrorException({
        statusCode: 500,
        message: 'Token request failed',
        errorCode: 'OIDC006',
      });
    }
  }

  /**
   * UserInfo Endpoint (OpenID Connect)
   *
   * Returns claims about the authenticated end-user. This endpoint is protected
   * and requires a valid access token in the Authorization header.
   *
   * The returned claims depend on the scopes requested during authorization:
   * - openid: sub (subject identifier)
   * - profile: name, given_name, family_name, picture, etc.
   * - email: email, email_verified
   * - phone: phone_number, phone_number_verified
   * - address: address object
   *
   * Standards: OpenID Connect Core 1.0
   *
   * @param authHeader - Authorization header containing Bearer token
   * @returns User claims based on requested scopes
   * @throws UnauthorizedException - When token is missing, invalid, or expired
   *
   * @example
   * GET /userinfo
   * Authorization: Bearer eyJhbGc...
   *
   * Response:
   * {
   *   "sub": "user-uuid-123",
   *   "name": "John Doe",
   *   "given_name": "John",
   *   "family_name": "Doe",
   *   "email": "john.doe@example.com",
   *   "email_verified": true
   * }
   */
  @Get('userinfo')
  @Post('userinfo')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'OpenID Connect UserInfo Endpoint',
    description: 'Returns claims about the authenticated user based on access token',
  })
  @ApiResponse({
    status: 200,
    description: 'User information claims',
    schema: {
      type: 'object',
      properties: {
        sub: { type: 'string', description: 'Subject identifier (user ID)' },
        name: { type: 'string', example: 'John Doe' },
        given_name: { type: 'string', example: 'John' },
        family_name: { type: 'string', example: 'Doe' },
        email: { type: 'string', example: 'john.doe@example.com' },
        email_verified: { type: 'boolean', example: true },
        picture: { type: 'string', example: 'https://example.com/avatar.jpg' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - missing or invalid access token',
    schema: {
      example: {
        statusCode: 401,
        message: 'Bearer token required',
        errorCode: 'OIDC007',
      },
    },
  })
  async userinfo(@Headers('authorization') authHeader: string) {
    try {
      // Validate Authorization header presence
      if (!authHeader || typeof authHeader !== 'string') {
        throw new UnauthorizedException({
          statusCode: 401,
          message: 'Authorization header required',
          errorCode: 'OIDC007',
        });
      }

      // Validate Bearer token format
      if (!authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedException({
          statusCode: 401,
          message: 'Bearer token required',
          errorCode: 'OIDC007',
        });
      }

      // Extract token from Authorization header
      const token = authHeader.substring(7); // Remove 'Bearer ' prefix

      if (!token || token.trim().length === 0) {
        throw new UnauthorizedException({
          statusCode: 401,
          message: 'Access token is empty',
          errorCode: 'OIDC007',
        });
      }

      // Retrieve and return user information based on token
      return await this.userInfoUC.execute(token);
    } catch (error) {
      console.error('[OidcController] Error in userinfo endpoint:', error);

      // Pass through known exceptions
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      // Handle unexpected errors
      throw new InternalServerErrorException({
        statusCode: 500,
        message: 'UserInfo request failed',
        errorCode: 'OIDC008',
      });
    }
  }

  /**
   * Token Introspection Endpoint (OAuth2)
   *
   * Allows authorized clients to determine the active state and metadata of a token.
   * This endpoint requires client authentication and is typically used by resource
   * servers to validate access tokens.
   *
   * Returns information about:
   * - Whether the token is active
   * - Token expiration time
   * - Scopes associated with the token
   * - Client ID
   * - User ID (subject)
   *
   * Security: Protected by ClientAuthGuard - requires valid client credentials
   *
   * Standards: OAuth 2.0 Token Introspection (RFC 7662)
   *
   * @param body - Introspection request containing token and optional token_type_hint
   * @returns Introspection response with token metadata
   *
   * @example
   * POST /introspect
   * Authorization: Basic base64(client_id:client_secret)
   * Content-Type: application/x-www-form-urlencoded
   *
   * token=eyJhbGc...&token_type_hint=access_token
   *
   * Response:
   * {
   *   "active": true,
   *   "scope": "openid profile email",
   *   "client_id": "ecom-web",
   *   "sub": "user-uuid-123",
   *   "exp": 1234567890
   * }
   */
  @Post('introspect')
  @HttpCode(200)
  @UseGuards(ClientAuthGuard)
  @ApiSecurity('basic')
  @ApiOperation({
    summary: 'OAuth2 Token Introspection',
    description: 'Determine the active state and metadata of a token (requires client authentication)',
  })
  @ApiBody({
    description: 'Introspection request',
    schema: {
      type: 'object',
      required: ['token'],
      properties: {
        token: { type: 'string', description: 'The token to introspect' },
        token_type_hint: {
          type: 'string',
          enum: ['access_token', 'refresh_token'],
          description: 'Hint about the type of token',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Token introspection result',
    schema: {
      type: 'object',
      properties: {
        active: { type: 'boolean', description: 'Whether the token is currently active' },
        scope: { type: 'string', example: 'openid profile email' },
        client_id: { type: 'string', example: 'ecom-web' },
        sub: { type: 'string', description: 'Subject identifier (user ID)' },
        exp: { type: 'number', description: 'Expiration timestamp' },
        iat: { type: 'number', description: 'Issued at timestamp' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - client authentication failed',
  })
  async introspect(@Body() body: IntrospectDto) {
    try {
      // Validate token parameter
      if (!body.token || typeof body.token !== 'string' || body.token.trim().length === 0) {
        throw new BadRequestException({
          statusCode: 400,
          message: 'token parameter is required',
          errorCode: 'OIDC009',
        });
      }

      // Introspect the token
      return await this.introspectUC.execute(body.token, body.token_type_hint);
    } catch (error) {
      console.error('[OidcController] Error in introspect endpoint:', error);

      // Pass through known exceptions
      if (error instanceof BadRequestException) {
        throw error;
      }

      // Handle unexpected errors
      throw new InternalServerErrorException({
        statusCode: 500,
        message: 'Token introspection failed',
        errorCode: 'OIDC010',
      });
    }
  }

  /**
   * Token Revocation Endpoint (OAuth2)
   *
   * Allows clients to revoke access tokens or refresh tokens. Once revoked, the
   * token can no longer be used. This is important for security when a user logs
   * out or when credentials are compromised.
   *
   * Security: Protected by ClientAuthGuard - requires valid client credentials
   *
   * Standards: OAuth 2.0 Token Revocation (RFC 7009)
   *
   * @param body - Revocation request containing token and optional token_type_hint
   * @returns Success response (200 OK)
   *
   * @example
   * POST /revoke
   * Authorization: Basic base64(client_id:client_secret)
   * Content-Type: application/x-www-form-urlencoded
   *
   * token=refresh_token_xyz&token_type_hint=refresh_token
   *
   * Response:
   * {
   *   "success": true
   * }
   */
  @Post('revoke')
  @HttpCode(200)
  @UseGuards(ClientAuthGuard)
  @ApiSecurity('basic')
  @ApiOperation({
    summary: 'OAuth2 Token Revocation',
    description: 'Revoke an access token or refresh token (requires client authentication)',
  })
  @ApiBody({
    description: 'Revocation request',
    schema: {
      type: 'object',
      required: ['token'],
      properties: {
        token: { type: 'string', description: 'The token to revoke' },
        token_type_hint: {
          type: 'string',
          enum: ['access_token', 'refresh_token'],
          description: 'Hint about the type of token',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Token revoked successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - client authentication failed',
  })
  async revoke(@Body() body: RevokeDto) {
    try {
      // Validate token parameter
      if (!body.token || typeof body.token !== 'string' || body.token.trim().length === 0) {
        throw new BadRequestException({
          statusCode: 400,
          message: 'token parameter is required',
          errorCode: 'OIDC011',
        });
      }

      // Revoke the token
      await this.revokeUC.execute(body.token, body.token_type_hint);

      return { success: true };
    } catch (error) {
      console.error('[OidcController] Error in revoke endpoint:', error);

      // Pass through known exceptions
      if (error instanceof BadRequestException) {
        throw error;
      }

      // Handle unexpected errors - but still return success per RFC 7009
      // The revocation endpoint should return 200 even if token doesn't exist
      console.warn('[OidcController] Token revocation failed but returning success per RFC 7009');
      return { success: true };
    }
  }
}
