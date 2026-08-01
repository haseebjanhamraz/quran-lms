import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { SalaryPaymentsService } from './salary-payments.service';
import { CreateSalaryPaymentDto } from './dto/create-salary-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../schemas';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('salary-payments')
export class SalaryPaymentsController {
  constructor(private readonly salaryPaymentsService: SalaryPaymentsService) {}

  @Post()
  @Roles(Role.ADMIN, Role.HR)
  async create(@Body() createDto: CreateSalaryPaymentDto, @CurrentUser() user: any) {
    return this.salaryPaymentsService.create(createDto, user?.id);
  }

  @Get()
  @Roles(Role.ADMIN, Role.HR)
  async findAll(@Query('month') month?: string, @Query('teacherId') teacherId?: string) {
    return this.salaryPaymentsService.findAll(month, teacherId);
  }

  @Get('summary')
  @Roles(Role.ADMIN, Role.HR)
  async getSummary(@Query('month') month?: string) {
    const currentMonth = month || new Date().toISOString().slice(0, 7);
    return this.salaryPaymentsService.getSummary(currentMonth);
  }

  @Get('configs')
  @Roles(Role.ADMIN, Role.HR)
  async findAllConfigs() {
    return this.salaryPaymentsService.findAllConfigs();
  }

  @Put('configs/:teacherId')
  @Roles(Role.ADMIN, Role.HR)
  async upsertConfig(@Param('teacherId') teacherId: string, @Body() data: any) {
    return this.salaryPaymentsService.upsertConfig(teacherId, data);
  }

  @Get(':id/slip')
  @Roles(Role.ADMIN, Role.HR, Role.TEACHER)
  async generateSlip(@Param('id') id: string, @CurrentUser() user: any) {
    return this.salaryPaymentsService.generateSlip(id, user?.id);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.HR)
  async remove(@Param('id') id: string) {
    return this.salaryPaymentsService.remove(id);
  }
}
