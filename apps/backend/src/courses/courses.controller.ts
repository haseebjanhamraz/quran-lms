import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../schemas';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  // --- Subject Categories ---
  @Get('categories')
  async findAllCategories() {
    return this.coursesService.findAllCategories();
  }

  @Post('categories')
  @Roles(Role.ADMIN)
  async createCategory(@Body() dto: any) {
    return this.coursesService.createCategory(dto);
  }

  @Put('categories/:id')
  @Roles(Role.ADMIN)
  async updateCategory(@Param('id') id: string, @Body() dto: any) {
    return this.coursesService.updateCategory(id, dto);
  }

  @Delete('categories/:id')
  @Roles(Role.ADMIN)
  async removeCategory(@Param('id') id: string) {
    return this.coursesService.removeCategory(id);
  }

  @Post()
  @Roles(Role.ADMIN)
  async create(@Body() createCourseDto: CreateCourseDto) {
    return this.coursesService.create(createCourseDto);
  }

  @Get()
  async findAll() {
    return this.coursesService.findAll();
  }

  @Get('enrolled')
  async findEnrolledCourses(@CurrentUser() user: any) {
    return this.coursesService.findEnrolledCourses(user.id);
  }

  @Get('teacher/:teacherId')
  async findByTeacher(@Param('teacherId') teacherId: string) {
    return this.coursesService.findByTeacher(teacherId);
  }

  @Post('teacher/:teacherId/assign')
  @Roles(Role.ADMIN)
  async assignCoursesToTeacher(
    @Param('teacherId') teacherId: string,
    @Body('courseIds') courseIds: string[],
  ) {
    return this.coursesService.assignCoursesToTeacher(teacherId, courseIds);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.coursesService.findOne(id);
  }

  @Put(':id')
  @Roles(Role.ADMIN)
  async update(@Param('id') id: string, @Body() updateCourseDto: UpdateCourseDto) {
    return this.coursesService.update(id, updateCourseDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  async remove(@Param('id') id: string) {
    return this.coursesService.remove(id);
  }
}
