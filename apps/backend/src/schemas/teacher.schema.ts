import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type TeacherDocument = Teacher & Document;

@Schema({ _id: false })
export class Guarantor {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  phone: string;

  @Prop()
  email?: string;

  @Prop({ required: true })
  relationship: string;

  @Prop({ required: true })
  cnicOrId: string;

  @Prop()
  address?: string;
}

export const GuarantorSchema = SchemaFactory.createForClass(Guarantor);

@Schema({ _id: false })
export class TeacherProfile {
  @Prop()
  qualification?: string;

  @Prop()
  specialization?: string;

  @Prop()
  joiningDate?: Date;

  @Prop()
  salary?: number;

  @Prop({ default: 'MONTHLY' })
  payType?: string; // 'MONTHLY' | 'HOURLY'

  @Prop({ type: Number })
  hourlyRate?: number;

  @Prop()
  country?: string;

  @Prop({ default: 'PKR' })
  currency?: string;

  @Prop()
  employeeId?: string;

  @Prop()
  phone?: string;

  @Prop()
  phoneCode?: string;

  @Prop()
  cnicOrId?: string;

  @Prop()
  gender?: string;

  @Prop({ type: Date })
  dateOfBirth?: Date;

  @Prop({ default: true, type: Boolean })
  canEditProfile?: boolean;

  @Prop({ type: [GuarantorSchema], default: [] })
  guarantors?: Guarantor[];
}

export const TeacherProfileSchema = SchemaFactory.createForClass(TeacherProfile);

@Schema({ timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } })
export class Teacher {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, unique: true })
  userId: MongooseSchema.Types.ObjectId | string;

  @Prop({ type: TeacherProfileSchema, default: {} })
  profile: TeacherProfile;

  createdAt?: Date;
  updatedAt?: Date;
}

export const TeacherSchema = SchemaFactory.createForClass(Teacher);

TeacherSchema.virtual('id').get(function (this: Document) {
  return this._id.toHexString();
});

TeacherSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true,
});
