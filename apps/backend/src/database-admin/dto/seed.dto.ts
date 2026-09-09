import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SeedDatabaseDto {
  @IsString()
  @IsNotEmpty()
  type: 'comprehensive' | 'students' | 'courses_teachers' | 'finance' | 'materials';

  @IsOptional()
  options?: any;
}
