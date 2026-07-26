import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

export enum Role {
  ADMIN = 'ADMIN',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
  REVIEWER = 'REVIEWER',
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

  // Profile fields
  @Prop()
  profilePicture?: string;

  @Prop()
  gender?: string;

  @Prop()
  dateOfBirth?: Date;

  @Prop({ default: 'UTC' })
  timezone: string;

  @Prop()
  latitude?: number;

  @Prop()
  longitude?: number;

  // Student-specific fields
  @Prop({ unique: true, sparse: true })
  studentId?: number;

  @Prop()
  enrollmentDate?: Date;

  @Prop({ default: 'ACTIVE' })
  studentStatus?: string;

  @Prop({ default: 'ACTIVE' })
  trialStatus?: string;

  @Prop({ default: false })
  discontinued?: boolean;

  // Teacher/Reviewer-specific fields
  @Prop()
  salary?: number;

  @Prop()
  employeeId?: string;

  @Prop()
  qualification?: string;

  @Prop()
  specialization?: string;

  @Prop()
  joiningDate?: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.virtual('id').get(function (this: Document) {
  return this._id.toHexString();
});
