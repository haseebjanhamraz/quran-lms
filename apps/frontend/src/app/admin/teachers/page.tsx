'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus, Search, Trash2, Edit, XCircle, Loader2, User as UserIcon,
  BookUser, Shield, DollarSign, CheckCircle, AlertCircle, ShieldCheck, FileText
} from 'lucide-react';

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
  employeeId?: string;
  avatar?: string;
  name: string;
  preferredName?: string;
  email: string;
  role: string;
  gender?: string;
  qualification?: string;
  specialization?: string;
  joiningDate?: string;
  salary?: number;
  bio?: string;
  timezone?: string;
  guarantors?: GuarantorItem[];
  isActive: boolean;
  createdAt: string;
}

import TeacherWizard from '@/components/TeacherWizard';
import { getImageUrl } from '@/utils/image';

export default function TeachersManagementPage() {
  const [teachers, setTeachers] = useState<TeacherUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Teacher Wizard Modal State
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<any | null>(null);

  // View Guarantors Modal
  const [viewingGuarantors, setViewingGuarantors] = useState<GuarantorItem[] | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/users`, { credentials: 'include' });
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!formData.g1Name || !formData.g1Phone || !formData.g1Cnic) {
      setErrorMsg('Please complete all required fields for Guarantor 1.');
      return;
    }
    if (!formData.g2Name || !formData.g2Phone || !formData.g2Cnic) {
      setErrorMsg('Please complete all required fields for Guarantor 2.');
      return;
    }

    setSubmitting(true);

    const guarantors: GuarantorItem[] = [
      {
        name: formData.g1Name,
        phone: formData.g1Phone,
        email: formData.g1Email,
        relationship: formData.g1Relationship,
        cnicOrId: formData.g1Cnic,
        address: formData.g1Address,
      },
      {
        name: formData.g2Name,
        phone: formData.g2Phone,
        email: formData.g2Email,
        relationship: formData.g2Relationship,
        cnicOrId: formData.g2Cnic,
        address: formData.g2Address,
      },
    ];

    try {
      const res = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: 'TEACHER',
          gender: formData.gender,
          timezone: formData.timezone,
          qualification: formData.qualification,
          specialization: formData.specialization,
          joiningDate: formData.joiningDate,
          salary: Number(formData.salary),
          employeeId: formData.employeeId || `EMP-${Date.now().toString().slice(-4)}`,
          bio: formData.bio,
          guarantors,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to create teacher.');
      }

      setShowAddModal(false);
      fetchTeachers();
      // Reset form
      setFormData({
        name: '', email: '', password: '', gender: 'Male', timezone: 'Asia/Karachi',
        qualification: 'Certified Qari & Hafiz', specialization: 'Nazira & Tajweed',
        joiningDate: new Date().toISOString().split('T')[0], salary: 35000, employeeId: '', bio: '',
        g1Name: '', g1Phone: '', g1Email: '', g1Relationship: 'Father', g1Cnic: '', g1Address: '',
        g2Name: '', g2Phone: '', g2Email: '', g2Relationship: 'Brother / Uncle', g2Cnic: '', g2Address: '',
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTeacher = async (id: string) => {
    if (!confirm('Are you sure you want to delete this teacher account?')) return;
    try {
      const res = await fetch(`${API_URL}/users/${id}`, { method: 'DELETE', credentials: 'include' });
      if (res.ok) fetchTeachers();
    } catch (err) {
      console.error('Error deleting teacher:', err);
    }
  };

  const filteredTeachers = useMemo(() => {
    return teachers.filter((t) => {
      const q = searchQuery.toLowerCase().trim();
      return (
        t.name.toLowerCase().includes(q) ||
        t.email.toLowerCase().includes(q) ||
        (t.employeeId && t.employeeId.toLowerCase().includes(q)) ||
        (t.specialization && t.specialization.toLowerCase().includes(q))
      );
    });
  }, [teachers, searchQuery]);

  const stats = useMemo(() => {
    const total = teachers.length;
    const active = teachers.filter((t) => t.isActive).length;
    const totalPayroll = teachers.reduce((sum, t) => sum + (t.salary || 0), 0);
    return { total, active, totalPayroll };
  }, [teachers]);

  return (
    <div className="relative mx-auto max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
            <BookUser className="h-8 w-8 text-brand" />
            <span>Teachers & Staff Management</span>
          </h1>
          <p className="text-muted-foreground mt-1">Manage teaching staff profiles, guarantors, credentials, and monthly compensation.</p>
        </div>
        <button
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500">
            <BookUser className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            <p className="text-xs text-muted-foreground font-medium">Total Teachers</p>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-emerald-500">{stats.active}</p>
            <p className="text-xs text-muted-foreground font-medium">Active Teachers</p>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-amber-500">{stats.totalPayroll.toLocaleString()} Cash</p>
            <p className="text-xs text-muted-foreground font-medium">Total Monthly Payroll</p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="glass-panel rounded-xl p-4 mb-6 flex items-center gap-3">
        <Search className="h-5 w-5 text-muted-foreground/60" />
        <input
          type="text"
          placeholder="Search teachers by name, email, employee ID, or specialization..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-transparent border-none outline-none w-full text-sm text-foreground placeholder:text-muted-foreground/50"
        />
      </div>

      {/* Table */}
      <div className="glass-panel rounded-2xl overflow-hidden shadow-xl border border-border/50">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Fetching teacher records...</p>
          </div>
        ) : filteredTeachers.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            No teachers found matching your search.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-border bg-card/30">
                  <th className="py-4 px-4 font-semibold uppercase tracking-wider text-xs text-muted-foreground/80">Employee ID</th>
                  <th className="py-4 px-4 font-semibold uppercase tracking-wider text-xs text-muted-foreground/80">Teacher Name</th>
                  <th className="py-4 px-4 font-semibold uppercase tracking-wider text-xs text-muted-foreground/80">Specialization</th>
                  <th className="py-4 px-4 font-semibold uppercase tracking-wider text-xs text-muted-foreground/80">Salary / Pay</th>
                  <th className="py-4 px-4 font-semibold uppercase tracking-wider text-xs text-muted-foreground/80">Guarantors</th>
                  <th className="py-4 px-4 font-semibold uppercase tracking-wider text-xs text-muted-foreground/80">Self-Edit</th>
                  <th className="py-4 px-4 font-semibold uppercase tracking-wider text-xs text-muted-foreground/80 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredTeachers.map((t: any) => (
                  <tr key={t.id || t._id} className="hover:bg-card/20 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-xs font-bold text-brand">
                      {t.employeeId || 'EMP-001'}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        {t.profilePicture || t.avatar ? (
                          <img src={getImageUrl(t.profilePicture || t.avatar)} alt={t.name} className="h-8 w-8 rounded-full object-cover border border-border" />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                            {t.name?.charAt(0)}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-foreground">{t.name}</p>
                          <p className="text-xs text-muted-foreground">{t.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium">
                      {t.specialization || 'Tajweed & Nazira'}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono font-bold text-emerald-500">
                      {t.salary ? `${t.currency || 'PKR'} ${t.salary.toLocaleString()}` : '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => setViewingGuarantors(t.guarantors || [])}
                        className="flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
                      >
                        <ShieldCheck className="h-4 w-4" />
                        <span>{t.guarantors?.length || 2} Verified</span>
                      </button>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        t.canEditProfile !== false ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                      }`}>
                        {t.canEditProfile !== false ? 'Allowed' : 'Disabled'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => {
                            setEditingTeacher(t);
                            setIsWizardOpen(true);
                          }}
                          className="text-muted-foreground hover:text-foreground transition-colors p-2 hover:bg-muted rounded-lg"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTeacher(t.id || t._id)}
                          className="text-muted-foreground hover:text-destructive transition-colors p-2 hover:bg-destructive/10 rounded-lg"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* TEACHER WIZARD MODAL */}
      <TeacherWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onSuccess={() => fetchTeachers()}
        editingTeacher={editingTeacher}
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
              <button onClick={() => setViewingGuarantors(null)} className="text-muted-foreground hover:text-foreground">
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              {viewingGuarantors.length === 0 ? (
                <p className="text-xs text-muted-foreground italic text-center py-4">No guarantor records registered for this account.</p>
              ) : (
                viewingGuarantors.map((g, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-card/60 border border-border space-y-1">
                    <p className="font-bold text-sm text-foreground flex items-center justify-between">
                      <span>Guarantor #{idx + 1}: {g.name}</span>
                      <span className="text-xs text-brand font-normal">({g.relationship})</span>
                    </p>
                    <p className="text-xs text-muted-foreground">CNIC/ID: <span className="font-mono text-foreground font-semibold">{g.cnicOrId}</span></p>
                    <p className="text-xs text-muted-foreground">Phone: <span className="text-foreground">{g.phone}</span></p>
                    {g.address && <p className="text-xs text-muted-foreground">Address: {g.address}</p>}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
