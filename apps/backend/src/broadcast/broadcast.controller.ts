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
import { BroadcastService } from './broadcast.service';
import { CreateBroadcastDto } from './dto/create-broadcast.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../schemas';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('broadcasts')
export class BroadcastController {
  constructor(private readonly broadcastService: BroadcastService) {}

  @Post()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  createBroadcast(
    @Body() createBroadcastDto: CreateBroadcastDto,
    @CurrentUser() user: any,
  ) {
    return this.broadcastService.createBroadcast(createBroadcastDto, user);
  }

  @Get()
  getBroadcasts(@CurrentUser() user: any) {
    return this.broadcastService.getBroadcasts(user);
  }

  @Patch(':id/read')
  markAsRead(@Param('id') id: string, @CurrentUser() user: any) {
    return this.broadcastService.markAsRead(id, user);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  deleteBroadcast(@Param('id') id: string) {
    return this.broadcastService.deleteBroadcast(id);
  }
}
