import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type StudentInquiryDocument = StudentInquiry & Document;

@Schema({ timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } })
export class StudentInquiry {
  @Prop({ required: true, trim: true })
  studentName: string;

  @Prop({ required: true, trim: true })
  age: string;

  @Prop({ type: [String], default: [] })
  courses: string[];

  @Prop({ type: [String], default: [] })
  preferredDays: string[];

  @Prop({ required: true, trim: true })
  classTime: string;

  @Prop({ required: true, trim: true, lowercase: true })
  email: string;

  @Prop({ required: true, trim: true })
  phoneOrWhatsapp: string;

  @Prop({ required: true, trim: true, default: 'English' })
  classLanguage: string;

  @Prop({ default: '' })
  message?: string;

  @Prop({ default: 'NEW', index: true })
  status: 'NEW' | 'CONTACTED' | 'ENROLLED' | 'REJECTED';

  @Prop()
  notes?: string;
}

export const StudentInquirySchema = SchemaFactory.createForClass(StudentInquiry);

StudentInquirySchema.virtual('id').get(function (this: Document) {
  return this._id.toHexString();
});
