'use client';

import React, { useState, useEffect } from 'react';
import {
  XCircle, User, Shield, GraduationCap, BookOpen, Calendar, Clock,
  Mail, Phone, Globe, CheckCircle2, AlertCircle, Sparkles, BookUser,
  Activity, ShieldAlert, Award
} from 'lucide-react';

interface StudentUser {
  id: string;
  _id?: string;
  studentId?: number | string;
  profilePicture?: string;
  avatar?: string;
  name: string;
  preferredName?: string;
  email: string;
  role: string;
  gender?: string;
  dob?: string;
  dateOfBirth?: string;
  timezone?: string;
  enrollmentDate?: string;
  status?: string;
  studentStatus?: string;
  trialStatus?: string;
  isDiscontinued?: boolean;
  discontinued?: boolean;
  guardianName?: string;
  guardianPhone?: string;
  guardianEmail?: string;
  isActive: boolean;
  createdAt: string;
}

interface EnrollmentDetail {
  id: string;
  enrolledAt: string;
  course?: {
    id: string;
    title: string;
    type: string;
    curriculum?: string;
    teacher?: {
      id: string;
      name: string;
      email: string;
    };
  };
}

interface StudentDetailModalProps {
  isOpen: boolean;
  student: StudentUser | null;
  onClose: () => void;
  onEdit?: (student: StudentUser) => void;
  onAssignCourse?: (student: StudentUser) => void;
  onAssignTeacher?: (student: StudentUser) => void;
}

export default function StudentDetailModal({
  isOpen,
  student,
  onClose,
  onEdit,
  onAssignCourse,
  onAssignTeacher,
}: StudentDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'guardian'>('overview');
  const [enrollments, setEnrollments] = useState<EnrollmentDetail[]>([]);
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

  useEffect(() => {
    if (isOpen && student) {
      const studentTargetId = student.id || student._id;
      if (studentTargetId) {
        fetchStudentEnrollments(studentTargetId);
      }
    }
  }, [isOpen, student]);

  const fetchStudentEnrollments = async (studentId: string) => {
    setLoadingEnrollments(true);
    try {
      const res = await fetch(`${API_URL}/enrollments/student/${studentId}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setEnrollments(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error fetching student enrollments:', err);
    } finally {
      setLoadingEnrollments(false);
    }
  };

  if (!isOpen || !student) return null;

  const calculateAgeAndType = (dobStr?: string) => {
    if (!dobStr) return { age: '-', type: '-' };
    const birthDate = new Date(dobStr);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return { age: isNaN(age) ? '-' : age, type: age < 18 ? 'Child' : 'Adult' };
  };

  const getFullImageUrl = (url?: string | null) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:5000';
    return `${baseUrl}${url}`;
  };

  const dobVal = student.dob || student.dateOfBirth || '';
  const { age, type } = calculateAgeAndType(dobVal);
  const photo = student.profilePicture || student.avatar;

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
              <GraduationCap className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground">Student Profile Details</h2>
                <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-full bg-brand/10 text-brand border border-brand/20">
                  {student.studentId ? `STU-${student.studentId}` : 'STU-NEW'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">Comprehensive profile overview, guardian credentials, and active course assignments.</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {onAssignCourse && (
              <button
                type="button"
                onClick={() => onAssignCourse(student)}
                className="flex items-center gap-1.5 bg-brand/10 hover:bg-brand/20 text-brand border border-brand/30 text-xs font-bold py-2 px-3 sm:px-3.5 rounded-xl transition-all"
                title="Quickly assign a course to this student"
              >
                <BookOpen className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Assign Course</span>
              </button>
            )}
            {onAssignTeacher && (
              <button
                type="button"
                onClick={() => onAssignTeacher(student)}
                className="flex items-center gap-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 border border-blue-500/30 text-xs font-bold py-2 px-3 sm:px-3.5 rounded-xl transition-all"
                title="Quickly assign a teacher to this student's course"
              >
                <BookUser className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Assign Teacher</span>
              </button>
            )}
            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(student);
                }}
                className="hidden md:flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold py-2 px-4 rounded-xl shadow-md transition-all"
              >
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

        {/* Student Banner Ribbon Header */}
        <div className="my-5 p-5 rounded-2xl bg-gradient-to-r from-card via-muted/40 to-card border border-border flex flex-col sm:flex-row items-center justify-between gap-5 z-10 shrink-0 shadow-sm">
          <div className="flex items-center gap-5 w-full sm:w-auto">
            {/* 1:1 Profile Photo Display */}
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-brand/40 shadow-xl bg-muted shrink-0 group">
              {photo ? (
                <img
                  src={getFullImageUrl(photo)}
                  alt={student.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-brand/10 text-brand">
                  <User className="h-10 w-10 opacity-70" />
                </div>
              )}
            </div>

            {/* Basic Identity Info */}
            <div className="space-y-1">
              <h3 className="text-xl sm:text-2xl font-bold font-display text-foreground">
                {student.name} {student.preferredName && <span className="text-muted-foreground font-normal">({student.preferredName})</span>}
              </h3>
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-brand" />
                <span>{student.email}</span>
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                  student.isActive && !student.discontinued && !student.isDiscontinued
                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                }`}>
                  {student.isActive && !student.discontinued && !student.isDiscontinued ? 'Active Student' : 'Inactive'}
                </span>
                {type === 'Child' ? (
                  <span className="bg-blue-500/10 text-blue-500 border border-blue-500/20 text-[10px] font-bold px-2.5 py-0.5 rounded-full">Minor / Child</span>
                ) : type === 'Adult' ? (
                  <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-bold px-2.5 py-0.5 rounded-full">Adult Student</span>
                ) : null}
                <span className="bg-muted text-muted-foreground border border-border text-[10px] font-semibold px-2.5 py-0.5 rounded-full">
                  Timezone: {student.timezone || 'UTC'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-4 w-full sm:w-auto justify-around sm:justify-end border-t sm:border-t-0 sm:border-l border-border pt-4 sm:pt-0 sm:pl-6">
            <div className="text-center">
              <p className="text-xl font-bold font-mono text-brand">{enrollments.length}</p>
              <p className="text-[10px] text-muted-foreground font-semibold uppercase">Enrolled Courses</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold font-mono text-foreground">{age !== '-' ? age : '—'}</p>
              <p className="text-[10px] text-muted-foreground font-semibold uppercase">Age (Years)</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-border/60 pb-3 mb-5 z-10 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'overview'
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <User className="h-4 w-4" />
            <span>Personal & Demographics</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('courses')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'courses'
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <BookOpen className="h-4 w-4" />
            <span>Courses & Teachers ({enrollments.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('guardian')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'guardian'
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <Shield className="h-4 w-4" />
            <span>Guardian & Parent Info</span>
          </button>
        </div>

        {/* Tab Content Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto pr-1 z-10 space-y-6">
          {/* TAB 1: OVERVIEW & DEMOGRAPHICS */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-fadeIn">
              <div className="glass-panel p-5 rounded-2xl border border-border space-y-4">
                <h4 className="text-sm font-bold text-foreground flex items-center gap-2 border-b border-border/40 pb-2">
                  <User className="h-4 w-4 text-brand" />
                  <span>Personal Demographics</span>
                </h4>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between py-1 border-b border-border/30">
                    <span className="text-muted-foreground font-medium">Full Name:</span>
                    <span className="font-semibold text-foreground">{student.name}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/30">
                    <span className="text-muted-foreground font-medium">Preferred Name:</span>
                    <span className="font-semibold text-foreground">{student.preferredName || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/30">
                    <span className="text-muted-foreground font-medium">Email Address:</span>
                    <span className="font-semibold text-foreground">{student.email}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/30">
                    <span className="text-muted-foreground font-medium">Gender:</span>
                    <span className="font-semibold text-foreground">{student.gender || 'Not specified'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/30">
                    <span className="text-muted-foreground font-medium">Date of Birth:</span>
                    <span className="font-semibold text-foreground">
                      {dobVal ? new Date(dobVal).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground font-medium">Timezone Region:</span>
                    <span className="font-mono font-semibold text-foreground">{student.timezone || 'UTC'}</span>
                  </div>
                </div>
              </div>

              <div className="glass-panel p-5 rounded-2xl border border-border space-y-4">
                <h4 className="text-sm font-bold text-foreground flex items-center gap-2 border-b border-border/40 pb-2">
                  <GraduationCap className="h-4 w-4 text-brand" />
                  <span>Academy Classification</span>
                </h4>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between py-1 border-b border-border/30">
                    <span className="text-muted-foreground font-medium">Student System ID:</span>
                    <span className="font-mono font-bold text-brand">{student.studentId ? `STU-${student.studentId}` : '—'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/30">
                    <span className="text-muted-foreground font-medium">Enrollment Date:</span>
                    <span className="font-semibold text-foreground">
                      {student.enrollmentDate ? new Date(student.enrollmentDate).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/30">
                    <span className="text-muted-foreground font-medium">Academic Status:</span>
                    <span className="font-semibold text-foreground">{student.studentStatus || student.status || 'Regular'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/30">
                    <span className="text-muted-foreground font-medium">Trial Phase Status:</span>
                    <span className="font-semibold text-foreground">{student.trialStatus || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground font-medium">Account Status:</span>
                    <span className={`font-bold ${student.isActive ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {student.isActive ? 'Active User Session' : 'Suspended'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: COURSES & TEACHERS */}
          {activeTab === 'courses' && (
            <div className="space-y-4 animate-fadeIn">
              <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-brand" />
                <span>Enrolled Courses & Assigned Teachers</span>
              </h4>

              {loadingEnrollments ? (
                <div className="py-12 flex justify-center">
                  <Activity className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : enrollments.length === 0 ? (
                <div className="p-8 rounded-2xl bg-card/50 border border-border text-center text-xs text-muted-foreground">
                  No courses or teachers assigned to this student yet. You can assign courses via the Edit menu.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {enrollments.map((enroll) => {
                    const course = enroll.course;
                    const teacher = course?.teacher;

                    return (
                      <div
                        key={enroll.id}
                        className="p-5 rounded-2xl glass-panel border border-border/60 shadow-md space-y-3 relative hover:border-brand/50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-brand/10 text-brand border border-brand/20">
                              {course?.type || 'Standard'}
                            </span>
                            <h5 className="text-base font-bold text-foreground mt-1.5">{course?.title || 'Untitled Course'}</h5>
                          </div>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            Enrolled: {new Date(enroll.enrolledAt).toLocaleDateString()}
                          </span>
                        </div>

                        {course?.curriculum && (
                          <p className="text-xs text-muted-foreground line-clamp-2">{course.curriculum}</p>
                        )}

                        {/* Assigned Teacher Card */}
                        <div className="pt-3 border-t border-border/40 flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-primary/10 text-primary">
                            <BookUser className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-foreground">{teacher?.name || 'No Teacher Assigned'}</p>
                            <p className="text-[10px] text-muted-foreground">{teacher?.email || 'Assign teacher in settings'}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: GUARDIAN / PARENT INFO */}
          {activeTab === 'guardian' && (
            <div className="glass-panel p-6 rounded-2xl border border-border space-y-4 max-w-2xl animate-fadeIn">
              <h4 className="text-sm font-bold text-foreground flex items-center gap-2 border-b border-border/40 pb-2">
                <Shield className="h-4 w-4 text-brand" />
                <span>Parent / Guardian Contact Information</span>
              </h4>

              {student.guardianName ? (
                <div className="space-y-4 text-xs">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
                    <User className="h-5 w-5 text-brand" />
                    <div>
                      <p className="text-[10px] uppercase font-semibold text-muted-foreground">Guardian Full Name</p>
                      <p className="text-sm font-bold text-foreground">{student.guardianName}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
                    <Phone className="h-5 w-5 text-emerald-500" />
                    <div>
                      <p className="text-[10px] uppercase font-semibold text-muted-foreground">Guardian Contact Phone</p>
                      <p className="text-sm font-bold text-foreground">{student.guardianPhone || 'Not provided'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
                    <Mail className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-[10px] uppercase font-semibold text-muted-foreground">Guardian Email Address</p>
                      <p className="text-sm font-bold text-foreground">{student.guardianEmail || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-muted-foreground italic">
                  No guardian record associated with this student account (Adult / Self Student).
                </div>
              )}
            </div>
          )}
        </div>

        {/* Dialog Footer */}
        <div className="pt-4 border-t border-border flex items-center justify-between z-10 shrink-0 mt-4">
          <p className="text-[11px] text-muted-foreground font-mono">
            Created: {new Date(student.createdAt).toLocaleDateString()}
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
    </div>
  );
}
