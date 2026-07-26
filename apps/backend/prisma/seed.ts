import { PrismaClient, Role, CourseType, ClassStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not defined in environment variables');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database with Prisma 7 adapter...');
  await prisma.rolePermission.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.classSession.deleteMany();
  await prisma.course.deleteMany();
  await prisma.user.deleteMany();

  const defaultPassword = await bcrypt.hash('password123', 10);

  // Seed Permissions
  const permissionsData = [
    { name: 'users.create', description: 'Create users', module: 'users', action: 'create' },
    { name: 'users.read', description: 'Read users', module: 'users', action: 'read' },
    { name: 'users.update', description: 'Update users', module: 'users', action: 'update' },
    { name: 'users.delete', description: 'Delete users', module: 'users', action: 'delete' },
    { name: 'courses.create', description: 'Create courses', module: 'courses', action: 'create' },
    { name: 'courses.read', description: 'Read courses', module: 'courses', action: 'read' },
    { name: 'courses.update', description: 'Update courses', module: 'courses', action: 'update' },
    { name: 'courses.delete', description: 'Delete courses', module: 'courses', action: 'delete' },
    { name: 'sessions.create', description: 'Create sessions', module: 'sessions', action: 'create' },
    { name: 'sessions.read', description: 'Read sessions', module: 'sessions', action: 'read' },
    { name: 'sessions.update', description: 'Update sessions', module: 'sessions', action: 'update' },
    { name: 'sessions.delete', description: 'Delete sessions', module: 'sessions', action: 'delete' },
  ];

  const permissions = [];
  for (const p of permissionsData) {
    const perm = await prisma.permission.create({ data: p });
    permissions.push(perm);
  }

  // Admins
  const admin1 = await prisma.user.create({
    data: { name: 'Admin One', email: 'admin1@lms.com', passwordHash: defaultPassword, role: Role.ADMIN, timezone: 'UTC' },
  });
  const admin2 = await prisma.user.create({
    data: { name: 'Admin Two', email: 'admin2@lms.com', passwordHash: defaultPassword, role: Role.ADMIN, timezone: 'UTC' },
  });

  // Assign all permissions to ADMIN
  for (const p of permissions) {
    await prisma.rolePermission.create({
      data: { role: Role.ADMIN, permissionId: p.id, grantedBy: admin1.id },
    });
  }

  // Teachers (7 Color-coded Teachers)
  const teacherNames = [
    { name: 'Qari Muneeb', email: 'muneeb@lms.com', color: '#10b981' }, // Green
    { name: 'Sheikh Abdullah', email: 'abdullah@lms.com', color: '#3b82f6' }, // Blue
    { name: 'Ustadh Asad', email: 'asad@lms.com', color: '#8b5cf6' }, // Purple
    { name: 'Qari Talha', email: 'talha@lms.com', color: '#f59e0b' }, // Orange
    { name: 'Sheikh Aziz', email: 'aziz@lms.com', color: '#ef4444' }, // Red
    { name: 'Qari Aamir', email: 'aamir@lms.com', color: '#14b8a6' }, // Teal
    { name: 'Ustadh Aahil', email: 'aahil@lms.com', color: '#ec4899' }, // Pink
  ];

  const teachers = [];
  for (const t of teacherNames) {
    const teacher = await prisma.user.create({
      data: { name: t.name, email: t.email, passwordHash: defaultPassword, role: Role.TEACHER, timezone: 'Asia/Karachi' },
    });
    teachers.push(teacher);
  }

  // Students (12+)
  const studentNames = ['Rayyan', 'Ahmed', 'Ahmed Shan', 'Arfan Rahman', 'Areeb', 'Mamud', 'Bassaro Silima', 'Mahamoud Silim', 'Munasar', 'Mahir', 'Aisha', 'Fatima'];
  const students = [];
  let studentIdCounter = 1001;
  for (const name of studentNames) {
    const s = await prisma.user.create({
      data: {
        name,
        email: `${name.toLowerCase().replace(/\s/g, '')}@lms.com`,
        passwordHash: defaultPassword,
        role: Role.STUDENT,
        timezone: 'Europe/London',
        gender: name === 'Aisha' || name === 'Fatima' ? 'Female' : 'Male',
        dateOfBirth: new Date('2010-01-01'),
        studentId: studentIdCounter++,
      },
    });
    students.push(s);
  }

  // Reviewers
  const reviewer1 = await prisma.user.create({
    data: { name: 'Reviewer One', email: 'rev1@lms.com', passwordHash: defaultPassword, role: Role.REVIEWER, timezone: 'UTC' },
  });
  const reviewer2 = await prisma.user.create({
    data: { name: 'Reviewer Two', email: 'rev2@lms.com', passwordHash: defaultPassword, role: Role.REVIEWER, timezone: 'UTC' },
  });

  // Courses
  const coursesData = [
    { title: 'Nazira Basics', type: CourseType.NAZIRA, curriculum: 'Basic Reading', teacherId: teachers[0].id },
    { title: 'Tajweed Rules', type: CourseType.TAJWEED, curriculum: 'Makharij and Sifat', teacherId: teachers[1].id },
    { title: 'Hifz Program', type: CourseType.HIFZ_UL_QURAN, curriculum: 'Memorization', teacherId: teachers[2].id },
    { title: 'Islamic Studies', type: CourseType.ISLAMIC_STUDIES, curriculum: 'Fiqh and Seerah', teacherId: teachers[3].id },
  ];

  const courses = [];
  for (const c of coursesData) {
    courses.push(await prisma.course.create({ data: c }));
  }

  // Enrollments
  for (let i = 0; i < students.length; i++) {
    await prisma.enrollment.create({
      data: { studentId: students[i].id, courseId: courses[i % courses.length].id },
    });
  }

  // Class Sessions (matching the weekly schedule matrix (09:00 - 03:00, Mon-Sun))
  // For each teacher, we'll create some sessions
  const startDate = new Date();
  startDate.setHours(9, 0, 0, 0); // Start at 09:00 today

  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    for (let tIdx = 0; tIdx < teachers.length; tIdx++) {
      const scheduledAt = new Date(startDate);
      scheduledAt.setDate(scheduledAt.getDate() + dayOffset);
      scheduledAt.setHours(9 + tIdx, 0, 0, 0); // Stagger times

      const course = courses[tIdx % courses.length];
      const student = students[tIdx % students.length];

      await prisma.classSession.create({
        data: {
          courseId: course.id,
          teacherId: teachers[tIdx].id,
          studentId: student.id,
          scheduledAt,
          durationMinutes: 30,
          status: ClassStatus.SCHEDULED,
        },
      });
    }
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
