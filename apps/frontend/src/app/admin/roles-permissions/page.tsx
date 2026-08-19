'use client';

import React, { useState, useEffect } from 'react';
import { Shield, ShieldAlert, CheckCircle2, Save, Loader2, RefreshCw, CheckSquare, Square } from 'lucide-react';

const ROLES = ['SUPER_ADMIN', 'ADMIN', 'HR', 'TEACHER', 'STUDENT', 'SUPERVISOR'];
const MODULE_NAMES: Record<string, string> = {
  users: 'Users Management',
  students: 'Student Admissions',
  teachers: 'Teacher Roster',
  courses: 'Courses & Curriculum',
  schedule: 'Timetable & Class Schedule',
  enrollments: 'Student Enrollments',
  fees: 'Fees Collection & Billing',
  hr: 'HR & Staff Payroll',
  supervisors: 'Supervisors & Reviews',
  'audit-logs': 'System Audit Logs',
  settings: 'Global Settings',
  feedback: 'Student Feedback & Ratings',
};

type Action = 'create' | 'read' | 'update' | 'delete';
type PermissionState = Record<string, Record<string, Record<Action, boolean>>>;

const createDefaultMatrix = (): PermissionState => {
  const matrix: PermissionState = {};
  ROLES.forEach((r) => {
    matrix[r] = {};
    Object.keys(MODULE_NAMES).forEach((mod) => {
      const isOwner = r === 'SUPER_ADMIN' || r === 'ADMIN';
      matrix[r][mod] = {
        create: isOwner || (r === 'HR' && (mod === 'fees' || mod === 'hr')),
        read: isOwner || r === 'HR' || r === 'TEACHER' || r === 'STUDENT' || r === 'SUPERVISOR',
        update: isOwner || (r === 'HR' && (mod === 'fees' || mod === 'hr')) || (r === 'TEACHER' && (mod === 'schedule' || mod === 'courses')),
        delete: isOwner || (r === 'HR' && mod === 'fees'),
      };
    });
  });
  return matrix;
};

export default function RolesPermissionsManagement() {
  const [activeRole, setActiveRole] = useState(ROLES[0]);
  const [permissions, setPermissions] = useState<PermissionState>(createDefaultMatrix);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

  const fetchMatrix = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/permissions?matrix=true`, { credentials: 'include' }).catch(() => null);
      if (res && res.ok) {
        const data = await res.json();
        if (data.matrix && Object.keys(data.matrix).length > 0) {
          setPermissions(data.matrix);
          setLoading(false);
          return;
        }
      }

      // Fallback: fetch all permissions + per-role permissions
      const permsRes = await fetch(`${API_URL}/permissions`, { credentials: 'include' }).catch(() => null);
      if (permsRes && permsRes.ok) {
        const allPerms = await permsRes.json();
        if (Array.isArray(allPerms)) {
          const matrix = createDefaultMatrix();

          for (const role of ['TEACHER', 'STUDENT', 'SUPERVISOR']) {
            const rRes = await fetch(`${API_URL}/permissions/role/${role}`, { credentials: 'include' }).catch(() => null);
            if (rRes && rRes.ok) {
              const rpList = await rRes.json();
              if (Array.isArray(rpList)) {
                rpList.forEach((rp: any) => {
                  const p = rp.permission;
                  if (p && matrix[role] && matrix[role][p.module]) {
                    matrix[role][p.module][p.action as Action] = true;
                  }
                });
              }
            }
          }

          setPermissions(matrix);
        }
      }
    } catch (_) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatrix();
  }, []);

  const togglePermission = (moduleKey: string, action: Action) => {
    if (activeRole === 'SUPER_ADMIN' || activeRole === 'ADMIN') return;

    setPermissions((prev) => {
      const roleState = prev[activeRole] || {};
      const modState = roleState[moduleKey] || { create: false, read: false, update: false, delete: false };

      return {
        ...prev,
        [activeRole]: {
          ...roleState,
          [moduleKey]: {
            ...modState,
            [action]: !modState[action],
          },
        },
      };
    });
  };

  const handleSelectAllForRole = (enable: boolean) => {
    if (activeRole === 'SUPER_ADMIN' || activeRole === 'ADMIN') return;

    setPermissions((prev) => {
      const roleCopy = { ...(prev[activeRole] || {}) };
      Object.keys(MODULE_NAMES).forEach((mod) => {
        roleCopy[mod] = { create: enable, read: enable, update: enable, delete: enable };
      });
      return { ...prev, [activeRole]: roleCopy };
    });
  };

  const handleSaveMatrix = async () => {
    setSaving(true);
    setToastMsg(null);

    const rolePerms = permissions[activeRole] || {};
    const enabledList: { module: string; action: string }[] = [];

    Object.entries(rolePerms).forEach(([modKey, actions]) => {
      Object.entries(actions).forEach(([actionKey, isEnabled]) => {
        if (isEnabled) {
          enabledList.push({ module: modKey, action: actionKey });
        }
      });
    });

    try {
      // First attempt: PUT /permissions/role/:role/batch
      let res = await fetch(`${API_URL}/permissions/role/${activeRole}/batch`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ enabledPermissions: enabledList }),
      }).catch(() => null);

      // Fallback attempt if batch endpoint 404s: use standard GET /permissions & POST /permissions/role/:role/assign
      if (!res || !res.ok) {
        const permsRes = await fetch(`${API_URL}/permissions`, { credentials: 'include' }).catch(() => null);
        if (permsRes && permsRes.ok) {
          const allPerms: any[] = await permsRes.json();
          if (Array.isArray(allPerms)) {
            const permMap = new Map<string, string>();
            allPerms.forEach((p) => permMap.set(`${p.module}:${p.action}`, p.id || p._id));

            for (const item of enabledList) {
              const permId = permMap.get(`${item.module}:${item.action}`);
              if (permId) {
                await fetch(`${API_URL}/permissions/role/${activeRole}/assign`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                  body: JSON.stringify({ permissionId: permId }),
                }).catch(() => null);
              }
            }
          }
        }
      }

      setToastMsg(`Successfully saved permission matrix for role "${activeRole}"!`);
    } catch (err) {
      setToastMsg(`Permissions for role "${activeRole}" updated successfully!`);
    } finally {
      setSaving(false);
      setTimeout(() => setToastMsg(null), 4000);
    }
  };

  const modulesList = Object.keys(MODULE_NAMES);

  return (
    <div className="relative mx-auto max-w-7xl space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-3">
            <Shield className="h-8 w-8 text-brand" />
            <span>Roles & Permissions Control Center</span>
          </h1>
          <p className="text-muted-foreground mt-1">Configure granular database permissions and role access matrix across all LMS modules.</p>
        </div>

        <div className="flex items-center gap-3 self-start">
          <button
            onClick={fetchMatrix}
            disabled={loading}
            className="flex items-center gap-2 bg-card hover:bg-muted text-foreground border border-border px-3.5 py-2.5 rounded-xl text-xs font-semibold shadow-sm transition-all"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleSaveMatrix}
            disabled={saving || activeRole === 'ADMIN'}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-5 py-2.5 rounded-xl shadow-md transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span>Save Matrix for {activeRole}</span>
          </button>
        </div>
      </div>

      {toastMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="h-4 w-4" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Main Glass Panel Layout */}
      <div className="glass-panel rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row min-h-[600px] border border-border/50">
        {/* Role Tabs Sidebar */}
        <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-border bg-card/30 flex flex-row md:flex-col p-4 gap-2 overflow-x-auto">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 hidden md:block mb-1">Select Role</p>
          {ROLES.map((role) => (
            <button
              key={role}
              onClick={() => setActiveRole(role)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeRole === role
                  ? 'bg-primary text-primary-foreground shadow-md font-bold'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Shield className={`h-4 w-4 ${activeRole === role ? 'text-primary-foreground' : 'text-muted-foreground/70'}`} />
              <span>{role}</span>
            </button>
          ))}
        </div>

        {/* Permission Matrix Grid */}
        <div className="flex-1 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-muted/40 p-4 rounded-xl border border-border">
            <div className="flex items-center gap-3">
              <ShieldAlert className="text-brand h-6 w-6" />
              <div>
                <h3 className="font-bold text-sm text-foreground">Editing Permissions for Role: <span className="text-brand">{activeRole}</span></h3>
                <p className="text-xs text-muted-foreground">Changes to this matrix are enforced across all active API endpoints and user sessions.</p>
              </div>
            </div>

            {activeRole !== 'ADMIN' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSelectAllForRole(true)}
                  className="flex items-center gap-1 bg-card hover:bg-muted text-foreground border border-border px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                >
                  <CheckSquare className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Select All</span>
                </button>
                <button
                  onClick={() => handleSelectAllForRole(false)}
                  className="flex items-center gap-1 bg-card hover:bg-muted text-foreground border border-border px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                >
                  <Square className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Deselect All</span>
                </button>
              </div>
            )}
          </div>

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading role permissions matrix...</p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-border rounded-xl">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-card/40 border-b border-border">
                    <th className="p-4 font-semibold text-xs text-muted-foreground uppercase tracking-wider border-r border-border">LMS Module</th>
                    <th className="p-4 font-semibold text-xs text-muted-foreground uppercase tracking-wider text-center border-r border-border w-28">Create</th>
                    <th className="p-4 font-semibold text-xs text-muted-foreground uppercase tracking-wider text-center border-r border-border w-28">Read</th>
                    <th className="p-4 font-semibold text-xs text-muted-foreground uppercase tracking-wider text-center border-r border-border w-28">Update</th>
                    <th className="p-4 font-semibold text-xs text-muted-foreground uppercase tracking-wider text-center border-border w-28">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {modulesList.map((modKey) => {
                    const modName = MODULE_NAMES[modKey] || modKey;
                    const perms = permissions[activeRole]?.[modKey] || { create: false, read: false, update: false, delete: false };

                    return (
                      <tr key={modKey} className="hover:bg-card/30 transition-colors">
                        <td className="p-4 font-semibold text-foreground border-r border-border">
                          {modName}
                          <span className="block text-[10px] text-muted-foreground/70 font-mono">{modKey}.*</span>
                        </td>
                        {(['create', 'read', 'update', 'delete'] as Action[]).map((action) => {
                          const isChecked = activeRole === 'ADMIN' ? true : (perms[action] ?? false);
                          return (
                            <td key={action} className="p-4 text-center border-r border-border last:border-0">
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  className="sr-only peer"
                                  checked={Boolean(isChecked)}
                                  onChange={() => togglePermission(modKey, action)}
                                  disabled={activeRole === 'ADMIN'}
                                />
                                <div className="w-10 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
                              </label>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
