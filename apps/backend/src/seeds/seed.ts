import mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import * as path from 'path';
import {
  UserSchema, CourseSchema, EnrollmentSchema, ClassSessionSchema,
  PermissionSchema, RolePermissionSchema, CounterSchema,
  Role, CourseType, ClassStatus
} from '../schemas';

dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/quran_lms';

async function main() {
  console.log(`Connecting to MongoDB at: ${MONGODB_URI}`);
  await mongoose.connect(MONGODB_URI);

  const User = mongoose.model('User', UserSchema);
  const Course = mongoose.model('Course', CourseSchema);
  const Enrollment = mongoose.model('Enrollment', EnrollmentSchema);
  const ClassSession = mongoose.model('ClassSession', ClassSessionSchema);
  const Permission = mongoose.model('Permission', PermissionSchema);
  const RolePermission = mongoose.model('RolePermission', RolePermissionSchema);
  const Counter = mongoose.model('Counter', CounterSchema);

  console.log('Clearing existing database collections...');
  await User.deleteMany({});
  await Course.deleteMany({});
  await Enrollment.deleteMany({});
  await ClassSession.deleteMany({});
  await Permission.deleteMany({});
  await RolePermission.deleteMany({});
  await Counter.deleteMany({});

  const defaultPassword = await bcrypt.hash('password123', 10);

  // Initialize Counter for studentId
  await Counter.create({ name: 'studentId', seq: 1000 });

  // 1. Seed Permissions
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
    const perm = await Permission.create(p);
    permissions.push(perm);
  }

  // 2. Admins
  const admin1 = await User.create({
    name: 'Admin One',
    email: 'admin1@lms.com',
    passwordHash: defaultPassword,
    role: Role.ADMIN,
    timezone: 'UTC',
  });
  await User.create({
    name: 'Admin Two',
    email: 'admin2@lms.com',
    passwordHash: defaultPassword,
    role: Role.ADMIN,
    timezone: 'UTC',
  });

  // Assign permissions to ADMIN
  for (const p of permissions) {
    await RolePermission.create({
      role: Role.ADMIN,
      permissionId: p._id,
      grantedBy: admin1._id,
    });
  }

  // 3. Teachers
  const teacherNames = [
    { name: 'Qari Muneeb', email: 'muneeb@lms.com' },
    { name: 'Sheikh Abdullah', email: 'abdullah@lms.com' },
    { name: 'Ustadh Asad', email: 'asad@lms.com' },
    { name: 'Qari Talha', email: 'talha@lms.com' },
    { name: 'Sheikh Aziz', email: 'aziz@lms.com' },
    { name: 'Qari Aamir', email: 'aamir@lms.com' },
    { name: 'Ustadh Aahil', email: 'aahil@lms.com' },
  ];

  const teachers = [];
  for (const t of teacherNames) {
    const teacher = await User.create({
      name: t.name,
      email: t.email,
      passwordHash: defaultPassword,
      role: Role.TEACHER,
      timezone: 'Asia/Karachi',
    });
    teachers.push(teacher);
  }

  // 4. Students
  const studentNames = ['Rayyan', 'Ahmed', 'Ahmed Shan', 'Arfan Rahman', 'Areeb', 'Mamud', 'Bassaro Silima', 'Mahamoud Silim', 'Munasar', 'Mahir', 'Aisha', 'Fatima'];
  const students = [];
  for (const name of studentNames) {
    const counterDoc = await Counter.findOneAndUpdate(
      { name: 'studentId' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    const s = await User.create({
      name,
      email: `${name.toLowerCase().replace(/\s/g, '')}@lms.com`,
      passwordHash: defaultPassword,
      role: Role.STUDENT,
      timezone: 'Europe/London',
      gender: name === 'Aisha' || name === 'Fatima' ? 'Female' : 'Male',
      dateOfBirth: new Date('2010-01-01'),
      studentId: counterDoc.seq,
    });
    students.push(s);
  }

  // 5. Reviewers
  await User.create({
    name: 'Reviewer One',
    email: 'rev1@lms.com',
    passwordHash: defaultPassword,
    role: Role.REVIEWER,
    timezone: 'UTC',
  });
  await User.create({
    name: 'Reviewer Two',
    email: 'rev2@lms.com',
    passwordHash: defaultPassword,
    role: Role.REVIEWER,
    timezone: 'UTC',
  });

  // 6. Courses
  const coursesData = [
    { title: 'Nazira Basics', type: CourseType.NAZIRA, curriculum: 'Basic Reading', teacherId: teachers[0]._id },
    { title: 'Tajweed Rules', type: CourseType.TAJWEED, curriculum: 'Makharij and Sifat', teacherId: teachers[1]._id },
    { title: 'Hifz Program', type: CourseType.HIFZ_UL_QURAN, curriculum: 'Memorization', teacherId: teachers[2]._id },
    { title: 'Islamic Studies', type: CourseType.ISLAMIC_STUDIES, curriculum: 'Fiqh and Seerah', teacherId: teachers[3]._id },
  ];

  const courses = [];
  for (const c of coursesData) {
    courses.push(await Course.create(c));
  }

  // 7. Enrollments
  for (let i = 0; i < students.length; i++) {
    await Enrollment.create({
      studentId: students[i]._id,
      courseId: courses[i % courses.length]._id,
    });
  }

  // 8. Class Sessions
  const startDate = new Date();
  startDate.setHours(9, 0, 0, 0);

  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    for (let tIdx = 0; tIdx < teachers.length; tIdx++) {
      const scheduledAt = new Date(startDate);
      scheduledAt.setDate(scheduledAt.getDate() + dayOffset);
      scheduledAt.setHours(9 + tIdx, 0, 0, 0);

      const course = courses[tIdx % courses.length];
      const student = students[tIdx % students.length];

      await ClassSession.create({
        courseId: course._id,
        teacherId: teachers[tIdx]._id,
        studentId: student._id,
        scheduledAt,
        durationMinutes: 30,
        status: ClassStatus.SCHEDULED,
      });
    }
  }

  console.log('MongoDB database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
