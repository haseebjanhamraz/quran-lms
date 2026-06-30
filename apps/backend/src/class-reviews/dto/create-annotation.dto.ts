import { IsNumber, IsString } from 'class-validator';

export class CreateAnnotationDto {
  @IsNumber()
  timestamp: number;

  @IsString()
  note: string;

  @IsString()
  category: string;
}
