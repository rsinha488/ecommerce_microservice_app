// src/presentation/controllers/admin.controller.ts
import { Controller, Post, Body, Inject } from '@nestjs/common';
import bcrypt from 'bcryptjs';

import { AUTH_REPOSITORY } from '../../domain/tokens/auth-repository.token';
import type { AuthRepositoryInterface } from '../../domain/interfaces/auth-repository.interface';

@Controller('admin')
export class AdminController {
  constructor(
    @Inject(AUTH_REPOSITORY)
    private readonly repo: AuthRepositoryInterface,
  ) { }

  @Post('create-client')
  async createClient(@Body() body: {
    clientId: string;
    clientName: string, clientSecret?: string; redirectUris: string[]; scopes?: string[]
  }) {
    const secret = body.clientSecret ?? Math.random().toString(36).slice(2, 12);
    const client = {
      clientId: body.clientId,
      clientName: body.clientName,
      clientSecretHash: body.clientSecret ? await bcrypt.hash(body.clientSecret, 10) : await bcrypt.hash(secret, 10),
      redirectUris: body.redirectUris || [],
      grantTypes: ['authorization_code', 'refresh_token'],
      responseTypes: ['code'],
      scopes: body.scopes || ['openid', 'profile', 'email'],
      active: true,
    };

    // call repo method; implement createClient in AuthRepository if not yet present
    if (typeof (this.repo as any).createClient === 'function') {
      const created = await (this.repo as any).createClient(client);
      return { clientId: created.clientId, clientSecret: secret };
    }

    // fallback: return clientId and secret but warn you should implement repo.createClient
    return { clientId: client.clientId, clientSecret: secret };
  }
}
