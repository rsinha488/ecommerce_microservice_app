import { Injectable } from '@nestjs/common';
import { RedisService } from '../../infrastructure/redis/redis.service';
import crypto from 'crypto';

@Injectable()
export class AuthorizeUseCase {
  constructor(private readonly redisService: RedisService) {}

  async createAuthCode(payload: { clientId: string; userId: string; redirectUri: string; scope?: string; codeChallenge?: string; codeChallengeMethod?: string }) {
    const code = crypto.randomBytes(32).toString('hex');
    const key = `auth:code:${code}`;
    await this.redisService.getClient().set(key, JSON.stringify(payload), 'EX', 600); // 10 min
    return code;
  }
}
