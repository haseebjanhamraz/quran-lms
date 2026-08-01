import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type StudentDocument = Student & Document;

@Schema({ _id: false })
export class StudentProfile {
  @Prop()
  gender?: string;

  @Prop()
  dateOfBirth?: Date;

  @Prop()
  enrollmentDate?: Date;

  @Prop({ default: 'ACTIVE' })
  studentStatus?: string;

  @Prop({ default: 'ACTIVE' })
  trialStatus?: string;

  @Prop({ default: false })
  discontinued?: boolean;

  @Prop()
  guardianName?: string;

  @Prop()
  guardianPhone?: string;

  @Prop()
  guardianEmail?: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'FeeStructure' })
  feeStructureId?: MongooseSchema.Types.ObjectId | string;

  @Prop({ type: Number })
  monthlyFeeOverride?: number;

  @Prop({ default: 0, type: Number })
  feeWaiverPercent?: number;
}

export const StudentProfileSchema = SchemaFactory.createForClass(StudentProfile);

@Schema({ timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } })
export class Student {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, unique: true })
  userId: MongooseSchema.Types.ObjectId | string;

  @Prop({ required: true, unique: true })
  studentId: number;

  @Prop({ type: StudentProfileSchema, default: {} })
  profile: StudentProfile;

  createdAt?: Date;
  updatedAt?: Date;
}

export const StudentSchema = SchemaFactory.createForClass(Student);

StudentSchema.virtual('id').get(function (this: Document) {
  return this._id.toHexString();
});

StudentSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true,
});
