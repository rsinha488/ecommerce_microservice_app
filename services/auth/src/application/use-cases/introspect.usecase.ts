import { Injectable, Inject } from '@nestjs/common';
import { jwtVerify } from 'jose';
import { JwksService } from '../../infrastructure/jwks/jwks.service';
import { AUTH_REPOSITORY } from '../../domain/tokens/auth-repository.token';
import type { AuthRepositoryInterface } from '../../domain/interfaces/auth-repository.interface';
import crypto from 'crypto';

@Injectable()
export class IntrospectUseCase {
  constructor(
    private readonly jwks: JwksService,
    @Inject(AUTH_REPOSITORY)
    private readonly authRepo: AuthRepositoryInterface,
  ) {}

  async execute(token: string, tokenTypeHint?: string) {
    // If hint says it's a refresh token, check in database
    if (tokenTypeHint === 'refresh_token') {
      return this.introspectRefreshToken(token);
    }

    // Try to verify as JWT (access token)
    try {
      const publicJwks = this.jwks.getPublicJwks();
      const publicKey = publicJwks.keys[0];
      
      const { payload } = await jwtVerify(
        token,
        await this.importPublicKey(publicKey),
        {
          issuer: process.env.JWT_ISS || 'http://localhost:4000',
        },
      );

      return {
        active: true,
        sub: payload.sub,
        aud: payload.aud,
        iss: payload.iss,
        exp: payload.exp,
        iat: payload.iat,
        token_type: 'Bearer',
        scope: payload.scope || 'openid profile email',
      };
    } catch (error) {
      // If JWT verification fails, check if it's a refresh token
      if (!tokenTypeHint) {
        const refreshResult = await this.introspectRefreshToken(token);
        if (refreshResult.active) {
          return refreshResult;
        }
      }

      return { active: false };
    }
  }

  private async introspectRefreshToken(token: string) {
    try {
      const hash = crypto.createHash('sha256').update(token).digest('hex');
      const refreshToken = await this.authRepo.findRefreshToken(hash);

      if (!refreshToken || refreshToken.revoked) {
        return { active: false };
      }

      // Check if token is expired
      if (new Date(refreshToken.expiresAt) < new Date()) {
        return { active: false };
      }

      return {
        active: true,
        sub: refreshToken.userId,
        client_id: refreshToken.clientId,
        token_type: 'refresh_token',
        exp: Math.floor(new Date(refreshToken.expiresAt).getTime() / 1000),
      };
    } catch (error) {
      return { active: false };
    }
  }

  private async importPublicKey(jwk: any) {
    const { importJWK } = await import('jose');
    return importJWK(jwk, 'RS256');
  }
}

