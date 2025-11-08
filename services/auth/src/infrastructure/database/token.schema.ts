import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Token extends Document {
  @Prop({ required: true })
  accessToken: string;

  @Prop({ required: true })
  refreshToken: string;

  @Prop({ required: true })
  clientId: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ type: [String], default: [] })
  scopes: string[];

  @Prop({ required: true })
  expiresAt: Date;


  @Prop({ default: false })
  revoked: boolean;

}

export const TokenSchema = SchemaFactory.createForClass(Token);
export type TokenDocument = Token & Document;
