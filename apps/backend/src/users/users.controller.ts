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
import { Role, AccountStatus } from '../schemas';
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
      storage: multer.memoryStorage(),
      fileFilter: (req: any, file: any, cb: any) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|webp|gif)$/)) {
          return cb(new BadRequestException('Only image files (jpg, jpeg, png, webp, gif) are allowed!'), false);
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
    const filename = `${randomUUID()}.png`;
    const fs = require('fs');
    const path = require('path');
    const sharp = require('sharp');

    const uploadsDir = process.env.UPLOADS_DIR || path.join(process.cwd(), 'uploads');
    const avatarsDir = path.join(uploadsDir, 'avatars');
    if (!fs.existsSync(avatarsDir)) {
      fs.mkdirSync(avatarsDir, { recursive: true });
    }

    const outPath = path.join(avatarsDir, filename);
    await sharp(file.buffer)
      .resize(400, 400, { fit: 'cover', position: 'center' })
      .png({ quality: 90 })
      .toFile(outPath);

    const filePath = `/uploads/avatars/${filename}`;
    return this.usersService.updateProfilePicture(user.id, filePath);
  }

  @Post('upload-avatar')
  @Roles(Role.ADMIN, Role.HR, Role.TEACHER, Role.STUDENT, Role.SUPERVISOR)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.memoryStorage(),
      fileFilter: (req: any, file: any, cb: any) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|webp|gif)$/)) {
          return cb(new BadRequestException('Only image files are allowed!'), false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadStandaloneAvatar(@UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    const filename = `${randomUUID()}.png`;
    const fs = require('fs');
    const path = require('path');
    const sharp = require('sharp');

    const uploadsDir = process.env.UPLOADS_DIR || path.join(process.cwd(), 'uploads');
    const avatarsDir = path.join(uploadsDir, 'avatars');
    if (!fs.existsSync(avatarsDir)) {
      fs.mkdirSync(avatarsDir, { recursive: true });
    }

    const outPath = path.join(avatarsDir, filename);
    await sharp(file.buffer)
      .resize(400, 400, { fit: 'cover', position: 'center' })
      .png({ quality: 90 })
      .toFile(outPath);

    return { filePath: `/uploads/avatars/${filename}` };
  }

  @Get('role/:role')
  @Roles(Role.ADMIN, Role.SUPERVISOR)
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
      storage: multer.memoryStorage(),
      fileFilter: (req: any, file: any, cb: any) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|webp|gif)$/)) {
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
    const filename = `${randomUUID()}.png`;
    const fs = require('fs');
    const path = require('path');
    const sharp = require('sharp');

    const uploadsDir = process.env.UPLOADS_DIR || path.join(process.cwd(), 'uploads');
    const avatarsDir = path.join(uploadsDir, 'avatars');
    if (!fs.existsSync(avatarsDir)) {
      fs.mkdirSync(avatarsDir, { recursive: true });
    }

    const outPath = path.join(avatarsDir, filename);
    await sharp(file.buffer)
      .resize(400, 400, { fit: 'cover', position: 'center' })
      .png({ quality: 90 })
      .toFile(outPath);

    const filePath = `/uploads/avatars/${filename}`;
    return this.usersService.updateProfilePicture(id, filePath);
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN)
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { accountStatus: AccountStatus; reason?: string },
  ) {
    if (!body.accountStatus) {
      throw new BadRequestException('accountStatus is required');
    }
    return this.usersService.updateAccountStatus(id, body.accountStatus, body.reason);
  }

  @Post('appeal')
  async submitAppeal(
    @CurrentUser() user: any,
    @Body() body: { subject?: string; reason: string },
  ) {
    if (!body.reason) {
      throw new BadRequestException('Reason for appeal is required');
    }
    return this.usersService.submitAppeal(user.id, body);
  }

  @Delete(':id/permanent')
  @Roles(Role.ADMIN)
  async hardDelete(@Param('id') id: string) {
    return this.usersService.hardDelete(id);
  }
}
