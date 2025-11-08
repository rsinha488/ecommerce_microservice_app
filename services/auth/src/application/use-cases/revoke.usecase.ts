import { Injectable, Inject } from '@nestjs/common';
import crypto from 'crypto';
import { AUTH_REPOSITORY } from '../../domain/tokens/auth-repository.token';
import type { AuthRepositoryInterface } from '../../domain/interfaces/auth-repository.interface';

@Injectable()
export class RevokeUseCase {
  constructor(
    @Inject(AUTH_REPOSITORY)
    private readonly authRepo: AuthRepositoryInterface,
  ) {}

  async execute(token: string, tokenTypeHint?: string) {
    // For access tokens (JWT), we can't revoke them directly
    // They will expire naturally. In production, you might want to maintain a blacklist.
    
    // For refresh tokens, we can revoke them in the database
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    
    try {
      const result = await this.authRepo.revokeRefreshToken(hash);
      return { revoked: result };
    } catch (error) {
      // Token not found or already revoked - this is OK per OAuth2 spec
      return { revoked: false };
    }
  }
}

