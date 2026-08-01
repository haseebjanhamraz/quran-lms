import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { FeesService } from './fees.service';
import { CreateFeeStructureDto } from './dto/create-fee-structure.dto';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../schemas';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('fees')
export class FeesController {
  constructor(private readonly feesService: FeesService) {}

  // Fee Structures
  @Post('structures')
  @Roles(Role.ADMIN, Role.HR)
  async createStructure(@Body() dto: CreateFeeStructureDto) {
    return this.feesService.createStructure(dto);
  }

  @Get('structures')
  @Roles(Role.ADMIN, Role.HR, Role.TEACHER)
  async findAllStructures() {
    return this.feesService.findAllStructures();
  }

  // Invoices
  @Post('invoices')
  @Roles(Role.ADMIN, Role.HR)
  async createInvoice(@Body() dto: CreateInvoiceDto, @CurrentUser() user: any) {
    return this.feesService.createInvoice(dto, user?.id);
  }

  @Post('invoices/generate-monthly')
  @Roles(Role.ADMIN, Role.HR)
  async autoGenerateMonthlyInvoices(@Body('billingMonth') billingMonth: string, @CurrentUser() user: any) {
    const month = billingMonth || new Date().toISOString().slice(0, 7);
    return this.feesService.autoGenerateMonthlyInvoices(month, user?.id);
  }

  @Get('invoices')
  @Roles(Role.ADMIN, Role.HR)
  async findAllInvoices(
    @Query('billingMonth') billingMonth?: string,
    @Query('status') status?: string,
    @Query('studentId') studentId?: string,
  ) {
    return this.feesService.findAllInvoices(billingMonth, status, studentId);
  }

  @Get('invoices/summary')
  @Roles(Role.ADMIN, Role.HR)
  async getRevenueSummary(@Query('billingMonth') billingMonth?: string) {
    return this.feesService.getRevenueSummary(billingMonth);
  }

  @Patch('invoices/:id/pay')
  @Roles(Role.ADMIN, Role.HR)
  async recordPayment(
    @Param('id') id: string,
    @Body('amount') amount: number,
    @Body('paymentMethod') paymentMethod?: string,
    @Body('referenceNumber') referenceNumber?: string,
    @Body('notes') notes?: string,
    @CurrentUser() user?: any,
  ) {
    return this.feesService.recordPayment(id, amount, paymentMethod, referenceNumber, notes, user?.id);
  }

  @Post('invoices/:id/send-reminder')
  @Roles(Role.ADMIN, Role.HR)
  async sendReminder(@Param('id') id: string) {
    return this.feesService.sendReminder(id);
  }
}
