import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ExpenseStatus, Role } from '../schemas';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('dashboard')
  @Roles(Role.ADMIN, Role.HR)
  getDashboardStats() {
    return this.financeService.getDashboardStats();
  }

  @Get('expenses')
  @Roles(Role.ADMIN, Role.HR)
  findAllExpenses(@Query() query: any) {
    return this.financeService.findAllExpenses(query);
  }

  @Post('expenses')
  @Roles(Role.ADMIN, Role.HR)
  createExpense(@Body() createExpenseDto: CreateExpenseDto, @CurrentUser() user: any) {
    return this.financeService.createExpense(createExpenseDto, user.id);
  }

  @Patch('expenses/:id/status')
  @Roles(Role.ADMIN, Role.HR)
  updateExpenseStatus(
    @Param('id') id: string,
    @Body('status') status: ExpenseStatus,
    @CurrentUser() user: any,
  ) {
    return this.financeService.updateExpenseStatus(id, status, user.id);
  }

  @Get('income')
  @Roles(Role.ADMIN, Role.HR)
  findAllIncome(@Query() query: any) {
    return this.financeService.findAllIncome(query);
  }
}
