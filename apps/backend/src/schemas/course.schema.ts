import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type CourseDocument = Course & Document;

export enum CourseType {
  NAZIRA = 'NAZIRA',
  TAJWEED = 'TAJWEED',
  HIFZ_UL_QURAN = 'HIFZ_UL_QURAN',
  ISLAMIC_STUDIES = 'ISLAMIC_STUDIES',
}

@Schema({ timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } })
export class Course {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true, enum: CourseType })
  type: CourseType;

  @Prop({ required: true })
  curriculum: string;

  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'User', index: true })
  teacherId: MongooseSchema.Types.ObjectId | string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const CourseSchema = SchemaFactory.createForClass(Course);

CourseSchema.virtual('id').get(function (this: Document) {
  return this._id.toHexString();
});
CourseSchema.virtual('teacher', {
  ref: 'User',
  localField: 'teacherId',
  foreignField: '_id',
  justOne: true,
});
CourseSchema.virtual('enrollments', {
  ref: 'Enrollment',
  localField: '_id',
  foreignField: 'courseId',
});
CourseSchema.virtual('classSessions', {
  ref: 'ClassSession',
  localField: '_id',
  foreignField: 'courseId',
});
CourseSchema.virtual('supervisorAssignments', {
  ref: 'SupervisorAssignment',
  localField: '_id',
  foreignField: 'courseId',
});
CourseSchema.virtual('reviewerAssignments', {
  ref: 'SupervisorAssignment',
  localField: '_id',
  foreignField: 'courseId',
});
