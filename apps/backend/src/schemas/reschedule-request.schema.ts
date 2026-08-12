import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type RescheduleRequestDocument = RescheduleRequest & Document;

export enum RescheduleStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

@Schema({ timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } })
export class RescheduleRequest {
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'ClassSession', index: true })
  sessionId: MongooseSchema.Types.ObjectId | string;

  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'User', index: true })
  requestedBy: MongooseSchema.Types.ObjectId | string;

  @Prop({ required: true })
  originalScheduledAt: Date;

  @Prop({ required: true })
  requestedTime: Date;

  @Prop()
  reason?: string;

  @Prop({ required: true, enum: RescheduleStatus, default: RescheduleStatus.PENDING, index: true })
  status: RescheduleStatus;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  reviewedBy?: MongooseSchema.Types.ObjectId | string;

  @Prop()
  reviewedAt?: Date;

  @Prop()
  adminNote?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const RescheduleRequestSchema = SchemaFactory.createForClass(RescheduleRequest);

RescheduleRequestSchema.virtual('id').get(function (this: Document) {
  return this._id.toHexString();
});

RescheduleRequestSchema.virtual('session', {
  ref: 'ClassSession',
  localField: 'sessionId',
  foreignField: '_id',
  justOne: true,
});

RescheduleRequestSchema.virtual('student', {
  ref: 'User',
  localField: 'requestedBy',
  foreignField: '_id',
  justOne: true,
});

RescheduleRequestSchema.virtual('reviewer', {
  ref: 'User',
  localField: 'reviewedBy',
  foreignField: '_id',
  justOne: true,
});
