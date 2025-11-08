import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { JwksService } from '../../infrastructure/jwks/jwks.service';
import crypto from 'crypto';

// ✅ Import the interface as a TYPE ONLY
import type { AuthRepositoryInterface } from '../../domain/interfaces/auth-repository.interface';

// ✅ Import injection token (runtime value)
import { AUTH_REPOSITORY } from '../../domain/tokens/auth-repository.token';

@Injectable()
export class TokenUseCase {
  constructor(
    private readonly redis: RedisService,
    private readonly jwks: JwksService,

    // ✅ Proper DI using injection token
    @Inject(AUTH_REPOSITORY)
    private readonly authRepo: AuthRepositoryInterface,
  ) {}

  async exchangeCode(code: string, codeVerifier: string) {
    const key = `auth:code:${code}`;
    const raw = await this.redis.getClient().get(key);
    if (!raw) throw new BadRequestException('invalid_grant');

    const data = JSON.parse(raw);

    // PKCE verification
    if (data.codeChallenge) {
      const digest = crypto.createHash('sha256').update(codeVerifier).digest();
      const hash = digest
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      if (hash !== data.codeChallenge) {
        throw new BadRequestException('invalid_grant');
      }
    }

    await this.redis.getClient().del(key);

    // Create tokens
    const accessToken = await this.jwks.signJwt(
      { sub: data.userId, aud: data.clientId },
      '15m',
    );

    const refreshToken = crypto.randomBytes(48).toString('hex');
    const refreshHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await this.authRepo.saveRefreshToken(
      data.clientId,
      data.userId,
      refreshHash,
      expiresAt,
    );

    return {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 15 * 60,
      refresh_token: refreshToken,
      scope: data.scope,
    };
  }

  async refreshToken(refreshToken: string) {
    const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const db = await this.authRepo.findRefreshToken(hash);

    if (!db) throw new BadRequestException('invalid_grant');

    // rotate refresh token
    const newRefresh = crypto.randomBytes(48).toString('hex');
    const newHash = crypto.createHash('sha256').update(newRefresh).digest('hex');

    await this.authRepo.revokeRefreshToken(hash);

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await this.authRepo.saveRefreshToken(
      db.clientId,
      db.userId,
      newHash,
      expiresAt,
    );

    const accessToken = await this.jwks.signJwt(
      { sub: db.userId, aud: db.clientId },
      '15m',
    );

    return {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 15 * 60,
      refresh_token: newRefresh,
    };
  }
}
