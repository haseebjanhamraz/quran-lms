'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus, Trash2, Edit, Eye, XCircle, User as UserIcon,
  BookUser, DollarSign, CheckCircle, AlertCircle, ShieldCheck, BookOpen, MoreHorizontal,
  Calendar, Ban, UserX, CheckCircle2, KeyRound
} from 'lucide-react';
import TeacherWizard from '@/components/TeacherWizard';
import TeacherDetailModal from '@/components/TeacherDetailModal';
import TeacherCourseAssignmentModal from '@/components/TeacherCourseAssignmentModal';
import ScheduleEditorModal from '@/components/ScheduleEditorModal';
import AccountStatusModal from '@/components/AccountStatusModal';
import AccountCredentialsModal from '@/components/AccountCredentialsModal';
import { getImageUrl } from '@/utils/image';
import { apiFetch } from '@/utils/apiFetch';
import DataTable, { Column, FilterOption } from '@/components/DataTable';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface GuarantorItem {
  name: string;
  phone: string;
  email?: string;
  relationship: string;
  cnicOrId: string;
  address?: string;
}

interface TeacherUser {
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
  accountStatus?: 'ACTIVE' | 'SUSPENDED' | 'TERMINATED' | 'ON_LEAVE';
  accountStatusReason?: string;
  createdAt: string;
}

export default function TeachersManagementPage() {
  const [teachers, setTeachers] = useState<TeacherUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<TeacherUser | null>(null);
  const [viewingTeacher, setViewingTeacher] = useState<TeacherUser | null>(null);
  const [credentialsTeacher, setCredentialsTeacher] = useState<TeacherUser | null>(null);
  const [scheduleEditorTeacher, setScheduleEditorTeacher] = useState<TeacherUser | null>(null);
  const [accountStatusState, setAccountStatusState] = useState<{
    isOpen: boolean;
    user: any;
    initialAction: 'SUSPEND' | 'TERMINATE' | 'REACTIVATE' | 'DELETE';
  }>({
    isOpen: false,
    user: null,
    initialAction: 'SUSPEND',
  });

  // View Guarantors Modal
  const [viewingGuarantors, setViewingGuarantors] = useState<GuarantorItem[] | null>(null);
  const [assigningTeacher, setAssigningTeacher] = useState<TeacherUser | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`${API_URL}/users`);
      if (res.ok) {
        const data = await res.json();
        const teacherOnly = Array.isArray(data) ? data.filter((u: any) => u.role === 'TEACHER') : [];
        setTeachers(teacherOnly);
      }
    } catch (err) {
      console.error('Error fetching teachers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const handleDeleteTeacher = async (id: string) => {
    if (!confirm('Are you sure you want to delete this teacher account?')) return;
    try {
      const res = await apiFetch(`${API_URL}/users/${id}`, { method: 'DELETE' });
      if (res.ok) fetchTeachers();
    } catch (err) {
      console.error('Error deleting teacher:', err);
    }
  };

  const stats = useMemo(() => {
    const total = teachers.length;
    const active = teachers.filter((t) => t.isActive).length;
    const inactive = teachers.filter((t) => !t.isActive).length;
    const totalPayroll = teachers.reduce((sum, t) => sum + (t.salary || 0), 0);
    return { total, active, inactive, totalPayroll };
  }, [teachers]);

  // Filters for DataTable
  const filterOptions: FilterOption[] = [
    { key: 'ALL', label: 'All Teachers', predicate: () => true },
    { key: 'MALE', label: 'Male Teachers', predicate: (t) => t.gender === 'Male' },
    { key: 'FEMALE', label: 'Female Teachers', predicate: (t) => t.gender === 'Female' },
    { key: 'ACTIVE', label: 'Active Teachers', predicate: (t) => t.isActive },
    { key: 'INACTIVE', label: 'Inactive Teachers', predicate: (t) => !t.isActive },
    { key: 'CAMERA_RESTRICTED', label: 'Camera Restricted', predicate: (t) => Boolean((t as any).cameraRestricted) },
    { key: 'CAN_EDIT', label: 'Self-Edit Allowed', predicate: (t) => t.canEditProfile !== false },
    { key: 'CANNOT_EDIT', label: 'Self-Edit Disabled', predicate: (t) => t.canEditProfile === false },
  ];

  // Columns definition for DataTable
  const columns: Column<TeacherUser>[] = [
    {
      key: 'serialNo',
      label: '#',
      render: (_t, _idx, globalIdx) => (
        <span className="font-mono text-xs text-muted-foreground/80 font-medium">
          {globalIdx}
        </span>
      ),
    },
    {
      key: 'employeeId',
      label: 'ID',
      sortable: true,
      render: (t) => (
        <span className="font-mono text-xs font-bold text-brand">
          {t.employeeId || 'EMP-001'}
        </span>
      ),
    },
    {
      key: 'name',
      label: 'Teacher Name',
      sortable: true,
      render: (t) => {
        const photo = t.profilePicture || t.avatar;
        return (
          <div className="flex items-center gap-3">
            {photo ? (
              <img
                src={getImageUrl(photo)}
                alt={t.name}
                className="h-8 w-8 rounded-full object-cover border border-border shrink-0"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                {t.name?.charAt(0)}
              </div>
            )}
            <div>
              <p className="font-semibold text-foreground leading-snug">
                {t.name} {t.preferredName && `(${t.preferredName})`}
              </p>
              <p className="text-xs text-muted-foreground">{t.email}</p>
            </div>
          </div>
        );
      },
    },
    {
      key: 'specialization',
      label: 'Qualification',
      sortable: true,
      render: (t) => (
        <div className="text-xs">
          <p className="font-medium text-foreground">{t.specialization || 'Tajweed & Nazira'}</p>
          {t.qualification && (
            <p className="text-[10px] text-muted-foreground">{t.qualification}</p>
          )}
        </div>
      ),
    },
    {
      key: 'salary',
      label: 'Salary / Pay',
      sortable: true,
      render: (t) => (
        <span className="font-mono text-xs font-bold text-emerald-500">
          {t.salary ? `${t.currency || 'PKR'} ${t.salary.toLocaleString()}` : '—'}
        </span>
      ),
    },
    {
      key: 'guarantors',
      label: 'Guarantors',
      render: (t) => (
        <button
          type="button"
          onClick={() => setViewingGuarantors(t.guarantors || [])}
          className="flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
        >
          <ShieldCheck className="h-4 w-4" />
          <span>{t.guarantors?.length || 0} Verified</span>
        </button>
      ),
    },
    {
      key: 'isActive',
      label: 'Status',
      sortable: true,
      render: (t) => {
        const status = t.accountStatus || (t.isActive ? 'ACTIVE' : 'SUSPENDED');
        return (
          <span
            className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
              status === 'ACTIVE'
                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                : status === 'SUSPENDED'
                ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                : status === 'TERMINATED'
                ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                : 'bg-sky-500/10 text-sky-500 border-sky-500/20'
            }`}
          >
            {status === 'ACTIVE' ? 'Active' : status === 'SUSPENDED' ? 'Suspended' : status === 'TERMINATED' ? 'Terminated' : 'On Leave'}
          </span>
        );
      },
    },
    {
      key: 'canEditProfile',
      label: 'Self-Edit',
      sortable: true,
      render: (t) => (
        <span
          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${t.canEditProfile !== false
            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
            : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
            }`}
        >
          {t.canEditProfile !== false ? 'Allowed' : 'Disabled'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      render: (t) => (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger className="h-8 w-8 rounded-lg p-0 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 border border-transparent hover:border-border transition-colors">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Open teacher actions</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Teacher Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setViewingTeacher(t)}>
                <Eye className="mr-2 h-4 w-4 text-blue-500" />
                <span>View Full Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setScheduleEditorTeacher(t)}>
                <Calendar className="mr-2 h-4 w-4 text-purple-500" />
                <span>Edit Schedule & Slots</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setAssigningTeacher(t)}>
                <BookOpen className="mr-2 h-4 w-4 text-brand" />
                <span>Assign Courses</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setEditingTeacher(t);
                  setIsWizardOpen(true);
                }}
              >
                <Edit className="mr-2 h-4 w-4 text-amber-500" />
                <span>Edit Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setCredentialsTeacher(t)}
              >
                <KeyRound className="mr-2 h-4 w-4 text-amber-500" />
                <span>Change Credentials</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />

              {/* Account Status Actions */}
              {t.accountStatus === 'SUSPENDED' || t.accountStatus === 'TERMINATED' || !t.isActive ? (
                <DropdownMenuItem
                  onClick={() => setAccountStatusState({
                    isOpen: true,
                    user: t,
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
                      user: t,
                      initialAction: 'SUSPEND',
                    })}
                  >
                    <Ban className="mr-2 h-4 w-4 text-amber-500" />
                    <span>Suspend Account</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setAccountStatusState({
                      isOpen: true,
                      user: t,
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
                  user: t,
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
    <div className="relative mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
            <BookUser className="h-8 w-8 text-brand" />
            <span>Teachers & Staff Management</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage teaching staff profiles, guarantors, credentials, and monthly compensation.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingTeacher(null);
            setIsWizardOpen(true);
          }}
          className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-primary/10 transition-all duration-300 outline-none hover-lift self-start"
        >
          <Plus className="h-5 w-5" />
          <span>Add New Teacher</span>
        </button>
      </div>

      {/* Ribbon Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4 border border-border/50">
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500">
            <BookUser className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            <p className="text-xs text-muted-foreground font-medium">Total Teachers</p>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4 border border-border/50">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-emerald-500">{stats.active}</p>
            <p className="text-xs text-muted-foreground font-medium">Active Teachers</p>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4 border border-border/50">
          <div className="p-3 rounded-xl bg-rose-500/10 text-rose-500">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-rose-500">{stats.inactive}</p>
            <p className="text-xs text-muted-foreground font-medium">Inactive Staff</p>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4 border border-border/50">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-amber-500">{stats.totalPayroll.toLocaleString()} Cash</p>
            <p className="text-xs text-muted-foreground font-medium">Total Monthly Payroll</p>
          </div>
        </div>
      </div>

      {/* Reusable Paginated & Filterable Data Table */}
      <DataTable
        columns={columns}
        data={teachers}
        searchKeys={['name', 'email', 'employeeId', 'specialization', 'qualification']}
        searchPlaceholder="Search teachers by name, email, employee ID, specialization, or qualification..."
        filters={filterOptions}
        filterVariant="dropdown"
        initialItemsPerPage={10}
        itemsPerPageOptions={[5, 10, 20, 50, 100]}
        loading={loading}
        emptyMessage="No teacher records found matching your criteria."
        keyExtractor={(t) => t.id || t._id || t.email}
      />

      {/* TEACHER WIZARD MODAL */}
      <TeacherWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onSuccess={() => fetchTeachers()}
        editingTeacher={editingTeacher}
      />

      {/* FULL-SCREEN TEACHER DETAILS DIALOG */}
      <TeacherDetailModal
        isOpen={Boolean(viewingTeacher)}
        teacher={viewingTeacher}
        onClose={() => setViewingTeacher(null)}
        onEdit={(teacherToEdit) => {
          setViewingTeacher(null);
          setEditingTeacher(teacherToEdit);
          setIsWizardOpen(true);
        }}
        onEditCredentials={(teacherToEditCreds) => {
          setViewingTeacher(null);
          setCredentialsTeacher(teacherToEditCreds);
        }}
      />

      {/* ACCOUNT CREDENTIALS / EMAIL & PASSWORD CHANGE MODAL */}
      <AccountCredentialsModal
        isOpen={Boolean(credentialsTeacher)}
        user={credentialsTeacher}
        onClose={() => setCredentialsTeacher(null)}
        onCredentialsUpdated={fetchTeachers}
      />

      {/* VIEW GUARANTORS MODAL */}
      {viewingGuarantors && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="glass-panel w-full max-w-lg rounded-2xl p-6 shadow-2xl relative border border-border">
            <div className="flex justify-between items-center mb-4 border-b border-border/40 pb-3">
              <h3 className="text-lg font-bold font-display flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-500" />
                <span>Teacher Verified Guarantors</span>
              </h3>
              <button
                type="button"
                onClick={() => setViewingGuarantors(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              {viewingGuarantors.length === 0 ? (
                <p className="text-xs text-muted-foreground italic text-center py-4">
                  No guarantor records registered for this account.
                </p>
              ) : (
                viewingGuarantors.map((g, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-card/60 border border-border space-y-1">
                    <p className="font-bold text-sm text-foreground flex items-center justify-between">
                      <span>
                        Guarantor #{idx + 1}: {g.name}
                      </span>
                      <span className="text-xs text-brand font-normal">({g.relationship})</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      CNIC/ID:{' '}
                      <span className="font-mono text-foreground font-semibold">{g.cnicOrId}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Phone: <span className="text-foreground">{g.phone}</span>
                    </p>
                    {g.address && <p className="text-xs text-muted-foreground">Address: {g.address}</p>}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ASSIGN COURSES MULTI-SELECT MODAL */}
      <TeacherCourseAssignmentModal
        isOpen={Boolean(assigningTeacher)}
        teacher={assigningTeacher}
        onClose={() => setAssigningTeacher(null)}
        onSuccess={() => fetchTeachers()}
      />

      {/* DIRECT TEACHER SCHEDULE EDITOR MODAL */}
      <ScheduleEditorModal
        isOpen={Boolean(scheduleEditorTeacher)}
        mode="teacher"
        entity={scheduleEditorTeacher}
        onClose={() => setScheduleEditorTeacher(null)}
        onScheduleUpdated={fetchTeachers}
      />

      {/* ACCOUNT STATUS / SUSPEND / TERMINATE / DELETE MODAL */}
      <AccountStatusModal
        isOpen={accountStatusState.isOpen}
        user={accountStatusState.user}
        initialAction={accountStatusState.initialAction}
        onClose={() => setAccountStatusState({ isOpen: false, user: null, initialAction: 'SUSPEND' })}
        onStatusUpdated={fetchTeachers}
      />
    </div>
  );
}
