import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ClassReviewDocument = ClassReview & Document;

export enum ReviewMode {
  LIVE_MONITOR = 'LIVE_MONITOR',
  RECORDING_REVIEW = 'RECORDING_REVIEW',
}

export enum ReviewStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
}

export enum FlagSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

@Schema({ timestamps: { createdAt: true, updatedAt: false }, toJSON: { virtuals: true }, toObject: { virtuals: true } })
export class ReviewAnnotation {
  @Prop({ required: true })
  timestamp: number;

  @Prop({ required: true })
  note: string;

  @Prop({ required: true })
  category: string;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const ReviewAnnotationSchema = SchemaFactory.createForClass(ReviewAnnotation);

ReviewAnnotationSchema.virtual('id').get(function (this: Document) {
  return this._id.toHexString();
});

@Schema({ timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } })
export class ClassReview {
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'ClassSession', index: true })
  sessionId: MongooseSchema.Types.ObjectId | string;

  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'User', index: true })
  supervisorId: MongooseSchema.Types.ObjectId | string;

  @Prop({ required: true, enum: ReviewMode })
  reviewMode: ReviewMode;

  @Prop({ default: Date.now })
  reviewedAt: Date;

  @Prop({ required: true })
  curriculumAdherenceScore: number;

  @Prop({ required: true })
  teachingQualityScore: number;

  @Prop({ required: true })
  engagementScore: number;

  @Prop({ required: true })
  overallScore: number;

  @Prop({ required: true, default: '' })
  strengths: string;

  @Prop({ required: true, default: '' })
  improvements: string;

  @Prop({ required: true, default: '' })
  privateNotes: string;

  @Prop({ default: false, index: true })
  isFlagged: boolean;

  @Prop({ enum: FlagSeverity })
  flagSeverity?: FlagSeverity;

  @Prop()
  flagReason?: string;

  @Prop({ required: true, enum: ReviewStatus, default: ReviewStatus.DRAFT, index: true })
  status: ReviewStatus;

  @Prop({ type: [ReviewAnnotationSchema], default: [] })
  annotations: ReviewAnnotation[];

  createdAt?: Date;
  updatedAt?: Date;
}

export const ClassReviewSchema = SchemaFactory.createForClass(ClassReview);

ClassReviewSchema.virtual('id').get(function (this: Document) {
  return this._id.toHexString();
});
ClassReviewSchema.virtual('session', {
  ref: 'ClassSession',
  localField: 'sessionId',
  foreignField: '_id',
  justOne: true,
});
ClassReviewSchema.virtual('supervisor', {
  ref: 'User',
  localField: 'supervisorId',
  foreignField: '_id',
  justOne: true,
});
