import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type AttendanceDocument = Attendance & Document;

@Schema({ timestamps: { createdAt: true, updatedAt: false }, toJSON: { virtuals: true }, toObject: { virtuals: true } })
export class Attendance {
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'ClassSession' })
  sessionId: MongooseSchema.Types.ObjectId | string;

  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'User' })
  userId: MongooseSchema.Types.ObjectId | string;

  @Prop()
  joinTime?: Date;

  @Prop()
  leaveTime?: Date;

  @Prop({ default: 0 })
  durationSeconds: number;

  createdAt?: Date;
}

export const AttendanceSchema = SchemaFactory.createForClass(Attendance);

AttendanceSchema.index({ sessionId: 1, userId: 1 }, { unique: true });

AttendanceSchema.virtual('id').get(function (this: Document) {
  return this._id.toHexString();
});
AttendanceSchema.virtual('session', {
  ref: 'ClassSession',
  localField: 'sessionId',
  foreignField: '_id',
  justOne: true,
});
AttendanceSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true,
});
