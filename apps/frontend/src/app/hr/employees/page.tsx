'use client';

import React, { useState, useEffect } from 'react';
import { Users, Search, Mail, Shield, CheckCircle2, UserCheck, Loader2, RefreshCw } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export default function HREmployeesPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('TEACHER');
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/users`, { credentials: 'include' });
      if (res.ok) setUsers(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter((u) => {
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesSearch = !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase());
    return matchesRole && matchesSearch;
  });

  return (
    <div className="space-y-6 mx-auto max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
            <Users className="h-8 w-8 text-brand" />
            <span>Employee &amp; Staff Directory</span>
          </h1>
          <p className="text-muted-foreground mt-1">Directory of teachers, HR personnel, and operational support staff.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search staff name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-card border border-border rounded-xl pl-9 pr-4 py-2 text-xs outline-none focus:border-primary w-64"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-card border border-border rounded-xl px-3 py-2 text-xs font-semibold outline-none cursor-pointer"
          >
            <option value="TEACHER">Teachers Only</option>
            <option value="HR">HR Staff Only</option>
            <option value="ALL">All Roles</option>
          </select>
        </div>
      </div>

      {/* Roster Table */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-border/50 shadow-xl">
        <div className="p-4 border-b border-border/40 bg-card/30 flex items-center justify-between">
          <h3 className="font-display font-bold text-base text-foreground">Staff Directory ({filteredUsers.length})</h3>
          <button onClick={fetchUsers} className="p-1.5 text-muted-foreground hover:text-foreground">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        {loading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-16 text-center text-xs text-muted-foreground">No staff members match the selected filter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-border bg-card/20 text-xs font-semibold text-muted-foreground uppercase">
                  <th className="py-3.5 px-6">Employee Name</th>
                  <th className="py-3.5 px-6">Email Address</th>
                  <th className="py-3.5 px-6">Role</th>
                  <th className="py-3.5 px-6">Timezone</th>
                  <th className="py-3.5 px-6">Account Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredUsers.map((u) => (
                  <tr key={u.id || u._id} className="hover:bg-card/20 transition-colors">
                    <td className="py-4 px-6 font-semibold text-foreground flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                        {u.name?.slice(0, 2).toUpperCase()}
                      </div>
                      <span>{u.name}</span>
                    </td>
                    <td className="py-4 px-6 text-xs text-muted-foreground">{u.email}</td>
                    <td className="py-4 px-6">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                        u.role === 'TEACHER'
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                          : 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-xs">{u.timezone || 'UTC'}</td>
                    <td className="py-4 px-6">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        ACTIVE
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
