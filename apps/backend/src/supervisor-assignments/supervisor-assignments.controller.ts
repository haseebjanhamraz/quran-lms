import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { SupervisorAssignmentsService } from './supervisor-assignments.service';
import { CreateSupervisorAssignmentDto } from './dto/create-supervisor-assignment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../schemas';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('supervisor-assignments')
export class SupervisorAssignmentsController {
  constructor(private readonly supervisorAssignmentsService: SupervisorAssignmentsService) {}

  @Post()
  @Roles(Role.ADMIN)
  async create(@Body() createDto: CreateSupervisorAssignmentDto) {
    return this.supervisorAssignmentsService.create(createDto);
  }

  @Get()
  @Roles(Role.ADMIN)
  async findAll() {
    return this.supervisorAssignmentsService.findAll();
  }

  @Get('supervisor/:supervisorId')
  @Roles(Role.ADMIN, Role.SUPERVISOR)
  async findBySupervisor(@Param('supervisorId') supervisorId: string) {
    return this.supervisorAssignmentsService.findBySupervisor(supervisorId);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  async remove(@Param('id') id: string) {
    return this.supervisorAssignmentsService.remove(id);
  }
}
