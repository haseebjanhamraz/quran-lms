import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type BroadcastDocument = Broadcast & Document;

export enum BroadcastAudience {
  ALL = 'ALL',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
}

export enum BroadcastPriority {
  NORMAL = 'NORMAL',
  URGENT = 'URGENT',
}

@Schema({ timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } })
export class Broadcast {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, trim: true })
  message: string;

  @Prop({ required: true, enum: BroadcastAudience, default: BroadcastAudience.ALL, index: true })
  targetAudience: BroadcastAudience;

  @Prop({ required: true, enum: BroadcastPriority, default: BroadcastPriority.NORMAL })
  priority: BroadcastPriority;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  sentBy: MongooseSchema.Types.ObjectId | string;

  @Prop()
  sentByName?: string;

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'User' }], default: [] })
  readBy: MongooseSchema.Types.ObjectId[];

  createdAt?: Date;
  updatedAt?: Date;
}

export const BroadcastSchema = SchemaFactory.createForClass(Broadcast);

BroadcastSchema.virtual('id').get(function (this: Document) {
  return this._id.toHexString();
});

BroadcastSchema.virtual('sender', {
  ref: 'User',
  localField: 'sentBy',
  foreignField: '_id',
  justOne: true,
});
