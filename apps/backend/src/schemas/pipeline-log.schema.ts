import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type PipelineLogDocument = PipelineLog & Document;

@Schema({ timestamps: { createdAt: true, updatedAt: false }, toJSON: { virtuals: true }, toObject: { virtuals: true } })
export class PipelineLog {
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'ClassSession', index: true })
  sessionId: MongooseSchema.Types.ObjectId | string;

  @Prop({ required: true })
  step: string;

  @Prop({ required: true })
  status: string;

  @Prop({ required: true })
  message: string;

  createdAt?: Date;
}

export const PipelineLogSchema = SchemaFactory.createForClass(PipelineLog);

PipelineLogSchema.virtual('id').get(function (this: Document) {
  return this._id.toHexString();
});
PipelineLogSchema.virtual('session', {
  ref: 'ClassSession',
  localField: 'sessionId',
  foreignField: '_id',
  justOne: true,
});
