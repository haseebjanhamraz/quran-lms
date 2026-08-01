import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type TicketCommentDocument = TicketComment & Document;

@Schema({ timestamps: { createdAt: true, updatedAt: false }, toJSON: { virtuals: true }, toObject: { virtuals: true } })
export class TicketComment {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Ticket', required: true })
  ticketId: MongooseSchema.Types.ObjectId | string;

  @Prop({ required: true })
  comment: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  commentBy: MongooseSchema.Types.ObjectId | string;

  @Prop()
  commentByName?: string;

  @Prop({ default: false })
  isInternal: boolean;

  createdAt?: Date;
}

export const TicketCommentSchema = SchemaFactory.createForClass(TicketComment);

TicketCommentSchema.virtual('id').get(function (this: Document) {
  return this._id.toHexString();
});
