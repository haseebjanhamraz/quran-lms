import * as dns from 'dns';
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

import mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import * as path from 'path';
import {
  UserSchema, TeacherSchema, StudentSchema,
  CourseSchema, EnrollmentSchema, ClassSessionSchema,
  PermissionSchema, RolePermissionSchema, CounterSchema,
  FeeStructureSchema, InvoiceSchema, SalaryPaymentSchema,
  SupervisorAssignmentSchema, WeeklyScheduleSlotSchema,
  MaterialSchema,
  Role, CourseType, ClassStatus, InvoiceStatus, PaymentMethod, DayOfWeek, MaterialCategory
} from '../schemas';

dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/quran_lms';

async function main() {
  console.log(`Connecting to MongoDB at: ${MONGODB_URI}`);
  await mongoose.connect(MONGODB_URI);

  const db = mongoose.connection.db;
  if (db) {
    console.log('Dropping all existing database collections & indexes (full reset)...');
    const collections = await db.listCollections().toArray();
    for (const c of collections) {
      try {
        await db.collection(c.name).drop();
      } catch (err) {
        // ignore if already dropped
      }
    }
    console.log('All collections and indexes dropped successfully.');
  }

  const User = mongoose.model('User', UserSchema);
  const Teacher = mongoose.model('Teacher', TeacherSchema);
  const Student = mongoose.model('Student', StudentSchema);
  const Course = mongoose.model('Course', CourseSchema);
  const Enrollment = mongoose.model('Enrollment', EnrollmentSchema);
  const ClassSession = mongoose.model('ClassSession', ClassSessionSchema);
  const Permission = mongoose.model('Permission', PermissionSchema);
  const RolePermission = mongoose.model('RolePermission', RolePermissionSchema);
  const Counter = mongoose.model('Counter', CounterSchema);
  const FeeStructure = mongoose.model('FeeStructure', FeeStructureSchema);
  const Invoice = mongoose.model('Invoice', InvoiceSchema);
  const SalaryPayment = mongoose.model('SalaryPayment', SalaryPaymentSchema);
  const SupervisorAssignment = mongoose.model('SupervisorAssignment', SupervisorAssignmentSchema);
  const WeeklyScheduleSlot = mongoose.model('WeeklyScheduleSlot', WeeklyScheduleSlotSchema);
  const Material = mongoose.model('Material', MaterialSchema);

  const defaultPassword = await bcrypt.hash('password123', 10);

  // ─────────────────────────────────────────────────────────────
  // 1. SEED PERMISSIONS & ROLE PERMISSIONS
  // ─────────────────────────────────────────────────────────────
  const modulesList = [
    'users', 'students', 'teachers', 'courses', 'schedule',
    'enrollments', 'fees', 'hr', 'supervisors', 'audit-logs', 'settings', 'feedback',
    'expenses', 'salary-config', 'support', 'reports', 'leave', 'materials'
  ];
  const actionsList = ['create', 'read', 'update', 'delete'];

  const permissionsData: any[] = [];
  for (const mod of modulesList) {
    for (const act of actionsList) {
      permissionsData.push({
        name: `${mod}.${act}`,
        description: `Can ${act} ${mod}`,
        module: mod,
        action: act,
      });
    }
  }

  const permissions = await Permission.insertMany(permissionsData);
  console.log(`Seeded ${permissions.length} permissions.`);

  // ─────────────────────────────────────────────────────────────
  // 2. SEED ADMINS & HR
  // ─────────────────────────────────────────────────────────────
  const adminUsersData = [
    { name: 'Chief Executive Officer (CEO)', email: 'ceo@lms.com', passwordHash: defaultPassword, role: Role.SUPER_ADMIN, timezone: 'UTC' },
    { name: 'Admin One', email: 'admin1@lms.com', passwordHash: defaultPassword, role: Role.ADMIN, timezone: 'UTC' },
    { name: 'Admin Two', email: 'admin2@lms.com', passwordHash: defaultPassword, role: Role.ADMIN, timezone: 'UTC' },
    { name: 'HR Manager', email: 'hr@lms.com', passwordHash: defaultPassword, role: Role.HR, timezone: 'UTC' },
  ];
  const adminUsers = await User.insertMany(adminUsersData);
  const admin1 = adminUsers[0];
  console.log('Seeded Super Admin, Admin & HR users.');

  // Grant role permissions
  const rolePermDocs: any[] = [];
  permissions.forEach((p) => {
    rolePermDocs.push({
      role: Role.SUPER_ADMIN,
      permissionId: p._id,
      grantedBy: admin1._id,
    });
    rolePermDocs.push({
      role: Role.ADMIN,
      permissionId: p._id,
      grantedBy: admin1._id,
    });
  });

  // HR permissions
  permissions.forEach((p) => {
    if (['fees', 'hr', 'expenses', 'salary-config', 'support', 'reports', 'students', 'teachers', 'enrollments', 'leave', 'materials'].includes(p.module)) {
      rolePermDocs.push({
        role: Role.HR,
        permissionId: p._id,
        grantedBy: admin1._id,
      });
    }
  });

  // Teacher permissions
  permissions.forEach((p) => {
    if (['courses', 'schedule', 'students', 'enrollments', 'feedback', 'leave', 'materials'].includes(p.module)) {
      if (p.action === 'read' || p.action === 'create' || (p.action === 'update' && (p.module === 'schedule' || p.module === 'leave'))) {
        rolePermDocs.push({
          role: Role.TEACHER,
          permissionId: p._id,
          grantedBy: admin1._id,
        });
      }
    }
  });

  // Supervisor permissions
  permissions.forEach((p) => {
    if (['courses', 'schedule', 'students', 'supervisors', 'feedback', 'materials'].includes(p.module)) {
      if (p.action === 'read' || p.action === 'create') {
        rolePermDocs.push({
          role: Role.SUPERVISOR,
          permissionId: p._id,
          grantedBy: admin1._id,
        });
      }
    }
  });

  // Student permissions
  permissions.forEach((p) => {
    if (['courses', 'schedule', 'enrollments', 'feedback', 'support', 'materials'].includes(p.module)) {
      if (p.action === 'read' || (p.action === 'create' && (p.module === 'feedback' || p.module === 'support'))) {
        rolePermDocs.push({
          role: Role.STUDENT,
          permissionId: p._id,
          grantedBy: admin1._id,
        });
      }
    }
  });

  await RolePermission.insertMany(rolePermDocs);

  // ─────────────────────────────────────────────────────────────
  // STEP 1: ADD TEACHERS
  // ─────────────────────────────────────────────────────────────
  const teacherConfigs = [
    { name: 'Qari Muneeb', email: 'muneeb@lms.com', spec: 'Nazira & Tajweed', salary: 35000, empId: 'EMP-1001', courseTitle: 'Nazira & Basic Quranic Reading', courseType: CourseType.NAZIRA, curriculum: 'Qaida and Nazira of 30 Juz' },
    { name: 'Sheikh Abdullah', email: 'abdullah@lms.com', spec: 'Tajweed Rules & Makharij', salary: 40000, empId: 'EMP-1002', courseTitle: 'Advanced Tajweed & Makharij', courseType: CourseType.TAJWEED, curriculum: 'Ahkam-e-Tajweed, Sifat and Waqf Rules' },
    { name: 'Ustadh Asad', email: 'asad@lms.com', spec: 'Hifz-ul-Quran', salary: 45000, empId: 'EMP-1003', courseTitle: 'Full Hifz-ul-Quran Program', courseType: CourseType.HIFZ_UL_QURAN, curriculum: 'Complete 30 Paras Memorization with Revision' },
    { name: 'Qari Talha', email: 'talha@lms.com', spec: 'Islamic Studies & Fiqh', salary: 38000, empId: 'EMP-1004', courseTitle: 'Islamic Studies, Fiqh & Duas', courseType: CourseType.ISLAMIC_STUDIES, curriculum: 'Daily Adhkar, Masnoon Duas, Fiqh and Seerah' },
    { name: 'Sheikh Aziz', email: 'aziz@lms.com', spec: 'Quran Translation & Tafseer', salary: 42000, empId: 'EMP-1005', courseTitle: 'Quran Translation & Tafseer', courseType: CourseType.ISLAMIC_STUDIES, curriculum: 'Word-by-word Translation and Tafseer of Surahs' },
    { name: 'Qari Aamir', email: 'aamir@lms.com', spec: 'Qiraat & Voice Modulation', salary: 36000, empId: 'EMP-1006', courseTitle: 'Qiraat-e-Sabaa & Voice Melodies', courseType: CourseType.TAJWEED, curriculum: 'The 7 Styles of Quranic Recitation' },
    { name: 'Ustadh Aahil', email: 'aahil@lms.com', spec: 'Noorani & Madani Qaida', salary: 35000, empId: 'EMP-1007', courseTitle: 'Noorani & Madani Qaida for Kids', courseType: CourseType.NAZIRA, curriculum: 'Letter recognition, Harakat, Tanween & Sukoon' },
  ];

  const teacherUsersData = teacherConfigs.map((t) => ({
    name: t.name,
    email: t.email,
    passwordHash: defaultPassword,
    role: Role.TEACHER,
    timezone: 'Asia/Karachi',
    country: 'PK',
    phone: '+92 300 1234567',
  }));
  const teacherUsers = await User.insertMany(teacherUsersData);

  const teacherProfileDocs = teacherUsers.map((teacherUser, idx) => {
    const t = teacherConfigs[idx];
    return {
      userId: teacherUser._id,
      profile: {
        specialization: t.spec,
        joiningDate: new Date('2023-01-15'),
        qualification: 'Certified Hafiz & Qari (Wifaq-ul-Madaris)',
        salary: t.salary,
        employeeId: t.empId,
        bio: `Experienced ${t.spec} instructor with over 8 years of teaching experience.`,
        guarantors: [
          {
            name: `${t.name.split(' ')[1] || 'Senior'} Guardian`,
            phone: '+92 300 1234567',
            email: `guarantor1.${t.email}`,
            relationship: 'Father',
            cnicOrId: '35202-1234567-1',
            address: 'Lahore, Pakistan',
          },
        ],
      },
    };
  });
  await Teacher.insertMany(teacherProfileDocs);
  console.log(`✅ STEP 1: Seeded ${teacherUsers.length} Teachers.`);

  // ─────────────────────────────────────────────────────────────
  // STEP 2: ASSIGN TEACHERS TO COURSES
  // ─────────────────────────────────────────────────────────────
  const coursesData = teacherConfigs.map((cfg, idx) => ({
    title: cfg.courseTitle,
    type: cfg.courseType,
    curriculum: cfg.curriculum,
    teacherId: teacherUsers[idx]._id,
  }));
  const courses = await Course.insertMany(coursesData);
  console.log(`✅ STEP 2: Seeded ${courses.length} Courses assigned to Teachers.`);

  // Fee Structures for each Course
  const feeStructuresData = courses.map((c, idx) => ({
    courseId: c._id,
    monthlyFee: [45, 55, 75, 40, 50, 45, 35][idx],
    registrationFee: 15,
    currency: 'USD',
    description: `Standard monthly fee structure for ${c.title}`,
  }));
  await FeeStructure.insertMany(feeStructuresData);

  // ─────────────────────────────────────────────────────────────
  // SEED SUPERVISORS (Assigned to Teachers)
  // ─────────────────────────────────────────────────────────────
  const supervisorUsersData = [
    { name: 'Supervisor Qari Tariq', email: 'supervisor1@lms.com', passwordHash: defaultPassword, role: Role.SUPERVISOR, timezone: 'Asia/Karachi', country: 'PK' },
    { name: 'Supervisor Mufti Bilal', email: 'supervisor2@lms.com', passwordHash: defaultPassword, role: Role.SUPERVISOR, timezone: 'Asia/Karachi', country: 'PK' },
  ];
  const supervisorUsers = await User.insertMany(supervisorUsersData);

  // Assign teachers directly to supervisors
  await SupervisorAssignment.insertMany([
    { supervisorId: supervisorUsers[0]._id, teacherId: teacherUsers[0]._id, courseId: courses[0]._id },
    { supervisorId: supervisorUsers[0]._id, teacherId: teacherUsers[1]._id, courseId: courses[1]._id },
    { supervisorId: supervisorUsers[0]._id, teacherId: teacherUsers[2]._id, courseId: courses[2]._id },
    { supervisorId: supervisorUsers[1]._id, teacherId: teacherUsers[3]._id, courseId: courses[3]._id },
    { supervisorId: supervisorUsers[1]._id, teacherId: teacherUsers[4]._id, courseId: courses[4]._id },
    { supervisorId: supervisorUsers[1]._id, teacherId: teacherUsers[5]._id, courseId: courses[5]._id },
    { supervisorId: supervisorUsers[1]._id, teacherId: teacherUsers[6]._id, courseId: courses[6]._id },
  ]);
  console.log('Seeded Supervisors assigned directly to Teachers.');

  // ─────────────────────────────────────────────────────────────
  // STEP 3: ADD STUDENTS WITH SCHEDULE DAYS & TIMES AND ASSIGN TEACHERS
  // ─────────────────────────────────────────────────────────────
  const studentConfigs = [
    {
      name: 'Rayyan Khan',
      preferredName: 'Rayyan',
      email: 'rayyan@lms.com',
      tz: 'Europe/London',
      country: 'GB',
      guardian: 'Kamran Khan',
      phone: '+44 7700 900077',
      teacherIdx: 0, // Qari Muneeb
      classDays: [
        { day: 'Mon', time: '16:00' },
        { day: 'Tue', time: '16:00' },
        { day: 'Wed', time: '16:00' },
        { day: 'Thu', time: '16:00' },
        { day: 'Fri', time: '16:00' },
      ],
      duration: 30,
      monthlyFee: 50,
      currency: 'GBP',
      tier: 'Beginner',
    },
    {
      name: 'Ahmed Bilal',
      preferredName: 'Ahmed',
      email: 'ahmed@lms.com',
      tz: 'Asia/Karachi',
      country: 'PK',
      guardian: 'Bilal Ahmed',
      phone: '+92 321 4455667',
      teacherIdx: 1, // Sheikh Abdullah
      classDays: [
        { day: 'Mon', time: '17:00' },
        { day: 'Wed', time: '17:00' },
        { day: 'Fri', time: '17:00' },
      ],
      duration: 60,
      monthlyFee: 12000,
      currency: 'PKR',
      tier: 'Intermediate',
    },
    {
      name: 'Ahmed Shan',
      preferredName: 'Shan',
      email: 'ahmedshan@lms.com',
      tz: 'America/New_York',
      country: 'US',
      guardian: 'Shan Mohammad',
      phone: '+1 555 0192',
      teacherIdx: 2, // Ustadh Asad (Hifz)
      classDays: [
        { day: 'Tue', time: '18:00' },
        { day: 'Thu', time: '18:00' },
        { day: 'Sat', time: '18:00' },
      ],
      duration: 60,
      monthlyFee: 75,
      currency: 'USD',
      tier: 'Advanced',
    },
    {
      name: 'Arfan Rahman',
      preferredName: 'Arfan',
      email: 'arfan@lms.com',
      tz: 'Europe/London',
      country: 'GB',
      guardian: 'Mustafa Rahman',
      phone: '+44 7700 900088',
      teacherIdx: 3, // Qari Talha (Islamic Studies)
      classDays: [
        { day: 'Mon', time: '15:00' },
        { day: 'Tue', time: '15:00' },
        { day: 'Wed', time: '15:00' },
        { day: 'Thu', time: '15:00' },
        { day: 'Fri', time: '15:00' },
      ],
      duration: 30,
      monthlyFee: 45,
      currency: 'GBP',
      tier: 'Beginner',
    },
    {
      name: 'Areeb Farhan',
      preferredName: 'Areeb',
      email: 'areeb@lms.com',
      tz: 'Asia/Karachi',
      country: 'PK',
      guardian: 'Farhan Areeb',
      phone: '+92 300 5566778',
      teacherIdx: 4, // Sheikh Aziz (Translation & Tafseer)
      classDays: [
        { day: 'Mon', time: '16:30' },
        { day: 'Tue', time: '16:30' },
        { day: 'Wed', time: '16:30' },
        { day: 'Thu', time: '16:30' },
      ],
      duration: 60,
      monthlyFee: 14000,
      currency: 'PKR',
      tier: 'Intermediate',
    },
    {
      name: 'Mamud Omar',
      preferredName: 'Mamud',
      email: 'mamud@lms.com',
      tz: 'America/Chicago',
      country: 'US',
      guardian: 'Omar Mamud',
      phone: '+1 312 555 0143',
      teacherIdx: 5, // Qari Aamir (Qiraat)
      classDays: [
        { day: 'Mon', time: '19:00' },
        { day: 'Wed', time: '19:00' },
        { day: 'Fri', time: '19:00' },
      ],
      duration: 30,
      monthlyFee: 45,
      currency: 'USD',
      tier: 'Intermediate',
    },
    {
      name: 'Bassaro Silima',
      preferredName: 'Bassaro',
      email: 'bassaro@lms.com',
      tz: 'Europe/Paris',
      country: 'FR',
      guardian: 'Silima Bassaro',
      phone: '+33 1 42 68 55 00',
      teacherIdx: 6, // Ustadh Aahil (Noorani Qaida)
      classDays: [
        { day: 'Mon', time: '14:00' },
        { day: 'Tue', time: '14:00' },
        { day: 'Wed', time: '14:00' },
        { day: 'Thu', time: '14:00' },
        { day: 'Fri', time: '14:00' },
      ],
      duration: 30,
      monthlyFee: 40,
      currency: 'EUR',
      tier: 'Beginner',
    },
    {
      name: 'Mahamoud Silim',
      preferredName: 'Mahamoud',
      email: 'mahamoud@lms.com',
      tz: 'Europe/Paris',
      country: 'FR',
      guardian: 'Silim Mahamoud',
      phone: '+33 1 42 68 55 11',
      teacherIdx: 0, // Qari Muneeb
      classDays: [
        { day: 'Tue', time: '17:30' },
        { day: 'Thu', time: '17:30' },
      ],
      duration: 30,
      monthlyFee: 30,
      currency: 'EUR',
      tier: 'Beginner',
    },
    {
      name: 'Munasar Hassan',
      preferredName: 'Munasar',
      email: 'munasar@lms.com',
      tz: 'America/Los_Angeles',
      country: 'US',
      guardian: 'Hassan Munasar',
      phone: '+1 213 555 0188',
      teacherIdx: 1, // Sheikh Abdullah
      classDays: [
        { day: 'Mon', time: '16:00' },
        { day: 'Tue', time: '16:00' },
        { day: 'Wed', time: '16:00' },
        { day: 'Thu', time: '16:00' },
        { day: 'Fri', time: '16:00' },
      ],
      duration: 30,
      monthlyFee: 55,
      currency: 'USD',
      tier: 'Intermediate',
    },
    {
      name: 'Mahir Javed',
      preferredName: 'Mahir',
      email: 'mahir@lms.com',
      tz: 'Asia/Karachi',
      country: 'PK',
      guardian: 'Javed Mahir',
      phone: '+92 333 8899001',
      teacherIdx: 2, // Ustadh Asad
      classDays: [
        { day: 'Mon', time: '18:30' },
        { day: 'Tue', time: '18:30' },
        { day: 'Wed', time: '18:30' },
      ],
      duration: 60,
      monthlyFee: 15000,
      currency: 'PKR',
      tier: 'Advanced',
    },
    {
      name: 'Aisha Zubair',
      preferredName: 'Aisha',
      email: 'aisha@lms.com',
      tz: 'Europe/London',
      country: 'GB',
      guardian: 'Zubair Fatima',
      phone: '+44 7700 900099',
      teacherIdx: 3, // Qari Talha
      classDays: [
        { day: 'Mon', time: '15:30' },
        { day: 'Tue', time: '15:30' },
        { day: 'Wed', time: '15:30' },
        { day: 'Thu', time: '15:30' },
        { day: 'Fri', time: '15:30' },
      ],
      duration: 30,
      monthlyFee: 45,
      currency: 'GBP',
      tier: 'Beginner',
    },
    {
      name: 'Fatima Rashid',
      preferredName: 'Fatima',
      email: 'fatima@lms.com',
      tz: 'Asia/Karachi',
      country: 'PK',
      guardian: 'Rashid Ali',
      phone: '+92 312 9900112',
      teacherIdx: 4, // Sheikh Aziz
      classDays: [
        { day: 'Mon', time: '16:00' },
        { day: 'Wed', time: '16:00' },
        { day: 'Fri', time: '16:00' },
      ],
      duration: 60,
      monthlyFee: 12000,
      currency: 'PKR',
      tier: 'Intermediate',
    },
  ];

  const studentUsersData = studentConfigs.map((cfg) => ({
    name: cfg.name,
    preferredName: cfg.preferredName,
    email: cfg.email,
    passwordHash: defaultPassword,
    role: Role.STUDENT,
    timezone: cfg.tz,
    country: cfg.country,
    phone: cfg.phone,
  }));
  const studentUsers = await User.insertMany(studentUsersData);

  let currentStudentId = 1000;
  const studentProfileDocs = studentUsers.map((studentUser, idx) => {
    const cfg = studentConfigs[idx];
    const assignedTeacherUser = teacherUsers[cfg.teacherIdx];
    currentStudentId += 1;

    return {
      userId: studentUser._id,
      studentId: currentStudentId,
      profile: {
        gender: cfg.name.startsWith('Aisha') || cfg.name.startsWith('Fatima') ? 'Female' : 'Male',
        dateOfBirth: new Date('2014-06-15'),
        enrollmentDate: new Date(),
        studentStatus: 'Regular',
        trialStatus: 'N/A',
        discontinued: false,
        guardianName: cfg.guardian,
        guardianPhone: cfg.phone,
        guardianEmail: `guardian.${cfg.email}`,
        guardianType: 'Father',
        classDuration: cfg.duration,
        classesPerWeek: cfg.classDays.length,
        classDays: cfg.classDays,
        tier: cfg.tier,
        monthlyFee: cfg.monthlyFee,
        currency: cfg.currency,
        assignedTeacher: assignedTeacherUser._id,
        noteToTeacher: `Focus on correct makharij and Tajweed. Student is at ${cfg.tier} level.`,
      },
    };
  });
  await Student.insertMany(studentProfileDocs);
  await Counter.create({ name: 'studentId', seq: currentStudentId });
  console.log(`✅ STEP 3: Seeded ${studentUsers.length} Students with assigned Teachers, Days & Times.`);

  // Enrollments: Link student to the assigned Teacher's course
  const enrollmentDocs = studentUsers.map((studentUser, idx) => {
    const cfg = studentConfigs[idx];
    const assignedCourse = courses[cfg.teacherIdx];
    return {
      studentId: studentUser._id,
      courseId: assignedCourse._id,
    };
  });
  await Enrollment.insertMany(enrollmentDocs);
  console.log(`Seeded ${enrollmentDocs.length} Enrollments.`);

  // ─────────────────────────────────────────────────────────────
  // STEP 4: SEED WEEKLY SCHEDULE SLOTS & LIVE/HISTORICAL CLASS SESSIONS
  // ─────────────────────────────────────────────────────────────
  const dayKeyToDayOfWeek: Record<string, DayOfWeek> = {
    Mon: DayOfWeek.MONDAY,
    Tue: DayOfWeek.TUESDAY,
    Wed: DayOfWeek.WEDNESDAY,
    Thu: DayOfWeek.THURSDAY,
    Fri: DayOfWeek.FRIDAY,
    Sat: DayOfWeek.SATURDAY,
    Sun: DayOfWeek.SUNDAY,
  };

  const dayKeyToDayNumber: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  const weeklySlotDocs: any[] = [];
  const usedSlotKeys = new Set<string>();

  studentConfigs.forEach((cfg, sIdx) => {
    const studentUser = studentUsers[sIdx];
    const teacherUser = teacherUsers[cfg.teacherIdx];
    const course = courses[cfg.teacherIdx];

    cfg.classDays.forEach((slot, dayIdx) => {
      const fullDay = dayKeyToDayOfWeek[slot.day] || DayOfWeek.MONDAY;
      const [h, m] = slot.time.split(':').map(Number);
      const endH = Math.floor((h * 60 + m + cfg.duration) / 60) % 24;
      const endM = (h * 60 + m + cfg.duration) % 60;
      const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
      const timeSlotIndex = (h - 8) >= 0 ? (h - 8) : dayIdx;

      const slotKey = `${fullDay}-${timeSlotIndex}`;
      if (!usedSlotKeys.has(slotKey)) {
        usedSlotKeys.add(slotKey);
        weeklySlotDocs.push({
          dayOfWeek: fullDay,
          timeSlotIndex,
          startTime: slot.time,
          endTime,
          teacherId: teacherUser._id,
          studentId: studentUser._id,
          courseId: course._id,
          isRecurring: true,
          isActive: true,
        });
      }
    });
  });

  await WeeklyScheduleSlot.insertMany(weeklySlotDocs);
  console.log(`✅ STEP 4: Seeded ${weeklySlotDocs.length} Weekly Schedule Slots.`);

  // Seed Today's, Yesterday's and Upcoming Class Sessions for all Students
  const sessionDocs: any[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Generate sessions for past 3 days to next 7 days matching student schedules
  for (let offset = -3; offset <= 7; offset++) {
    const sessionDate = new Date(today);
    sessionDate.setDate(sessionDate.getDate() + offset);
    const dayOfWeekNum = sessionDate.getDay(); // 0 = Sun, 1 = Mon...

    studentConfigs.forEach((cfg, sIdx) => {
      const studentUser = studentUsers[sIdx];
      const teacherUser = teacherUsers[cfg.teacherIdx];
      const course = courses[cfg.teacherIdx];

      const matchingSlot = cfg.classDays.find((d) => dayKeyToDayNumber[d.day] === dayOfWeekNum);
      if (matchingSlot) {
        const [h, m] = matchingSlot.time.split(':').map(Number);
        const scheduledAt = new Date(sessionDate);
        scheduledAt.setHours(h, m, 0, 0);

        let status = ClassStatus.SCHEDULED;
        if (offset < 0) {
          status = ClassStatus.COMPLETED;
        } else if (offset === 0) {
          const currentHour = new Date().getHours();
          if (h < currentHour) status = ClassStatus.COMPLETED;
          else if (h === currentHour) status = ClassStatus.LIVE;
          else status = ClassStatus.SCHEDULED;
        }

        sessionDocs.push({
          courseId: course._id,
          teacherId: teacherUser._id,
          studentId: studentUser._id,
          scheduledAt,
          durationMinutes: cfg.duration,
          status,
          zoomJoinUrl: `http://localhost:3000/classroom/${studentUser._id}`,
        });
      }
    });
  }

  await ClassSession.insertMany(sessionDocs);
  console.log(`✅ Seeded ${sessionDocs.length} Class Sessions matching Student Schedules.`);

  // ─────────────────────────────────────────────────────────────
  // STEP 5: SEED PDF MATERIALS
  // ─────────────────────────────────────────────────────────────
  const sampleMaterials = [
    {
      title: 'Noorani Qaida with English Instructions',
      description: 'Standard beginner Arabic alphabet and pronunciation primer for young learners.',
      category: MaterialCategory.QAIDA,
      targetLevel: 'Beginner',
      courseId: courses[6]._id,
      fileName: 'noorani_qaida_complete.pdf',
      fileUrl: '/uploads/materials/sample_noorani_qaida.pdf',
      fileSize: 4520000,
      mimeType: 'application/pdf',
      uploadedBy: admin1._id,
      downloadsCount: 34,
    },
    {
      title: 'Essential Tajweed Rules Handbook',
      description: 'Comprehensive guide covering Makharij, Noon Sakinah, Meem Sakinah and Mudood rules.',
      category: MaterialCategory.TAJWEED,
      targetLevel: 'Intermediate',
      courseId: courses[1]._id,
      fileName: 'tajweed_rules_handbook.pdf',
      fileUrl: '/uploads/materials/sample_tajweed_rules.pdf',
      fileSize: 2840000,
      mimeType: 'application/pdf',
      uploadedBy: admin1._id,
      downloadsCount: 68,
    },
    {
      title: 'Juz 30 (Amma Para) with Color Coded Tajweed',
      description: 'Complete 30th Juz of the Holy Quran with high resolution tajweed color coding.',
      category: MaterialCategory.QURAN_PARAH,
      targetLevel: 'Intermediate',
      courseId: courses[2]._id,
      fileName: 'juz_30_tajweed_colored.pdf',
      fileUrl: '/uploads/materials/sample_juz_30.pdf',
      fileSize: 8900000,
      mimeType: 'application/pdf',
      uploadedBy: admin1._id,
      downloadsCount: 112,
    },
    {
      title: 'Daily Masnoon Duas & Morning/Evening Adhkar',
      description: 'Authentic Fortress of the Muslim supplications with Arabic, transliteration and translation.',
      category: MaterialCategory.DUAS_ADHKAR,
      targetLevel: 'All Levels',
      courseId: courses[3]._id,
      fileName: 'masnoon_duas_collection.pdf',
      fileUrl: '/uploads/materials/sample_masnoon_duas.pdf',
      fileSize: 1750000,
      mimeType: 'application/pdf',
      uploadedBy: admin1._id,
      downloadsCount: 95,
    },
    {
      title: 'Basic Islamic Studies: Pillars of Islam & Iman',
      description: 'Workbook for students covering Shahadah, Salah, Sawm, Zakah, and Hajj fundamentals.',
      category: MaterialCategory.ISLAMIC_STUDIES,
      targetLevel: 'Beginner',
      courseId: courses[4]._id,
      fileName: 'pillars_of_islam_workbook.pdf',
      fileUrl: '/uploads/materials/sample_islamic_studies.pdf',
      fileSize: 3200000,
      mimeType: 'application/pdf',
      uploadedBy: admin1._id,
      downloadsCount: 52,
    },
  ];

  await Material.insertMany(sampleMaterials);
  console.log(`✅ Seeded ${sampleMaterials.length} Course PDF Materials.`);

  // ─────────────────────────────────────────────────────────────
  // STEP 6: SEED INVOICES & SALARIES
  // ─────────────────────────────────────────────────────────────
  const currentMonth = new Date().toISOString().slice(0, 7);
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 10);

  const invoiceDocs = studentUsers.map((studentUser, idx) => {
    const cfg = studentConfigs[idx];
    const course = courses[cfg.teacherIdx];
    const isPaid = idx % 2 === 0;

    return {
      studentId: studentUser._id,
      courseId: course._id,
      amount: cfg.monthlyFee,
      currency: cfg.currency,
      dueDate,
      status: isPaid ? InvoiceStatus.PAID : InvoiceStatus.PENDING,
      paidAmount: isPaid ? cfg.monthlyFee : 0,
      paidDate: isPaid ? new Date() : undefined,
      paymentMethod: isPaid ? PaymentMethod.CASH : undefined,
      billingMonth: currentMonth,
      recordedBy: admin1._id,
    };
  });
  await Invoice.insertMany(invoiceDocs);
  console.log(`Seeded ${invoiceDocs.length} Invoices.`);

  const salaryDocs = teacherUsers.map((tUser, idx) => ({
    teacherId: tUser._id,
    amount: teacherConfigs[idx].salary,
    month: currentMonth,
    paymentDate: new Date(),
    paymentMethod: PaymentMethod.CASH,
    notes: `Monthly salary disbursement for ${teacherConfigs[idx].name}`,
    recordedBy: admin1._id,
  }));
  await SalaryPayment.insertMany(salaryDocs);
  console.log(`Seeded ${salaryDocs.length} Salary Payments.`);

  console.log('\n=============================================================');
  console.log('🎉 DATABASE RESET & SEEDING COMPLETED SUCCESSFULLY!');
  console.log('=============================================================');
  console.log('Flow verified:');
  console.log('  1. 7 Teachers added with specializations and salaries');
  console.log('  2. 7 Courses created & assigned to Teachers');
  console.log('  3. 12 Students admitted with Schedule Days & Times and assigned Teachers');
  console.log('  4. Weekly Schedule & Class Sessions generated matching student timetables');
  console.log('  5. Materials (PDF), Invoices, Salaries and Permissions populated');
  console.log('=============================================================\n');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
