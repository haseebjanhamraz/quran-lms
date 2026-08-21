import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type LeaveBalanceDocument = LeaveBalance & Document;

@Schema({ _id: false })
export class LeaveQuotas {
  @Prop({ default: 10, min: 0 })
  sick: number;

  @Prop({ default: 12, min: 0 })
  casual: number;

  @Prop({ default: 15, min: 0 })
  annual: number;

  @Prop({ default: 5, min: 0 })
  other: number;
}
export const LeaveQuotasSchema = SchemaFactory.createForClass(LeaveQuotas);

@Schema({ _id: false })
export class LeaveUsed {
  @Prop({ default: 0, min: 0 })
  sick: number;

  @Prop({ default: 0, min: 0 })
  casual: number;

  @Prop({ default: 0, min: 0 })
  annual: number;

  @Prop({ default: 0, min: 0 })
  other: number;
}
export const LeaveUsedSchema = SchemaFactory.createForClass(LeaveUsed);

@Schema({ timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } })
export class LeaveBalance {
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'User', index: true })
  teacherId: MongooseSchema.Types.ObjectId | string;

  @Prop({ required: true, default: () => new Date().getFullYear(), index: true })
  year: number;

  @Prop({ type: LeaveQuotasSchema, default: () => ({ sick: 10, casual: 12, annual: 15, other: 5 }) })
  allocated: LeaveQuotas;

  @Prop({ type: LeaveUsedSchema, default: () => ({ sick: 0, casual: 0, annual: 0, other: 0 }) })
  used: LeaveUsed;

  createdAt?: Date;
  updatedAt?: Date;
}

export const LeaveBalanceSchema = SchemaFactory.createForClass(LeaveBalance);

LeaveBalanceSchema.index({ teacherId: 1, year: 1 }, { unique: true });

LeaveBalanceSchema.virtual('id').get(function (this: Document) {
  return this._id.toHexString();
});

LeaveBalanceSchema.virtual('teacher', {
  ref: 'User',
  localField: 'teacherId',
  foreignField: '_id',
  justOne: true,
});
