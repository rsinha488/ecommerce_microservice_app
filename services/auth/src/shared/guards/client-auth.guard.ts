import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { AuthRepository } from '../../infrastructure/repositories/auth.repository';

@Injectable()
export class ClientAuthGuard implements CanActivate {
  constructor(private readonly repo: AuthRepository) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();

    const auth = req.headers['authorization'];
    if (!auth) throw new UnauthorizedException();

    const [type, value] = auth.split(' ');
    if (type !== 'Basic') throw new UnauthorizedException();

    const decoded = Buffer.from(value, 'base64').toString();
    const [clientId, clientSecret] = decoded.split(':');

    // ✅ Use repository method → guaranteed typed result
    const client = await this.repo.findClientById(clientId);

    if (!client || !client.clientSecretHash) {
      throw new UnauthorizedException();
    }

    const ok = await bcrypt.compare(clientSecret, client.clientSecretHash);
    if (!ok) throw new UnauthorizedException();

    return true;
  }
}
