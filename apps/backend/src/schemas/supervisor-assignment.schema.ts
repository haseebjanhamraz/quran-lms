import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type SupervisorAssignmentDocument = SupervisorAssignment & Document;

@Schema({ timestamps: { createdAt: true, updatedAt: false }, toJSON: { virtuals: true }, toObject: { virtuals: true } })
export class SupervisorAssignment {
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'User' })
  supervisorId: MongooseSchema.Types.ObjectId | string;

  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'Course' })
  courseId: MongooseSchema.Types.ObjectId | string;

  @Prop({ default: Date.now })
  assignedAt: Date;

  @Prop({ default: true })
  isActive: boolean;
}

export const SupervisorAssignmentSchema = SchemaFactory.createForClass(SupervisorAssignment);

SupervisorAssignmentSchema.index({ supervisorId: 1, courseId: 1 }, { unique: true });

SupervisorAssignmentSchema.virtual('id').get(function (this: Document) {
  return this._id.toHexString();
});
SupervisorAssignmentSchema.virtual('supervisor', {
  ref: 'User',
  localField: 'supervisorId',
  foreignField: '_id',
  justOne: true,
});
SupervisorAssignmentSchema.virtual('course', {
  ref: 'Course',
  localField: 'courseId',
  foreignField: '_id',
  justOne: true,
});
