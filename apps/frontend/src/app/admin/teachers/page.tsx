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

export default function TeachersManagementPage() {
  const [teachers, setTeachers] = useState<TeacherUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Add Teacher Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    gender: 'Male',
    timezone: 'Asia/Karachi',
    qualification: 'Certified Qari & Hafiz',
    specialization: 'Nazira & Tajweed',
    joiningDate: new Date().toISOString().split('T')[0],
    salary: 35000,
    employeeId: '',
    bio: '',
    // Guarantor 1
    g1Name: '',
    g1Phone: '',
    g1Email: '',
    g1Relationship: 'Father',
    g1Cnic: '',
    g1Address: '',
    // Guarantor 2
    g2Name: '',
    g2Phone: '',
    g2Email: '',
    g2Relationship: 'Brother / Uncle',
    g2Cnic: '',
    g2Address: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // View Guarantors Modal
  const [viewingGuarantors, setViewingGuarantors] = useState<GuarantorItem[] | null>(null);

  // Edit Teacher Modal
  const [editingTeacher, setEditingTeacher] = useState<TeacherUser | null>(null);

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
          onClick={() => setShowAddModal(true)}
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
                  <th className="py-4 px-4 font-semibold uppercase tracking-wider text-xs text-muted-foreground/80">Salary (Cash)</th>
                  <th className="py-4 px-4 font-semibold uppercase tracking-wider text-xs text-muted-foreground/80">Guarantors</th>
                  <th className="py-4 px-4 font-semibold uppercase tracking-wider text-xs text-muted-foreground/80">Status</th>
                  <th className="py-4 px-4 font-semibold uppercase tracking-wider text-xs text-muted-foreground/80 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredTeachers.map((t) => (
                  <tr key={t.id} className="hover:bg-card/20 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-xs font-bold text-brand">
                      {t.employeeId || 'EMP-001'}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-foreground">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.email}</p>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium">
                      {t.specialization || 'Tajweed & Nazira'}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono font-bold text-emerald-500">
                      {t.salary ? `${t.salary.toLocaleString()} Cash` : '—'}
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
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                        t.isActive ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                      }`}>
                        {t.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => handleDeleteTeacher(t.id)}
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

      {/* ADD TEACHER MODAL (WITH 2 GUARANTORS) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn overflow-y-auto">
          <div className="glass-panel w-full max-w-3xl rounded-2xl p-6 md:p-8 shadow-2xl relative border border-border my-8">
            <div className="flex justify-between items-center mb-6 border-b border-border/40 pb-4">
              <div>
                <h2 className="text-2xl font-display font-bold">Add New Teacher & Register Guarantors</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Two verified guarantors are required for teacher onboarding.</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-muted-foreground hover:text-foreground">
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateTeacher} className="space-y-6">
              {/* SECTION 1: Personal & Account */}
              <div>
                <h3 className="text-sm font-bold text-brand uppercase tracking-wider mb-3">1. Account & Personal Info</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Full Name *</label>
                    <input type="text" name="name" required value={formData.name} onChange={handleInputChange} className="w-full bg-background border border-border rounded-lg p-2.5 text-sm outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Email Address *</label>
                    <input type="email" name="email" required value={formData.email} onChange={handleInputChange} className="w-full bg-background border border-border rounded-lg p-2.5 text-sm outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Password *</label>
                    <input type="password" name="password" required value={formData.password} onChange={handleInputChange} className="w-full bg-background border border-border rounded-lg p-2.5 text-sm outline-none" />
                  </div>
                </div>
              </div>

              {/* SECTION 2: Professional & HR */}
              <div>
                <h3 className="text-sm font-bold text-brand uppercase tracking-wider mb-3">2. Professional Credentials & Compensation</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Qualification</label>
                    <input type="text" name="qualification" value={formData.qualification} onChange={handleInputChange} className="w-full bg-background border border-border rounded-lg p-2.5 text-sm outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Specialization</label>
                    <input type="text" name="specialization" value={formData.specialization} onChange={handleInputChange} className="w-full bg-background border border-border rounded-lg p-2.5 text-sm outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Monthly Salary (Cash)</label>
                    <input type="number" name="salary" value={formData.salary} onChange={handleInputChange} className="w-full bg-background border border-border rounded-lg p-2.5 text-sm outline-none" />
                  </div>
                </div>
              </div>

              {/* SECTION 3: GUARANTOR 1 */}
              <div className="p-4 rounded-xl bg-card/40 border border-border">
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  <span>Guarantor 1 (Mandatory)</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Full Name *</label>
                    <input type="text" name="g1Name" required value={formData.g1Name} onChange={handleInputChange} placeholder="e.g. Usman Ali" className="w-full bg-background border border-border rounded-lg p-2.5 text-sm outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Phone Number *</label>
                    <input type="tel" name="g1Phone" required value={formData.g1Phone} onChange={handleInputChange} placeholder="+92 300 1234567" className="w-full bg-background border border-border rounded-lg p-2.5 text-sm outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">CNIC / ID Number *</label>
                    <input type="text" name="g1Cnic" required value={formData.g1Cnic} onChange={handleInputChange} placeholder="35202-1234567-1" className="w-full bg-background border border-border rounded-lg p-2.5 text-sm outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Relationship</label>
                    <input type="text" name="g1Relationship" value={formData.g1Relationship} onChange={handleInputChange} className="w-full bg-background border border-border rounded-lg p-2.5 text-sm outline-none" />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Address</label>
                    <input type="text" name="g1Address" value={formData.g1Address} onChange={handleInputChange} placeholder="Street address..." className="w-full bg-background border border-border rounded-lg p-2.5 text-sm outline-none" />
                  </div>
                </div>
              </div>

              {/* SECTION 4: GUARANTOR 2 */}
              <div className="p-4 rounded-xl bg-card/40 border border-border">
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  <span>Guarantor 2 (Mandatory)</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Full Name *</label>
                    <input type="text" name="g2Name" required value={formData.g2Name} onChange={handleInputChange} placeholder="e.g. Tariq Mehmood" className="w-full bg-background border border-border rounded-lg p-2.5 text-sm outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Phone Number *</label>
                    <input type="tel" name="g2Phone" required value={formData.g2Phone} onChange={handleInputChange} placeholder="+92 300 9876543" className="w-full bg-background border border-border rounded-lg p-2.5 text-sm outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">CNIC / ID Number *</label>
                    <input type="text" name="g2Cnic" required value={formData.g2Cnic} onChange={handleInputChange} placeholder="35202-9876543-2" className="w-full bg-background border border-border rounded-lg p-2.5 text-sm outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Relationship</label>
                    <input type="text" name="g2Relationship" value={formData.g2Relationship} onChange={handleInputChange} className="w-full bg-background border border-border rounded-lg p-2.5 text-sm outline-none" />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Address</label>
                    <input type="text" name="g2Address" value={formData.g2Address} onChange={handleInputChange} placeholder="Street address..." className="w-full bg-background border border-border rounded-lg p-2.5 text-sm outline-none" />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-border">
                <button type="button" onClick={() => setShowAddModal(false)} className="bg-muted hover:bg-muted/80 text-foreground py-2 px-4 rounded-lg text-sm font-semibold transition-colors">Cancel</button>
                <button type="submit" disabled={submitting} className="bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 px-6 rounded-xl text-sm font-bold shadow-md flex items-center gap-2 disabled:opacity-50">
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>Save Teacher & Guarantors</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
