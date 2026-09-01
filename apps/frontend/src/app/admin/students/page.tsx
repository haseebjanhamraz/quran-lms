'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus, Edit, Trash2, GraduationCap, Users, CheckCircle, AlertCircle, User as UserIcon,
  Eye, BookOpen, BookUser, Filter, MoreHorizontal, Calendar, Ban, UserX, CheckCircle2, KeyRound
} from 'lucide-react';
import AdmissionWizard from '@/components/AdmissionWizard';
import StudentDetailModal from '@/components/StudentDetailModal';
import QuickAssignModal from '@/components/QuickAssignModal';
import ScheduleEditorModal from '@/components/ScheduleEditorModal';
import AccountStatusModal from '@/components/AccountStatusModal';
import AccountCredentialsModal from '@/components/AccountCredentialsModal';
import DataTable, { Column, FilterOption } from '@/components/DataTable';
import { apiFetch } from '@/utils/apiFetch';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

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
  classDuration?: number;
  classesPerWeek?: number;
  classDays?: Array<{ day: string; time: string }>;
  assignedTeacher?: any;
  teacher?: any;
  tier?: string;
  guardianName?: string;
  guardianPhone?: string;
  guardianEmail?: string;
  isActive: boolean;
  accountStatus?: 'ACTIVE' | 'SUSPENDED' | 'TERMINATED' | 'ON_LEAVE';
  accountStatusReason?: string;
  createdAt: string;
}

interface CourseItem {
  id: string;
  _id?: string;
  title: string;
  type: string;
}

export default function StudentsManagementPage() {
  const [students, setStudents] = useState<StudentUser[]>([]);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [studentEnrollmentMap, setStudentEnrollmentMap] = useState<Record<string, { courseId: string; courseTitle: string; courseType: string }[]>>({});
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('');
  const [selectedGenderFilter, setSelectedGenderFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Modals
  const [showWizard, setShowWizard] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentUser | null>(null);
  const [viewingStudent, setViewingStudent] = useState<StudentUser | null>(null);
  const [credentialsStudent, setCredentialsStudent] = useState<StudentUser | null>(null);
  const [scheduleEditorStudent, setScheduleEditorStudent] = useState<StudentUser | null>(null);
  const [accountStatusState, setAccountStatusState] = useState<{
    isOpen: boolean;
    user: any;
    initialAction: 'SUSPEND' | 'TERMINATE' | 'REACTIVATE' | 'DELETE';
  }>({
    isOpen: false,
    user: null,
    initialAction: 'SUSPEND',
  });
  const [quickAssignState, setQuickAssignState] = useState<{
    isOpen: boolean;
    mode: 'course' | 'teacher';
    student: StudentUser | null;
  }>({
    isOpen: false,
    mode: 'course',
    student: null,
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

  // Restore admission wizard draft if page is reloaded with an open form
  useEffect(() => {
    try {
      const draftRaw = typeof window !== 'undefined' ? localStorage.getItem('quran_lms_admission_wizard_draft') : null;
      if (draftRaw) {
        const draft = JSON.parse(draftRaw);
        if (draft && draft.isOpen) {
          setShowWizard(true);
          if (draft.editingStudent) {
            setEditingStudent(draft.editingStudent);
          }
        }
      }
    } catch (_) {}
  }, []);

  const fetchStudentsData = async () => {
    setLoading(true);
    try {
      const [usersRes, coursesRes, enrollmentsRes] = await Promise.all([
        apiFetch(`${API_URL}/users`),
        apiFetch(`${API_URL}/courses`),
        apiFetch(`${API_URL}/enrollments`),
      ]);

      if (usersRes.ok) {
        const data = await usersRes.json();
        const studentOnly = Array.isArray(data) ? data.filter((u: any) => u.role === 'STUDENT') : [];
        setStudents(studentOnly);
      }

      if (coursesRes.ok) {
        const cData = await coursesRes.json();
        setCourses(Array.isArray(cData) ? cData : []);
      }

      if (enrollmentsRes.ok) {
        const eData = await enrollmentsRes.json();
        const map: Record<string, { courseId: string; courseTitle: string; courseType: string }[]> = {};
        if (Array.isArray(eData)) {
          eData.forEach((e: any) => {
            const sId = e.studentId || e.student?.id || e.student?._id;
            const cId = e.courseId || e.course?.id || e.course?._id;
            const cTitle = e.course?.title || 'Assigned Course';
            const cType = e.course?.type || '';
            if (sId && cId) {
              if (!map[sId]) map[sId] = [];
              if (!map[sId].some((item) => item.courseId === cId)) {
                map[sId].push({ courseId: cId, courseTitle: cTitle, courseType: cType });
              }
            }
          });
        }
        setStudentEnrollmentMap(map);
      }
    } catch (err) {
      console.error('Error fetching students data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentsData();
  }, []);

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

  const handleDeleteStudent = async (id: string) => {
    if (!confirm('Are you sure you want to delete this student account?')) return;
    try {
      const res = await apiFetch(`${API_URL}/users/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchStudentsData();
      }
    } catch (err) {
      console.error('Error deleting student:', err);
    }
  };

  const getFullImageUrl = (url?: string | null) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:5000';
    return `${baseUrl}${url}`;
  };

  // Stats computation
  const stats = useMemo(() => {
    const total = students.length;
    const active = students.filter((s) => s.isActive && !s.discontinued && !s.isDiscontinued).length;
    const trial = students.filter((s) => s.trialStatus === 'Active' || s.studentStatus === 'Trial').length;
    const discontinued = students.filter((s) => s.discontinued || s.isDiscontinued).length;
    return { total, active, trial, discontinued };
  }, [students]);

  // Filter students by assigned course & gender
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      // 1. Course Filter
      if (selectedCourseFilter) {
        const sId = s.id || s._id || '';
        const sCourses = studentEnrollmentMap[sId] || [];
        const matchesCourse = sCourses.some((c) => c.courseId === selectedCourseFilter || c.courseTitle === selectedCourseFilter);
        if (!matchesCourse) return false;
      }

      // 2. Gender Filter
      if (selectedGenderFilter) {
        const studentGender = (s.gender || '').toLowerCase();
        const filterGender = selectedGenderFilter.toLowerCase();
        if (studentGender !== filterGender) return false;
      }

      return true;
    });
  }, [students, selectedCourseFilter, selectedGenderFilter, studentEnrollmentMap]);

  // Filters for DataTable
  const filterOptions: FilterOption[] = [
    { key: 'ALL', label: 'All Statuses', predicate: () => true },
    { key: 'ACTIVE', label: 'Active Enrolled', predicate: (s) => s.isActive && !s.discontinued && !s.isDiscontinued },
    { key: 'TRIAL', label: 'Trial', predicate: (s) => s.trialStatus === 'Active' || s.studentStatus === 'Trial' },
    { key: 'DISCONTINUED', label: 'Discontinued', predicate: (s) => Boolean(s.discontinued || s.isDiscontinued) },
  ];

  // Columns definition for DataTable
  const columns: Column<StudentUser>[] = [
    {
      key: 'serialNo',
      label: '#',
      render: (_s, _idx, globalIdx) => (
        <span className="font-mono text-xs text-muted-foreground/80 font-medium">
          {globalIdx}
        </span>
      ),
    },
    {
      key: 'studentId',
      label: 'ID',
      sortable: true,
      render: (s) => (
        <span className="font-mono text-xs font-bold text-brand">
          {s.studentId ? `STU-${s.studentId}` : '—'}
        </span>
      ),
    },
    {
      key: 'name',
      label: 'Student',
      sortable: true,
      render: (s) => {
        const photo = s.profilePicture || s.avatar;
        return (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-muted border border-border flex items-center justify-center overflow-hidden shrink-0">
              {photo ? (
                <img src={getFullImageUrl(photo)} alt={s.name} className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-foreground leading-snug">
                  {s.name} {s.preferredName && `(${s.preferredName})`}
                </p>
                {s.gender && (
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${s.gender.toLowerCase() === 'female'
                    ? 'bg-pink-500/10 text-pink-500 border-pink-500/20'
                    : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                    }`}>
                    {s.gender}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{s.email}</p>
            </div>
          </div>
        );
      },
    },
    {
      key: 'assignedTeacher',
      label: 'Assigned Teacher',
      render: (s) => {
        const teacherName = s.assignedTeacher?.name || s.teacher?.name || (typeof s.assignedTeacher === 'string' ? s.assignedTeacher : null);
        return teacherName ? (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <BookUser className="h-3.5 w-3.5" />
              <span>{teacherName}</span>
            </span>
          </div>
        ) : (
          <span className="text-muted-foreground/50 italic text-xs">Unassigned</span>
        );
      },
    },
    // {
    //   key: 'schedule',
    //   label: 'Schedule & Timing',
    //   render: (s) => {
    //     const days = Array.isArray(s.classDays) && s.classDays.length > 0
    //       ? s.classDays.map((d) => d.day).join(', ')
    //       : (s.classesPerWeek ? `${s.classesPerWeek} days/wk` : '5 days/wk');
    //     return (
    //       <div className="text-xs space-y-0.5">
    //         <p className="font-semibold text-foreground">{days}</p>
    //         <p className="text-[10px] text-muted-foreground">{s.classDuration || 60} mins/class</p>
    //       </div>
    //     );
    //   },
    // },
    {
      key: 'dob',
      label: 'Age / Type',
      sortable: true,
      render: (s) => {
        const dobVal = s.dob || s.dateOfBirth || '';
        const { age, type } = calculateAgeAndType(dobVal);
        return (
          <div className="flex items-center gap-2">
            <span className="font-medium text-xs">{age !== '-' ? `${age} yrs` : '—'}</span>
            {type === 'Child' ? (
              <span className="bg-blue-500/10 text-blue-500 border border-blue-500/20 text-[10px] font-bold px-2 py-0.5 rounded">Child</span>
            ) : type === 'Adult' ? (
              <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-bold px-2 py-0.5 rounded">Adult</span>
            ) : null}
          </div>
        );
      },
    },
    // {
    //   key: 'guardianName',
    //   label: 'Guardian Contact',
    //   sortable: true,
    //   render: (s) => (
    //     <div className="text-xs">
    //       {s.guardianName ? (
    //         <div>
    //           <p className="font-semibold text-foreground">{s.guardianName}</p>
    //           <p className="text-[10px] text-muted-foreground">{s.guardianPhone || s.guardianEmail || 'No contact'}</p>
    //         </div>
    //       ) : (
    //         <span className="text-muted-foreground italic">Self / N/A</span>
    //       )}
    //     </div>
    //   ),
    // },
    {
      key: 'isActive',
      label: 'Status',
      sortable: true,
      render: (s) => {
        const status = s.accountStatus || (s.isActive && !s.discontinued && !s.isDiscontinued ? 'ACTIVE' : 'SUSPENDED');
        return (
          <div className="flex items-center gap-1.5">
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
              status === 'ACTIVE'
                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                : status === 'SUSPENDED'
                ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                : status === 'TERMINATED'
                ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                : 'bg-sky-500/10 text-sky-500 border-sky-500/20'
            }`}>
              {status === 'ACTIVE' ? 'Active' : status === 'SUSPENDED' ? 'Suspended' : status === 'TERMINATED' ? 'Terminated' : 'On Leave'}
            </span>
            {s.trialStatus === 'Active' && (
              <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] font-bold px-2 py-0.5 rounded">Trial</span>
            )}
          </div>
        );
      },
    },
    {
      key: 'timezone',
      label: 'Timezone',
      sortable: true,
      render: (s) => <span className="font-mono text-xs">{s.timezone || 'UTC'}</span>,
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      render: (s) => (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger className="h-8 w-8 rounded-lg p-0 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 border border-transparent hover:border-border transition-colors">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Open student actions</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Student Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setViewingStudent(s)}>
                <Eye className="mr-2 h-4 w-4 text-blue-500" />
                <span>View Full Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setScheduleEditorStudent(s)}>
                <Calendar className="mr-2 h-4 w-4 text-purple-500" />
                <span>Edit Schedule & Timings</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setQuickAssignState({ isOpen: true, mode: 'course', student: s })}
              >
                <BookOpen className="mr-2 h-4 w-4 text-brand" />
                <span>Assign Course</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setQuickAssignState({ isOpen: true, mode: 'teacher', student: s })}
              >
                <BookUser className="mr-2 h-4 w-4 text-emerald-500" />
                <span>Assign Teacher</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setEditingStudent(s);
                  setShowWizard(true);
                }}
              >
                <Edit className="mr-2 h-4 w-4 text-amber-500" />
                <span>Edit Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setCredentialsStudent(s)}
              >
                <KeyRound className="mr-2 h-4 w-4 text-amber-500" />
                <span>Change Credentials</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              
              {/* Account Status Actions */}
              {s.accountStatus === 'SUSPENDED' || s.accountStatus === 'TERMINATED' || !s.isActive ? (
                <DropdownMenuItem
                  onClick={() => setAccountStatusState({
                    isOpen: true,
                    user: s,
                    initialAction: 'REACTIVATE',
                  })}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" />
                  <span>Reactivate Account</span>
                </DropdownMenuItem>
              ) : (
                <>
                  <DropdownMenuItem
                    onClick={() => setAccountStatusState({
                      isOpen: true,
                      user: s,
                      initialAction: 'SUSPEND',
                    })}
                  >
                    <Ban className="mr-2 h-4 w-4 text-amber-500" />
                    <span>Suspend Account</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setAccountStatusState({
                      isOpen: true,
                      user: s,
                      initialAction: 'TERMINATE',
                    })}
                  >
                    <UserX className="mr-2 h-4 w-4 text-rose-500" />
                    <span>Terminate Account</span>
                  </DropdownMenuItem>
                </>
              )}

              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setAccountStatusState({
                  isOpen: true,
                  user: s,
                  initialAction: 'DELETE',
                })}
              >
                <Trash2 className="mr-2 h-4 w-4 text-destructive" />
                <span>Delete Account</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  return (
    <div className="relative mx-auto w-full space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
            <GraduationCap className="h-8 w-8 text-brand" />
            <span>Students Management & Admissions</span>
          </h1>
          <p className="text-muted-foreground mt-1">Admit students, manage student profiles, guardians, and academic rosters.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingStudent(null);
            setShowWizard(true);
          }}
          className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-primary/10 transition-all duration-300 outline-none hover-lift self-start"
        >
          <Plus className="h-5 w-5" />
          <span>Admit New Student</span>
        </button>
      </div>

      {/* Ribbon Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4 border border-border/50">
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            <p className="text-xs text-muted-foreground font-medium">Total Students</p>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4 border border-border/50">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-emerald-500">{stats.active}</p>
            <p className="text-xs text-muted-foreground font-medium">Active Enrolled</p>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4 border border-border/50">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-amber-500">{stats.trial}</p>
            <p className="text-xs text-muted-foreground font-medium">Trial Students</p>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4 border border-border/50">
          <div className="p-3 rounded-xl bg-rose-500/10 text-rose-500">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-rose-500">{stats.discontinued}</p>
            <p className="text-xs text-muted-foreground font-medium">Discontinued</p>
          </div>
        </div>
      </div>

      {/* Roster Multi-Filter Selector Bar */}
      <div className="glass-panel p-4 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-border/50 shadow-sm bg-card/60">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-brand/15 text-brand border border-brand/20">
            <Filter className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Roster Filters</h3>
            <p className="text-xs text-muted-foreground">Filter students by course curriculum and gender</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Course Filter */}
          <div className="relative flex-1 md:w-64">
            <select
              value={selectedCourseFilter}
              onChange={(e) => setSelectedCourseFilter(e.target.value)}
              className="w-full bg-card border border-border rounded-xl px-3.5 py-2 text-xs font-bold text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-brand/50 transition-all cursor-pointer"
            >
              <option value="">All Courses ({courses.length} Total)</option>
              {courses.map((c) => (
                <option key={c.id || c._id} value={c.id || c._id}>
                  {c.title} ({c.type})
                </option>
              ))}
            </select>
          </div>

          {/* Gender Filter */}
          <div className="relative w-full sm:w-40">
            <select
              value={selectedGenderFilter}
              onChange={(e) => setSelectedGenderFilter(e.target.value)}
              className="w-full bg-card border border-border rounded-xl px-3.5 py-2 text-xs font-bold text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-brand/50 transition-all cursor-pointer"
            >
              <option value="">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reusable Paginated & Filterable Data Table */}
      <DataTable
        columns={columns}
        data={filteredStudents}
        searchKeys={['name', 'email', 'studentId', 'guardianName']}
        searchPlaceholder="Search students by name, email, guardian, or ID..."
        filters={filterOptions}
        filterVariant="dropdown"
        initialItemsPerPage={10}
        itemsPerPageOptions={[5, 10, 20, 50, 100]}
        loading={loading}
        emptyMessage="No student records found matching your criteria."
        keyExtractor={(s) => s.id || s._id || s.email}
      />

      {/* Student Admission / Editing Onboarding Wizard Modal */}
      <AdmissionWizard
        isOpen={showWizard}
        editingStudent={editingStudent}
        onClose={() => {
          try {
            localStorage.removeItem('quran_lms_admission_wizard_draft');
          } catch (_) {}
          setShowWizard(false);
          setEditingStudent(null);
        }}
        onSuccess={fetchStudentsData}
      />

      {/* Full-Screen Student Details Dialog Box */}
      <StudentDetailModal
        isOpen={Boolean(viewingStudent)}
        student={viewingStudent}
        onClose={() => setViewingStudent(null)}
        onEdit={(studentToEdit) => {
          setViewingStudent(null);
          setEditingStudent(studentToEdit);
          setShowWizard(true);
        }}
        onEditCredentials={(studentToEditCreds) => {
          setViewingStudent(null);
          setCredentialsStudent(studentToEditCreds);
        }}
        onAssignCourse={(studentToAssign) => {
          setViewingStudent(null);
          setQuickAssignState({ isOpen: true, mode: 'course', student: studentToAssign });
        }}
        onAssignTeacher={(studentToAssign) => {
          setViewingStudent(null);
          setQuickAssignState({ isOpen: true, mode: 'teacher', student: studentToAssign });
        }}
      />

      {/* Quick Assign Course / Teacher Modal */}
      <QuickAssignModal
        isOpen={quickAssignState.isOpen}
        mode={quickAssignState.mode}
        student={quickAssignState.student}
        onClose={() => setQuickAssignState({ isOpen: false, mode: 'course', student: null })}
        onSuccess={fetchStudentsData}
      />

      {/* Direct Schedule Editor Modal */}
      <ScheduleEditorModal
        isOpen={Boolean(scheduleEditorStudent)}
        mode="student"
        entity={scheduleEditorStudent}
        onClose={() => setScheduleEditorStudent(null)}
        onScheduleUpdated={fetchStudentsData}
      />

      {/* Account Credentials / Email & Password Change Modal */}
      <AccountCredentialsModal
        isOpen={Boolean(credentialsStudent)}
        user={credentialsStudent}
        onClose={() => setCredentialsStudent(null)}
        onCredentialsUpdated={fetchStudentsData}
      />

      {/* Account Status / Suspend / Terminate / Delete Modal */}
      <AccountStatusModal
        isOpen={accountStatusState.isOpen}
        user={accountStatusState.user}
        initialAction={accountStatusState.initialAction}
        onClose={() => setAccountStatusState({ isOpen: false, user: null, initialAction: 'SUSPEND' })}
        onStatusUpdated={fetchStudentsData}
      />
    </div>
  );
}
