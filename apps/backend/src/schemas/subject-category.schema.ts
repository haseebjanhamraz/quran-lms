import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SubjectCategoryDocument = SubjectCategory & Document;

@Schema({ timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } })
export class SubjectCategory {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true, unique: true, uppercase: true })
  code: string;

  @Prop()
  description?: string;

  @Prop({ default: '#10b981' })
  color?: string;

  @Prop({ default: true })
  isActive: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export const SubjectCategorySchema = SchemaFactory.createForClass(SubjectCategory);

SubjectCategorySchema.virtual('id').get(function (this: Document) {
  return this._id.toHexString();
});
