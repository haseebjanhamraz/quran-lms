import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SystemSettingDocument = SystemSetting & Document;

@Schema({ timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } })
export class SystemSetting {
  @Prop({ required: true, unique: true })
  key: string;

  @Prop({ required: true })
  value: string;

  @Prop()
  description?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const SystemSettingSchema = SchemaFactory.createForClass(SystemSetting);

SystemSettingSchema.virtual('id').get(function (this: Document) {
  return this._id.toHexString();
});
