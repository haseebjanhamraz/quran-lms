import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class CreateFeedbackDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['COMPLAINT', 'TECHNICAL_ISSUE', 'PARENT_FEEDBACK', 'GENERAL'])
  category: string;

  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsString()
  @IsNotEmpty()
  message: string;
}
