'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { Plus, Search, Trash2, Edit, XCircle, Loader2, User as UserIcon, Shield, ShieldCheck } from 'lucide-react';

interface UserAccount {
  id: string;
  name: string;
  preferredName?: string;
  email: string;
  role: 'ADMIN' | 'SUPERVISOR' | 'TEACHER' | 'STUDENT';
  gender?: string;
  timezone?: string;
  isActive: boolean;
  createdAt: string;
}

export default function UserAccountsManagement() {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'ADMIN' | 'SUPERVISOR'>('ALL');

  // Add Account Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'SUPERVISOR',
    gender: 'Male',
    timezone: 'UTC',
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/users`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setUsers(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error fetching user accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);

    try {
      const res = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to create user account.');
      }

      setShowAddModal(false);
      fetchUsers();
      setFormData({ name: '', email: '', password: '', role: 'SUPERVISOR', gender: 'Male', timezone: 'UTC' });
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (user: UserAccount) => {
    try {
      const res = await fetch(`${API_URL}/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      if (res.ok) fetchUsers();
    } catch (err) {
      console.error('Error toggling user status:', err);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user account?')) return;
    try {
      const res = await fetch(`${API_URL}/users/${id}`, { method: 'DELETE', credentials: 'include' });
      if (res.ok) fetchUsers();
    } catch (err) {
      console.error('Error deleting user:', err);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = u.name.toLowerCase().includes(query) || u.email.toLowerCase().includes(query);
      if (!matchesSearch) return false;

      if (roleFilter === 'ADMIN') return u.role === 'ADMIN';
      if (roleFilter === 'SUPERVISOR') return u.role === 'SUPERVISOR' || u.role === ('REVIEWER' as any);

      return true;
    });
  }, [users, searchQuery, roleFilter]);

  return (
    <div className="relative mx-auto max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-3">
            <Shield className="h-8 w-8 text-brand" />
            <span>User Accounts & Administrative Access</span>
          </h1>
          <p className="text-muted-foreground mt-1">Manage system administrators, quality supervisors, and global account credentials.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-primary/10 transition-all duration-300 outline-none hover-lift self-start"
        >
          <Plus className="h-5 w-5" />
          <span>Create Account</span>
        </button>
      </div>

      {/* Role Filter Tabs */}
      <div className="flex border-b border-border mb-6 gap-2">
        {(['ALL', 'ADMIN', 'SUPERVISOR'] as const).map((r) => (
          <button
            key={r}
            onClick={() => setRoleFilter(r)}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors ${
              roleFilter === r ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {r} ACCOUNTS
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="glass-panel rounded-xl p-4 mb-6 flex items-center gap-3">
        <Search className="h-5 w-5 text-muted-foreground/60" />
        <input
          type="text"
          placeholder="Search accounts by name or email..."
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
            <p className="text-sm text-muted-foreground">Fetching user accounts...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            No user accounts found matching your search.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-border bg-card/30">
                  <th className="py-4 px-6 font-semibold uppercase tracking-wider text-xs text-muted-foreground/80">Account Name</th>
                  <th className="py-4 px-6 font-semibold uppercase tracking-wider text-xs text-muted-foreground/80">System Role</th>
                  <th className="py-4 px-6 font-semibold uppercase tracking-wider text-xs text-muted-foreground/80">Status</th>
                  <th className="py-4 px-6 font-semibold uppercase tracking-wider text-xs text-muted-foreground/80">Timezone</th>
                  <th className="py-4 px-6 font-semibold uppercase tracking-wider text-xs text-muted-foreground/80 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-card/20 transition-colors">
                    <td className="py-3.5 px-6">
                      <p className="font-semibold text-foreground">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </td>
                    <td className="py-3.5 px-6">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                        u.role === 'ADMIN'
                          ? 'bg-purple-500/10 text-purple-500 border-purple-500/20'
                          : u.role === 'SUPERVISOR' || (u.role as any) === 'REVIEWER'
                          ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                          : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-6">
                      <button
                        onClick={() => handleToggleStatus(u)}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full border cursor-pointer hover:opacity-80 transition-all ${
                          u.isActive
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                        }`}
                      >
                        {u.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="py-3.5 px-6 font-mono text-xs">{u.timezone || 'UTC'}</td>
                    <td className="py-3.5 px-6 text-right">
                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors p-2 hover:bg-destructive/10 rounded-lg"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE ACCOUNT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="glass-panel w-full max-w-md rounded-2xl p-6 shadow-2xl relative border border-border">
            <div className="flex justify-between items-center mb-4 border-b border-border/40 pb-3">
              <h2 className="text-xl font-display font-bold">Create User Account</h2>
              <button onClick={() => setShowAddModal(false)} className="text-muted-foreground hover:text-foreground">
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4">
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">System Role</label>
                  <select name="role" value={formData.role} onChange={handleInputChange} className="w-full bg-background border border-border rounded-lg p-2.5 text-sm outline-none">
                    <option value="SUPERVISOR">SUPERVISOR</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Gender</label>
                  <select name="gender" value={formData.gender} onChange={handleInputChange} className="w-full bg-background border border-border rounded-lg p-2.5 text-sm outline-none">
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-border">
                <button type="button" onClick={() => setShowAddModal(false)} className="bg-muted hover:bg-muted/80 text-foreground py-2 px-4 rounded-lg text-sm font-semibold transition-colors">Cancel</button>
                <button type="submit" disabled={submitting} className="bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 px-5 rounded-lg text-sm font-bold shadow-md flex items-center gap-1.5 disabled:opacity-50">
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>Create Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
