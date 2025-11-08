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
} from '@nestjs/common';

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

  // ✅ OpenID Provider Discovery Document
  @Get('.well-known/openid-configuration')
  discovery(@Res() res: Response) {
    const issuer = process.env.JWT_ISS || 'http://localhost:4000';

    return res.json({
      issuer,
      authorization_endpoint: `${issuer}/authorize`,
      token_endpoint: `${issuer}/token`,
      userinfo_endpoint: `${issuer}/userinfo`,
      jwks_uri: `${issuer}/.well-known/jwks.json`,
      introspection_endpoint: `${issuer}/introspect`,
      revocation_endpoint: `${issuer}/revoke`,
      registration_endpoint: `${issuer}/auth/register`,
      scopes_supported: ['openid', 'profile', 'email', 'address', 'phone'],
      response_types_supported: ['code'],
      response_modes_supported: ['query', 'fragment'],
      grant_types_supported: ['authorization_code', 'refresh_token'],
      subject_types_supported: ['public'],
      id_token_signing_alg_values_supported: ['RS256'],
      token_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post'],
      claims_supported: [
        'sub',
        'iss',
        'aud',
        'exp',
        'iat',
        'name',
        'given_name',
        'family_name',
        'middle_name',
        'nickname',
        'preferred_username',
        'profile',
        'picture',
        'website',
        'email',
        'email_verified',
        'gender',
        'birthdate',
        'zoneinfo',
        'locale',
        'phone_number',
        'phone_number_verified',
        'address',
      ],
      code_challenge_methods_supported: ['S256', 'plain'],
    });
  }

  // ✅ JWKS Endpoint
  @Get('.well-known/jwks.json')
  getJwks(@Res() res: Response) {
    return res.json(this.jwksService.getPublicJwks());
  }

  // ✅ Authorization Endpoint (OAuth2 / OIDC Code Flow)
  @Get('authorize')
  async authorize(
    @Query() q: AuthorizeDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    // Check if user is logged in
    const sessionId = req.cookies?.session_id;
    
    if (!sessionId) {
      // Redirect to login page with return URL
      const loginUrl = `/auth/login-page?client_id=${q.client_id}&redirect_uri=${encodeURIComponent(q.redirect_uri)}&state=${q.state || ''}&scope=${q.scope || 'openid profile email'}${q.code_challenge ? `&code_challenge=${q.code_challenge}` : ''}${q.code_challenge_method ? `&code_challenge_method=${q.code_challenge_method}` : ''}`;
      return res.redirect(loginUrl);
    }

    const session = await this.loginUC.getSession(sessionId);
    
    if (!session) {
      // Session expired, redirect to login
      const loginUrl = `/auth/login-page?client_id=${q.client_id}&redirect_uri=${encodeURIComponent(q.redirect_uri)}&state=${q.state || ''}&scope=${q.scope || 'openid profile email'}${q.code_challenge ? `&code_challenge=${q.code_challenge}` : ''}${q.code_challenge_method ? `&code_challenge_method=${q.code_challenge_method}` : ''}`;
      return res.redirect(loginUrl);
    }

    const userId = session.userId;

    // In a full implementation, you would show a consent screen here
    // For now, we'll auto-approve

    const code = await this.authorizeUC.createAuthCode({
      clientId: q.client_id,
      userId,
      redirectUri: q.redirect_uri,
      scope: q.scope || 'openid profile email',
      codeChallenge: q.code_challenge,
      codeChallengeMethod: q.code_challenge_method,
    });

    const redirect = `${q.redirect_uri}?code=${code}${
      q.state ? `&state=${q.state}` : ''
    }`;

    return res.redirect(redirect);
  }

  // ✅ Token Endpoint
  @Post('token')
  @HttpCode(200)
  async token(@Body() body: TokenDto) {
    if (body.grant_type === 'authorization_code') {
      if (!body.code) throw new BadRequestException('code required');

      return this.tokenUC.exchangeCode(
        body.code,
        body.code_verifier || '',
      );
    }

    if (body.grant_type === 'refresh_token') {
      if (!body.refresh_token)
        throw new BadRequestException('refresh_token required');

      return this.tokenUC.refreshToken(body.refresh_token);
    }

    throw new BadRequestException('unsupported_grant_type');
  }

  // ✅ UserInfo Endpoint (OpenID Connect)
  @Get('userinfo')
  @Post('userinfo')
  async userinfo(@Headers('authorization') authHeader: string) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Bearer token required');
    }

    const token = authHeader.substring(7);
    return this.userInfoUC.execute(token);
  }

  // ✅ Token Introspection Endpoint (OAuth2)
  @Post('introspect')
  @HttpCode(200)
  @UseGuards(ClientAuthGuard)
  async introspect(@Body() body: IntrospectDto) {
    return this.introspectUC.execute(body.token, body.token_type_hint);
  }

  // ✅ Token Revocation Endpoint (OAuth2)
  @Post('revoke')
  @HttpCode(200)
  @UseGuards(ClientAuthGuard)
  async revoke(@Body() body: RevokeDto) {
    await this.revokeUC.execute(body.token, body.token_type_hint);
    return { success: true };
  }
}
