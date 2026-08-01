import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type IncomeDocument = Income & Document;

export enum IncomeSource {
  FEES = 'FEES',
  DONATION = 'DONATION',
  GRANT = 'GRANT',
  OTHER = 'OTHER',
}

@Schema({ timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } })
export class Income {
  @Prop({ required: true })
  title: string;

  @Prop()
  description?: string;

  @Prop({ required: true, type: Number })
  amount: number;

  @Prop({ default: 'PKR' })
  currency: string;

  @Prop({ required: true, enum: IncomeSource })
  source: IncomeSource;

  @Prop({ required: true, type: Date })
  date: Date;

  @Prop()
  referenceId?: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  recordedBy: MongooseSchema.Types.ObjectId | string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const IncomeSchema = SchemaFactory.createForClass(Income);

IncomeSchema.virtual('id').get(function (this: Document) {
  return this._id.toHexString();
});
