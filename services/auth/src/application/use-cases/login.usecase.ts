import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { AUTH_REPOSITORY } from '../../domain/tokens/auth-repository.token';
import type { AuthRepositoryInterface } from '../../domain/interfaces/auth-repository.interface';
import { RedisService } from '../../infrastructure/redis/redis.service';
import crypto from 'crypto';

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(AUTH_REPOSITORY)
    private readonly authRepo: AuthRepositoryInterface,
    private readonly redis: RedisService,
  ) {}

  async execute(email: string, password: string): Promise<{ sessionId: string; userId: string }> {
    const user = await this.authRepo.findUserByEmail(email);
    
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Create session
    const sessionId = crypto.randomBytes(32).toString('hex');
    const sessionKey = `auth:session:${sessionId}`;
    
    await this.redis.getClient().set(
      sessionKey,
      JSON.stringify({
        userId: user._id.toString(),
        email: user.email,
        roles: user.roles,
        profile: user.profile,
        createdAt: Date.now(),
      }),
      'EX',
      3600, // 1 hour
    );

    return {
      sessionId,
      userId: user._id.toString(),
    };
  }

  async getSession(sessionId: string) {
    const sessionKey = `auth:session:${sessionId}`;
    const raw = await this.redis.getClient().get(sessionKey);
    
    if (!raw) {
      return null;
    }

    return JSON.parse(raw);
  }

  async destroySession(sessionId: string) {
    const sessionKey = `auth:session:${sessionId}`;
    await this.redis.getClient().del(sessionKey);
  }
}

