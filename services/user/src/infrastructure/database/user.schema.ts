import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';


export type UserDocument = HydratedDocument<UserModel>;


@Schema({ timestamps: true })
export class UserModel {
    @Prop({ required: true })
    name!: string;


    @Prop({ required: true, unique: true, index: true })
    email!: string;


    @Prop({ required: true })
    passwordHash!: string;


    @Prop()
    roles!: string[];
}


export const UserSchema = SchemaFactory.createForClass(UserModel);
UserSchema.index({ email: 1 });