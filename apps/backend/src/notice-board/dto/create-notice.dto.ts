import { IsString, IsNotEmpty, IsEnum, IsOptional, IsArray, IsBoolean } from 'class-validator';
import { NoticeTargetRole } from '../../schemas';

export class CreateNoticeDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsEnum(NoticeTargetRole)
  @IsOptional()
  targetRole?: NoticeTargetRole;

  @IsArray()
  @IsOptional()
  attachments?: Array<{
    name: string;
    url: string;
    fileType: 'IMAGE' | 'PDF' | 'OTHER';
    fileSize?: number;
  }>;

  @IsBoolean()
  @IsOptional()
  isPinned?: boolean;
}
