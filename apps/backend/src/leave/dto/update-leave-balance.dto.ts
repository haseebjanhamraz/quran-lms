import { IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateLeaveBalanceDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  sick?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  casual?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  annual?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  other?: number;
}
