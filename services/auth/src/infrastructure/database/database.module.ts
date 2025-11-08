import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { UserModel, UserSchema } from './user.schema';
import { Client, ClientSchema } from './client.schema';
import { Token, TokenSchema } from './token.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserModel.name, schema: UserSchema },
      { name: Client.name, schema: ClientSchema },
      { name: Token.name, schema: TokenSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class MongooseSchemasModule {}
