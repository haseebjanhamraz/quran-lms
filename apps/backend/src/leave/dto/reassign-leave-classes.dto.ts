import { IsArray, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ReassignClassItemDto {
  @IsNotEmpty()
  @IsString()
  sessionId: string;

  @IsNotEmpty()
  @IsString()
  substituteTeacherId: string;
}

export class ReassignLeaveClassesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReassignClassItemDto)
  reassignments: ReassignClassItemDto[];

  @IsOptional()
  @IsString()
  note?: string;
}
