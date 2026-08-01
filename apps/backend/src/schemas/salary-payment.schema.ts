import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type SalaryPaymentDocument = SalaryPayment & Document;

export enum PaymentMethod {
  CASH = 'CASH',
  BANK_TRANSFER = 'BANK_TRANSFER',
}

@Schema({ timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } })
export class SalaryPayment {
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'User', index: true })
  teacherId: MongooseSchema.Types.ObjectId | string;

  @Prop({ required: true })
  amount: number;

  @Prop({ default: 'MONTHLY' })
  payType?: string; // 'MONTHLY' | 'HOURLY'

  @Prop({ type: Number })
  hoursWorked?: number;

  @Prop({ type: Number })
  hourlyRate?: number;

  @Prop({ default: 'PKR' })
  currency?: string;

  @Prop({ required: true, index: true })
  month: string; // e.g. "2026-07"

  @Prop({ required: true, default: Date.now })
  paymentDate: Date;

  @Prop({ required: true, enum: PaymentMethod, default: PaymentMethod.CASH })
  paymentMethod: PaymentMethod;

  @Prop()
  notes?: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  recordedBy?: MongooseSchema.Types.ObjectId | string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const SalaryPaymentSchema = SchemaFactory.createForClass(SalaryPayment);

SalaryPaymentSchema.virtual('id').get(function (this: Document) {
  return this._id.toHexString();
});

SalaryPaymentSchema.virtual('teacher', {
  ref: 'User',
  localField: 'teacherId',
  foreignField: '_id',
  justOne: true,
});
