import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

export enum Role {
  ADMIN = 'ADMIN',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
  SUPERVISOR = 'SUPERVISOR',
  HR = 'HR',
}

@Schema({ timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } })
export class User {
  @Prop({ required: true })
  name: string;

  @Prop()
  preferredName?: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ required: true, enum: Role })
  role: Role;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  profilePicture?: string;

  @Prop({ default: 'UTC' })
  timezone: string;

  @Prop()
  latitude?: number;

  @Prop()
  longitude?: number;

  createdAt?: Date;
  updatedAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.virtual('id').get(function (this: Document) {
  return this._id.toHexString();
});

UserSchema.virtual('teacherProfile', {
  ref: 'Teacher',
  localField: '_id',
  foreignField: 'userId',
  justOne: true,
});

UserSchema.virtual('studentProfile', {
  ref: 'Student',
  localField: '_id',
  foreignField: 'userId',
  justOne: true,
});
