'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { Plus, Search, Trash2, Edit, XCircle, Loader2, Upload, User as UserIcon } from 'lucide-react';

interface UserItem {
  id: string;
  studentId?: string;
  avatar?: string;
  name: string;
  preferredName?: string;
  email: string;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT' | 'REVIEWER';
  gender?: string;
  dob?: string;
  timezone?: string;
  enrollmentDate?: string;
  status: string;
  trialStatus?: string;
  isDiscontinued?: boolean;
  isActive: boolean;
  createdAt: string;
}

export default function UserManagement() {
  const { logout } = useAuth();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Dummy Data for visual
  useEffect(() => {
    setUsers([
      {
        id: '1',
        studentId: 'STU-001',
        name: 'Ali Khan',
        preferredName: 'Ali',
        email: 'ali@example.com',
        role: 'STUDENT',
        gender: 'Male',
        dob: '2012-05-14',
        timezone: 'EST',
        enrollmentDate: '2023-01-10',
        status: 'Regular',
        trialStatus: 'Completed',
        isActive: true,
        createdAt: '2023-01-01',
      },
      {
        id: '2',
        studentId: 'STU-002',
        name: 'Sara Ahmed',
        email: 'sara@example.com',
        role: 'STUDENT',
        gender: 'Female',
        dob: '1995-11-20',
        timezone: 'GMT',
        enrollmentDate: '2023-06-15',
        status: 'Trial',
        trialStatus: 'Active',
        isActive: true,
        createdAt: '2023-06-01',
      }
    ]);
  }, []);

  // Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    preferredName: '',
    email: '',
    password: '',
    role: 'STUDENT',
    gender: 'Male',
    dob: '',
    timezone: 'UTC',
    enrollmentDate: new Date().toISOString().split('T')[0],
    status: 'Regular',
    trialStatus: 'N/A',
    isDiscontinued: false,
    avatar: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const calculateAgeAndType = (dob: string) => {
    if (!dob) return { age: '-', type: '-' };
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return { age, type: age < 18 ? 'Child' : 'Adult' };
  };

  const formComputed = useMemo(() => calculateAgeAndType(formData.dob), [formData.dob]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      const newUser: UserItem = {
        id: Date.now().toString(),
        studentId: `STU-00${users.length + 1}`,
        ...formData,
        role: formData.role as any,
        isActive: true,
        createdAt: new Date().toISOString()
      };
      setUsers([...users, newUser]);
      setShowAddModal(false);
      setSubmitting(false);
      setFormData({
        name: '', preferredName: '', email: '', password: '', role: 'STUDENT', gender: 'Male',
        dob: '', timezone: 'UTC', enrollmentDate: new Date().toISOString().split('T')[0],
        status: 'Regular', trialStatus: 'N/A', isDiscontinued: false, avatar: ''
      });
    }, 1000);
  };

  const filteredUsers = users.filter((u) => {
    const query = searchQuery.toLowerCase().trim();
    return u.name.toLowerCase().includes(query) || u.email.toLowerCase().includes(query) || (u.studentId && u.studentId.toLowerCase().includes(query));
  });

  return (
    <div className="relative mx-auto max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold">Students Management & Admission</h1>
          <p className="text-muted-foreground mt-1">Admit students, create accounts, and manage roster.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2.5 px-5 rounded-lg shadow-lg hover:shadow-primary/10 transition-all duration-300 outline-none hover-lift self-start"
        >
          <Plus className="h-5 w-5" />
          <span>Admit New User</span>
        </button>
      </div>

      <div className="glass-panel rounded-xl p-4 mb-6 flex items-center gap-3">
        <Search className="h-5 w-5 text-muted-foreground/60" />
        <input
          type="text"
          placeholder="Search users by name, email, or Student ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-transparent border-none outline-none w-full text-sm text-foreground placeholder:text-muted-foreground/50"
        />
      </div>

      <div className="glass-panel rounded-xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Fetching users...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            No users found matching your search.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-border bg-card/30">
                  <th className="py-4 px-4 font-semibold uppercase tracking-wider text-xs text-muted-foreground/80">Avatar</th>
                  <th className="py-4 px-4 font-semibold uppercase tracking-wider text-xs text-muted-foreground/80">ID</th>
                  <th className="py-4 px-4 font-semibold uppercase tracking-wider text-xs text-muted-foreground/80">Name / Email</th>
                  <th className="py-4 px-4 font-semibold uppercase tracking-wider text-xs text-muted-foreground/80">Role</th>
                  <th className="py-4 px-4 font-semibold uppercase tracking-wider text-xs text-muted-foreground/80">Gender</th>
                  <th className="py-4 px-4 font-semibold uppercase tracking-wider text-xs text-muted-foreground/80">DOB (Age)</th>
                  <th className="py-4 px-4 font-semibold uppercase tracking-wider text-xs text-muted-foreground/80">Type</th>
                  <th className="py-4 px-4 font-semibold uppercase tracking-wider text-xs text-muted-foreground/80">Status</th>
                  <th className="py-4 px-4 font-semibold uppercase tracking-wider text-xs text-muted-foreground/80">Trial Status</th>
                  <th className="py-4 px-4 font-semibold uppercase tracking-wider text-xs text-muted-foreground/80">Timezone</th>
                  <th className="py-4 px-4 font-semibold uppercase tracking-wider text-xs text-muted-foreground/80 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredUsers.map((u) => {
                  const { age, type } = calculateAgeAndType(u.dob || '');
                  return (
                    <tr key={u.id} className="hover:bg-card/20 transition-colors">
                      <td className="py-3 px-4">
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center overflow-hidden border border-border">
                          {u.avatar ? <img src={u.avatar} alt={u.name} className="object-cover w-full h-full" /> : <UserIcon className="h-5 w-5 text-muted-foreground" />}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs">{u.studentId || '-'}</td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-foreground">{u.name} {u.preferredName && `(${u.preferredName})`}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span className="bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold py-1 px-2.5 rounded-full">{u.role}</span>
                      </td>
                      <td className="py-3 px-4">{u.gender || '-'}</td>
                      <td className="py-3 px-4 text-xs">
                        {u.dob ? <>{u.dob} <br /><span className="text-muted-foreground">({age}y)</span></> : '-'}
                      </td>
                      <td className="py-3 px-4">
                        {type === 'Child' ? (
                          <span className="bg-blue-500/10 text-blue-500 text-[10px] px-2 py-0.5 rounded">Child</span>
                        ) : type === 'Adult' ? (
                          <span className="bg-emerald-500/10 text-emerald-500 text-[10px] px-2 py-0.5 rounded">Adult</span>
                        ) : '-'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs font-semibold">{u.status || 'Active'}</span>
                        {u.isDiscontinued && <span className="ml-1 bg-red-500/10 text-red-500 text-[10px] px-1.5 rounded">Disc.</span>}
                      </td>
                      <td className="py-3 px-4 text-xs">{u.trialStatus || '-'}</td>
                      <td className="py-3 px-4 font-mono text-xs">{u.timezone || 'UTC'}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button className="text-muted-foreground hover:text-brand transition-colors p-1.5 hover:bg-brand/10 rounded-lg">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button className="text-muted-foreground hover:text-destructive transition-colors p-1.5 hover:bg-destructive/10 rounded-lg">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn overflow-y-auto">
          <div className="glass-panel w-full max-w-2xl rounded-2xl p-6 shadow-2xl relative my-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-display font-bold">Admit New User</h2>
              <button onClick={() => setShowAddModal(false)} className="text-muted-foreground hover:text-foreground">
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-6">
              <div className="flex flex-col items-center mb-6">
                <div className="h-20 w-20 rounded-full bg-muted border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground cursor-pointer hover:bg-muted/80 hover:border-primary transition-colors">
                  <Upload className="h-6 w-6 mb-1" />
                  <span className="text-[10px] uppercase font-bold">Avatar</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Full Name</label>
                  <input type="text" name="name" required value={formData.name} onChange={handleInputChange} className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-2.5 text-sm outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Preferred Name</label>
                  <input type="text" name="preferredName" value={formData.preferredName} onChange={handleInputChange} className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-2.5 text-sm outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Email</label>
                  <input type="email" name="email" required value={formData.email} onChange={handleInputChange} className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-2.5 text-sm outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Password</label>
                  <input type="password" name="password" required value={formData.password} onChange={handleInputChange} className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-2.5 text-sm outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">System Role</label>
                  <select name="role" value={formData.role} onChange={handleInputChange} className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-2.5 text-sm outline-none">
                    <option value="STUDENT">STUDENT</option>
                    <option value="TEACHER">TEACHER</option>
                    <option value="REVIEWER">REVIEWER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Gender</label>
                  <select name="gender" value={formData.gender} onChange={handleInputChange} className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-2.5 text-sm outline-none">
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Date of Birth</label>
                  <div className="flex gap-2 items-center">
                    <input type="date" name="dob" value={formData.dob} onChange={handleInputChange} className="flex-1 bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-2.5 text-sm outline-none" />
                    {formData.dob && (
                      <div className="bg-muted px-3 py-2 rounded-lg border border-border text-xs flex flex-col justify-center">
                        <span className="font-bold">{formComputed.age} yrs</span>
                        <span className="text-[10px] text-muted-foreground leading-none">{formComputed.type}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Timezone</label>
                  <select name="timezone" value={formData.timezone} onChange={handleInputChange} className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-2.5 text-sm outline-none">
                    <option value="UTC">UTC</option>
                    <option value="EST">EST (New York)</option>
                    <option value="CST">CST (Chicago)</option>
                    <option value="PST">PST (Los Angeles)</option>
                    <option value="GMT">GMT (London)</option>
                    <option value="PKT">PKT (Islamabad)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Enrollment Date</label>
                  <input type="date" name="enrollmentDate" value={formData.enrollmentDate} onChange={handleInputChange} className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-2.5 text-sm outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</label>
                  <select name="status" value={formData.status} onChange={handleInputChange} className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-2.5 text-sm outline-none">
                    <option value="Regular">Regular</option>
                    <option value="Trial">Trial</option>
                    <option value="On Hold">On Hold</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Trial Status</label>
                  <select name="trialStatus" value={formData.trialStatus} onChange={handleInputChange} className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-2.5 text-sm outline-none">
                    <option value="N/A">N/A</option>
                    <option value="Active">Active</option>
                    <option value="Completed">Completed</option>
                    <option value="Failed">Failed</option>
                  </select>
                </div>
                <div className="flex items-center space-x-2 mt-7">
                  <input type="checkbox" name="isDiscontinued" id="isDiscontinued" checked={formData.isDiscontinued} onChange={handleInputChange} className="rounded border-border text-primary focus:ring-primary h-4 w-4" />
                  <label htmlFor="isDiscontinued" className="text-sm font-semibold text-foreground">Discontinued (Inactive)</label>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-border mt-6">
                <button type="button" onClick={() => setShowAddModal(false)} className="bg-muted hover:bg-muted/80 text-foreground py-2 px-4 rounded-lg text-sm font-semibold transition-colors outline-none">Cancel</button>
                <button type="submit" disabled={submitting} className="bg-primary hover:bg-primary/90 text-primary-foreground py-2 px-4 rounded-lg text-sm font-semibold transition-all duration-300 shadow-md hover:shadow-primary/10 flex items-center justify-center gap-1.5 disabled:opacity-50">
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>Admit User</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
