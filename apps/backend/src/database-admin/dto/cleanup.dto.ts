import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class CleanupDatabaseDto {
  @IsArray()
  @IsNotEmpty()
  targets: string[];

  @IsString()
  @IsNotEmpty()
  confirmation: string;
}
