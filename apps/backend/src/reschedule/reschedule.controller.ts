import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role, RescheduleStatus } from '../schemas';
import { RescheduleService } from './reschedule.service';
import { CreateRescheduleRequestDto } from './dto/create-reschedule-request.dto';
import { ReviewRescheduleRequestDto } from './dto/review-reschedule-request.dto';

@Controller('reschedule-requests')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RescheduleController {
  constructor(private readonly rescheduleService: RescheduleService) {}

  @Post()
  @Roles(Role.STUDENT)
  async createRequest(
    @CurrentUser() user: any,
    @Body() dto: CreateRescheduleRequestDto,
  ) {
    return this.rescheduleService.createRequest(user.id, dto);
  }

  @Get()
  @Roles(Role.ADMIN)
  async getAllRequests(@Query('status') status?: RescheduleStatus) {
    return this.rescheduleService.getAllRequests(status);
  }

  @Get('my')
  @Roles(Role.STUDENT)
  async getMyRequests(@CurrentUser() user: any) {
    return this.rescheduleService.getStudentRequests(user.id);
  }

  @Put(':id/approve')
  @Roles(Role.ADMIN)
  async approveRequest(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: ReviewRescheduleRequestDto,
  ) {
    return this.rescheduleService.approveRequest(id, user.id, dto);
  }

  @Put(':id/reject')
  @Roles(Role.ADMIN)
  async rejectRequest(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: ReviewRescheduleRequestDto,
  ) {
    return this.rescheduleService.rejectRequest(id, user.id, dto);
  }
}
