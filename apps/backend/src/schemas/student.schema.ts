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
  guardianType?: string; // 'Father' | 'Mother' | 'Brother' | 'Sister' | 'Other'

  @Prop()
  guardianTypeOther?: string;

  @Prop()
  guardianPhone?: string;

  @Prop()
  guardianEmail?: string;

  @Prop()
  phone?: string;

  @Prop()
  phoneCode?: string;

  @Prop()
  country?: string;

  @Prop({ type: Number, default: 60 })
  classDuration?: number; // 30, 60, 120 minutes

  @Prop({ type: Number, default: 5 })
  classesPerWeek?: number; // 1 - 7 days

  @Prop({ type: [{ day: String, time: String }], default: [] })
  classDays?: Array<{ day: string; time: string }>;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  assignedTeacher?: MongooseSchema.Types.ObjectId | string;

  @Prop({ default: 'Beginner' })
  tier?: string; // 'Beginner' | 'Intermediate' | 'Advanced'

  @Prop()
  noteToTeacher?: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'FeeStructure' })
  feeStructureId?: MongooseSchema.Types.ObjectId | string;

  @Prop({ type: Number })
  monthlyFee?: number;

  @Prop({ type: Number })
  monthlyFeeOverride?: number;

  @Prop({ default: 'USD' })
  currency?: string;

  @Prop({ default: 0, type: Number })
  feeWaiverPercent?: number;

  @Prop()
  customFeeNotes?: string;
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

StudentSchema.virtual('teacher', {
  ref: 'User',
  localField: 'profile.assignedTeacher',
  foreignField: '_id',
  justOne: true,
});
