'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus, Edit, Trash2, GraduationCap, Users, CheckCircle, AlertCircle, User as UserIcon, Eye, BookOpen, BookUser
} from 'lucide-react';
import AdmissionWizard from '@/components/AdmissionWizard';
import StudentDetailModal from '@/components/StudentDetailModal';
import QuickAssignModal from '@/components/QuickAssignModal';
import DataTable, { Column, FilterOption } from '@/components/DataTable';

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

export default function StudentsManagementPage() {
  const [students, setStudents] = useState<StudentUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showWizard, setShowWizard] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentUser | null>(null);
  const [viewingStudent, setViewingStudent] = useState<StudentUser | null>(null);
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

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/users`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        const studentOnly = Array.isArray(data) ? data.filter((u: any) => u.role === 'STUDENT') : [];
        setStudents(studentOnly);
      }
    } catch (err) {
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
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
      const res = await fetch(`${API_URL}/users/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        fetchStudents();
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

  // Filters for DataTable
  const filterOptions: FilterOption[] = [
    { key: 'ALL', label: 'All Students', predicate: () => true },
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
              <p className="font-semibold text-foreground leading-snug">
                {s.name} {s.preferredName && `(${s.preferredName})`}
              </p>
              <p className="text-xs text-muted-foreground">{s.email}</p>
            </div>
          </div>
        );
      },
    },
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
    {
      key: 'guardianName',
      label: 'Guardian Contact',
      sortable: true,
      render: (s) => (
        <div className="text-xs">
          {s.guardianName ? (
            <div>
              <p className="font-semibold text-foreground">{s.guardianName}</p>
              <p className="text-[10px] text-muted-foreground">{s.guardianPhone || s.guardianEmail || 'No contact'}</p>
            </div>
          ) : (
            <span className="text-muted-foreground italic">Self / N/A</span>
          )}
        </div>
      ),
    },
    {
      key: 'isActive',
      label: 'Status',
      sortable: true,
      render: (s) => (
        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
            s.isActive && !s.discontinued && !s.isDiscontinued
              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
          }`}>
            {s.isActive && !s.discontinued && !s.isDiscontinued ? 'Active' : 'Inactive'}
          </span>
          {s.trialStatus === 'Active' && (
            <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] font-bold px-2 py-0.5 rounded">Trial</span>
          )}
        </div>
      ),
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
        <div className="flex justify-end gap-1">
          <button
            type="button"
            onClick={() => setViewingStudent(s)}
            className="text-muted-foreground hover:text-primary transition-colors p-2 hover:bg-primary/10 rounded-lg"
            title="View Full Student Details & Classes"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setQuickAssignState({ isOpen: true, mode: 'course', student: s })}
            className="text-muted-foreground hover:text-brand transition-colors p-2 hover:bg-brand/10 rounded-lg"
            title="Quick Assign Course"
          >
            <BookOpen className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setQuickAssignState({ isOpen: true, mode: 'teacher', student: s })}
            className="text-muted-foreground hover:text-blue-500 transition-colors p-2 hover:bg-blue-500/10 rounded-lg"
            title="Quick Assign Teacher"
          >
            <BookUser className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingStudent(s);
              setShowWizard(true);
            }}
            className="text-muted-foreground hover:text-amber-500 transition-colors p-2 hover:bg-amber-500/10 rounded-lg"
            title="Edit Student Profile (Reuses Admission Wizard)"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => handleDeleteStudent(s.id || s._id || '')}
            className="text-muted-foreground hover:text-destructive transition-colors p-2 hover:bg-destructive/10 rounded-lg"
            title="Delete Account"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="relative mx-auto max-w-7xl space-y-6">
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

      {/* Reusable Paginated & Filterable Data Table */}
      <DataTable
        columns={columns}
        data={students}
        searchKeys={['name', 'email', 'studentId', 'guardianName']}
        searchPlaceholder="Search students by name, email, guardian, or ID..."
        filters={filterOptions}
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
          setShowWizard(false);
          setEditingStudent(null);
        }}
        onSuccess={fetchStudents}
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
        onSuccess={fetchStudents}
      />
    </div>
  );
}
