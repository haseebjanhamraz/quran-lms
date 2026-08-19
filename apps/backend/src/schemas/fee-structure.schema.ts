import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type FeeStructureDocument = FeeStructure & Document;

@Schema({ timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } })
export class FeeStructure {
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'Course', unique: true })
  courseId: MongooseSchema.Types.ObjectId | string;

  @Prop({ required: true })
  monthlyFee: number;

  @Prop({ default: 0 })
  registrationFee: number;

  @Prop({ default: 'PKR' })
  currency: string;

  @Prop({
    type: [
      {
        duration: { type: Number, required: true }, // 30, 60, 120
        ratePerDay: { type: Number, default: 0 },
        monthlyRate: { type: Number, default: 0 },
      },
    ],
    default: [],
  })
  durationRates?: { duration: number; ratePerDay?: number; monthlyRate?: number }[];

  @Prop()
  description?: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const FeeStructureSchema = SchemaFactory.createForClass(FeeStructure);

FeeStructureSchema.virtual('id').get(function (this: Document) {
  return this._id.toHexString();
});

FeeStructureSchema.virtual('course', {
  ref: 'Course',
  localField: 'courseId',
  foreignField: '_id',
  justOne: true,
});
