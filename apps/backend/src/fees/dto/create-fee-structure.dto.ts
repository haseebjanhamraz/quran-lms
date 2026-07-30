import { IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateFeeStructureDto {
  @IsMongoId()
  @IsNotEmpty()
  courseId: string;

  @IsNumber()
  @IsNotEmpty()
  monthlyFee: number;

  @IsNumber()
  @IsOptional()
  registrationFee?: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
