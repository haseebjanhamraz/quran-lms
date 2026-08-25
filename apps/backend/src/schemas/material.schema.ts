import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type MaterialDocument = Material & Document;

export enum MaterialCategory {
  QAIDA = 'QAIDA',
  TAJWEED = 'TAJWEED',
  QURAN_PARAH = 'QURAN_PARAH',
  DUAS_ADHKAR = 'DUAS_ADHKAR',
  ISLAMIC_STUDIES = 'ISLAMIC_STUDIES',
  GENERAL = 'GENERAL',
}

@Schema({ timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } })
export class Material {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ required: true, enum: MaterialCategory, default: MaterialCategory.GENERAL, index: true })
  category: MaterialCategory;

  @Prop({ default: 'All', index: true })
  targetLevel: string; // 'All' | 'Beginner' | 'Intermediate' | 'Advanced'

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Course', index: true })
  courseId?: MongooseSchema.Types.ObjectId | string;

  @Prop({ required: true })
  fileName: string;

  @Prop({ required: true })
  fileUrl: string;

  @Prop({ required: true })
  fileSize: number;

  @Prop({ default: 'application/pdf' })
  mimeType: string;

  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'User', index: true })
  uploadedBy: MongooseSchema.Types.ObjectId | string;

  @Prop({ default: 0 })
  downloadsCount: number;

  @Prop({ default: true, index: true })
  isActive: boolean;
}

export const MaterialSchema = SchemaFactory.createForClass(Material);

MaterialSchema.virtual('id').get(function (this: Document) {
  return this._id.toHexString();
});

MaterialSchema.virtual('uploader', {
  ref: 'User',
  localField: 'uploadedBy',
  foreignField: '_id',
  justOne: true,
});

MaterialSchema.virtual('course', {
  ref: 'Course',
  localField: 'courseId',
  foreignField: '_id',
  justOne: true,
});
