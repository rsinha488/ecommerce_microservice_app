import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { jwtVerify, createRemoteJWKSet } from 'jose';

/**
 * JWT Guard for protecting endpoints in other microservices
 * 
 * This guard verifies JWT tokens issued by the auth service
 * using the public JWKS endpoint
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  private jwksUri: string;
  private issuer: string;

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
      const JWKS = createRemoteJWKSet(new URL(this.jwksUri));
      
      const { payload } = await jwtVerify(token, JWKS, {
        issuer: this.issuer,
      });

      // Attach user info to request
      request['user'] = payload;

      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const authHeader = request.headers.authorization;
    
    if (!authHeader) {
      return undefined;
    }

    const [type, token] = authHeader.split(' ');
    
    return type === 'Bearer' ? token : undefined;
  }
}

