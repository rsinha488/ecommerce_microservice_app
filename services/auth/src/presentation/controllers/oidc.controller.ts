import {
  Controller,
  Get,
  Query,
  Res,
  Post,
  Body,
  BadRequestException,
} from '@nestjs/common';

import type { Response } from 'express';
import type { AuthorizeDto } from '../../application/dto/authorize.dto';
import type { TokenDto } from '../../application/dto/token.dto';

import { AuthorizeUseCase } from '../../application/use-cases/authorize.usecase';
import { TokenUseCase } from '../../application/use-cases/token.usecase';
import { JwksService } from '../../infrastructure/jwks/jwks.service';

@Controller()
export class OidcController {
  constructor(
    private readonly authorizeUC: AuthorizeUseCase,
    private readonly tokenUC: TokenUseCase,
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
      jwks_uri: `${issuer}/.well-known/jwks.json`,
      response_types_supported: ['code'],
      subject_types_supported: ['public'],
      id_token_signing_alg_values_supported: ['RS256'],
    });
  }

  // ✅ JWKS Endpoint
  @Get('.well-known/jwks.json')
  getJwks(@Res() res: Response) {
    return res.json(this.jwksService.getPublicJwks());
  }

  // ✅ Authorization Endpoint (OAuth2 / OIDC Code Flow)
  @Get('authorize')
  async authorize(@Query() q: AuthorizeDto, @Res() res: Response) {
    // In full implementation → session → login → consent
    const userId = 'demo-user';

    const code = await this.authorizeUC.createAuthCode({
      clientId: q.client_id,
      userId,
      redirectUri: q.redirect_uri,
      scope: q.scope,
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
}
