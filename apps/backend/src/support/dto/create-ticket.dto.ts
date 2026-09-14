import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { TicketCategory, TicketPriority } from '../../schemas';

export class CreateTicketDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  subject?: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsEnum(TicketCategory)
  @IsOptional()
  category?: TicketCategory;

  @IsEnum(TicketPriority)
  @IsOptional()
  priority?: TicketPriority;
}
