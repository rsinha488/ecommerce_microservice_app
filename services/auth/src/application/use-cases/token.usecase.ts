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

    // Get user info for claims
    const user = await this.authRepo.findUserById(data.userId);

    // Parse scopes
    const scopes = data.scope ? data.scope.split(' ') : [];

    // Create access token
    const accessToken = await this.jwks.signJwt(
      {
        sub: data.userId,
        aud: data.clientId,
        scope: data.scope || 'openid profile email',
      },
      '15m',
    );

    // Create ID token if openid scope is present
    let idToken: string | undefined;
    if (scopes.includes('openid')) {
      const idTokenPayload: Record<string, any> = {
        sub: data.userId,
        aud: data.clientId,
      };

      // Add profile claims if profile scope is present
      if (scopes.includes('profile') && user?.profile) {
        if (user.profile.name) idTokenPayload.name = user.profile.name;
        if (user.profile.given_name) idTokenPayload.given_name = user.profile.given_name;
        if (user.profile.family_name) idTokenPayload.family_name = user.profile.family_name;
        if (user.profile.middle_name) idTokenPayload.middle_name = user.profile.middle_name;
        if (user.profile.nickname) idTokenPayload.nickname = user.profile.nickname;
        if (user.profile.preferred_username) idTokenPayload.preferred_username = user.profile.preferred_username;
        if (user.profile.picture) idTokenPayload.picture = user.profile.picture;
        if (user.profile.website) idTokenPayload.website = user.profile.website;
        if (user.profile.gender) idTokenPayload.gender = user.profile.gender;
        if (user.profile.birthdate) idTokenPayload.birthdate = user.profile.birthdate;
        if (user.profile.zoneinfo) idTokenPayload.zoneinfo = user.profile.zoneinfo;
        if (user.profile.locale) idTokenPayload.locale = user.profile.locale;
      }

      // Add email claims if email scope is present
      if (scopes.includes('email') && user?.email) {
        idTokenPayload.email = user.email;
        idTokenPayload.email_verified = user.emailVerified || false;
      }

      idToken = await this.jwks.signJwt(idTokenPayload, '1h');
    }

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

    const response: Record<string, any> = {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 15 * 60,
      refresh_token: refreshToken,
      scope: data.scope,
    };

    if (idToken) {
      response.id_token = idToken;
    }

    return response;
  }

  async refreshToken(refreshToken: string) {
    const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const db = await this.authRepo.findRefreshToken(hash);

    if (!db || db.revoked) throw new BadRequestException('invalid_grant');

    // Check if token is expired
    if (new Date(db.expiresAt) < new Date()) {
      throw new BadRequestException('invalid_grant');
    }

    // Get user info
    const user = await this.authRepo.findUserById(db.userId);

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
      {
        sub: db.userId,
        aud: db.clientId,
        scope: 'openid profile email',
      },
      '15m',
    );

    // Create new ID token
    const idTokenPayload: Record<string, any> = {
      sub: db.userId,
      aud: db.clientId,
    };

    if (user?.profile) {
      if (user.profile.name) idTokenPayload.name = user.profile.name;
      if (user.profile.given_name) idTokenPayload.given_name = user.profile.given_name;
      if (user.profile.family_name) idTokenPayload.family_name = user.profile.family_name;
    }

    if (user?.email) {
      idTokenPayload.email = user.email;
      idTokenPayload.email_verified = user.emailVerified || false;
    }

    const idToken = await this.jwks.signJwt(idTokenPayload, '1h');

    return {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 15 * 60,
      refresh_token: newRefresh,
      id_token: idToken,
    };
  }
}
