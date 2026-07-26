import { IsNotEmpty, IsMongoId } from 'class-validator';

export class AssignPermissionDto {
  @IsMongoId()
  @IsNotEmpty()
  permissionId: string;
}
