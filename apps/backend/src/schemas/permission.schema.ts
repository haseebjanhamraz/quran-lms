import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PermissionDocument = Permission & Document;

@Schema({ timestamps: { createdAt: true, updatedAt: false }, toJSON: { virtuals: true }, toObject: { virtuals: true } })
export class Permission {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({ required: true })
  module: string;

  @Prop({ required: true })
  action: string;

  createdAt?: Date;
}

export const PermissionSchema = SchemaFactory.createForClass(Permission);

PermissionSchema.virtual('id').get(function (this: Document) {
  return this._id.toHexString();
});
PermissionSchema.virtual('rolePermissions', {
  ref: 'RolePermission',
  localField: '_id',
  foreignField: 'permissionId',
});
