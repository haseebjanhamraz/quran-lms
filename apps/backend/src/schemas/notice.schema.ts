import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type NoticeDocument = Notice & Document;

export enum NoticeTargetRole {
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
  ALL = 'ALL',
}

@Schema({ timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } })
export class Notice {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true })
  content: string;

  @Prop({ required: true, enum: NoticeTargetRole, default: NoticeTargetRole.TEACHER, index: true })
  targetRole: NoticeTargetRole;

  @Prop({
    type: [
      {
        name: { type: String, required: true },
        url: { type: String, required: true },
        fileType: { type: String, enum: ['IMAGE', 'PDF', 'OTHER'], default: 'OTHER' },
        fileSize: { type: Number },
      },
    ],
    default: [],
  })
  attachments: Array<{
    name: string;
    url: string;
    fileType: 'IMAGE' | 'PDF' | 'OTHER';
    fileSize?: number;
  }>;

  @Prop({ default: false, index: true })
  isPinned: boolean;

  @Prop({ default: true, index: true })
  isActive: boolean;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  postedBy: MongooseSchema.Types.ObjectId | string;

  @Prop()
  postedByName?: string;

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'User' }], default: [] })
  readBy: MongooseSchema.Types.ObjectId[];

  createdAt?: Date;
  updatedAt?: Date;
}

export const NoticeSchema = SchemaFactory.createForClass(Notice);

NoticeSchema.virtual('id').get(function (this: Document) {
  return this._id.toHexString();
});

NoticeSchema.virtual('author', {
  ref: 'User',
  localField: 'postedBy',
  foreignField: '_id',
  justOne: true,
});
