import { IsEnum, IsMongoId, IsOptional, IsString } from 'class-validator';
import { MaterialCategory } from '../../schemas';

export class UpdateMaterialDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(MaterialCategory)
  category?: MaterialCategory;

  @IsOptional()
  @IsString()
  targetLevel?: string;

  @IsOptional()
  @IsMongoId()
  courseId?: string;
}
