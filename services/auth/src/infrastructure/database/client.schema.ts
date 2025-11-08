import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Client extends Document {
  @Prop({ required: true, unique: true })
  clientId: string;

  
  @Prop({ required: true })
  clientName: string;          

  @Prop({ required: true })
  clientSecretHash: string; // ✅ hashed secret

  @Prop({ type: [String], default: [] })
  redirectUris: string[];

  @Prop({ type: [String], default: [] })
  grantTypes: string[];

  @Prop({ type: [String], default: [] })
  scopes: string[];
}

export const ClientSchema = SchemaFactory.createForClass(Client);

export type ClientDocument = Client & Document;
