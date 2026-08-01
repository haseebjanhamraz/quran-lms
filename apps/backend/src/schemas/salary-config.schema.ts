import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type SalaryConfigDocument = SalaryConfig & Document;

@Schema({ timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } })
export class SalaryConfig {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, unique: true })
  teacherId: MongooseSchema.Types.ObjectId | string;

  @Prop({ required: true, type: Number })
  baseSalary: number;

  @Prop({ default: 'MONTHLY' })
  payType: string; // 'MONTHLY' | 'HOURLY'

  @Prop({ type: Number, default: 0 })
  hourlyRate: number;

  @Prop({ default: 'Pakistan' })
  country: string;

  @Prop({ default: 'PKR' })
  currency: string;

  @Prop({ default: 0, type: Number })
  housingAllowance: number;

  @Prop({ default: 0, type: Number })
  transportAllowance: number;

  @Prop({ default: 0, type: Number })
  medicalAllowance: number;

  @Prop({ default: 0, type: Number })
  otherAllowances: number;

  @Prop({ default: 0, type: Number })
  taxDeduction: number;

  @Prop({ default: 0, type: Number })
  otherDeductions: number;

  @Prop({ type: Date })
  effectiveFrom?: Date;

  @Prop()
  notes?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const SalaryConfigSchema = SchemaFactory.createForClass(SalaryConfig);

SalaryConfigSchema.virtual('id').get(function (this: Document) {
  return this._id.toHexString();
});
