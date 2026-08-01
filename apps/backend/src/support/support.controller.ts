import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { SupportService } from './support.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../schemas';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Get('dashboard')
  @Roles(Role.ADMIN, Role.HR)
  getDashboardStats() {
    return this.supportService.getDashboardStats();
  }

  @Get('tickets')
  findAll(@Query() query: any, @CurrentUser() user: any) {
    return this.supportService.findAll(query, user);
  }

  @Post('tickets')
  createTicket(@Body() createTicketDto: CreateTicketDto, @CurrentUser() user: any) {
    return this.supportService.createTicket(createTicketDto, user);
  }

  @Get('tickets/:id')
  findOne(@Param('id') id: string) {
    return this.supportService.findOne(id);
  }

  @Patch('tickets/:id')
  @Roles(Role.ADMIN, Role.HR)
  updateTicket(@Param('id') id: string, @Body() updateData: any) {
    return this.supportService.updateTicket(id, updateData);
  }

  @Post('tickets/:id/comments')
  addComment(
    @Param('id') id: string,
    @Body('comment') comment: string,
    @Body('isInternal') isInternal: boolean,
    @CurrentUser() user: any,
  ) {
    return this.supportService.addComment(id, comment, user, isInternal);
  }
}
