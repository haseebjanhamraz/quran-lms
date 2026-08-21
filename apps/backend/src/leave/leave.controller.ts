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
import { LeaveService } from './leave.service';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { ReviewLeaveRequestDto } from './dto/review-leave-request.dto';
import { UpdateLeaveBalanceDto } from './dto/update-leave-balance.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role, LeaveStatus } from '../schemas';

@Controller('leave')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LeaveController {
  constructor(private readonly leaveService: LeaveService) {}

  // 1. Submit Leave Request (Teacher)
  @Post()
  @Roles(Role.TEACHER)
  async createRequest(
    @CurrentUser() user: any,
    @Body() dto: CreateLeaveRequestDto,
  ): Promise<any> {
    return this.leaveService.createLeaveRequest(user.id, dto);
  }

  // 2. Get My Leaves (Teacher)
  @Get('my')
  @Roles(Role.TEACHER)
  async getMyLeaves(
    @CurrentUser() user: any,
    @Query('status') status?: LeaveStatus,
  ): Promise<any> {
    return this.leaveService.getTeacherLeaves(user.id, status);
  }

  // 3. Get My Leave Balance (Teacher)
  @Get('my/balance')
  @Roles(Role.TEACHER)
  async getMyBalance(
    @CurrentUser() user: any,
    @Query('year') year?: number,
  ): Promise<any> {
    return this.leaveService.getTeacherBalance(user.id, year ? Number(year) : undefined);
  }

  // 4. Cancel Leave Request (Teacher)
  @Put(':id/cancel')
  @Roles(Role.TEACHER)
  async cancelRequest(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ): Promise<any> {
    return this.leaveService.cancelLeaveRequest(id, user.id);
  }

  // 5. Admin: Get all leave requests
  @Get()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async getAllLeaves(
    @Query('status') status?: LeaveStatus,
    @Query('teacherId') teacherId?: string,
  ): Promise<any> {
    return this.leaveService.getAllLeaves(status, teacherId);
  }

  // 6. Admin: Get leave overview statistics
  @Get('stats')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async getLeaveStats(): Promise<any> {
    return this.leaveService.getLeaveStats();
  }

  // 7. Admin: Get specific teacher leave balance
  @Get('teacher/:teacherId/balance')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async getTeacherBalance(
    @Param('teacherId') teacherId: string,
    @Query('year') year?: number,
  ): Promise<any> {
    return this.leaveService.getTeacherBalance(teacherId, year ? Number(year) : undefined);
  }

  // 8. Admin: Update teacher leave balance quota
  @Put('teacher/:teacherId/balance')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async updateTeacherBalance(
    @Param('teacherId') teacherId: string,
    @Body() dto: UpdateLeaveBalanceDto,
    @Query('year') year?: number,
  ): Promise<any> {
    return this.leaveService.updateTeacherBalance(teacherId, dto, year ? Number(year) : undefined);
  }

  // 9. Admin: Approve leave request
  @Put(':id/approve')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async approveLeave(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: ReviewLeaveRequestDto,
  ): Promise<any> {
    return this.leaveService.approveLeave(id, user.id, dto);
  }

  // 10. Admin: Reject leave request
  @Put(':id/reject')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async rejectLeave(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: ReviewLeaveRequestDto,
  ): Promise<any> {
    return this.leaveService.rejectLeave(id, user.id, dto);
  }
}
