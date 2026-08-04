'use client';

import React, { useState, useEffect } from 'react';
import {
  XCircle, User, Shield, BookOpen, Calendar, Clock,
  Mail, Phone, Globe, CheckCircle2, AlertCircle, Sparkles, BookUser,
  Activity, ShieldCheck, DollarSign, Award, Edit, FileText
} from 'lucide-react';
import { getImageUrl } from '@/utils/image';
import { apiFetch } from '@/utils/apiFetch';

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
  qualification?: string;
  specialization?: string;
  joiningDate?: string;
  salary?: number;
  currency?: string;
  bio?: string;
  timezone?: string;
  guarantors?: GuarantorItem[];
  canEditProfile?: boolean;
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
}

export default function TeacherDetailModal({
  isOpen,
  teacher,
  onClose,
  onEdit,
}: TeacherDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'guarantors'>('overview');
  const [courses, setCourses] = useState<AssignedCourse[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

  useEffect(() => {
    if (isOpen && teacher) {
      const teacherTargetId = teacher.id || teacher._id;
      if (teacherTargetId) {
        fetchTeacherCourses(teacherTargetId);
      }
    }
  }, [isOpen, teacher]);

  const fetchTeacherCourses = async (teacherId: string) => {
    setLoadingCourses(true);
    try {
      const res = await apiFetch(`${API_URL}/courses/teacher/${teacherId}`);
      if (res.ok) {
        const data = await res.json();
        setCourses(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error fetching teacher courses:', err);
    } finally {
      setLoadingCourses(false);
    }
  };

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
              <p className="text-xs text-muted-foreground mt-0.5">Comprehensive instructor profile, verified guarantors, credentials, and teaching assignments.</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
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
              <h3 className="text-xl sm:text-2xl font-bold font-display text-foreground">
                {teacher.name} {teacher.preferredName && <span className="text-muted-foreground font-normal">({teacher.preferredName})</span>}
              </h3>
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-brand" />
                <span>{teacher.email}</span>
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                  teacher.isActive
                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                }`}>
                  {teacher.isActive ? 'Active Staff' : 'Inactive'}
                </span>
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
            <div className="text-center">
              <p className="text-xl font-bold font-mono text-brand">{courses.length}</p>
              <p className="text-[10px] text-muted-foreground font-semibold uppercase">Assigned Courses</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold font-mono text-emerald-500">
                {teacher.salary ? `${teacher.currency || 'PKR'} ${teacher.salary.toLocaleString()}` : '—'}
              </p>
              <p className="text-[10px] text-muted-foreground font-semibold uppercase">Monthly Pay</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold font-mono text-foreground">{teacher.guarantors?.length || 0}</p>
              <p className="text-[10px] text-muted-foreground font-semibold uppercase">Guarantors</p>
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
            <span>Personal & Professional</span>
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
            <span>Assigned Courses & Classes ({courses.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('guarantors')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
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
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground font-medium">Account Status:</span>
                    <span className={`font-bold ${teacher.isActive ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {teacher.isActive ? 'Active Account' : 'Suspended / Inactive'}
                    </span>
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

          {/* TAB 2: ASSIGNED COURSES & CLASSES */}
          {activeTab === 'courses' && (
            <div className="space-y-4 animate-fadeIn">
              <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-brand" />
                <span>Assigned Courses & Classes Taught</span>
              </h4>

              {loadingCourses ? (
                <div className="py-12 flex justify-center">
                  <Activity className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : courses.length === 0 ? (
                <div className="p-8 rounded-2xl bg-card/50 border border-border text-center text-xs text-muted-foreground">
                  No courses or active classes currently assigned to this teacher.
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

                      <div className="pt-3 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">
                          {course.enrolledStudentsCount || course.students?.length || 0} Enrolled Students
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: GUARANTORS & VERIFICATION */}
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
    </div>
  );
}
