import { User } from '../entities/user.entity';

export const AUTH_REPOSITORY = Symbol('AUTH_REPOSITORY');

export interface AuthRepositoryInterface {
  createUser(user: any): Promise<any>;
  findUserByEmail(email: string): Promise<any>;

  createClient(client: any): Promise<any>;
  findClientById(clientId: string): Promise<any>;

  saveRefreshToken(clientId: string, userId: string, hash: string, expiresAt: Date): Promise<any>;
  findRefreshToken(hash: string): Promise<any>;
  revokeRefreshToken(hash: string): Promise<any>;
}
