import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Role } from './user.schema';

export type RolePermissionDocument = RolePermission & Document;

@Schema({ timestamps: { createdAt: true, updatedAt: false }, toJSON: { virtuals: true }, toObject: { virtuals: true } })
export class RolePermission {
  @Prop({ required: true, enum: Role })
  role: Role;

  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'Permission' })
  permissionId: MongooseSchema.Types.ObjectId | string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  grantedBy?: MongooseSchema.Types.ObjectId | string;

  createdAt?: Date;
}

export const RolePermissionSchema = SchemaFactory.createForClass(RolePermission);

RolePermissionSchema.index({ role: 1, permissionId: 1 }, { unique: true });

RolePermissionSchema.virtual('id').get(function (this: Document) {
  return this._id.toHexString();
});
RolePermissionSchema.virtual('permission', {
  ref: 'Permission',
  localField: 'permissionId',
  foreignField: '_id',
  justOne: true,
});
RolePermissionSchema.virtual('grantedByUser', {
  ref: 'User',
  localField: 'grantedBy',
  foreignField: '_id',
  justOne: true,
});
