import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type NotificationDocument = Notification & Document;

export enum NotificationType {
  CLASS_STARTING = 'CLASS_STARTING',
  REPORT_READY = 'REPORT_READY',
  RECORDING_READY = 'RECORDING_READY',
  FLAG_RAISED = 'FLAG_RAISED',
  SYSTEM = 'SYSTEM',
  RESCHEDULE_REQUESTED = 'RESCHEDULE_REQUESTED',
  RESCHEDULE_APPROVED = 'RESCHEDULE_APPROVED',
  RESCHEDULE_REJECTED = 'RESCHEDULE_REJECTED',
  CLASS_EXPIRED = 'CLASS_EXPIRED',
  CLASS_FROZEN = 'CLASS_FROZEN',
}

@Schema({ timestamps: { createdAt: true, updatedAt: false }, toJSON: { virtuals: true }, toObject: { virtuals: true } })
export class Notification {
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'User', index: true })
  userId: MongooseSchema.Types.ObjectId | string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  message: string;

  @Prop({ required: true, enum: NotificationType })
  type: NotificationType;

  @Prop({ default: false, index: true })
  isRead: boolean;

  @Prop({ type: MongooseSchema.Types.Mixed })
  metadata?: Record<string, any>;

  createdAt?: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

NotificationSchema.virtual('id').get(function (this: Document) {
  return this._id.toHexString();
});
NotificationSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true,
});
