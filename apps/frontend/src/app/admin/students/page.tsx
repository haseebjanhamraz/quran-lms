'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../../context/AuthContext';
import {
  Plus, Search, Trash2, Edit, XCircle, Loader2, User as UserIcon,
  GraduationCap, Users, CheckCircle, AlertCircle, Phone, Mail, ShieldCheck
} from 'lucide-react';
import AdmissionWizard from '@/components/AdmissionWizard';

interface StudentUser {
  id: string;
  studentId?: number | string;
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
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [showWizard, setShowWizard] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentUser | null>(null);
  const [submittingEdit, setSubmittingEdit] = useState(false);

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
    return { age, type: age < 18 ? 'Child' : 'Adult' };
  };

  const handleToggleStatus = async (student: StudentUser) => {
    try {
      const res = await fetch(`${API_URL}/users/${student.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isActive: !student.isActive }),
      });
      if (res.ok) {
        fetchStudents();
      }
    } catch (err) {
      console.error('Error toggling status:', err);
    }
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

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    setSubmittingEdit(true);

    try {
      const res = await fetch(`${API_URL}/users/${editingStudent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: editingStudent.name,
          preferredName: editingStudent.preferredName,
          email: editingStudent.email,
          gender: editingStudent.gender,
          timezone: editingStudent.timezone,
          guardianName: editingStudent.guardianName,
          guardianPhone: editingStudent.guardianPhone,
          guardianEmail: editingStudent.guardianEmail,
        }),
      });

      if (res.ok) {
        setEditingStudent(null);
        fetchStudents();
      }
    } catch (err) {
      console.error('Error updating student:', err);
    } finally {
      setSubmittingEdit(false);
    }
  };

  // Filtered dataset
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const query = searchQuery.toLowerCase().trim();
      const matchesQuery =
        s.name.toLowerCase().includes(query) ||
        s.email.toLowerCase().includes(query) ||
        (s.studentId && String(s.studentId).toLowerCase().includes(query));

      if (!matchesQuery) return false;

      if (statusFilter === 'ACTIVE') return s.isActive && !s.discontinued;
      if (statusFilter === 'TRIAL') return s.trialStatus === 'Active' || s.studentStatus === 'Trial';
      if (statusFilter === 'DISCONTINUED') return s.discontinued || s.isDiscontinued;

      return true;
    });
  }, [students, searchQuery, statusFilter]);

  // Ribbon stats
  const stats = useMemo(() => {
    const total = students.length;
    const active = students.filter((s) => s.isActive && !s.discontinued).length;
    const trial = students.filter((s) => s.trialStatus === 'Active' || s.studentStatus === 'Trial').length;
    const discontinued = students.filter((s) => s.discontinued || s.isDiscontinued).length;
    return { total, active, trial, discontinued };
  }, [students]);

  return (
    <div className="relative mx-auto max-w-7xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
            <GraduationCap className="h-8 w-8 text-brand" />
            <span>Students Management & Admissions</span>
          </h1>
          <p className="text-muted-foreground mt-1">Admit students, manage student profiles, guardians, and academic rosters.</p>
        </div>
        <button
          onClick={() => setShowWizard(true)}
          className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-primary/10 transition-all duration-300 outline-none hover-lift self-start"
        >
          <Plus className="h-5 w-5" />
          <span>Admit New Student</span>
        </button>
      </div>

      {/* Ribbon Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            <p className="text-xs text-muted-foreground font-medium">Total Students</p>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-emerald-500">{stats.active}</p>
            <p className="text-xs text-muted-foreground font-medium">Active Enrolled</p>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-amber-500">{stats.trial}</p>
            <p className="text-xs text-muted-foreground font-medium">Trial Students</p>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 rounded-xl bg-rose-500/10 text-rose-500">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-rose-500">{stats.discontinued}</p>
            <p className="text-xs text-muted-foreground font-medium">Discontinued</p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-panel rounded-xl p-4 mb-6 flex flex-col md:flex-row items-center gap-4 justify-between">
        <div className="flex items-center gap-3 w-full md:w-96 bg-background border border-border px-3 py-2 rounded-lg">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search students by name, email, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none w-full text-sm text-foreground placeholder:text-muted-foreground/60"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {['ALL', 'ACTIVE', 'TRIAL', 'DISCONTINUED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === st
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-card hover:bg-muted text-muted-foreground'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Data Table */}
      <div className="glass-panel rounded-2xl overflow-hidden shadow-xl border border-border/50">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Fetching student records...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            No students found matching your criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-border bg-card/30">
                  <th className="py-4 px-4 font-semibold uppercase tracking-wider text-xs text-muted-foreground/80">Student ID</th>
                  <th className="py-4 px-4 font-semibold uppercase tracking-wider text-xs text-muted-foreground/80">Student Name</th>
                  <th className="py-4 px-4 font-semibold uppercase tracking-wider text-xs text-muted-foreground/80">Age / Type</th>
                  <th className="py-4 px-4 font-semibold uppercase tracking-wider text-xs text-muted-foreground/80">Guardian Contact</th>
                  <th className="py-4 px-4 font-semibold uppercase tracking-wider text-xs text-muted-foreground/80">Status</th>
                  <th className="py-4 px-4 font-semibold uppercase tracking-wider text-xs text-muted-foreground/80">Timezone</th>
                  <th className="py-4 px-4 font-semibold uppercase tracking-wider text-xs text-muted-foreground/80 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredStudents.map((s) => {
                  const dobVal = s.dob || s.dateOfBirth || '';
                  const { age, type } = calculateAgeAndType(dobStr(dobVal));
                  return (
                    <tr key={s.id} className="hover:bg-card/20 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-xs font-bold text-brand">
                        {s.studentId ? `STU-${s.studentId}` : '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-foreground">{s.name} {s.preferredName && `(${s.preferredName})`}</p>
                        <p className="text-xs text-muted-foreground">{s.email}</p>
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{age !== '-' ? `${age} yrs` : '—'}</span>
                          {type === 'Child' ? (
                            <span className="bg-blue-500/10 text-blue-500 border border-blue-500/20 text-[10px] font-bold px-2 py-0.5 rounded">Child</span>
                          ) : type === 'Adult' ? (
                            <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-bold px-2 py-0.5 rounded">Adult</span>
                          ) : null}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        {s.guardianName ? (
                          <div>
                            <p className="font-semibold text-foreground">{s.guardianName}</p>
                            <p className="text-[10px] text-muted-foreground">{s.guardianPhone || s.guardianEmail || 'No contact info'}</p>
                          </div>
                        ) : <span className="text-muted-foreground italic">Self / N/A</span>}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                            s.isActive
                              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                          }`}>
                            {s.isActive ? 'Active' : 'Inactive'}
                          </span>
                          {s.trialStatus === 'Active' && (
                            <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] font-bold px-2 py-0.5 rounded">Trial</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs">{s.timezone || 'UTC'}</td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => setEditingStudent(s)}
                            className="text-muted-foreground hover:text-brand transition-colors p-2 hover:bg-brand/10 rounded-lg"
                            title="Edit Student"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteStudent(s.id)}
                            className="text-muted-foreground hover:text-destructive transition-colors p-2 hover:bg-destructive/10 rounded-lg"
                            title="Delete Student"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Multi-Step Admission Wizard */}
      <AdmissionWizard
        isOpen={showWizard}
        onClose={() => setShowWizard(false)}
        onSuccess={fetchStudents}
      />

      {/* Edit Student Modal */}
      {editingStudent && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="glass-panel w-full max-w-lg rounded-2xl p-6 shadow-2xl relative border border-border">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-display font-bold">Edit Student Details</h2>
              <button onClick={() => setEditingStudent(null)} className="text-muted-foreground hover:text-foreground">
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleUpdateStudent} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Full Name</label>
                <input
                  type="text"
                  required
                  value={editingStudent.name}
                  onChange={(e) => setEditingStudent({ ...editingStudent, name: e.target.value })}
                  className="w-full bg-background border border-border rounded-lg p-2.5 text-sm outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Email Address</label>
                <input
                  type="email"
                  required
                  value={editingStudent.email}
                  onChange={(e) => setEditingStudent({ ...editingStudent, email: e.target.value })}
                  className="w-full bg-background border border-border rounded-lg p-2.5 text-sm outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Guardian Name</label>
                  <input
                    type="text"
                    value={editingStudent.guardianName || ''}
                    onChange={(e) => setEditingStudent({ ...editingStudent, guardianName: e.target.value })}
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-sm outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Guardian Phone</label>
                  <input
                    type="tel"
                    value={editingStudent.guardianPhone || ''}
                    onChange={(e) => setEditingStudent({ ...editingStudent, guardianPhone: e.target.value })}
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-sm outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-border mt-6">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="bg-muted hover:bg-muted/80 text-foreground py-2 px-4 rounded-lg text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingEdit}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground py-2 px-5 rounded-lg text-sm font-bold shadow-md flex items-center gap-1.5"
                >
                  {submittingEdit && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function dobStr(dob?: any): string {
  if (!dob) return '';
  if (typeof dob === 'string') return dob.split('T')[0];
  return new Date(dob).toISOString().split('T')[0];
}
