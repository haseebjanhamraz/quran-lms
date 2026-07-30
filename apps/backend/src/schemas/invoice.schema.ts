import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type InvoiceDocument = Invoice & Document;

export enum InvoiceStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  PARTIAL = 'PARTIAL',
  CANCELLED = 'CANCELLED',
}

@Schema({ timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } })
export class Invoice {
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'User', index: true })
  studentId: MongooseSchema.Types.ObjectId | string;

  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'Course', index: true })
  courseId: MongooseSchema.Types.ObjectId | string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'FeeStructure' })
  feeStructureId?: MongooseSchema.Types.ObjectId | string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true, default: 'USD' })
  currency: string; // e.g. USD, PKR, GBP (auto-set per student's location/country)

  @Prop({ required: true })
  dueDate: Date;

  @Prop({ required: true, enum: InvoiceStatus, default: InvoiceStatus.PENDING, index: true })
  status: InvoiceStatus;

  @Prop({ default: 0 })
  paidAmount: number;

  @Prop()
  paidDate?: Date;

  @Prop({ default: 'CASH' })
  paymentMethod?: string;

  @Prop()
  referenceNumber?: string;

  @Prop()
  notes?: string;

  @Prop({ required: true, index: true })
  billingMonth: string; // e.g. "2026-07"

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  recordedBy?: MongooseSchema.Types.ObjectId | string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const InvoiceSchema = SchemaFactory.createForClass(Invoice);

InvoiceSchema.virtual('id').get(function (this: Document) {
  return this._id.toHexString();
});

InvoiceSchema.virtual('student', {
  ref: 'User',
  localField: 'studentId',
  foreignField: '_id',
  justOne: true,
});

InvoiceSchema.virtual('course', {
  ref: 'Course',
  localField: 'courseId',
  foreignField: '_id',
  justOne: true,
});
