import { IsString, IsNotEmpty, IsEmail, IsArray, IsOptional } from 'class-validator';

export class CreateStudentInquiryDto {
  @IsString()
  @IsNotEmpty()
  studentName: string;

  @IsString()
  @IsNotEmpty()
  age: string;

  @IsArray()
  @IsOptional()
  courses?: string[];

  @IsArray()
  @IsOptional()
  preferredDays?: string[];

  @IsString()
  @IsNotEmpty()
  classTime: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  phoneOrWhatsapp: string;

  @IsString()
  @IsNotEmpty()
  classLanguage: string;

  @IsString()
  @IsOptional()
  message?: string;
}
