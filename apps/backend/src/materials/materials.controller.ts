import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../schemas';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { MaterialsService } from './materials.service';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';

const multer = require('multer');

@Controller('materials')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MaterialsController {
  constructor(private readonly materialsService: MaterialsService) {}

  @Post('upload')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.TEACHER)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.memoryStorage(),
      limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
      fileFilter: (_req: any, file: any, cb: any) => {
        if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Only PDF documents are allowed.'), false);
        }
      },
    }),
  )
  async upload(
    @UploadedFile() file: any,
    @Body() createDto: CreateMaterialDto,
    @CurrentUser() user: any,
  ) {
    if (!file) {
      throw new BadRequestException('Please provide a valid PDF file.');
    }
    return this.materialsService.create(file, createDto, user.id);
  }

  @Get()
  async findAll(
    @Query('category') category?: string,
    @Query('targetLevel') targetLevel?: string,
    @Query('search') search?: string,
  ) {
    return this.materialsService.findAll({ category, targetLevel, search });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.materialsService.findOne(id);
  }

  @Post(':id/download')
  async recordDownload(@Param('id') id: string) {
    return this.materialsService.incrementDownload(id);
  }

  @Put(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async update(@Param('id') id: string, @Body() updateDto: UpdateMaterialDto) {
    return this.materialsService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async remove(@Param('id') id: string) {
    return this.materialsService.remove(id);
  }
}
