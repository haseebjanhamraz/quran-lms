import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { NoticeBoardService } from './notice-board.service';
import { CreateNoticeDto } from './dto/create-notice.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../schemas';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notices')
export class NoticeBoardController {
  constructor(private readonly noticeBoardService: NoticeBoardService) {}

  @Post()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  createNotice(
    @Body() createNoticeDto: CreateNoticeDto,
    @CurrentUser() user: any,
  ) {
    return this.noticeBoardService.createNotice(createNoticeDto, user);
  }

  @Get()
  getNotices(@CurrentUser() user: any) {
    return this.noticeBoardService.getNotices(user);
  }

  @Patch(':id/read')
  markAsRead(@Param('id') id: string, @CurrentUser() user: any) {
    return this.noticeBoardService.markAsRead(id, user);
  }

  @Patch(':id/pin')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  togglePin(@Param('id') id: string) {
    return this.noticeBoardService.togglePin(id);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  deleteNotice(@Param('id') id: string) {
    return this.noticeBoardService.deleteNotice(id);
  }
}
