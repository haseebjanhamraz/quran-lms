import { Controller, Get, Post, Put, Patch, Delete, Body, Param, UseGuards, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { FileInterceptor } from '@nestjs/platform-express';
import { extname } from 'path';
import { randomUUID } from 'crypto';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const multer = require('multer');

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Patch('change-password')
  async changePassword(
    @CurrentUser() user: any,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(user.id, changePasswordDto);
  }

  @Patch('profile')
  async updateProfile(
    @CurrentUser() user: any,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(user.id, updateProfileDto);
  }

  @Post('profile/picture')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.diskStorage({
        destination: './uploads/avatars',
        filename: (req: any, file: any, cb: any) => {
          const uniqueSuffix = randomUUID() + extname(file.originalname);
          cb(null, uniqueSuffix);
        },
      }),
      fileFilter: (req: any, file: any, cb: any) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
          return cb(new BadRequestException('Only image files are allowed!'), false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadProfilePicture(
    @CurrentUser() user: any,
    @UploadedFile() file: any,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    const filePath = `/uploads/avatars/${file.filename}`;
    return this.usersService.updateProfilePicture(user.id, filePath);
  }

  @Get('role/:role')
  @Roles(Role.ADMIN, Role.REVIEWER)
  async findByRole(@Param('role') role: string) {
    const roleEnum = Role[role as keyof typeof Role];
    if (!roleEnum) {
      throw new BadRequestException('Invalid role');
    }
    return this.usersService.findByRole(roleEnum);
  }

  @Post()
  @Roles(Role.ADMIN)
  async create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles(Role.ADMIN)
  async findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  async findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Put(':id')
  @Roles(Role.ADMIN)
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  async remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Post(':id/picture')
  @Roles(Role.ADMIN)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.diskStorage({
        destination: './uploads/avatars',
        filename: (req: any, file: any, cb: any) => {
          const uniqueSuffix = randomUUID() + extname(file.originalname);
          cb(null, uniqueSuffix);
        },
      }),
      fileFilter: (req: any, file: any, cb: any) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
          return cb(new BadRequestException('Only image files are allowed!'), false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadUserPictureAdmin(
    @Param('id') id: string,
    @UploadedFile() file: any,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    const filePath = `/uploads/avatars/${file.filename}`;
    return this.usersService.updateProfilePicture(id, filePath);
  }
}
