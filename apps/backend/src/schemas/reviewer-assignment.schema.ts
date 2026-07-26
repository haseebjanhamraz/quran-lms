import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ReviewerAssignmentDocument = ReviewerAssignment & Document;

@Schema({ timestamps: { createdAt: true, updatedAt: false }, toJSON: { virtuals: true }, toObject: { virtuals: true } })
export class ReviewerAssignment {
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'User' })
  reviewerId: MongooseSchema.Types.ObjectId | string;

  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'Course' })
  courseId: MongooseSchema.Types.ObjectId | string;

  @Prop({ default: Date.now })
  assignedAt: Date;

  @Prop({ default: true })
  isActive: boolean;
}

export const ReviewerAssignmentSchema = SchemaFactory.createForClass(ReviewerAssignment);

ReviewerAssignmentSchema.index({ reviewerId: 1, courseId: 1 }, { unique: true });

ReviewerAssignmentSchema.virtual('id').get(function (this: Document) {
  return this._id.toHexString();
});
ReviewerAssignmentSchema.virtual('reviewer', {
  ref: 'User',
  localField: 'reviewerId',
  foreignField: '_id',
  justOne: true,
});
ReviewerAssignmentSchema.virtual('course', {
  ref: 'Course',
  localField: 'courseId',
  foreignField: '_id',
  justOne: true,
});
