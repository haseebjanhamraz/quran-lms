import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type RecordingDocument = Recording & Document;

export enum RecordingStatus {
  PROCESSING = 'PROCESSING',
  UPLOADING = 'UPLOADING',
  READY = 'READY',
  FAILED = 'FAILED',
}

@Schema({ timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } })
export class Recording {
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'ClassSession', unique: true })
  sessionId: MongooseSchema.Types.ObjectId | string;

  @Prop()
  localPath?: string;

  @Prop()
  filePath?: string;

  @Prop()
  fileSize?: number;

  @Prop({ default: 0 })
  durationSeconds: number;

  @Prop({ required: true, enum: RecordingStatus, default: RecordingStatus.PROCESSING })
  status: RecordingStatus;

  createdAt?: Date;
  updatedAt?: Date;
}

export const RecordingSchema = SchemaFactory.createForClass(Recording);

RecordingSchema.virtual('id').get(function (this: Document) {
  return this._id.toHexString();
});
RecordingSchema.virtual('session', {
  ref: 'ClassSession',
  localField: 'sessionId',
  foreignField: '_id',
  justOne: true,
});
