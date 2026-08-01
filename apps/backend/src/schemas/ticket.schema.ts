import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type TicketDocument = Ticket & Document;

export enum TicketCategory {
  TECHNICAL = 'TECHNICAL',
  FINANCIAL = 'FINANCIAL',
  ACADEMIC = 'ACADEMIC',
  ADMINISTRATIVE = 'ADMINISTRATIVE',
  COMPLAINT = 'COMPLAINT',
  SUGGESTION = 'SUGGESTION',
}

export enum TicketPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum TicketStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
  ESCALATED = 'ESCALATED',
}

@Schema({ timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } })
export class Ticket {
  @Prop({ required: true, unique: true })
  ticketNumber: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true, enum: TicketCategory, default: TicketCategory.ADMINISTRATIVE })
  category: TicketCategory;

  @Prop({ required: true, enum: TicketPriority, default: TicketPriority.MEDIUM })
  priority: TicketPriority;

  @Prop({ required: true, enum: TicketStatus, default: TicketStatus.OPEN })
  status: TicketStatus;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  raisedBy: MongooseSchema.Types.ObjectId | string;

  @Prop()
  raisedByName?: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  assignedTo?: MongooseSchema.Types.ObjectId | string;

  @Prop()
  assignedToName?: string;

  @Prop({ type: Date })
  resolvedAt?: Date;

  @Prop({ type: Date })
  closedAt?: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

export const TicketSchema = SchemaFactory.createForClass(Ticket);

TicketSchema.virtual('id').get(function (this: Document) {
  return this._id.toHexString();
});

TicketSchema.virtual('user', {
  ref: 'User',
  localField: 'raisedBy',
  foreignField: '_id',
  justOne: true,
});
