import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { JwksService } from '../../infrastructure/jwks/jwks.service';
import { AUTH_REPOSITORY } from '../../domain/tokens/auth-repository.token';
import type { AuthRepositoryInterface } from '../../domain/interfaces/auth-repository.interface';
import crypto from 'crypto';

@Injectable()
export class IntrospectUseCase {
  private readonly issuer = process.env.JWT_ISS || 'http://localhost:4000';

  constructor(
    private readonly jwksService: JwksService,
    @Inject(AUTH_REPOSITORY)
    private readonly authRepo: AuthRepositoryInterface,
  ) {}

  /**
   * Introspect a token (JWT or Refresh Token)
   */
  async execute(token: string, tokenTypeHint?: string) {
    if (!token) {
      throw new UnauthorizedException('Token missing');
    }

    // ✅ Refresh token shortcut when hint is provided
    if (tokenTypeHint === 'refresh_token') {
      return this.introspectRefreshToken(token);
    }

    // ✅ Try Access Token (JWT)
    const accessTokenResult = await this.verifyJwtAccessToken(token);
    if (accessTokenResult.active) return accessTokenResult;

    // ✅ Fallback — maybe it's refresh token
    if (!tokenTypeHint) {
      return this.introspectRefreshToken(token);
    }

    return { active: false };
  }

  /**
   * ✅ Validate JWT Access Token
   */
  private async verifyJwtAccessToken(token: string) {
    try {
      // ✅ Lazy import ("NO" top-level await)
      const { jwtVerify } = await import('jose');

      const jwks = this.jwksService.getPublicJwks();
      if (!jwks?.keys?.length) {
        return { active: false };
      }

      const publicKey = await this.importPublicKey(jwks.keys[0]);

      const { payload } = await jwtVerify(token, publicKey, {
        issuer: this.issuer,
      });

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
    } catch {
      return { active: false };
    }
  }

  /**
   * ✅ Validate Refresh Token
   */
  private async introspectRefreshToken(token: string) {
    try {
      const hash = crypto.createHash('sha256').update(token).digest('hex');
      const stored = await this.authRepo.findRefreshToken(hash);

      if (!stored || stored.revoked) {
        return { active: false };
      }

      // expiration check
      const now = new Date();
      if (new Date(stored.expiresAt) < now) {
        return { active: false };
      }

      return {
        active: true,
        sub: stored.userId,
        client_id: stored.clientId,
        token_type: 'refresh_token',
        exp: Math.floor(new Date(stored.expiresAt).getTime() / 1000),
      };
    } catch {
      return { active: false };
    }
  }

  /**
   * ✅ Convert JWK → CryptoKey
   */
  private async importPublicKey(jwk: any) {
    const { importJWK } = await import('jose');
    return importJWK(jwk, 'RS256');
  }
}
