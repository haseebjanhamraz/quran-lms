import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type TranscriptSegmentDocument = TranscriptSegment & Document;

@Schema({ timestamps: { createdAt: true, updatedAt: false }, toJSON: { virtuals: true }, toObject: { virtuals: true } })
export class TranscriptSegment {
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'ClassSession', index: true })
  sessionId: MongooseSchema.Types.ObjectId | string;

  @Prop({ required: true })
  startTime: number;

  @Prop({ required: true })
  endTime: number;

  @Prop({ required: true })
  text: string;

  @Prop()
  speakerLabel?: string;

  @Prop({ default: 1.0 })
  confidence: number;

  @Prop({ default: 'en' })
  language: string;

  createdAt?: Date;
}

export const TranscriptSegmentSchema = SchemaFactory.createForClass(TranscriptSegment);

TranscriptSegmentSchema.virtual('id').get(function (this: Document) {
  return this._id.toHexString();
});
TranscriptSegmentSchema.virtual('session', {
  ref: 'ClassSession',
  localField: 'sessionId',
  foreignField: '_id',
  justOne: true,
});
