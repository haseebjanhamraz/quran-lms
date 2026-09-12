import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { BroadcastAudience, BroadcastPriority } from '../../schemas/broadcast.schema';

export class CreateBroadcastDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsEnum(BroadcastAudience)
  @IsOptional()
  targetAudience?: BroadcastAudience;

  @IsEnum(BroadcastPriority)
  @IsOptional()
  priority?: BroadcastPriority;
}
