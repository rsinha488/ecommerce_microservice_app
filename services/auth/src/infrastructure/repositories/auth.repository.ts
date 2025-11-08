import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { UserModel, UserDocument } from '../database/user.schema';
import { Client, ClientDocument } from '../database/client.schema';
import { Token, TokenDocument } from '../database/token.schema';

@Injectable()
export class AuthRepository {
  constructor(
    @InjectModel(UserModel.name)
    private readonly userModel: Model<UserDocument>,

    @InjectModel(Client.name)
    private readonly clientModel: Model<ClientDocument>,

    @InjectModel(Token.name)
    private readonly tokenModel: Model<TokenDocument>,
  ) {}

  // ------------------ USERS ------------------

  async createUser(user: any) {
    const doc = await this.userModel.create(user);
    return doc.toObject();
  }

  async findUserByEmail(email: string) {
    const doc = await this.userModel.findOne({ email }).lean();
    return doc || null;
  }

  // ------------------ CLIENTS ------------------

  /**
   * ✅ REQUIRED by AdminController
   */
  async createClient(client: any) {
    const doc = await this.clientModel.create(client);
    return doc.toObject();
  }

  /**
   * ✅ USED BY ClientAuthGuard AND Authorization Code Flow
   * 
   * IMPORTANT:
   * Returns persistence object (with clientSecretHash),
   * not domain object (which removes sensitive fields).
   */
  async findClientById(clientId: string) {
    return await this.clientModel.findOne({ clientId }).lean();
  }

  // ------------------ TOKENS (Refresh Tokens) ------------------

  async saveRefreshToken(clientId: string, userId: string, hash: string, expiresAt: Date) {
    return await this.tokenModel.create({
      clientId,
      userId,
      refreshTokenHash: hash,
      expiresAt,
    });
  }

  async findRefreshToken(hash: string) {
    return await this.tokenModel.findOne({ refreshTokenHash: hash }).lean();
  }

  async revokeRefreshToken(refreshToken: string): Promise<boolean> {
  const result = await this.tokenModel.updateOne(
    { refreshToken },
    { $set: { revoked: true } }
  ).exec();

  return result.modifiedCount > 0;
}

}
