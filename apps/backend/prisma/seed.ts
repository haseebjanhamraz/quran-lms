import { PrismaClient, Role } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from apps/backend/.env
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

  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'admin@lms.com' },
  });

  if (!existingAdmin) {
    const adminPasswordHash = await bcrypt.hash('adminpassword', 10);
    const admin = await prisma.user.create({
      data: {
        email: 'admin@lms.com',
        name: 'System Administrator',
        passwordHash: adminPasswordHash,
        role: Role.ADMIN,
      },
    });
    console.log(`Admin user created: ${admin.email}`);
  } else {
    console.log('Admin user already exists');
  }

  // Check if teacher exists
  const existingTeacher = await prisma.user.findUnique({
    where: { email: 'teacher@lms.com' },
  });

  if (!existingTeacher) {
    const teacherPasswordHash = await bcrypt.hash('teacherpassword', 10);
    const teacher = await prisma.user.create({
      data: {
        email: 'teacher@lms.com',
        name: 'Qari Ahmad',
        passwordHash: teacherPasswordHash,
        role: Role.TEACHER,
      },
    });
    console.log(`Teacher user created: ${teacher.email}`);
  }

  // Check if student exists
  const existingStudent = await prisma.user.findUnique({
    where: { email: 'student@lms.com' },
  });

  if (!existingStudent) {
    const studentPasswordHash = await bcrypt.hash('studentpassword', 10);
    const student = await prisma.user.create({
      data: {
        email: 'student@lms.com',
        name: 'Omar',
        passwordHash: studentPasswordHash,
        role: Role.STUDENT,
      },
    });
    console.log(`Student user created: ${student.email}`);
  }

  // Check if reviewer exists
  const existingReviewer = await prisma.user.findUnique({
    where: { email: 'reviewer@lms.com' },
  });

  if (!existingReviewer) {
    const reviewerPasswordHash = await bcrypt.hash('reviewerpassword', 10);
    const reviewer = await prisma.user.create({
      data: {
        email: 'reviewer@lms.com',
        name: 'QA Reviewer Bilal',
        passwordHash: reviewerPasswordHash,
        role: Role.REVIEWER,
      },
    });
    console.log(`Reviewer user created: ${reviewer.email}`);
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
