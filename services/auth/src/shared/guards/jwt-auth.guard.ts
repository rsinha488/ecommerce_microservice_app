import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly issuer: string;
  private readonly jwksUri: string;

  // ✅ Cached JWKS instance (so we don't recreate it)
  private jwksClient: ReturnType<any> | null = null;

  constructor() {
    this.issuer = process.env.JWT_ISS || 'http://localhost:4000';
    this.jwksUri = `${this.issuer}/.well-known/jwks.json`;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      // ✅ Lazy import (no top-level await)
      const { jwtVerify, createRemoteJWKSet } = await import('jose');

      // ✅ Create JWKS only once (cached)
      if (!this.jwksClient) {
        this.jwksClient = createRemoteJWKSet(new URL(this.jwksUri));
      }

      const { payload } = await jwtVerify(token, this.jwksClient, {
        issuer: this.issuer,
      });

      // ✅ Attach decoded user into request
      request['user'] = payload;

      return true;
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const auth = request.headers.authorization;
    if (!auth) return undefined;

    const [type, token] = auth.split(' ');
    return type === 'Bearer' ? token : undefined;
  }
}
