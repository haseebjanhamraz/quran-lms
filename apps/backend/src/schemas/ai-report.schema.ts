import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { FlagSeverity } from './class-review.schema';

export type AIReportDocument = AIReport & Document;

export enum ViolationType {
  PHONE_NUMBER = 'PHONE_NUMBER',
  EMAIL = 'EMAIL',
  WHATSAPP = 'WHATSAPP',
  SOCIAL_MEDIA = 'SOCIAL_MEDIA',
  OFF_TOPIC = 'OFF_TOPIC',
  INAPPROPRIATE_LANGUAGE = 'INAPPROPRIATE_LANGUAGE',
  MISSING_CONTENT = 'MISSING_CONTENT',
  EXCESSIVE_NON_ACADEMIC = 'EXCESSIVE_NON_ACADEMIC',
}

@Schema({ timestamps: { createdAt: true, updatedAt: false }, toJSON: { virtuals: true }, toObject: { virtuals: true } })
export class Violation {
  @Prop({ required: true, enum: ViolationType })
  type: ViolationType;

  @Prop({ required: true })
  evidence: string;

  @Prop({ required: true, enum: FlagSeverity, default: FlagSeverity.MEDIUM })
  severity: FlagSeverity;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const ViolationSchema = SchemaFactory.createForClass(Violation);

ViolationSchema.virtual('id').get(function (this: Document) {
  return this._id.toHexString();
});

@Schema({ timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } })
export class AIReport {
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'ClassSession', unique: true })
  sessionId: MongooseSchema.Types.ObjectId | string;

  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'User', index: true })
  teacherId: MongooseSchema.Types.ObjectId | string;

  @Prop({ default: 0.0 })
  riskScore: number;

  @Prop({ default: 5.0 })
  teachingQualityScore: number;

  @Prop({ default: 5.0 })
  topicRelevanceScore: number;

  @Prop({ required: true })
  summary: string;

  @Prop({ type: MongooseSchema.Types.Mixed, required: true })
  mainTopics: any;

  @Prop({ required: true })
  offTopicAnalysis: string;

  @Prop({ type: MongooseSchema.Types.Mixed, required: true })
  contactSharingDetection: any;

  @Prop({ required: true })
  complianceFindings: string;

  @Prop({ required: true })
  teachingAssessment: string;

  @Prop({ required: true })
  engagementAssessment: string;

  @Prop({ required: true })
  recommendations: string;

  @Prop({ type: [ViolationSchema], default: [] })
  violations: Violation[];

  createdAt?: Date;
  updatedAt?: Date;
}

export const AIReportSchema = SchemaFactory.createForClass(AIReport);

AIReportSchema.virtual('id').get(function (this: Document) {
  return this._id.toHexString();
});
AIReportSchema.virtual('session', {
  ref: 'ClassSession',
  localField: 'sessionId',
  foreignField: '_id',
  justOne: true,
});
AIReportSchema.virtual('teacher', {
  ref: 'User',
  localField: 'teacherId',
  foreignField: '_id',
  justOne: true,
});
