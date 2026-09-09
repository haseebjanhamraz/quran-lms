import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import {
  User, UserDocument,
  Teacher, TeacherDocument,
  Student, StudentDocument,
  Course, CourseDocument,
  Enrollment, EnrollmentDocument,
  ClassSession, ClassSessionDocument,
  WeeklyScheduleSlot, WeeklyScheduleSlotDocument,
  Attendance, AttendanceDocument,
  Recording, RecordingDocument,
  TranscriptSegment, TranscriptSegmentDocument,
  ClassReview, ClassReviewDocument,
  AIReport, AIReportDocument,
  RescheduleRequest, RescheduleRequestDocument,
  SupervisorAssignment, SupervisorAssignmentDocument,
  ReviewerAssignment, ReviewerAssignmentDocument,
  StudentFeedback, StudentFeedbackDocument,
  FeeStructure, FeeStructureDocument,
  Invoice, InvoiceDocument,
  Expense, ExpenseDocument,
  Income, IncomeDocument,
  SalaryPayment, SalaryPaymentDocument,
  SalarySlip, SalarySlipDocument,
  SalaryConfig, SalaryConfigDocument,
  LeaveRequest, LeaveRequestDocument,
  LeaveBalance, LeaveBalanceDocument,
  Ticket, TicketDocument,
  TicketComment, TicketCommentDocument,
  Notification, NotificationDocument,
  Material, MaterialDocument,
  SubjectCategory, SubjectCategoryDocument,
  AuditLog, AuditLogDocument,
  PipelineLog, PipelineLogDocument,
  Counter, CounterDocument,
  Permission, PermissionDocument,
  RolePermission, RolePermissionDocument,
  SystemSetting, SystemSettingDocument,
  Role, CourseType, ClassStatus, InvoiceStatus, PaymentMethod, DayOfWeek, MaterialCategory,
} from '../schemas';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { RedisCacheService } from '../cache/redis-cache.service';

@Injectable()
export class DatabaseAdminService {
  private readonly logger = new Logger(DatabaseAdminService.name);

  constructor(
    @InjectConnection() private readonly connection: Connection,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Teacher.name) private readonly teacherModel: Model<TeacherDocument>,
    @InjectModel(Student.name) private readonly studentModel: Model<StudentDocument>,
    @InjectModel(Course.name) private readonly courseModel: Model<CourseDocument>,
    @InjectModel(Enrollment.name) private readonly enrollmentModel: Model<EnrollmentDocument>,
    @InjectModel(ClassSession.name) private readonly classSessionModel: Model<ClassSessionDocument>,
    @InjectModel(WeeklyScheduleSlot.name) private readonly weeklyScheduleSlotModel: Model<WeeklyScheduleSlotDocument>,
    @InjectModel(Attendance.name) private readonly attendanceModel: Model<AttendanceDocument>,
    @InjectModel(Recording.name) private readonly recordingModel: Model<RecordingDocument>,
    @InjectModel(TranscriptSegment.name) private readonly transcriptSegmentModel: Model<TranscriptSegmentDocument>,
    @InjectModel(ClassReview.name) private readonly classReviewModel: Model<ClassReviewDocument>,
    @InjectModel(AIReport.name) private readonly aiReportModel: Model<AIReportDocument>,
    @InjectModel(RescheduleRequest.name) private readonly rescheduleRequestModel: Model<RescheduleRequestDocument>,
    @InjectModel(SupervisorAssignment.name) private readonly supervisorAssignmentModel: Model<SupervisorAssignmentDocument>,
    @InjectModel(ReviewerAssignment.name) private readonly reviewerAssignmentModel: Model<ReviewerAssignmentDocument>,
    @InjectModel(StudentFeedback.name) private readonly studentFeedbackModel: Model<StudentFeedbackDocument>,
    @InjectModel(FeeStructure.name) private readonly feeStructureModel: Model<FeeStructureDocument>,
    @InjectModel(Invoice.name) private readonly invoiceModel: Model<InvoiceDocument>,
    @InjectModel(Expense.name) private readonly expenseModel: Model<ExpenseDocument>,
    @InjectModel(Income.name) private readonly incomeModel: Model<IncomeDocument>,
    @InjectModel(SalaryPayment.name) private readonly salaryPaymentModel: Model<SalaryPaymentDocument>,
    @InjectModel(SalarySlip.name) private readonly salarySlipModel: Model<SalarySlipDocument>,
    @InjectModel(SalaryConfig.name) private readonly salaryConfigModel: Model<SalaryConfigDocument>,
    @InjectModel(LeaveRequest.name) private readonly leaveRequestModel: Model<LeaveRequestDocument>,
    @InjectModel(LeaveBalance.name) private readonly leaveBalanceModel: Model<LeaveBalanceDocument>,
    @InjectModel(Ticket.name) private readonly ticketModel: Model<TicketDocument>,
    @InjectModel(TicketComment.name) private readonly ticketCommentModel: Model<TicketCommentDocument>,
    @InjectModel(Notification.name) private readonly notificationModel: Model<NotificationDocument>,
    @InjectModel(Material.name) private readonly materialModel: Model<MaterialDocument>,
    @InjectModel(SubjectCategory.name) private readonly subjectCategoryModel: Model<SubjectCategoryDocument>,
    @InjectModel(AuditLog.name) private readonly auditLogModel: Model<AuditLogDocument>,
    @InjectModel(PipelineLog.name) private readonly pipelineLogModel: Model<PipelineLogDocument>,
    @InjectModel(Counter.name) private readonly counterModel: Model<CounterDocument>,
    @InjectModel(Permission.name) private readonly permissionModel: Model<PermissionDocument>,
    @InjectModel(RolePermission.name) private readonly rolePermissionModel: Model<RolePermissionDocument>,
    @InjectModel(SystemSetting.name) private readonly systemSettingModel: Model<SystemSettingDocument>,
    private readonly auditLogsService: AuditLogsService,
    private readonly redisCacheService: RedisCacheService,
  ) {}

  async getDatabaseStats() {
    const [
      studentsCount,
      studentUsersCount,
      enrollmentsCount,
      studentFeedbackCount,
      teachersCount,
      teacherUsersCount,
      supervisorAssignmentsCount,
      reviewerAssignmentsCount,
      coursesCount,
      categoriesCount,
      feeStructuresCount,
      classSessionsCount,
      weeklySlotsCount,
      attendanceCount,
      recordingsCount,
      transcriptsCount,
      classReviewsCount,
      aiReportsCount,
      rescheduleRequestsCount,
      invoicesCount,
      salaryPaymentsCount,
      salarySlipsCount,
      salaryConfigsCount,
      expensesCount,
      incomesCount,
      supervisorUsersCount,
      reviewerUsersCount,
      hrUsersCount,
      adminUsersCount,
      superAdminUsersCount,
      ticketsCount,
      ticketCommentsCount,
      notificationsCount,
      materialsCount,
      auditLogsCount,
      pipelineLogsCount,
      leaveRequestsCount,
      leaveBalancesCount,
    ] = await Promise.all([
      this.studentModel.countDocuments(),
      this.userModel.countDocuments({ role: Role.STUDENT }),
      this.enrollmentModel.countDocuments(),
      this.studentFeedbackModel.countDocuments(),
      this.teacherModel.countDocuments(),
      this.userModel.countDocuments({ role: Role.TEACHER }),
      this.supervisorAssignmentModel.countDocuments(),
      this.reviewerAssignmentModel.countDocuments(),
      this.courseModel.countDocuments(),
      this.subjectCategoryModel.countDocuments(),
      this.feeStructureModel.countDocuments(),
      this.classSessionModel.countDocuments(),
      this.weeklyScheduleSlotModel.countDocuments(),
      this.attendanceModel.countDocuments(),
      this.recordingModel.countDocuments(),
      this.transcriptSegmentModel.countDocuments(),
      this.classReviewModel.countDocuments(),
      this.aiReportModel.countDocuments(),
      this.rescheduleRequestModel.countDocuments(),
      this.invoiceModel.countDocuments(),
      this.salaryPaymentModel.countDocuments(),
      this.salarySlipModel.countDocuments(),
      this.salaryConfigModel.countDocuments(),
      this.expenseModel.countDocuments(),
      this.incomeModel.countDocuments(),
      this.userModel.countDocuments({ role: Role.SUPERVISOR }),
      this.reviewerAssignmentModel.distinct('reviewerId').then((ids) => ids.length),
      this.userModel.countDocuments({ role: Role.HR }),
      this.userModel.countDocuments({ role: Role.ADMIN }),
      this.userModel.countDocuments({ role: Role.SUPER_ADMIN }),
      this.ticketModel.countDocuments(),
      this.ticketCommentModel.countDocuments(),
      this.notificationModel.countDocuments(),
      this.materialModel.countDocuments(),
      this.auditLogModel.countDocuments(),
      this.pipelineLogModel.countDocuments(),
      this.leaveRequestModel.countDocuments(),
      this.leaveBalanceModel.countDocuments(),
    ]);

    const categories = {
      students: {
        label: 'Students & Enrollments',
        count: studentsCount + studentUsersCount + enrollmentsCount + studentFeedbackCount,
        details: {
          profiles: studentsCount,
          users: studentUsersCount,
          enrollments: enrollmentsCount,
          feedback: studentFeedbackCount,
        },
      },
      teachers: {
        label: 'Teachers & Assignments',
        count: teachersCount + teacherUsersCount + supervisorAssignmentsCount + reviewerAssignmentsCount + leaveRequestsCount + leaveBalancesCount,
        details: {
          profiles: teachersCount,
          users: teacherUsersCount,
          supervisorAssignments: supervisorAssignmentsCount,
          reviewerAssignments: reviewerAssignmentsCount,
          leaveRequests: leaveRequestsCount,
          leaveBalances: leaveBalancesCount,
        },
      },
      courses: {
        label: 'Courses & Curriculums',
        count: coursesCount + categoriesCount + feeStructuresCount,
        details: {
          courses: coursesCount,
          categories: categoriesCount,
          feeStructures: feeStructuresCount,
        },
      },
      classes_sessions: {
        label: 'Classes, Schedules & Recordings',
        count:
          classSessionsCount +
          weeklySlotsCount +
          attendanceCount +
          recordingsCount +
          transcriptsCount +
          classReviewsCount +
          aiReportsCount +
          rescheduleRequestsCount,
        details: {
          sessions: classSessionsCount,
          weeklySlots: weeklySlotsCount,
          attendance: attendanceCount,
          recordings: recordingsCount,
          transcripts: transcriptsCount,
          reviews: classReviewsCount,
          aiReports: aiReportsCount,
          rescheduleRequests: rescheduleRequestsCount,
        },
      },
      finance: {
        label: 'Finance, Invoices & Salaries',
        count: invoicesCount + salaryPaymentsCount + salarySlipsCount + salaryConfigsCount + expensesCount + incomesCount,
        details: {
          invoices: invoicesCount,
          salaryPayments: salaryPaymentsCount,
          salarySlips: salarySlipsCount,
          salaryConfigs: salaryConfigsCount,
          expenses: expensesCount,
          incomes: incomesCount,
        },
      },
      supervisors_reviewers: {
        label: 'Supervisors & Reviewers',
        count: supervisorUsersCount + reviewerUsersCount,
        details: {
          supervisors: supervisorUsersCount,
          reviewers: reviewerUsersCount,
        },
      },
      materials: {
        label: 'Course Materials & PDFs',
        count: materialsCount,
        details: {
          materials: materialsCount,
        },
      },
      support_notifications: {
        label: 'Support Tickets & Notifications',
        count: ticketsCount + ticketCommentsCount + notificationsCount,
        details: {
          tickets: ticketsCount,
          comments: ticketCommentsCount,
          notifications: notificationsCount,
        },
      },
      logs: {
        label: 'System & Audit Logs',
        count: auditLogsCount + pipelineLogsCount,
        details: {
          auditLogs: auditLogsCount,
          pipelineLogs: pipelineLogsCount,
        },
      },
      users: {
        label: 'All User Accounts (Admins Protected)',
        count: studentUsersCount + teacherUsersCount + supervisorUsersCount + reviewerUsersCount + hrUsersCount,
        details: {
          students: studentUsersCount,
          teachers: teacherUsersCount,
          supervisors: supervisorUsersCount,
          reviewers: reviewerUsersCount,
          hr: hrUsersCount,
          admins: adminUsersCount,
          superAdmins: superAdminUsersCount,
        },
      },
    };

    const totalRecords = Object.values(categories).reduce((sum, c) => sum + c.count, 0);

    return {
      success: true,
      totalRecords,
      categories,
      timestamp: new Date().toISOString(),
    };
  }

  async cleanup(targets: string[], confirmation: string, adminUser: any) {
    if (!confirmation || (confirmation.trim().toUpperCase() !== 'CONFIRM' && confirmation.trim().toUpperCase() !== 'DELETE' && confirmation.trim().toUpperCase() !== 'CLEANUP')) {
      throw new BadRequestException('Please provide a valid confirmation text ("CONFIRM" or "CLEANUP") to execute cleanup.');
    }

    if (!targets || !Array.isArray(targets) || targets.length === 0) {
      throw new BadRequestException('No targets selected for cleanup.');
    }

    const currentAdminId = adminUser?._id || adminUser?.id;
    const deletedCounts: Record<string, number> = {};
    const isFullReset = targets.includes('all');

    this.logger.warn(`Starting cleanup requested by Super Admin ${adminUser?.email || currentAdminId}. Targets: ${targets.join(', ')}`);

    // ─────────────────────────────────────────────────────────────
    // FULL RESET OPTION
    // ─────────────────────────────────────────────────────────────
    if (isFullReset) {
      // Preserve current Super Admin user and other Super Admins
      const superAdmins = await this.userModel.find({ role: Role.SUPER_ADMIN });
      const preservedSuperAdminIds = superAdmins.map((u) => u._id);

      // Delete non-super-admin users
      const deletedUsersRes = await this.userModel.deleteMany({ _id: { $nin: preservedSuperAdminIds } });
      deletedCounts['users'] = deletedUsersRes.deletedCount || 0;

      // Delete all business collections
      const deleteOps = await Promise.all([
        this.studentModel.deleteMany({}),
        this.teacherModel.deleteMany({}),
        this.courseModel.deleteMany({}),
        this.enrollmentModel.deleteMany({}),
        this.classSessionModel.deleteMany({}),
        this.weeklyScheduleSlotModel.deleteMany({}),
        this.attendanceModel.deleteMany({}),
        this.recordingModel.deleteMany({}),
        this.transcriptSegmentModel.deleteMany({}),
        this.classReviewModel.deleteMany({}),
        this.aiReportModel.deleteMany({}),
        this.rescheduleRequestModel.deleteMany({}),
        this.supervisorAssignmentModel.deleteMany({}),
        this.reviewerAssignmentModel.deleteMany({}),
        this.studentFeedbackModel.deleteMany({}),
        this.feeStructureModel.deleteMany({}),
        this.invoiceModel.deleteMany({}),
        this.expenseModel.deleteMany({}),
        this.incomeModel.deleteMany({}),
        this.salaryPaymentModel.deleteMany({}),
        this.salarySlipModel.deleteMany({}),
        this.salaryConfigModel.deleteMany({}),
        this.leaveRequestModel.deleteMany({}),
        this.leaveBalanceModel.deleteMany({}),
        this.ticketModel.deleteMany({}),
        this.ticketCommentModel.deleteMany({}),
        this.notificationModel.deleteMany({}),
        this.materialModel.deleteMany({}),
        this.subjectCategoryModel.deleteMany({}),
        this.pipelineLogModel.deleteMany({}),
        this.counterModel.deleteMany({}),
      ]);

      deletedCounts['students'] = deleteOps[0].deletedCount || 0;
      deletedCounts['teachers'] = deleteOps[1].deletedCount || 0;
      deletedCounts['courses'] = deleteOps[2].deletedCount || 0;
      deletedCounts['enrollments'] = deleteOps[3].deletedCount || 0;
      deletedCounts['classSessions'] = deleteOps[4].deletedCount || 0;
      deletedCounts['weeklyScheduleSlots'] = deleteOps[5].deletedCount || 0;
      deletedCounts['attendance'] = deleteOps[6].deletedCount || 0;
      deletedCounts['recordings'] = deleteOps[7].deletedCount || 0;
      deletedCounts['transcriptSegments'] = deleteOps[8].deletedCount || 0;
      deletedCounts['classReviews'] = deleteOps[9].deletedCount || 0;
      deletedCounts['aiReports'] = deleteOps[10].deletedCount || 0;
      deletedCounts['rescheduleRequests'] = deleteOps[11].deletedCount || 0;
      deletedCounts['supervisorAssignments'] = deleteOps[12].deletedCount || 0;
      deletedCounts['reviewerAssignments'] = deleteOps[13].deletedCount || 0;
      deletedCounts['studentFeedback'] = deleteOps[14].deletedCount || 0;
      deletedCounts['feeStructures'] = deleteOps[15].deletedCount || 0;
      deletedCounts['invoices'] = deleteOps[16].deletedCount || 0;
      deletedCounts['expenses'] = deleteOps[17].deletedCount || 0;
      deletedCounts['incomes'] = deleteOps[18].deletedCount || 0;
      deletedCounts['salaryPayments'] = deleteOps[19].deletedCount || 0;
      deletedCounts['salarySlips'] = deleteOps[20].deletedCount || 0;
      deletedCounts['salaryConfigs'] = deleteOps[21].deletedCount || 0;
      deletedCounts['leaveRequests'] = deleteOps[22].deletedCount || 0;
      deletedCounts['leaveBalances'] = deleteOps[23].deletedCount || 0;
      deletedCounts['tickets'] = deleteOps[24].deletedCount || 0;
      deletedCounts['ticketComments'] = deleteOps[25].deletedCount || 0;
      deletedCounts['notifications'] = deleteOps[26].deletedCount || 0;
      deletedCounts['materials'] = deleteOps[27].deletedCount || 0;
      deletedCounts['subjectCategories'] = deleteOps[28].deletedCount || 0;
      deletedCounts['pipelineLogs'] = deleteOps[29].deletedCount || 0;
      deletedCounts['counters'] = deleteOps[30].deletedCount || 0;

      // Ensure default RBAC permissions are populated for the preserved Super Admin
      await this.ensureDefaultPermissions();

      // Flush Cache
      await this.redisCacheService.delByPattern('*');

      await this.auditLogsService.log(
        'database.full_cleanup',
        currentAdminId ? String(currentAdminId) : undefined,
        { targets: ['all'], deletedCounts },
      );

      return {
        success: true,
        message: 'Complete database reset finished successfully. Super Admin account preserved.',
        deletedCounts,
      };
    }

    // ─────────────────────────────────────────────────────────────
    // SELECTIVE CLEANUP
    // ─────────────────────────────────────────────────────────────
    // 1. Students & Enrollments
    if (targets.includes('students')) {
      const studentUsers = await this.userModel.find({ role: Role.STUDENT }).select('_id');
      const studentUserIds = studentUsers.map((u) => u._id);

      const [sRes, uRes, eRes, fRes, wRes, cRes, aRes, invRes] = await Promise.all([
        this.studentModel.deleteMany({}),
        this.userModel.deleteMany({ role: Role.STUDENT }),
        this.enrollmentModel.deleteMany({ studentId: { $in: studentUserIds } }),
        this.studentFeedbackModel.deleteMany({ studentId: { $in: studentUserIds } }),
        this.weeklyScheduleSlotModel.deleteMany({ studentId: { $in: studentUserIds } }),
        this.classSessionModel.deleteMany({ studentId: { $in: studentUserIds } }),
        this.attendanceModel.deleteMany({ studentId: { $in: studentUserIds } }),
        this.invoiceModel.deleteMany({ studentId: { $in: studentUserIds } }),
      ]);

      await this.counterModel.deleteOne({ name: 'studentId' });

      deletedCounts['students'] = (sRes.deletedCount || 0) + (uRes.deletedCount || 0);
      deletedCounts['enrollments'] = eRes.deletedCount || 0;
      deletedCounts['studentFeedback'] = fRes.deletedCount || 0;
      deletedCounts['studentSessionsAndSlots'] = (wRes.deletedCount || 0) + (cRes.deletedCount || 0);
      deletedCounts['studentInvoices'] = invRes.deletedCount || 0;
    }

    // 2. Teachers & Staff Assignments
    if (targets.includes('teachers')) {
      const teacherUsers = await this.userModel.find({ role: Role.TEACHER }).select('_id');
      const teacherUserIds = teacherUsers.map((u) => u._id);

      const [tRes, uRes, sRes, rRes, salRes, lrRes, lbRes, wRes, cRes] = await Promise.all([
        this.teacherModel.deleteMany({}),
        this.userModel.deleteMany({ role: Role.TEACHER }),
        this.supervisorAssignmentModel.deleteMany({ teacherId: { $in: teacherUserIds } }),
        this.reviewerAssignmentModel.deleteMany({ teacherId: { $in: teacherUserIds } }),
        this.salaryPaymentModel.deleteMany({ teacherId: { $in: teacherUserIds } }),
        this.leaveRequestModel.deleteMany({ teacherId: { $in: teacherUserIds } }),
        this.leaveBalanceModel.deleteMany({ teacherId: { $in: teacherUserIds } }),
        this.weeklyScheduleSlotModel.deleteMany({ teacherId: { $in: teacherUserIds } }),
        this.classSessionModel.deleteMany({ teacherId: { $in: teacherUserIds } }),
      ]);

      // Unassign teacherId from courses
      await this.courseModel.updateMany({ teacherId: { $in: teacherUserIds } }, { $unset: { teacherId: '' } });

      deletedCounts['teachers'] = (tRes.deletedCount || 0) + (uRes.deletedCount || 0);
      deletedCounts['teacherAssignments'] = (sRes.deletedCount || 0) + (rRes.deletedCount || 0);
      deletedCounts['teacherSalaries'] = salRes.deletedCount || 0;
      deletedCounts['teacherLeaves'] = (lrRes.deletedCount || 0) + (lbRes.deletedCount || 0);
      deletedCounts['teacherSessionsAndSlots'] = (wRes.deletedCount || 0) + (cRes.deletedCount || 0);
    }

    // 3. Courses & Curriculums
    if (targets.includes('courses')) {
      const courses = await this.courseModel.find().select('_id');
      const courseIds = courses.map((c) => c._id);

      const [cRes, catRes, fRes, eRes, mRes, wRes, sRes] = await Promise.all([
        this.courseModel.deleteMany({}),
        this.subjectCategoryModel.deleteMany({}),
        this.feeStructureModel.deleteMany({ courseId: { $in: courseIds } }),
        this.enrollmentModel.deleteMany({ courseId: { $in: courseIds } }),
        this.materialModel.deleteMany({ courseId: { $in: courseIds } }),
        this.weeklyScheduleSlotModel.deleteMany({ courseId: { $in: courseIds } }),
        this.classSessionModel.deleteMany({ courseId: { $in: courseIds } }),
      ]);

      deletedCounts['courses'] = cRes.deletedCount || 0;
      deletedCounts['categories'] = catRes.deletedCount || 0;
      deletedCounts['feeStructures'] = fRes.deletedCount || 0;
      deletedCounts['courseEnrollments'] = eRes.deletedCount || 0;
      deletedCounts['courseMaterials'] = mRes.deletedCount || 0;
    }

    // 4. Classes, Schedules & Recordings
    if (targets.includes('classes_sessions')) {
      const [csRes, wsRes, attRes, recRes, trRes, revRes, aiRes, reqRes] = await Promise.all([
        this.classSessionModel.deleteMany({}),
        this.weeklyScheduleSlotModel.deleteMany({}),
        this.attendanceModel.deleteMany({}),
        this.recordingModel.deleteMany({}),
        this.transcriptSegmentModel.deleteMany({}),
        this.classReviewModel.deleteMany({}),
        this.aiReportModel.deleteMany({}),
        this.rescheduleRequestModel.deleteMany({}),
      ]);

      deletedCounts['classSessions'] = csRes.deletedCount || 0;
      deletedCounts['weeklyScheduleSlots'] = wsRes.deletedCount || 0;
      deletedCounts['attendance'] = attRes.deletedCount || 0;
      deletedCounts['recordings'] = recRes.deletedCount || 0;
      deletedCounts['transcripts'] = trRes.deletedCount || 0;
      deletedCounts['classReviews'] = revRes.deletedCount || 0;
      deletedCounts['aiReports'] = aiRes.deletedCount || 0;
      deletedCounts['rescheduleRequests'] = reqRes.deletedCount || 0;
    }

    // 5. Finance & Accounting
    if (targets.includes('finance')) {
      const [invRes, feeRes, salRes, slipRes, confRes, expRes, incRes] = await Promise.all([
        this.invoiceModel.deleteMany({}),
        this.feeStructureModel.deleteMany({}),
        this.salaryPaymentModel.deleteMany({}),
        this.salarySlipModel.deleteMany({}),
        this.salaryConfigModel.deleteMany({}),
        this.expenseModel.deleteMany({}),
        this.incomeModel.deleteMany({}),
      ]);

      deletedCounts['invoices'] = invRes.deletedCount || 0;
      deletedCounts['feeStructures'] = feeRes.deletedCount || 0;
      deletedCounts['salaryPayments'] = salRes.deletedCount || 0;
      deletedCounts['salarySlips'] = slipRes.deletedCount || 0;
      deletedCounts['salaryConfigs'] = confRes.deletedCount || 0;
      deletedCounts['expenses'] = expRes.deletedCount || 0;
      deletedCounts['incomes'] = incRes.deletedCount || 0;
    }

    // 6. Supervisors & Reviewers
    if (targets.includes('supervisors_reviewers')) {
      const [supRes, revRes, supUsersRes] = await Promise.all([
        this.supervisorAssignmentModel.deleteMany({}),
        this.reviewerAssignmentModel.deleteMany({}),
        this.userModel.deleteMany({ role: Role.SUPERVISOR }),
      ]);

      deletedCounts['supervisorAssignments'] = supRes.deletedCount || 0;
      deletedCounts['reviewerAssignments'] = revRes.deletedCount || 0;
      deletedCounts['supervisors'] = supUsersRes.deletedCount || 0;
    }

    // 7. Materials
    if (targets.includes('materials')) {
      const mRes = await this.materialModel.deleteMany({});
      deletedCounts['materials'] = mRes.deletedCount || 0;
    }

    // 8. Support & Notifications
    if (targets.includes('support_notifications')) {
      const [tRes, cRes, nRes] = await Promise.all([
        this.ticketModel.deleteMany({}),
        this.ticketCommentModel.deleteMany({}),
        this.notificationModel.deleteMany({}),
      ]);

      deletedCounts['tickets'] = tRes.deletedCount || 0;
      deletedCounts['ticketComments'] = cRes.deletedCount || 0;
      deletedCounts['notifications'] = nRes.deletedCount || 0;
    }

    // 9. System & Audit Logs
    if (targets.includes('logs')) {
      const [aRes, pRes] = await Promise.all([
        this.auditLogModel.deleteMany({}),
        this.pipelineLogModel.deleteMany({}),
      ]);

      deletedCounts['auditLogs'] = aRes.deletedCount || 0;
      deletedCounts['pipelineLogs'] = pRes.deletedCount || 0;
    }

    // Flush Cache
    await this.redisCacheService.delByPattern('*');

    await this.auditLogsService.log(
      'database.selective_cleanup',
      currentAdminId ? String(currentAdminId) : undefined,
      { targets, deletedCounts },
    );

    return {
      success: true,
      message: `Selected data cleaned up successfully: ${targets.join(', ')}`,
      deletedCounts,
    };
  }

  async seed(type: 'comprehensive' | 'students' | 'courses_teachers' | 'finance' | 'materials', adminUser: any) {
    const currentAdminId = adminUser?._id || adminUser?.id;
    this.logger.log(`Starting database seed of type: ${type} by Super Admin: ${adminUser?.email || currentAdminId}`);

    const defaultPassword = await bcrypt.hash('password123', 10);
    const createdCounts: Record<string, number> = {};

    // Always ensure permissions and basic role permissions exist
    await this.ensureDefaultPermissions();

    // ─────────────────────────────────────────────────────────────
    // COMPREHENSIVE SEED
    // ─────────────────────────────────────────────────────────────
    if (type === 'comprehensive') {
      const result = await this.seedComprehensiveDataset(defaultPassword, currentAdminId);
      await this.redisCacheService.delByPattern('*');
      await this.auditLogsService.log(
        'database.seed_comprehensive',
        currentAdminId ? String(currentAdminId) : undefined,
        { createdCounts: result },
      );
      return {
        success: true,
        message: 'Comprehensive sample data seeded successfully!',
        createdCounts: result,
      };
    }

    // ─────────────────────────────────────────────────────────────
    // COURSES & TEACHERS SEED
    // ─────────────────────────────────────────────────────────────
    if (type === 'courses_teachers') {
      const result = await this.seedTeachersAndCourses(defaultPassword, currentAdminId);
      await this.redisCacheService.delByPattern('*');
      await this.auditLogsService.log(
        'database.seed_courses_teachers',
        currentAdminId ? String(currentAdminId) : undefined,
        { createdCounts: result },
      );
      return {
        success: true,
        message: 'Standard Courses & Teachers seeded successfully!',
        createdCounts: result,
      };
    }

    // ─────────────────────────────────────────────────────────────
    // STUDENTS SEED
    // ─────────────────────────────────────────────────────────────
    if (type === 'students') {
      const result = await this.seedSampleStudents(defaultPassword, currentAdminId);
      await this.redisCacheService.delByPattern('*');
      await this.auditLogsService.log(
        'database.seed_students',
        currentAdminId ? String(currentAdminId) : undefined,
        { createdCounts: result },
      );
      return {
        success: true,
        message: 'Sample Students & Schedules seeded successfully!',
        createdCounts: result,
      };
    }

    // ─────────────────────────────────────────────────────────────
    // FINANCE SEED
    // ─────────────────────────────────────────────────────────────
    if (type === 'finance') {
      const result = await this.seedFinanceData(currentAdminId);
      await this.redisCacheService.delByPattern('*');
      await this.auditLogsService.log(
        'database.seed_finance',
        currentAdminId ? String(currentAdminId) : undefined,
        { createdCounts: result },
      );
      return {
        success: true,
        message: 'Sample Invoices & Salary disbursements seeded successfully!',
        createdCounts: result,
      };
    }

    // ─────────────────────────────────────────────────────────────
    // MATERIALS SEED
    // ─────────────────────────────────────────────────────────────
    if (type === 'materials') {
      const result = await this.seedMaterials(currentAdminId);
      await this.redisCacheService.delByPattern('*');
      await this.auditLogsService.log(
        'database.seed_materials',
        currentAdminId ? String(currentAdminId) : undefined,
        { createdCounts: result },
      );
      return {
        success: true,
        message: 'Quran & Islamic Study PDF Materials seeded successfully!',
        createdCounts: result,
      };
    }

    throw new BadRequestException(`Unsupported seed type: ${type}`);
  }

  // ─────────────────────────────────────────────────────────────
  // INTERNAL SEEDING HELPERS
  // ─────────────────────────────────────────────────────────────
  private async ensureDefaultPermissions() {
    const existingCount = await this.permissionModel.countDocuments();
    if (existingCount > 0) return;

    const modulesList = [
      'users', 'students', 'teachers', 'courses', 'schedule',
      'enrollments', 'fees', 'hr', 'supervisors', 'audit-logs', 'settings', 'feedback',
      'expenses', 'salary-config', 'support', 'reports', 'leave', 'materials',
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

    const permissions = await this.permissionModel.insertMany(permissionsData);
    const rolePermDocs: any[] = [];

    // Super Admin & Admin get all
    permissions.forEach((p) => {
      rolePermDocs.push({ role: Role.SUPER_ADMIN, permissionId: p._id });
      rolePermDocs.push({ role: Role.ADMIN, permissionId: p._id });
    });

    // HR
    permissions.forEach((p) => {
      if (['fees', 'hr', 'expenses', 'salary-config', 'support', 'reports', 'students', 'teachers', 'enrollments', 'leave', 'materials'].includes(p.module)) {
        rolePermDocs.push({ role: Role.HR, permissionId: p._id });
      }
    });

    // Teacher
    permissions.forEach((p) => {
      if (['courses', 'schedule', 'students', 'enrollments', 'feedback', 'leave', 'materials'].includes(p.module)) {
        if (p.action === 'read' || p.action === 'create' || (p.action === 'update' && (p.module === 'schedule' || p.module === 'leave'))) {
          rolePermDocs.push({ role: Role.TEACHER, permissionId: p._id });
        }
      }
    });

    // Supervisor
    permissions.forEach((p) => {
      if (['courses', 'schedule', 'students', 'supervisors', 'feedback', 'materials'].includes(p.module)) {
        if (p.action === 'read' || p.action === 'create') {
          rolePermDocs.push({ role: Role.SUPERVISOR, permissionId: p._id });
        }
      }
    });

    // Student
    permissions.forEach((p) => {
      if (['courses', 'schedule', 'enrollments', 'feedback', 'support', 'materials'].includes(p.module)) {
        if (p.action === 'read' || (p.action === 'create' && (p.module === 'feedback' || p.module === 'support'))) {
          rolePermDocs.push({ role: Role.STUDENT, permissionId: p._id });
        }
      }
    });

    await this.rolePermissionModel.insertMany(rolePermDocs);
    this.logger.log(`Initialized ${permissions.length} RBAC permissions.`);
  }

  private async seedComprehensiveDataset(defaultPassword: string, adminId?: any) {
    const createdCounts: Record<string, number> = {};

    // 1. Teachers & Courses
    const tcResult = await this.seedTeachersAndCourses(defaultPassword, adminId);
    Object.assign(createdCounts, tcResult);

    // 2. Supervisors
    const supCount = await this.userModel.countDocuments({ role: Role.SUPERVISOR });
    if (supCount === 0) {
      const supervisorsData = [
        { name: 'Supervisor Qari Tariq', email: 'supervisor1@lms.com', passwordHash: defaultPassword, role: Role.SUPERVISOR, timezone: 'Asia/Karachi', country: 'PK' },
        { name: 'Supervisor Mufti Bilal', email: 'supervisor2@lms.com', passwordHash: defaultPassword, role: Role.SUPERVISOR, timezone: 'Asia/Karachi', country: 'PK' },
      ];
      const supUsers = await this.userModel.insertMany(supervisorsData);
      createdCounts['supervisors'] = supUsers.length;

      // Assign teachers to supervisors
      const teachers = await this.userModel.find({ role: Role.TEACHER }).limit(6);
      const courses = await this.courseModel.find().limit(6);
      if (teachers.length >= 2 && courses.length >= 2) {
        const assignments: any[] = [];
        teachers.forEach((t, i) => {
          const sup = supUsers[i % supUsers.length];
          const c = courses[i % courses.length];
          assignments.push({
            supervisorId: sup._id,
            teacherId: t._id,
            courseId: c._id,
          });
        });
        await this.supervisorAssignmentModel.insertMany(assignments);
        createdCounts['supervisorAssignments'] = assignments.length;
      }
    }

    // 3. Students, Enrollments, Schedules & Sessions
    const studentResult = await this.seedSampleStudents(defaultPassword, adminId);
    Object.assign(createdCounts, studentResult);

    // 4. Materials
    const matResult = await this.seedMaterials(adminId);
    Object.assign(createdCounts, matResult);

    // 5. Finance (Invoices & Salaries)
    const finResult = await this.seedFinanceData(adminId);
    Object.assign(createdCounts, finResult);

    return createdCounts;
  }

  private async seedTeachersAndCourses(defaultPassword: string, adminId?: any) {
    const createdCounts: Record<string, number> = {};

    const teacherConfigs = [
      { name: 'Qari Muneeb', email: 'muneeb@lms.com', spec: 'Nazira & Tajweed', salary: 35000, empId: 'EMP-1001', courseTitle: 'Nazira & Basic Quranic Reading', courseType: CourseType.NAZIRA, curriculum: 'Qaida and Nazira of 30 Juz' },
      { name: 'Sheikh Abdullah', email: 'abdullah@lms.com', spec: 'Tajweed Rules & Makharij', salary: 40000, empId: 'EMP-1002', courseTitle: 'Advanced Tajweed & Makharij', courseType: CourseType.TAJWEED, curriculum: 'Ahkam-e-Tajweed, Sifat and Waqf Rules' },
      { name: 'Ustadh Asad', email: 'asad@lms.com', spec: 'Hifz-ul-Quran', salary: 45000, empId: 'EMP-1003', courseTitle: 'Full Hifz-ul-Quran Program', courseType: CourseType.HIFZ_UL_QURAN, curriculum: 'Complete 30 Paras Memorization with Revision' },
      { name: 'Qari Talha', email: 'talha@lms.com', spec: 'Islamic Studies & Fiqh', salary: 38000, empId: 'EMP-1004', courseTitle: 'Islamic Studies, Fiqh & Duas', courseType: CourseType.ISLAMIC_STUDIES, curriculum: 'Daily Adhkar, Masnoon Duas, Fiqh and Seerah' },
      { name: 'Sheikh Aziz', email: 'aziz@lms.com', spec: 'Quran Translation & Tafseer', salary: 42000, empId: 'EMP-1005', courseTitle: 'Quran Translation & Tafseer', courseType: CourseType.ISLAMIC_STUDIES, curriculum: 'Word-by-word Translation and Tafseer of Surahs' },
      { name: 'Qari Aamir', email: 'aamir@lms.com', spec: 'Qiraat & Voice Modulation', salary: 36000, empId: 'EMP-1006', courseTitle: 'Qiraat-e-Sabaa & Voice Melodies', courseType: CourseType.TAJWEED, curriculum: 'The 7 Styles of Quranic Recitation' },
      { name: 'Ustadh Aahil', email: 'aahil@lms.com', spec: 'Noorani & Madani Qaida', salary: 35000, empId: 'EMP-1007', courseTitle: 'Noorani & Madani Qaida for Kids', courseType: CourseType.NAZIRA, curriculum: 'Letter recognition, Harakat, Tanween & Sukoon' },
    ];

    let createdTeachers = 0;
    let createdCourses = 0;

    for (let i = 0; i < teacherConfigs.length; i++) {
      const cfg = teacherConfigs[i];
      let teacherUser = await this.userModel.findOne({ email: cfg.email });
      if (!teacherUser) {
        teacherUser = await this.userModel.create({
          name: cfg.name,
          email: cfg.email,
          passwordHash: defaultPassword,
          role: Role.TEACHER,
          timezone: 'Asia/Karachi',
          country: 'PK',
          phone: `+92 300 123400${i + 1}`,
          isActive: true,
        });
        createdTeachers++;

        await this.teacherModel.create({
          userId: teacherUser._id,
          profile: {
            specialization: cfg.spec,
            joiningDate: new Date('2023-01-15'),
            qualification: 'Certified Hafiz & Qari (Wifaq-ul-Madaris)',
            salary: cfg.salary,
            employeeId: cfg.empId,
            bio: `Experienced ${cfg.spec} instructor with over 8 years of teaching experience.`,
            guarantors: [
              {
                name: `${cfg.name.split(' ')[1] || 'Senior'} Guardian`,
                phone: '+92 300 1234567',
                email: `guarantor.${cfg.email}`,
                relationship: 'Father',
                cnicOrId: `35202-123456${i}-1`,
                address: 'Lahore, Pakistan',
              },
            ],
          },
        });
      }

      let course = await this.courseModel.findOne({ title: cfg.courseTitle });
      if (!course) {
        course = await this.courseModel.create({
          title: cfg.courseTitle,
          type: cfg.courseType,
          curriculum: cfg.curriculum,
          teacherId: teacherUser._id,
        });
        createdCourses++;

        await this.feeStructureModel.create({
          courseId: course._id,
          monthlyFee: [45, 55, 75, 40, 50, 45, 35][i] || 50,
          registrationFee: 15,
          currency: 'USD',
          description: `Standard monthly fee structure for ${course.title}`,
        });
      }
    }

    createdCounts['teachers'] = createdTeachers;
    createdCounts['courses'] = createdCourses;
    return createdCounts;
  }

  private async seedSampleStudents(defaultPassword: string, adminId?: any) {
    const createdCounts: Record<string, number> = {};

    const teachers = await this.userModel.find({ role: Role.TEACHER }).sort({ createdAt: 1 });
    const courses = await this.courseModel.find().sort({ createdAt: 1 });

    if (teachers.length === 0 || courses.length === 0) {
      await this.seedTeachersAndCourses(defaultPassword, adminId);
    }

    const availableTeachers = await this.userModel.find({ role: Role.TEACHER });
    const availableCourses = await this.courseModel.find();

    const studentConfigs = [
      { name: 'Rayyan Khan', preferredName: 'Rayyan', email: 'rayyan@lms.com', tz: 'Europe/London', country: 'GB', guardian: 'Kamran Khan', phone: '+44 7700 900077', fee: 50, curr: 'GBP', tier: 'Beginner', duration: 30, days: [{ day: 'Mon', time: '16:00' }, { day: 'Wed', time: '16:00' }, { day: 'Fri', time: '16:00' }] },
      { name: 'Ahmed Bilal', preferredName: 'Ahmed', email: 'ahmed@lms.com', tz: 'Asia/Karachi', country: 'PK', guardian: 'Bilal Ahmed', phone: '+92 321 4455667', fee: 12000, curr: 'PKR', tier: 'Intermediate', duration: 60, days: [{ day: 'Mon', time: '17:00' }, { day: 'Wed', time: '17:00' }, { day: 'Fri', time: '17:00' }] },
      { name: 'Ahmed Shan', preferredName: 'Shan', email: 'ahmedshan@lms.com', tz: 'America/New_York', country: 'US', guardian: 'Shan Mohammad', phone: '+1 555 0192', fee: 75, curr: 'USD', tier: 'Advanced', duration: 60, days: [{ day: 'Tue', time: '18:00' }, { day: 'Thu', time: '18:00' }, { day: 'Sat', time: '18:00' }] },
      { name: 'Arfan Rahman', preferredName: 'Arfan', email: 'arfan@lms.com', tz: 'Europe/London', country: 'GB', guardian: 'Mustafa Rahman', phone: '+44 7700 900088', fee: 45, curr: 'GBP', tier: 'Beginner', duration: 30, days: [{ day: 'Mon', time: '15:00' }, { day: 'Tue', time: '15:00' }, { day: 'Thu', time: '15:00' }] },
      { name: 'Areeb Farhan', preferredName: 'Areeb', email: 'areeb@lms.com', tz: 'Asia/Karachi', country: 'PK', guardian: 'Farhan Areeb', phone: '+92 300 5566778', fee: 14000, curr: 'PKR', tier: 'Intermediate', duration: 60, days: [{ day: 'Mon', time: '16:30' }, { day: 'Wed', time: '16:30' }] },
      { name: 'Mamud Omar', preferredName: 'Mamud', email: 'mamud@lms.com', tz: 'America/Chicago', country: 'US', guardian: 'Omar Mamud', phone: '+1 312 555 0143', fee: 45, curr: 'USD', tier: 'Intermediate', duration: 30, days: [{ day: 'Mon', time: '19:00' }, { day: 'Wed', time: '19:00' }] },
      { name: 'Bassaro Silima', preferredName: 'Bassaro', email: 'bassaro@lms.com', tz: 'Europe/Paris', country: 'FR', guardian: 'Silima Bassaro', phone: '+33 1 42 68 55 00', fee: 40, curr: 'EUR', tier: 'Beginner', duration: 30, days: [{ day: 'Tue', time: '14:00' }, { day: 'Thu', time: '14:00' }] },
      { name: 'Mahamoud Silim', preferredName: 'Mahamoud', email: 'mahamoud@lms.com', tz: 'Europe/Paris', country: 'FR', guardian: 'Silim Mahamoud', phone: '+33 1 42 68 55 11', fee: 30, curr: 'EUR', tier: 'Beginner', duration: 30, days: [{ day: 'Mon', time: '17:30' }, { day: 'Wed', time: '17:30' }] },
      { name: 'Munasar Hassan', preferredName: 'Munasar', email: 'munasar@lms.com', tz: 'America/Los_Angeles', country: 'US', guardian: 'Hassan Munasar', phone: '+1 213 555 0188', fee: 55, curr: 'USD', tier: 'Intermediate', duration: 30, days: [{ day: 'Mon', time: '16:00' }, { day: 'Fri', time: '16:00' }] },
      { name: 'Mahir Javed', preferredName: 'Mahir', email: 'mahir@lms.com', tz: 'Asia/Karachi', country: 'PK', guardian: 'Javed Mahir', phone: '+92 333 8899001', fee: 15000, curr: 'PKR', tier: 'Advanced', duration: 60, days: [{ day: 'Tue', time: '18:30' }, { day: 'Thu', time: '18:30' }] },
      { name: 'Aisha Zubair', preferredName: 'Aisha', email: 'aisha@lms.com', tz: 'Europe/London', country: 'GB', guardian: 'Zubair Fatima', phone: '+44 7700 900099', fee: 45, curr: 'GBP', tier: 'Beginner', duration: 30, days: [{ day: 'Mon', time: '15:30' }, { day: 'Wed', time: '15:30' }, { day: 'Fri', time: '15:30' }] },
      { name: 'Fatima Rashid', preferredName: 'Fatima', email: 'fatima@lms.com', tz: 'Asia/Karachi', country: 'PK', guardian: 'Rashid Ali', phone: '+92 312 9900112', fee: 12000, curr: 'PKR', tier: 'Intermediate', duration: 60, days: [{ day: 'Mon', time: '16:00' }, { day: 'Wed', time: '16:00' }] },
    ];

    let counter = await this.counterModel.findOne({ name: 'studentId' });
    let currentStudentId = counter ? counter.seq : 1000;

    let createdStudents = 0;
    let createdEnrollments = 0;
    let createdSlots = 0;
    let createdSessions = 0;

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

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let idx = 0; idx < studentConfigs.length; idx++) {
      const cfg = studentConfigs[idx];
      let studentUser = await this.userModel.findOne({ email: cfg.email });

      const assignedTeacher = availableTeachers[idx % availableTeachers.length];
      const assignedCourse = availableCourses[idx % availableCourses.length];

      if (!studentUser) {
        studentUser = await this.userModel.create({
          name: cfg.name,
          preferredName: cfg.preferredName,
          email: cfg.email,
          passwordHash: defaultPassword,
          role: Role.STUDENT,
          timezone: cfg.tz,
          country: cfg.country,
          phone: cfg.phone,
          isActive: true,
        });

        currentStudentId += 1;
        await this.studentModel.create({
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
            classesPerWeek: cfg.days.length,
            classDays: cfg.days,
            tier: cfg.tier,
            monthlyFee: cfg.fee,
            currency: cfg.curr,
            assignedTeacher: assignedTeacher._id,
            noteToTeacher: `Focus on makharij and fluent recitation (${cfg.tier} level).`,
          },
        });
        createdStudents++;

        // Enrollment
        await this.enrollmentModel.create({
          studentId: studentUser._id,
          courseId: assignedCourse._id,
        });
        createdEnrollments++;

        // Weekly Schedule Slots
        for (let d = 0; d < cfg.days.length; d++) {
          const slot = cfg.days[d];
          const fullDay = dayKeyToDayOfWeek[slot.day] || DayOfWeek.MONDAY;
          const [h, m] = slot.time.split(':').map(Number);
          const endH = Math.floor((h * 60 + m + cfg.duration) / 60) % 24;
          const endM = (h * 60 + m + cfg.duration) % 60;
          const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
          const timeSlotIndex = (h - 8) >= 0 ? (h - 8) : d;

          await this.weeklyScheduleSlotModel.create({
            dayOfWeek: fullDay,
            timeSlotIndex,
            startTime: slot.time,
            endTime,
            teacherId: assignedTeacher._id,
            studentId: studentUser._id,
            courseId: assignedCourse._id,
            isRecurring: true,
            isActive: true,
          });
          createdSlots++;
        }

        // Generate past 2 days, today, and next 5 days sessions
        for (let offset = -2; offset <= 5; offset++) {
          const sessionDate = new Date(today);
          sessionDate.setDate(sessionDate.getDate() + offset);
          const dayNum = sessionDate.getDay();

          const matchingSlot = cfg.days.find((d) => dayKeyToDayNumber[d.day] === dayNum);
          if (matchingSlot) {
            const [h, m] = matchingSlot.time.split(':').map(Number);
            const scheduledAt = new Date(sessionDate);
            scheduledAt.setHours(h, m, 0, 0);

            let status = ClassStatus.SCHEDULED;
            if (offset < 0) status = ClassStatus.COMPLETED;
            else if (offset === 0) {
              const currentHour = new Date().getHours();
              if (h < currentHour) status = ClassStatus.COMPLETED;
              else if (h === currentHour) status = ClassStatus.LIVE;
              else status = ClassStatus.SCHEDULED;
            }

            await this.classSessionModel.create({
              courseId: assignedCourse._id,
              teacherId: assignedTeacher._id,
              studentId: studentUser._id,
              scheduledAt,
              durationMinutes: cfg.duration,
              status,
              zoomJoinUrl: `http://localhost:3000/classroom/${studentUser._id}`,
            });
            createdSessions++;
          }
        }
      }
    }

    await this.counterModel.findOneAndUpdate(
      { name: 'studentId' },
      { seq: currentStudentId },
      { upsert: true, new: true },
    );

    createdCounts['students'] = createdStudents;
    createdCounts['enrollments'] = createdEnrollments;
    createdCounts['weeklyScheduleSlots'] = createdSlots;
    createdCounts['classSessions'] = createdSessions;
    return createdCounts;
  }

  private async seedFinanceData(adminId?: any) {
    const createdCounts: Record<string, number> = {};
    const students = await this.studentModel.find().populate('userId');
    const teachers = await this.userModel.find({ role: Role.TEACHER });
    const courses = await this.courseModel.find();

    const currentMonth = new Date().toISOString().slice(0, 7);
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 10);

    let createdInvoices = 0;
    let createdSalaries = 0;

    for (let i = 0; i < students.length; i++) {
      const s = students[i];
      const studentUser = s.userId as any;
      if (!studentUser) continue;

      const course = courses[i % courses.length];
      const monthlyFee = s.profile?.monthlyFee || 50;
      const currency = s.profile?.currency || 'USD';
      const isPaid = i % 2 === 0;

      const existingInv = await this.invoiceModel.findOne({
        studentId: studentUser._id,
        billingMonth: currentMonth,
      });

      if (!existingInv) {
        await this.invoiceModel.create({
          studentId: studentUser._id,
          courseId: course ? course._id : undefined,
          amount: monthlyFee,
          currency,
          dueDate,
          status: isPaid ? InvoiceStatus.PAID : InvoiceStatus.PENDING,
          paidAmount: isPaid ? monthlyFee : 0,
          paidDate: isPaid ? new Date() : undefined,
          paymentMethod: isPaid ? PaymentMethod.CASH : undefined,
          billingMonth: currentMonth,
          recordedBy: adminId || undefined,
        });
        createdInvoices++;
      }
    }

    for (let j = 0; j < teachers.length; j++) {
      const t = teachers[j];
      const existingSal = await this.salaryPaymentModel.findOne({
        teacherId: t._id,
        month: currentMonth,
      });

      if (!existingSal) {
        await this.salaryPaymentModel.create({
          teacherId: t._id,
          amount: 35000 + (j * 2000),
          month: currentMonth,
          paymentDate: new Date(),
          paymentMethod: PaymentMethod.CASH,
          notes: `Monthly salary disbursement for ${t.name}`,
          recordedBy: adminId || undefined,
        });
        createdSalaries++;
      }
    }

    createdCounts['invoices'] = createdInvoices;
    createdCounts['salaryPayments'] = createdSalaries;
    return createdCounts;
  }

  private async seedMaterials(adminId?: any) {
    const createdCounts: Record<string, number> = {};
    const existingCount = await this.materialModel.countDocuments();
    if (existingCount > 0) {
      createdCounts['materials'] = 0;
      return createdCounts;
    }

    const courses = await this.courseModel.find();
    const sampleMaterials = [
      {
        title: 'Noorani Qaida with English Instructions',
        description: 'Standard beginner Arabic alphabet and pronunciation primer for young learners.',
        category: MaterialCategory.QAIDA,
        targetLevel: 'Beginner',
        courseId: courses[0]?._id,
        fileName: 'noorani_qaida_complete.pdf',
        fileUrl: '/uploads/materials/sample_noorani_qaida.pdf',
        fileSize: 4520000,
        mimeType: 'application/pdf',
        uploadedBy: adminId || undefined,
        downloadsCount: 34,
      },
      {
        title: 'Essential Tajweed Rules Handbook',
        description: 'Comprehensive guide covering Makharij, Noon Sakinah, Meem Sakinah and Mudood rules.',
        category: MaterialCategory.TAJWEED,
        targetLevel: 'Intermediate',
        courseId: courses[1]?._id,
        fileName: 'tajweed_rules_handbook.pdf',
        fileUrl: '/uploads/materials/sample_tajweed_rules.pdf',
        fileSize: 2840000,
        mimeType: 'application/pdf',
        uploadedBy: adminId || undefined,
        downloadsCount: 68,
      },
      {
        title: 'Juz 30 (Amma Para) with Color Coded Tajweed',
        description: 'Complete 30th Juz of the Holy Quran with high resolution tajweed color coding.',
        category: MaterialCategory.QURAN_PARAH,
        targetLevel: 'Intermediate',
        courseId: courses[2]?._id,
        fileName: 'juz_30_tajweed_colored.pdf',
        fileUrl: '/uploads/materials/sample_juz_30.pdf',
        fileSize: 8900000,
        mimeType: 'application/pdf',
        uploadedBy: adminId || undefined,
        downloadsCount: 112,
      },
      {
        title: 'Daily Masnoon Duas & Morning/Evening Adhkar',
        description: 'Authentic Fortress of the Muslim supplications with Arabic, transliteration and translation.',
        category: MaterialCategory.DUAS_ADHKAR,
        targetLevel: 'All Levels',
        courseId: courses[3]?._id,
        fileName: 'masnoon_duas_collection.pdf',
        fileUrl: '/uploads/materials/sample_masnoon_duas.pdf',
        fileSize: 1750000,
        mimeType: 'application/pdf',
        uploadedBy: adminId || undefined,
        downloadsCount: 95,
      },
      {
        title: 'Basic Islamic Studies: Pillars of Islam & Iman',
        description: 'Workbook for students covering Shahadah, Salah, Sawm, Zakah, and Hajj fundamentals.',
        category: MaterialCategory.ISLAMIC_STUDIES,
        targetLevel: 'Beginner',
        courseId: courses[4]?._id,
        fileName: 'pillars_of_islam_workbook.pdf',
        fileUrl: '/uploads/materials/sample_islamic_studies.pdf',
        fileSize: 3200000,
        mimeType: 'application/pdf',
        uploadedBy: adminId || undefined,
        downloadsCount: 52,
      },
    ];

    const docs = await this.materialModel.insertMany(sampleMaterials);
    createdCounts['materials'] = docs.length;
    return createdCounts;
  }
}
