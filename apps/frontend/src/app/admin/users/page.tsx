'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { Shield, ArrowLeft, Plus, Search, Trash2, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT' | 'REVIEWER';
  isActive: boolean;
  createdAt: string;
}

export default function UserManagement() {
  const { logout } = useAuth();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Create User Modal Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'TEACHER' | 'STUDENT' | 'REVIEWER'>('TEACHER');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_URL}/users`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitting(true);

    try {
      const res = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
        credentials: 'include',
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to create user');
      }

      setShowAddModal(false);
      setName('');
      setEmail('');
      setPassword('');
      setRole('TEACHER');
      fetchUsers(); // Refresh list
    } catch (err: any) {
      setSubmitError(err.message || 'An error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate this user account?')) {
      return;
    }

    try {
      const res = await fetch(`${API_URL}/users/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (res.ok) {
        fetchUsers(); // Refresh list
      } else {
        alert('Failed to deactivate user.');
      }
    } catch (err) {
      console.error('Error deactivating user:', err);
    }
  };

  const filteredUsers = users.filter((u) => {
    const query = searchQuery.toLowerCase().trim();
    return u.name.toLowerCase().includes(query) || u.email.toLowerCase().includes(query);
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold py-1 px-2.5 rounded-full">{role}</span>;
      case 'TEACHER':
        return <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold py-1 px-2.5 rounded-full">{role}</span>;
      case 'REVIEWER':
        return <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-semibold py-1 px-2.5 rounded-full">{role}</span>;
      default:
        return <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs font-semibold py-1 px-2.5 rounded-full">{role}</span>;
    }
  };

  return (
    <div className="relative mx-auto max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold">Manage Accounts</h1>
            <p className="text-muted-foreground mt-1">Create, view, and manage roles for teachers, reviewers, and students.</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2.5 px-5 rounded-lg shadow-lg hover:shadow-primary/10 transition-all duration-300 outline-none hover-lift self-start"
          >
            <Plus className="h-5 w-5" />
            <span>Add New User</span>
          </button>
        </div>

        {/* Toolbar (Search) */}
        <div className="glass-panel rounded-xl p-4 mb-6 flex items-center gap-3">
          <Search className="h-5 w-5 text-muted-foreground/60" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none w-full text-sm text-foreground placeholder:text-muted-foreground/50"
          />
        </div>

        {/* Users Table */}
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
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border bg-card/30">
                    <th className="py-4 px-6 font-semibold uppercase tracking-wider text-xs text-muted-foreground/80">User</th>
                    <th className="py-4 px-6 font-semibold uppercase tracking-wider text-xs text-muted-foreground/80">System Role</th>
                    <th className="py-4 px-6 font-semibold uppercase tracking-wider text-xs text-muted-foreground/80">Status</th>
                    <th className="py-4 px-6 font-semibold uppercase tracking-wider text-xs text-muted-foreground/80">Created Date</th>
                    <th className="py-4 px-6 font-semibold uppercase tracking-wider text-xs text-muted-foreground/80 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-card/20 transition-colors">
                      <td className="py-4 px-6">
                        <p className="font-semibold text-foreground">{u.name}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </td>
                      <td className="py-4 px-6">{getRoleBadge(u.role)}</td>
                      <td className="py-4 px-6">
                        {u.isActive ? (
                          <div className="flex items-center gap-1.5 text-emerald-400">
                            <CheckCircle2 className="h-4 w-4" />
                            <span className="text-xs font-semibold">Active</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <XCircle className="h-4 w-4" />
                            <span className="text-xs">Deactivated</span>
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6 text-muted-foreground text-xs">
                        {new Date(u.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="py-4 px-6 text-right">
                        {u.isActive ? (
                          <button
                            onClick={() => handleDeactivate(u.id)}
                            className="text-muted-foreground hover:text-destructive transition-colors p-2 hover:bg-destructive/10 rounded-lg"
                            title="Deactivate Account"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        ) : (
                          <span className="text-xs text-muted-foreground">--</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>


      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="glass-panel w-full max-w-md rounded-2xl p-6 shadow-2xl relative">
            <h2 className="text-2xl font-display font-bold mb-4">Register User</h2>
            
            <form onSubmit={handleCreateUser} className="space-y-4">
              {submitError && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-lg p-3">
                  {submitError}
                </div>
              )}

              {/* Name input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Qari Bilal"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-2.5 text-sm outline-none transition-all duration-300"
                />
              </div>

              {/* Email input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="name@academy.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-2.5 text-sm outline-none transition-all duration-300"
                />
              </div>

              {/* Password input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Initial Password</label>
                <input
                  type="password"
                  required
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-2.5 text-sm outline-none transition-all duration-300"
                />
              </div>

              {/* Role selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">System Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-2.5 text-sm outline-none transition-all duration-300"
                >
                  <option value="TEACHER">TEACHER</option>
                  <option value="REVIEWER">REVIEWER</option>
                  <option value="STUDENT">STUDENT</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="bg-muted hover:bg-muted/80 text-foreground py-2 px-4 rounded-lg text-sm font-semibold transition-colors outline-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground py-2 px-4 rounded-lg text-sm font-semibold transition-all duration-300 shadow-md hover:shadow-primary/10 flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>Register</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
