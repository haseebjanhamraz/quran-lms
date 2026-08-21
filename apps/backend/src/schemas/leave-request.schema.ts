import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type LeaveRequestDocument = LeaveRequest & Document;

export enum LeaveType {
  SICK = 'SICK',
  CASUAL = 'CASUAL',
  ANNUAL = 'ANNUAL',
  OTHER = 'OTHER',
}

export enum LeaveStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

@Schema({ timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } })
export class LeaveRequest {
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'User', index: true })
  teacherId: MongooseSchema.Types.ObjectId | string;

  @Prop({ required: true, enum: LeaveType })
  leaveType: LeaveType;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({ required: true, min: 0.5 })
  totalDays: number;

  @Prop({ required: true })
  reason: string;

  @Prop({ required: true, enum: LeaveStatus, default: LeaveStatus.PENDING, index: true })
  status: LeaveStatus;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  reviewedBy?: MongooseSchema.Types.ObjectId | string;

  @Prop()
  reviewedAt?: Date;

  @Prop()
  adminRemarks?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const LeaveRequestSchema = SchemaFactory.createForClass(LeaveRequest);

LeaveRequestSchema.virtual('id').get(function (this: Document) {
  return this._id.toHexString();
});

LeaveRequestSchema.virtual('teacher', {
  ref: 'User',
  localField: 'teacherId',
  foreignField: '_id',
  justOne: true,
});

LeaveRequestSchema.virtual('reviewer', {
  ref: 'User',
  localField: 'reviewedBy',
  foreignField: '_id',
  justOne: true,
});
