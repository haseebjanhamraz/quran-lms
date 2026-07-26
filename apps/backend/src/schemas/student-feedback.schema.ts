import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type StudentFeedbackDocument = StudentFeedback & Document;

@Schema({ timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } })
export class StudentFeedback {
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'User', index: true })
  studentId: MongooseSchema.Types.ObjectId | string;

  @Prop({ required: true })
  category: string;

  @Prop({ required: true })
  subject: string;

  @Prop({ required: true })
  message: string;

  @Prop({ default: 'OPEN', index: true })
  status: string;

  @Prop()
  adminNotes?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const StudentFeedbackSchema = SchemaFactory.createForClass(StudentFeedback);

StudentFeedbackSchema.virtual('id').get(function (this: Document) {
  return this._id.toHexString();
});
StudentFeedbackSchema.virtual('student', {
  ref: 'User',
  localField: 'studentId',
  foreignField: '_id',
  justOne: true,
});
