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
  SupervisorAssignmentSchema,
  Role, CourseType, ClassStatus, InvoiceStatus, PaymentMethod
} from '../schemas';

dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/quran_lms';

async function main() {
  console.log(`Connecting to MongoDB at: ${MONGODB_URI}`);
  await mongoose.connect(MONGODB_URI);

  const db = mongoose.connection.db;
  if (db) {
    console.log('Clearing all existing database collections...');
    const collections = await db.listCollections().toArray();
    await Promise.all(
      collections.map((c) =>
        db.collection(c.name).deleteMany({}).catch((err) => {
          console.warn(`Could not clear ${c.name}:`, err);
        })
      )
    );
    console.log('All collections cleared successfully.');
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

  const defaultPassword = await bcrypt.hash('password123', 10);

  // 1. Seed Permissions across all modules
  const modulesList = [
    'users', 'students', 'teachers', 'courses', 'schedule',
    'enrollments', 'fees', 'hr', 'supervisors', 'audit-logs', 'settings', 'feedback'
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

  // 2. Admins
  const adminUsersData = [
    { name: 'Admin One', email: 'admin1@lms.com', passwordHash: defaultPassword, role: Role.ADMIN, timezone: 'UTC' },
    { name: 'Admin Two', email: 'admin2@lms.com', passwordHash: defaultPassword, role: Role.ADMIN, timezone: 'UTC' },
  ];
  const adminUsers = await User.insertMany(adminUsersData);
  const admin1 = adminUsers[0];
  console.log('Seeded 2 Admin users.');

  // Role Permissions for Admin (all permissions)
  const rolePermDocs: any[] = permissions.map((p) => ({
    role: Role.ADMIN,
    permissionId: p._id,
    grantedBy: admin1._id,
  }));

  // Role Permissions for Teacher
  permissions.forEach((p) => {
    if (['courses', 'schedule', 'students', 'enrollments', 'feedback'].includes(p.module)) {
      if (p.action === 'read' || (p.action === 'update' && p.module === 'schedule')) {
        rolePermDocs.push({
          role: Role.TEACHER,
          permissionId: p._id,
          grantedBy: admin1._id,
        });
      }
    }
  });

  // Role Permissions for Supervisor
  permissions.forEach((p) => {
    if (['courses', 'schedule', 'students', 'supervisors', 'feedback'].includes(p.module)) {
      if (p.action === 'read' || p.action === 'create') {
        rolePermDocs.push({
          role: Role.SUPERVISOR,
          permissionId: p._id,
          grantedBy: admin1._id,
        });
      }
    }
  });

  // Role Permissions for Student
  permissions.forEach((p) => {
    if (['courses', 'schedule', 'enrollments', 'feedback'].includes(p.module)) {
      if (p.action === 'read' || (p.action === 'create' && p.module === 'feedback')) {
        rolePermDocs.push({
          role: Role.STUDENT,
          permissionId: p._id,
          grantedBy: admin1._id,
        });
      }
    }
  });

  await RolePermission.insertMany(rolePermDocs);

  // 3. Teachers
  const teacherNames = [
    { name: 'Qari Muneeb', email: 'muneeb@lms.com', spec: 'Nazira & Tajweed', salary: 35000, empId: 'EMP-1001' },
    { name: 'Sheikh Abdullah', email: 'abdullah@lms.com', spec: 'Tajweed Rules', salary: 40000, empId: 'EMP-1002' },
    { name: 'Ustadh Asad', email: 'asad@lms.com', spec: 'Hifz-ul-Quran', salary: 45000, empId: 'EMP-1003' },
    { name: 'Qari Talha', email: 'talha@lms.com', spec: 'Islamic Studies', salary: 38000, empId: 'EMP-1004' },
    { name: 'Sheikh Aziz', email: 'aziz@lms.com', spec: 'Fiqh & Seerah', salary: 42000, empId: 'EMP-1005' },
    { name: 'Qari Aamir', email: 'aamir@lms.com', spec: 'Qiraat', salary: 36000, empId: 'EMP-1006' },
    { name: 'Ustadh Aahil', email: 'aahil@lms.com', spec: 'Basic Arabic', salary: 35000, empId: 'EMP-1007' },
  ];

  const teacherUsersData = teacherNames.map((t) => ({
    name: t.name,
    email: t.email,
    passwordHash: defaultPassword,
    role: Role.TEACHER,
    timezone: 'Asia/Karachi',
  }));
  const teacherUsers = await User.insertMany(teacherUsersData);

  const teacherProfileDocs = teacherUsers.map((teacherUser, idx) => {
    const t = teacherNames[idx];
    return {
      userId: teacherUser._id,
      profile: {
        specialization: t.spec,
        joiningDate: new Date('2023-01-15'),
        qualification: 'Certified Hafiz & Qari',
        salary: t.salary,
        employeeId: t.empId,
        bio: `Experienced ${t.spec} instructor.`,
        guarantors: [
          {
            name: `${t.name.split(' ')[1] || 'Usman'} Senior`,
            phone: '+92 300 1234567',
            email: 'guarantor1@lms.com',
            relationship: 'Father',
            cnicOrId: '35202-1234567-1',
            address: 'House #12, Block A, Lahore, Pakistan',
          },
          {
            name: `${t.name.split(' ')[1] || 'Tariq'} Uncle`,
            phone: '+92 300 9876543',
            email: 'guarantor2@lms.com',
            relationship: 'Uncle',
            cnicOrId: '35202-9876543-2',
            address: 'House #45, Block B, Islamabad, Pakistan',
          },
        ],
      },
    };
  });
  await Teacher.insertMany(teacherProfileDocs);
  console.log(`Seeded ${teacherUsers.length} Teacher users and profiles.`);

  // 4. Students
  const studentDataList = [
    { name: 'Rayyan', email: 'rayyan@lms.com', tz: 'Europe/London', guardian: 'Kamran Khan', phone: '+44 7700 900077' },
    { name: 'Ahmed', email: 'ahmed@lms.com', tz: 'Asia/Karachi', guardian: 'Bilal Ahmed', phone: '+92 321 4455667' },
    { name: 'Ahmed Shan', email: 'ahmedshan@lms.com', tz: 'America/New_York', guardian: 'Shan Mohammad', phone: '+1 555 0192' },
    { name: 'Arfan Rahman', email: 'arfan@lms.com', tz: 'Europe/London', guardian: 'Mustafa Rahman', phone: '+44 7700 900088' },
    { name: 'Areeb', email: 'areeb@lms.com', tz: 'Asia/Karachi', guardian: 'Farhan Areeb', phone: '+92 300 5566778' },
    { name: 'Mamud', email: 'mamud@lms.com', tz: 'America/Chicago', guardian: 'Omar Mamud', phone: '+1 312 555 0143' },
    { name: 'Bassaro Silima', email: 'bassaro@lms.com', tz: 'Europe/Paris', guardian: 'Silima Bassaro', phone: '+33 1 42 68 55 00' },
    { name: 'Mahamoud Silim', email: 'mahamoud@lms.com', tz: 'Europe/Paris', guardian: 'Silim Mahamoud', phone: '+33 1 42 68 55 11' },
    { name: 'Munasar', email: 'munasar@lms.com', tz: 'America/Los_Angeles', guardian: 'Hassan Munasar', phone: '+1 213 555 0188' },
    { name: 'Mahir', email: 'mahir@lms.com', tz: 'Asia/Karachi', guardian: 'Javed Mahir', phone: '+92 333 8899001' },
    { name: 'Aisha', email: 'aisha@lms.com', tz: 'Europe/London', guardian: 'Zubair Fatima', phone: '+44 7700 900099' },
    { name: 'Fatima', email: 'fatima@lms.com', tz: 'Asia/Karachi', guardian: 'Rashid Ali', phone: '+92 312 9900112' },
  ];

  const studentUsersData = studentDataList.map((item) => ({
    name: item.name,
    email: item.email,
    passwordHash: defaultPassword,
    role: Role.STUDENT,
    timezone: item.tz,
  }));
  const studentUsers = await User.insertMany(studentUsersData);

  let currentStudentId = 1000;
  const studentProfileDocs = studentUsers.map((studentUser, idx) => {
    const item = studentDataList[idx];
    currentStudentId += 1;
    return {
      userId: studentUser._id,
      studentId: currentStudentId,
      profile: {
        gender: item.name === 'Aisha' || item.name === 'Fatima' ? 'Female' : 'Male',
        dateOfBirth: new Date('2012-05-14'),
        enrollmentDate: new Date(),
        studentStatus: 'ACTIVE',
        trialStatus: 'ACTIVE',
        discontinued: false,
        guardianName: item.guardian,
        guardianPhone: item.phone,
        guardianEmail: `parent.${item.email}`,
      },
    };
  });
  await Student.insertMany(studentProfileDocs);
  await Counter.create({ name: 'studentId', seq: currentStudentId });
  console.log(`Seeded ${studentUsers.length} Student users and profiles.`);

  // 5. Supervisors
  const supervisorUsersData = [
    { name: 'Supervisor One', email: 'supervisor1@lms.com', passwordHash: defaultPassword, role: Role.SUPERVISOR, timezone: 'UTC' },
    { name: 'Supervisor Two', email: 'supervisor2@lms.com', passwordHash: defaultPassword, role: Role.SUPERVISOR, timezone: 'UTC' },
  ];
  const supervisorUsers = await User.insertMany(supervisorUsersData);
  const supervisor1 = supervisorUsers[0];
  const supervisor2 = supervisorUsers[1];
  console.log('Seeded 2 Supervisor users.');

  // 6. Courses
  const coursesData = [
    { title: 'Nazira Basics', type: CourseType.NAZIRA, curriculum: 'Basic Quranic Reading', teacherId: teacherUsers[0]._id },
    { title: 'Tajweed Rules & Makharij', type: CourseType.TAJWEED, curriculum: 'Makharij and Sifat', teacherId: teacherUsers[1]._id },
    { title: 'Hifz Program (Quran Memorization)', type: CourseType.HIFZ_UL_QURAN, curriculum: 'Juz 30 Memorization', teacherId: teacherUsers[2]._id },
    { title: 'Islamic Studies & Seerah', type: CourseType.ISLAMIC_STUDIES, curriculum: 'Fiqh and Seerah Basics', teacherId: teacherUsers[3]._id },
  ];
  const courses = await Course.insertMany(coursesData);
  console.log(`Seeded ${courses.length} Courses.`);

  // 7. Fee Structures
  const feeStructuresData = [
    { courseId: courses[0]._id, monthlyFee: 50, registrationFee: 15, currency: 'USD', description: 'Standard Nazira Course Fee' },
    { courseId: courses[1]._id, monthlyFee: 65, registrationFee: 20, currency: 'USD', description: 'Advanced Tajweed Course Fee' },
    { courseId: courses[2]._id, monthlyFee: 80, registrationFee: 25, currency: 'USD', description: 'Full Hifz Program Fee' },
    { courseId: courses[3]._id, monthlyFee: 45, registrationFee: 10, currency: 'USD', description: 'Islamic Studies Course Fee' },
  ];
  await FeeStructure.insertMany(feeStructuresData);
  console.log(`Seeded ${feeStructuresData.length} Fee Structures.`);

  // 8. Enrollments
  const enrollmentDocs = studentUsers.map((std, i) => ({
    studentId: std._id,
    courseId: courses[i % courses.length]._id,
  }));
  await Enrollment.insertMany(enrollmentDocs);
  console.log(`Seeded ${enrollmentDocs.length} Enrollments.`);

  // 9. Supervisor Assignments
  await SupervisorAssignment.insertMany([
    { supervisorId: supervisor1._id, courseId: courses[0]._id },
    { supervisorId: supervisor1._id, courseId: courses[1]._id },
    { supervisorId: supervisor2._id, courseId: courses[2]._id },
  ]);
  console.log('Seeded 3 Supervisor Assignments.');

  // 10. Invoices
  const currentMonth = new Date().toISOString().slice(0, 7);
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 10);

  const invoiceDocs = studentUsers.map((student, i) => {
    const course = courses[i % courses.length];
    let currency = 'USD';
    if (student.timezone?.includes('Karachi')) currency = 'PKR';
    else if (student.timezone?.includes('London')) currency = 'GBP';

    const isPaid = i % 2 === 0;
    return {
      studentId: student._id,
      courseId: course._id,
      amount: currency === 'PKR' ? 12000 : currency === 'GBP' ? 45 : 55,
      currency,
      dueDate,
      status: isPaid ? InvoiceStatus.PAID : InvoiceStatus.PENDING,
      paidAmount: isPaid ? (currency === 'PKR' ? 12000 : currency === 'GBP' ? 45 : 55) : 0,
      paidDate: isPaid ? new Date() : undefined,
      paymentMethod: isPaid ? PaymentMethod.CASH : undefined,
      billingMonth: currentMonth,
      recordedBy: admin1._id,
    };
  });
  await Invoice.insertMany(invoiceDocs);
  console.log(`Seeded ${invoiceDocs.length} Invoices.`);

  // 11. Salary Payments
  const salaryDocs = teacherUsers
    .map((t, i) => {
      if (i % 2 === 0) {
        return {
          teacherId: t._id,
          amount: teacherNames[i].salary,
          month: currentMonth,
          paymentDate: new Date(),
          paymentMethod: PaymentMethod.CASH,
          notes: `Monthly cash salary disbursement for ${teacherNames[i].name}`,
          recordedBy: admin1._id,
        };
      }
      return null;
    })
    .filter(Boolean) as any[];
  await SalaryPayment.insertMany(salaryDocs);
  console.log(`Seeded ${salaryDocs.length} Salary Payments.`);

  // 12. Class Sessions
  const startDate = new Date();
  startDate.setHours(9, 0, 0, 0);
  const sessionDocs = [];

  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    for (let tIdx = 0; tIdx < teacherUsers.length; tIdx++) {
      const scheduledAt = new Date(startDate);
      scheduledAt.setDate(scheduledAt.getDate() + dayOffset);
      scheduledAt.setHours(9 + tIdx, 0, 0, 0);

      const course = courses[tIdx % courses.length];
      const student = studentUsers[tIdx % studentUsers.length];

      sessionDocs.push({
        courseId: course._id,
        teacherId: teacherUsers[tIdx]._id,
        studentId: student._id,
        scheduledAt,
        durationMinutes: 30,
        status: ClassStatus.SCHEDULED,
      });
    }
  }
  await ClassSession.insertMany(sessionDocs);
  console.log(`Seeded ${sessionDocs.length} Class Sessions.`);

  console.log('✅ MongoDB database seeding completed successfully with all collections populated!');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
