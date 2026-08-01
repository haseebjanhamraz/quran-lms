import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { TicketCategory, TicketPriority } from '../../schemas';

export class CreateTicketDto {
  @IsString()
  @IsNotEmpty()
  title: string;

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
