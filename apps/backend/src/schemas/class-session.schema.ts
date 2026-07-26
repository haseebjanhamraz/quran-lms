import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ClassSessionDocument = ClassSession & Document;

export enum ClassStatus {
  SCHEDULED = 'SCHEDULED',
  LIVE = 'LIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

@Schema({ timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } })
export class ClassSession {
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'Course', index: true })
  courseId: MongooseSchema.Types.ObjectId | string;

  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'User', index: true })
  teacherId: MongooseSchema.Types.ObjectId | string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', index: true })
  studentId?: MongooseSchema.Types.ObjectId | string;

  @Prop({ required: true, index: true })
  scheduledAt: Date;

  @Prop({ required: true })
  durationMinutes: number;

  @Prop({ required: true, enum: ClassStatus, default: ClassStatus.SCHEDULED, index: true })
  status: ClassStatus;

  @Prop({ unique: true, sparse: true })
  livekitRoomId?: string;

  @Prop()
  startedAt?: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

export const ClassSessionSchema = SchemaFactory.createForClass(ClassSession);

ClassSessionSchema.virtual('id').get(function (this: Document) {
  return this._id.toHexString();
});
ClassSessionSchema.virtual('course', {
  ref: 'Course',
  localField: 'courseId',
  foreignField: '_id',
  justOne: true,
});
ClassSessionSchema.virtual('teacher', {
  ref: 'User',
  localField: 'teacherId',
  foreignField: '_id',
  justOne: true,
});
ClassSessionSchema.virtual('student', {
  ref: 'User',
  localField: 'studentId',
  foreignField: '_id',
  justOne: true,
});
ClassSessionSchema.virtual('attendances', {
  ref: 'Attendance',
  localField: '_id',
  foreignField: 'sessionId',
});
ClassSessionSchema.virtual('recording', {
  ref: 'Recording',
  localField: '_id',
  foreignField: 'sessionId',
  justOne: true,
});
ClassSessionSchema.virtual('classReviews', {
  ref: 'ClassReview',
  localField: '_id',
  foreignField: 'sessionId',
});
ClassSessionSchema.virtual('transcriptSegments', {
  ref: 'TranscriptSegment',
  localField: '_id',
  foreignField: 'sessionId',
});
ClassSessionSchema.virtual('aiReport', {
  ref: 'AIReport',
  localField: '_id',
  foreignField: 'sessionId',
  justOne: true,
});
ClassSessionSchema.virtual('pipelineLogs', {
  ref: 'PipelineLog',
  localField: '_id',
  foreignField: 'sessionId',
});
