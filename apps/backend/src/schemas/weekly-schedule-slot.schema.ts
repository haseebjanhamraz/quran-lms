import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type WeeklyScheduleSlotDocument = WeeklyScheduleSlot & Document;

export enum DayOfWeek {
  MONDAY = 'Monday',
  TUESDAY = 'Tuesday',
  WEDNESDAY = 'Wednesday',
  THURSDAY = 'Thursday',
  FRIDAY = 'Friday',
  SATURDAY = 'Saturday',
  SUNDAY = 'Sunday',
}

@Schema({ timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } })
export class WeeklyScheduleSlot {
  @Prop({ required: true, enum: DayOfWeek, index: true })
  dayOfWeek: DayOfWeek;

  @Prop({ required: true, type: Number, index: true })
  timeSlotIndex: number; // 0 to 11 corresponding to 30-min time slots

  @Prop({ required: true })
  startTime: string; // e.g., '09:00'

  @Prop({ required: true })
  endTime: string; // e.g., '09:30'

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, index: true })
  teacherId: MongooseSchema.Types.ObjectId | string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Course', index: true })
  courseId?: MongooseSchema.Types.ObjectId | string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', index: true })
  studentId?: MongooseSchema.Types.ObjectId | string;

  @Prop({ default: true, type: Boolean })
  isRecurring: boolean;

  @Prop({ default: true, type: Boolean })
  isActive: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export const WeeklyScheduleSlotSchema = SchemaFactory.createForClass(WeeklyScheduleSlot);

WeeklyScheduleSlotSchema.index({ dayOfWeek: 1, timeSlotIndex: 1 }, { unique: true });

WeeklyScheduleSlotSchema.virtual('id').get(function (this: Document) {
  return this._id.toHexString();
});

WeeklyScheduleSlotSchema.virtual('teacher', {
  ref: 'User',
  localField: 'teacherId',
  foreignField: '_id',
  justOne: true,
});

WeeklyScheduleSlotSchema.virtual('course', {
  ref: 'Course',
  localField: 'courseId',
  foreignField: '_id',
  justOne: true,
});

WeeklyScheduleSlotSchema.virtual('student', {
  ref: 'User',
  localField: 'studentId',
  foreignField: '_id',
  justOne: true,
});
