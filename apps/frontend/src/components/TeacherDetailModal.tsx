'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  XCircle, User, Shield, BookOpen, Calendar, Clock,
  Mail, Phone, Globe, CheckCircle2, AlertCircle, Sparkles, BookUser,
  Activity, ShieldCheck, DollarSign, Award, Edit, FileText, GraduationCap, Users, VideoOff, KeyRound
} from 'lucide-react';
import { getImageUrl } from '@/utils/image';
import { apiFetch } from '@/utils/apiFetch';
import { getCountryByCode, getCountryByName } from '@/utils/countries';
import TeacherTimetableGrid from './TeacherTimetableGrid';
import TeacherCourseAssignmentModal from './TeacherCourseAssignmentModal';

export interface GuarantorItem {
  name: string;
  phone: string;
  email?: string;
  relationship: string;
  cnicOrId: string;
  address?: string;
}

export interface TeacherUser {
  id: string;
  _id?: string;
  employeeId?: string;
  avatar?: string;
  profilePicture?: string;
  name: string;
  preferredName?: string;
  email: string;
  role: string;
  gender?: string;
  country?: string;
  phone?: string;
  phoneCode?: string;
  qualification?: string;
  specialization?: string;
  joiningDate?: string;
  salary?: number;
  currency?: string;
  bio?: string;
  timezone?: string;
  guarantors?: GuarantorItem[];
  canEditProfile?: boolean;
  cameraRestricted?: boolean;
  isActive: boolean;
  createdAt: string;
}

interface AssignedCourse {
  id: string;
  title: string;
  type?: string;
  description?: string;
  curriculum?: string;
  enrolledStudentsCount?: number;
  students?: any[];
}

interface TeacherDetailModalProps {
  isOpen: boolean;
  teacher: TeacherUser | null;
  onClose: () => void;
  onEdit?: (teacher: TeacherUser) => void;
  onEditCredentials?: (teacher: TeacherUser) => void;
}

export default function TeacherDetailModal({
  isOpen,
  teacher,
  onClose,
  onEdit,
  onEditCredentials,
}: TeacherDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'timetable' | 'students' | 'courses' | 'guarantors'>('overview');
  const [courses, setCourses] = useState<AssignedCourse[]>([]);
  const [assignedStudents, setAssignedStudents] = useState<any[]>([]);
  const [assignedSlotsCount, setAssignedSlotsCount] = useState<number>(0);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

  useEffect(() => {
    if (isOpen && teacher) {
      const teacherTargetId = teacher.id || teacher._id;
      if (teacherTargetId) {
        fetchTeacherData(teacherTargetId);
      }
    }
  }, [isOpen, teacher]);

  const fetchTeacherData = async (teacherId: string) => {
    setLoadingCourses(true);
    try {
      const [coursesRes, gridRes, enrollmentsRes] = await Promise.all([
        apiFetch(`${API_URL}/courses/teacher/${teacherId}`).catch(() => null),
        apiFetch(`${API_URL}/schedule/grid`).catch(() => null),
        apiFetch(`${API_URL}/enrollments/teacher/${teacherId}`).catch(() => null),
      ]);

      let fetchedCourses: AssignedCourse[] = [];
      if (coursesRes && coursesRes.ok) {
        const data = await coursesRes.json();
        fetchedCourses = Array.isArray(data) ? data : [];
      }

      let fetchedEnrollments: any[] = [];
      if (enrollmentsRes && enrollmentsRes.ok) {
        const eData = await enrollmentsRes.json();
        fetchedEnrollments = Array.isArray(eData) ? eData : [];
      }

      let slotCount = 0;
      const slotStudentsMap: Record<string, any> = {};
      if (gridRes && gridRes.ok) {
        const gridData: any[] = await gridRes.json();
        const teacherSlots = gridData.filter((s) => {
          const tId = typeof s.teacherId === 'object' ? s.teacherId?._id || s.teacherId?.id : s.teacherId;
          return tId === teacherId || s.teacher?.id === teacherId || s.teacher?._id === teacherId;
        });
        slotCount = teacherSlots.length;

        teacherSlots.forEach((slot) => {
          if (slot.student) {
            const sId = slot.student.id || slot.student._id;
            if (sId) {
              slotStudentsMap[sId] = {
                student: slot.student,
                course: slot.course || { title: 'Weekly Timetable Slot', type: 'Schedule Slot' },
              };
            }
          }
          if (Array.isArray(slot.enrolledStudents)) {
            slot.enrolledStudents.forEach((st: any) => {
              const sId = st.id || st._id;
              if (sId) {
                slotStudentsMap[sId] = {
                  student: st,
                  course: slot.course || { title: 'Weekly Timetable Slot', type: 'Schedule Slot' },
                };
              }
            });
          }
        });
      }

      // Merge API enrollments & schedule slot students
      const combinedEnrollments = [...fetchedEnrollments];
      Object.values(slotStudentsMap).forEach((item: any) => {
        const sId = item.student?.id || item.student?._id;
        const exists = combinedEnrollments.some((e) => (e.student?.id || e.student?._id) === sId);
        if (!exists) {
          combinedEnrollments.push(item);
        }
      });

      setAssignedStudents(combinedEnrollments);

      // Map enrolled students onto courses
      const courseStudentsMap: Record<string, any[]> = {};
      combinedEnrollments.forEach((e: any) => {
        const cId = e.course?.id || e.course?._id || e.courseId;
        if (cId && e.student) {
          if (!courseStudentsMap[cId]) courseStudentsMap[cId] = [];
          if (!courseStudentsMap[cId].some((st) => (st.id || st._id) === (e.student.id || e.student._id))) {
            courseStudentsMap[cId].push(e.student);
          }
        }
      });

      fetchedCourses = fetchedCourses.map((c) => {
        const cId = c.id || (c as any)._id;
        const students = courseStudentsMap[cId] || [];
        return {
          ...c,
          students,
          enrolledStudentsCount: students.length,
        };
      });

      setCourses(fetchedCourses);
      setAssignedSlotsCount(slotCount);
    } catch (err) {
      console.error('Error fetching teacher data:', err);
    } finally {
      setLoadingCourses(false);
    }
  };

  // Compute unique students
  const uniqueStudents = useMemo(() => {
    const studentMap: Record<string, { student: any; courses: string[] }> = {};
    assignedStudents.forEach((enrollment) => {
      const s = enrollment.student;
      if (!s) return;
      const sId = s.id || s._id;
      if (!sId) return;
      if (!studentMap[sId]) {
        studentMap[sId] = {
          student: s,
          courses: [],
        };
      }
      if (enrollment.course?.title) {
        studentMap[sId].courses.push(enrollment.course.title);
      }
    });
    return Object.values(studentMap);
  }, [assignedStudents]);

  if (!isOpen || !teacher) return null;

  const photo = teacher.profilePicture || teacher.avatar;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-2 sm:p-4 bg-background/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
      {/* Fullscreen Dialog Container */}
      <div className="glass-panel w-full max-w-5xl h-[92vh] max-h-[920px] rounded-3xl p-6 sm:p-8 shadow-2xl relative border border-border flex flex-col my-auto overflow-hidden bg-card/95">

        {/* Top Floating Glow Backdrop */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-brand/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border/60 pb-5 z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-brand/15 text-brand border border-brand/20 shadow-inner">
              <BookUser className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground">Teacher Profile Details</h2>
                <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-full bg-brand/10 text-brand border border-brand/20">
                  {teacher.employeeId || 'EMP-001'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">Comprehensive instructor profile, verified guarantors, credentials, and assigned students.</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {onEditCredentials && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEditCredentials(teacher);
                }}
                className="flex items-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 text-xs font-bold py-2.5 px-3.5 rounded-xl transition-all"
                title="Change login email or reset password"
              >
                <KeyRound className="h-4 w-4" />
                <span className="hidden sm:inline">Credentials</span>
              </button>
            )}
            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(teacher);
                }}
                className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold py-2.5 px-4 rounded-xl shadow-md transition-all"
              >
                <Edit className="h-4 w-4" />
                <span>Edit Profile</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors p-1 hover:bg-muted rounded-full ml-1"
            >
              <XCircle className="h-7 w-7" />
            </button>
          </div>
        </div>

        {/* Teacher Banner Ribbon Header */}
        <div className="my-5 p-5 rounded-2xl bg-gradient-to-r from-card via-muted/40 to-card border border-border flex flex-col sm:flex-row items-center justify-between gap-5 z-10 shrink-0 shadow-sm">
          <div className="flex items-center gap-5 w-full sm:w-auto">
            {/* Profile Photo Display */}
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-brand/40 shadow-xl bg-muted shrink-0 group">
              {photo ? (
                <img
                  src={getImageUrl(photo)}
                  alt={teacher.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-brand/10 text-brand font-bold text-2xl">
                  {teacher.name?.charAt(0)}
                </div>
              )}
            </div>

            {/* Basic Identity Info */}
            <div className="space-y-1">
              <h3 className="text-xl sm:text-2xl font-bold font-display text-foreground flex items-center gap-2">
                <span>{teacher.name}</span>
                {teacher.preferredName && <span className="text-muted-foreground font-normal text-base">({teacher.preferredName})</span>}
                {(() => {
                  const c = getCountryByCode(teacher.country) || getCountryByName(teacher.country);
                  return c ? <span className="text-xl">{c.flag}</span> : null;
                })()}
              </h3>
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-brand" />
                <span>{teacher.email}</span>
                {teacher.phone && (
                  <>
                    <span className="text-border">•</span>
                    <Phone className="h-3.5 w-3.5 text-emerald-500" />
                    <span className="font-mono">{teacher.phone}</span>
                  </>
                )}
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${teacher.isActive
                  ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                  }`}>
                  {teacher.isActive ? 'Active Staff' : 'Inactive'}
                </span>
                {teacher.cameraRestricted && (
                  <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <VideoOff className="h-3 w-3" />
                    <span>Camera Restricted</span>
                  </span>
                )}
                <span className="bg-brand/10 text-brand border border-brand/20 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                  {teacher.specialization || 'Tajweed & Nazira'}
                </span>
                <span className="bg-muted text-muted-foreground border border-border text-[10px] font-semibold px-2.5 py-0.5 rounded-full">
                  Timezone: {teacher.timezone || 'UTC'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-4 w-full sm:w-auto justify-around sm:justify-end border-t sm:border-t-0 sm:border-l border-border pt-4 sm:pt-0 sm:pl-6">
            <button
              type="button"
              onClick={() => setActiveTab('timetable')}
              className="text-center p-2 rounded-xl hover:bg-muted/60 transition-all cursor-pointer group"
              title="Click to view weekly timetable"
            >
              <p className="text-xl font-bold font-mono text-brand group-hover:scale-110 transition-transform">
                {assignedSlotsCount || courses.length}
              </p>
              <p className="text-[10px] text-muted-foreground font-semibold uppercase group-hover:text-brand transition-colors">
                Timetable Slots
              </p>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('students')}
              className="text-center p-2 rounded-xl hover:bg-muted/60 transition-all cursor-pointer group"
              title="Click to view assigned students"
            >
              <p className="text-xl font-bold font-mono text-blue-500 group-hover:scale-110 transition-transform">
                {uniqueStudents.length}
              </p>
              <p className="text-[10px] text-muted-foreground font-semibold uppercase group-hover:text-blue-500 transition-colors">
                Assigned Students
              </p>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className="text-center p-2 rounded-xl hover:bg-muted/60 transition-all cursor-pointer group"
              title="Click to view payroll"
            >
              <p className="text-xl font-bold font-mono text-emerald-500 group-hover:scale-110 transition-transform">
                {teacher.salary ? `${teacher.currency || 'PKR'} ${teacher.salary.toLocaleString()}` : '—'}
              </p>
              <p className="text-[10px] text-muted-foreground font-semibold uppercase group-hover:text-emerald-500 transition-colors">
                Monthly Pay
              </p>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('guarantors')}
              className="text-center p-2 rounded-xl hover:bg-muted/60 transition-all cursor-pointer group"
              title="Click to view guarantors"
            >
              <p className="text-xl font-bold font-mono text-foreground group-hover:scale-110 transition-transform">
                {teacher.guarantors?.length || 0}
              </p>
              <p className="text-[10px] text-muted-foreground font-semibold uppercase group-hover:text-foreground transition-colors">
                Guarantors
              </p>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-border/60 pb-3 mb-5 z-10 shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'overview'
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <User className="h-4 w-4" />
            <span>Personal & Professional</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('timetable')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'timetable'
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <Calendar className="h-4 w-4" />
            <span>Weekly Timetable ({assignedSlotsCount} Slots)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('students')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'students'
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <GraduationCap className="h-4 w-4" />
            <span>Assigned Students ({uniqueStudents.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('courses')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'courses'
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <BookOpen className="h-4 w-4" />
            <span>Assigned Courses ({courses.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('guarantors')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'guarantors'
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Guarantors & Verification ({teacher.guarantors?.length || 0})</span>
          </button>
        </div>

        {/* Tab Content Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto pr-1 z-10 space-y-6">
          {/* TAB 1: OVERVIEW & PROFESSIONAL */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-fadeIn">
              <div className="glass-panel p-5 rounded-2xl border border-border space-y-4">
                <h4 className="text-sm font-bold text-foreground flex items-center gap-2 border-b border-border/40 pb-2">
                  <User className="h-4 w-4 text-brand" />
                  <span>Personal Information</span>
                </h4>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between py-1 border-b border-border/30">
                    <span className="text-muted-foreground font-medium">Full Name:</span>
                    <span className="font-semibold text-foreground">{teacher.name}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/30">
                    <span className="text-muted-foreground font-medium">Preferred Name:</span>
                    <span className="font-semibold text-foreground">{teacher.preferredName || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/30">
                    <span className="text-muted-foreground font-medium">Email Address:</span>
                    <span className="font-semibold text-foreground">{teacher.email}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/30">
                    <span className="text-muted-foreground font-medium">Gender:</span>
                    <span className="font-semibold text-foreground">{teacher.gender || 'Not specified'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/30">
                    <span className="text-muted-foreground font-medium">Timezone Region:</span>
                    <span className="font-mono font-semibold text-foreground">{teacher.timezone || 'UTC'}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground font-medium">Joining Date:</span>
                    <span className="font-semibold text-foreground">
                      {teacher.joiningDate
                        ? new Date(teacher.joiningDate).toLocaleDateString(undefined, { dateStyle: 'medium' })
                        : new Date(teacher.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="glass-panel p-5 rounded-2xl border border-border space-y-4">
                <h4 className="text-sm font-bold text-foreground flex items-center gap-2 border-b border-border/40 pb-2">
                  <Award className="h-4 w-4 text-brand" />
                  <span>Professional Credentials & Payroll</span>
                </h4>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between py-1 border-b border-border/30">
                    <span className="text-muted-foreground font-medium">Employee System ID:</span>
                    <span className="font-mono font-bold text-brand">{teacher.employeeId || 'EMP-001'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/30">
                    <span className="text-muted-foreground font-medium">Qualification:</span>
                    <span className="font-semibold text-foreground">{teacher.qualification || 'Not specified'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/30">
                    <span className="text-muted-foreground font-medium">Specialization:</span>
                    <span className="font-semibold text-foreground">{teacher.specialization || 'Tajweed & Nazira'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/30">
                    <span className="text-muted-foreground font-medium">Monthly Compensation:</span>
                    <span className="font-mono font-bold text-emerald-500">
                      {teacher.salary ? `${teacher.currency || 'PKR'} ${teacher.salary.toLocaleString()}` : 'Not set'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/30">
                    <span className="text-muted-foreground font-medium">Self-Profile Editing:</span>
                    <span className={`font-bold ${teacher.canEditProfile !== false ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {teacher.canEditProfile !== false ? 'Allowed' : 'Disabled'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/30">
                    <span className="text-muted-foreground font-medium">Account Status:</span>
                    <span className={`font-bold ${teacher.isActive ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {teacher.isActive ? 'Active Account' : 'Suspended / Inactive'}
                    </span>
                  </div>
                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-muted-foreground font-medium">Weekly Schedule:</span>
                    <button
                      type="button"
                      onClick={() => setActiveTab('timetable')}
                      className="text-xs font-bold text-brand hover:underline flex items-center gap-1.5 cursor-pointer"
                    >
                      <Calendar className="h-3.5 w-3.5" />
                      <span>View Timetable ({assignedSlotsCount} Slots)</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Bio Statement */}
              {teacher.bio && (
                <div className="glass-panel p-5 rounded-2xl border border-border md:col-span-2 space-y-2">
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-2 uppercase tracking-wider text-muted-foreground">
                    <FileText className="h-4 w-4 text-brand" />
                    <span>Teacher Biography & Overview</span>
                  </h4>
                  <p className="text-xs text-foreground/90 leading-relaxed whitespace-pre-wrap">{teacher.bio}</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: WEEKLY TIMETABLE SCHEDULE */}
          {activeTab === 'timetable' && (
            <div className="space-y-6 animate-fadeIn">
              <TeacherTimetableGrid
                teacherId={teacher.id || teacher._id || ''}
                teacherName={teacher.name}
                timezone={teacher.timezone || 'UTC'}
                specialization={teacher.specialization || 'Tajweed & Quranic Studies'}
                coursesCount={courses.length}
                studentsCount={uniqueStudents.length}
              />
            </div>
          )}

          {/* TAB 3: ASSIGNED STUDENTS */}
          {activeTab === 'students' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-foreground flex items-center gap-2 border-b border-border/40 pb-2">
                  <GraduationCap className="h-4 w-4 text-brand" />
                  <span>Assigned Enrolled Students ({uniqueStudents.length})</span>
                </h4>
              </div>

              {loadingCourses ? (
                <div className="py-12 flex justify-center">
                  <Activity className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : uniqueStudents.length === 0 ? (
                <div className="p-8 rounded-2xl bg-card/50 border border-border text-center text-xs text-muted-foreground">
                  No active students enrolled in this teacher's assigned courses yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {uniqueStudents.map(({ student, courses: studentCourses }, idx) => {
                    const sPhoto = student.profilePicture || student.avatar;
                    return (
                      <div
                        key={student.id || student._id || idx}
                        className="p-4 rounded-2xl glass-panel border border-border/70 shadow-sm flex items-start gap-4 hover:border-brand/40 transition-all bg-card/70"
                      >
                        <div className="w-12 h-12 rounded-2xl bg-brand/15 border border-brand/30 flex items-center justify-center shrink-0 text-brand font-bold overflow-hidden">
                          {sPhoto ? (
                            <img src={getImageUrl(sPhoto)} alt={student.name} className="w-full h-full object-cover" />
                          ) : (
                            <span>{student.name?.charAt(0)}</span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0 space-y-1 text-xs">
                          <div className="flex items-center justify-between gap-2">
                            <h5 className="font-bold text-foreground text-sm truncate">{student.name}</h5>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                              Active Student
                            </span>
                          </div>

                          <p className="text-muted-foreground flex items-center gap-1 text-[11px]">
                            <Mail className="h-3 w-3 text-brand shrink-0" />
                            <span className="truncate">{student.email}</span>
                          </p>

                          {student.timezone && (
                            <p className="text-muted-foreground text-[10px] font-mono">
                              Timezone: {student.timezone}
                            </p>
                          )}

                          <div className="pt-2 border-t border-border/40 flex flex-wrap items-center gap-1.5 mt-2">
                            <span className="text-[10px] font-medium text-muted-foreground">Enrolled In:</span>
                            {studentCourses.map((cTitle, cIdx) => (
                              <span
                                key={cIdx}
                                className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-brand/10 text-brand border border-brand/20"
                              >
                                {cTitle}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ASSIGNED COURSES & CLASSES */}
          {activeTab === 'courses' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-brand" />
                  <span>Assigned Courses Taught</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-brand/15 text-brand border border-brand/30 text-xs font-bold hover:bg-brand/20 transition-all shadow-sm"
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  <span>Assign / Edit Courses</span>
                </button>
              </div>

              {loadingCourses ? (
                <div className="py-12 flex justify-center">
                  <Activity className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : courses.length === 0 ? (
                <div className="p-8 rounded-2xl bg-card/50 border border-border text-center text-xs text-muted-foreground">
                  No active course curriculum assigned to this teacher yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {courses.map((course) => (
                    <div
                      key={course.id}
                      className="p-5 rounded-2xl glass-panel border border-border/60 shadow-md space-y-3 relative hover:border-brand/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-brand/10 text-brand border border-brand/20">
                            {course.type || 'Standard Course'}
                          </span>
                          <h5 className="text-base font-bold text-foreground mt-1.5">{course.title}</h5>
                        </div>
                      </div>

                      {course.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{course.description}</p>
                      )}

                      {course.curriculum && (
                        <p className="text-xs text-muted-foreground italic line-clamp-2">Curriculum: {course.curriculum}</p>
                      )}

                      <div className="pt-3 border-t border-border/40 space-y-1.5 text-xs text-muted-foreground">
                        <div className="flex items-center justify-between font-semibold text-foreground">
                          <span>{course.enrolledStudentsCount || course.students?.length || 0} Enrolled Students</span>
                        </div>
                        {course.students && course.students.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1 pt-1">
                            {course.students.map((st: any, sIdx: number) => (
                              <span key={sIdx} className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20 text-[10px] font-semibold">
                                {st.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: GUARANTORS & VERIFICATION */}
          {activeTab === 'guarantors' && (
            <div className="space-y-4 animate-fadeIn">
              <h4 className="text-sm font-bold text-foreground flex items-center gap-2 border-b border-border/40 pb-2">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <span>Verified Guarantor Records & Credentials</span>
              </h4>

              {!teacher.guarantors || teacher.guarantors.length === 0 ? (
                <div className="py-12 text-center text-xs text-muted-foreground italic glass-panel p-6 rounded-2xl border border-border">
                  No verified guarantor records registered for this teacher profile.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {teacher.guarantors.map((g, idx) => (
                    <div key={idx} className="glass-panel p-5 rounded-2xl border border-border/70 space-y-3 bg-card/60">
                      <div className="flex items-center justify-between border-b border-border/40 pb-2">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="h-5 w-5 text-emerald-500" />
                          <span className="font-bold text-sm text-foreground">Guarantor #{idx + 1}: {g.name}</span>
                        </div>
                        <span className="text-xs font-semibold text-brand px-2 py-0.5 rounded-full bg-brand/10 border border-brand/20">
                          {g.relationship}
                        </span>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between py-0.5">
                          <span className="text-muted-foreground font-medium">CNIC / Government ID:</span>
                          <span className="font-mono font-bold text-foreground">{g.cnicOrId}</span>
                        </div>
                        <div className="flex justify-between py-0.5">
                          <span className="text-muted-foreground font-medium">Contact Phone:</span>
                          <span className="font-semibold text-foreground">{g.phone}</span>
                        </div>
                        {g.email && (
                          <div className="flex justify-between py-0.5">
                            <span className="text-muted-foreground font-medium">Email Address:</span>
                            <span className="font-semibold text-foreground">{g.email}</span>
                          </div>
                        )}
                        {g.address && (
                          <div className="py-0.5">
                            <span className="text-muted-foreground font-medium block">Residential Address:</span>
                            <span className="text-foreground font-medium mt-0.5 block">{g.address}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Dialog Footer */}
        <div className="pt-4 border-t border-border flex items-center justify-between z-10 shrink-0 mt-4">
          <p className="text-[11px] text-muted-foreground font-mono">
            Account Created: {new Date(teacher.createdAt).toLocaleDateString()}
          </p>

          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 text-xs font-bold rounded-xl bg-muted hover:bg-muted/80 text-foreground transition-all shadow-sm"
          >
            Close Profile
          </button>
        </div>
      </div>

      {/* ASSIGN / EDIT COURSES MODAL */}
      <TeacherCourseAssignmentModal
        isOpen={isAssignModalOpen}
        teacher={teacher}
        onClose={() => setIsAssignModalOpen(false)}
        onSuccess={() => {
          const teacherTargetId = teacher.id || teacher._id;
          if (teacherTargetId) {
            fetchTeacherData(teacherTargetId);
          }
        }}
      />
    </div>
  );
}
