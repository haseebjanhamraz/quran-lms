import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class AssignPermissionDto {
  @IsUUID()
  @IsNotEmpty()
  permissionId: string;
}
