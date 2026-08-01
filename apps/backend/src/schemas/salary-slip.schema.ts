import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type SalarySlipDocument = SalarySlip & Document;

@Schema({ timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } })
export class SalarySlip {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'SalaryPayment', required: true })
  salaryPaymentId: MongooseSchema.Types.ObjectId | string;

  @Prop({ required: true, unique: true })
  slipNumber: string;

  @Prop({ type: Date, default: Date.now })
  generatedAt: Date;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  generatedBy?: MongooseSchema.Types.ObjectId | string;

  @Prop({ type: Object })
  breakdown: {
    baseSalary: number;
    housingAllowance: number;
    transportAllowance: number;
    medicalAllowance: number;
    otherAllowances: number;
    grossSalary: number;
    taxDeduction: number;
    otherDeductions: number;
    totalDeductions: number;
    netSalary: number;
  };

  createdAt?: Date;
  updatedAt?: Date;
}

export const SalarySlipSchema = SchemaFactory.createForClass(SalarySlip);

SalarySlipSchema.virtual('id').get(function (this: Document) {
  return this._id.toHexString();
});
