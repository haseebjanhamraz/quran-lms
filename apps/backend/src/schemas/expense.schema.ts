import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ExpenseDocument = Expense & Document;

export enum ExpenseCategory {
  UTILITIES = 'UTILITIES',
  MAINTENANCE = 'MAINTENANCE',
  SUPPLIES = 'SUPPLIES',
  SALARY = 'SALARY',
  TRANSPORT = 'TRANSPORT',
  RENT = 'RENT',
  MISCELLANEOUS = 'MISCELLANEOUS',
}

export enum ExpenseStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

@Schema({ timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } })
export class Expense {
  @Prop({ required: true })
  title: string;

  @Prop()
  description?: string;

  @Prop({ required: true, type: Number })
  amount: number;

  @Prop({ default: 'PKR' })
  currency: string;

  @Prop({ required: true, enum: ExpenseCategory })
  category: ExpenseCategory;

  @Prop({ required: true, type: Date })
  date: Date;

  @Prop()
  receiptUrl?: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  approvedBy?: MongooseSchema.Types.ObjectId | string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  createdBy: MongooseSchema.Types.ObjectId | string;

  @Prop({ required: true, enum: ExpenseStatus, default: ExpenseStatus.PENDING })
  status: ExpenseStatus;

  createdAt?: Date;
  updatedAt?: Date;
}

export const ExpenseSchema = SchemaFactory.createForClass(Expense);

ExpenseSchema.virtual('id').get(function (this: Document) {
  return this._id.toHexString();
});
