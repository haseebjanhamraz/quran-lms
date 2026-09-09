import { Controller, Get, Post, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { DatabaseAdminService } from './database-admin.service';
import { CleanupDatabaseDto } from './dto/cleanup.dto';
import { SeedDatabaseDto } from './dto/seed.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role, User } from '../schemas';

@Controller('database-admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
export class DatabaseAdminController {
  constructor(private readonly databaseAdminService: DatabaseAdminService) {}

  @Get('stats')
  async getDatabaseStats() {
    return this.databaseAdminService.getDatabaseStats();
  }

  @Post('cleanup')
  @HttpCode(HttpStatus.OK)
  async cleanupDatabase(
    @Body() dto: CleanupDatabaseDto,
    @CurrentUser() user: User,
  ) {
    return this.databaseAdminService.cleanup(dto.targets, dto.confirmation, user);
  }

  @Post('seed')
  @HttpCode(HttpStatus.OK)
  async seedDatabase(
    @Body() dto: SeedDatabaseDto,
    @CurrentUser() user: User,
  ) {
    return this.databaseAdminService.seed(dto.type, user);
  }
}
