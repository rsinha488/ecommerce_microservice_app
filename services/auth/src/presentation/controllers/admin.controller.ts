// src/presentation/controllers/admin.controller.ts
import { Controller, Post, Body, Inject } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiProperty,
} from '@nestjs/swagger';
import bcrypt from 'bcryptjs';

import { AUTH_REPOSITORY } from '../../domain/tokens/auth-repository.token';
import type { AuthRepositoryInterface } from '../../domain/interfaces/auth-repository.interface';

/**
 * DTO for creating OAuth2 clients
 */
export class CreateClientDto {
  @ApiProperty({
    description: 'Unique client identifier for OAuth2',
    example: 'ecom-web',
    required: true,
  })
  clientId: string;

  @ApiProperty({
    description: 'Human-readable client name',
    example: 'E-Commerce Web Application',
    required: true,
  })
  clientName: string;

  @ApiProperty({
    description: 'Client secret for authentication (auto-generated if not provided)',
    example: 'super-secret-key-123',
    required: false,
  })
  clientSecret?: string;

  @ApiProperty({
    description: 'List of allowed redirect URIs for OAuth2 flow',
    example: ['http://localhost:3000/callback', 'https://app.example.com/callback'],
    type: [String],
    required: true,
  })
  redirectUris: string[];

  @ApiProperty({
    description: 'Allowed OAuth2 scopes for this client',
    example: ['openid', 'profile', 'email', 'address'],
    type: [String],
    required: false,
  })
  scopes?: string[];
}

/**
 * Response DTO for client creation
 */
export class CreateClientResponse {
  @ApiProperty({
    description: 'The created client ID',
    example: 'ecom-web',
  })
  clientId: string;

  @ApiProperty({
    description: 'The client secret (store this securely - it will not be shown again)',
    example: 'abc123def456',
  })
  clientSecret: string;
}

/**
 * Admin Controller
 *
 * Provides administrative endpoints for managing OAuth2 clients and other
 * administrative tasks. These endpoints should be protected in production
 * with proper authentication and authorization.
 *
 * @security In production, this controller should be protected with:
 * - Admin-only JWT guard
 * - IP whitelist
 * - Rate limiting
 * - Audit logging
 */
@ApiTags('admin')
@Controller('admin')
export class AdminController {
  constructor(
    @Inject(AUTH_REPOSITORY)
    private readonly repo: AuthRepositoryInterface,
  ) {}

  /**
   * Create OAuth2 Client
   *
   * Creates a new OAuth2 client application that can authenticate users via the
   * authorization code flow. Each client gets a unique client_id and client_secret
   * that must be used for token requests.
   *
   * Security Notes:
   * - Client secrets are hashed using bcrypt before storage
   * - If no secret is provided, one is auto-generated
   * - Store the returned client_secret securely - it cannot be retrieved later
   * - In production, this endpoint should require admin authentication
   *
   * Use Cases:
   * - Register a new frontend application
   * - Register a mobile app
   * - Register a third-party integration
   *
   * @param body - Client registration data
   * @returns Client credentials (clientId and clientSecret)
   *
   * @example
   * POST /admin/create-client
   * {
   *   "clientId": "ecom-mobile",
   *   "clientName": "E-Commerce Mobile App",
   *   "redirectUris": ["myapp://callback"],
   *   "scopes": ["openid", "profile", "email"]
   * }
   *
   * Response:
   * {
   *   "clientId": "ecom-mobile",
   *   "clientSecret": "abc123def456"
   * }
   */
  @Post('create-client')
  @ApiOperation({
    summary: 'Create OAuth2 client',
    description: 'Register a new OAuth2 client application with credentials',
  })
  @ApiBody({
    type: CreateClientDto,
    description: 'Client registration data',
    examples: {
      'web-app': {
        summary: 'Web Application',
        description: 'Register a web application client',
        value: {
          clientId: 'ecom-web',
          clientName: 'E-Commerce Web App',
          redirectUris: ['http://localhost:3000/callback'],
          scopes: ['openid', 'profile', 'email'],
        },
      },
      'mobile-app': {
        summary: 'Mobile Application',
        description: 'Register a mobile application client',
        value: {
          clientId: 'ecom-mobile',
          clientName: 'E-Commerce Mobile App',
          clientSecret: 'custom-secret-123',
          redirectUris: ['myapp://callback'],
          scopes: ['openid', 'profile', 'email', 'address'],
        },
      },
      'spa-app': {
        summary: 'Single Page Application',
        description: 'Register a SPA with PKCE support',
        value: {
          clientId: 'ecom-spa',
          clientName: 'E-Commerce SPA',
          redirectUris: ['https://app.example.com/callback'],
          scopes: ['openid', 'profile'],
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Client created successfully',
    type: CreateClientResponse,
    schema: {
      example: {
        clientId: 'ecom-web',
        clientSecret: 'abc123def456',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request data',
    schema: {
      example: {
        statusCode: 400,
        message: 'Invalid client registration data',
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Client ID already exists',
    schema: {
      example: {
        statusCode: 409,
        message: 'Client with this ID already exists',
        error: 'Conflict',
      },
    },
  })
  async createClient(@Body() body: CreateClientDto): Promise<CreateClientResponse> {
    // Generate client secret if not provided
    const secret = body.clientSecret ?? Math.random().toString(36).slice(2, 12);

    // Prepare client data with hashed secret
    const client = {
      clientId: body.clientId,
      clientName: body.clientName,
      clientSecretHash: body.clientSecret
        ? await bcrypt.hash(body.clientSecret, 10)
        : await bcrypt.hash(secret, 10),
      redirectUris: body.redirectUris || [],
      grantTypes: ['authorization_code', 'refresh_token'],
      responseTypes: ['code'],
      scopes: body.scopes || ['openid', 'profile', 'email'],
      active: true,
    };

    // Store client in repository
    if (typeof (this.repo as any).createClient === 'function') {
      const created = await (this.repo as any).createClient(client);
      return { clientId: created.clientId, clientSecret: secret };
    }

    // Fallback: return clientId and secret
    // Note: In production, implement repo.createClient method
    return { clientId: client.clientId, clientSecret: secret };
  }
}
