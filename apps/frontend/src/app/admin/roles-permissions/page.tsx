'use client';

import React, { useState } from 'react';
import { Shield, ShieldAlert } from 'lucide-react';

const ROLES = ['ADMIN', 'TEACHER', 'STUDENT', 'REVIEWER'];
const MODULES = [
  'Dashboard', 'Users', 'Courses', 'Schedule', 'Enrollments',
  'Reviews', 'Quality Reports', 'Audit Logs', 'Settings', 'Feedback'
];

type Action = 'create' | 'read' | 'update' | 'delete';
type PermissionState = Record<string, Record<string, Record<Action, boolean>>>;

// Initialize some default dummy permissions
const defaultPermissions: PermissionState = {};
ROLES.forEach(role => {
  defaultPermissions[role] = {};
  MODULES.forEach(mod => {
    const isOwner = role === 'ADMIN';
    defaultPermissions[role][mod] = {
      create: isOwner,
      read: isOwner || role === 'TEACHER' || role === 'STUDENT',
      update: isOwner,
      delete: isOwner
    };
  });
});

export default function RolesPermissions() {
  const [activeRole, setActiveRole] = useState(ROLES[0]);
  const [permissions, setPermissions] = useState<PermissionState>(defaultPermissions);

  const togglePermission = (moduleName: string, action: Action) => {
    setPermissions(prev => ({
      ...prev,
      [activeRole]: {
        ...prev[activeRole],
        [moduleName]: {
          ...prev[activeRole][moduleName],
          [action]: !prev[activeRole][moduleName][action]
        }
      }
    }));
  };

  return (
    <div className="relative mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-display font-bold">Roles & Permissions</h1>
          <p className="text-muted-foreground mt-1">Manage access control and module permissions across different roles.</p>
        </div>
      </div>

      <div className="glass-panel rounded-xl shadow-xl overflow-hidden flex flex-col md:flex-row min-h-[600px]">
        {/* Role Sidebar tabs */}
        <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-border bg-card/30 flex flex-row md:flex-col p-4 gap-2 overflow-x-auto">
          {ROLES.map(role => (
            <button
              key={role}
              onClick={() => setActiveRole(role)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
                activeRole === role 
                  ? 'bg-primary text-primary-foreground shadow-md' 
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Shield className={`h-4 w-4 ${activeRole === role ? 'text-primary-foreground' : 'text-muted-foreground/70'}`} />
              {role}
            </button>
          ))}
        </div>

        {/* Matrix Container */}
        <div className="flex-1 p-6">
          <div className="flex items-center gap-3 mb-6 bg-muted/50 p-4 rounded-xl border border-border">
            <ShieldAlert className="text-brand h-6 w-6" />
            <div>
              <h3 className="font-bold text-sm">Currently Editing: {activeRole}</h3>
              <p className="text-xs text-muted-foreground">Changes to these permissions apply immediately to all users with this role.</p>
            </div>
          </div>

          <div className="overflow-x-auto border border-border rounded-xl">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-muted/50">
                  <th className="p-4 font-semibold text-xs text-muted-foreground uppercase tracking-wider border-b border-r border-border">Module</th>
                  <th className="p-4 font-semibold text-xs text-muted-foreground uppercase tracking-wider text-center border-b border-r border-border w-24">Create</th>
                  <th className="p-4 font-semibold text-xs text-muted-foreground uppercase tracking-wider text-center border-b border-r border-border w-24">Read</th>
                  <th className="p-4 font-semibold text-xs text-muted-foreground uppercase tracking-wider text-center border-b border-r border-border w-24">Update</th>
                  <th className="p-4 font-semibold text-xs text-muted-foreground uppercase tracking-wider text-center border-b border-border w-24">Delete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {MODULES.map(mod => {
                  const perms = permissions[activeRole]?.[mod];
                  return (
                    <tr key={mod} className="hover:bg-card/30 transition-colors">
                      <td className="p-4 font-medium border-r border-border">{mod}</td>
                      {(['create', 'read', 'update', 'delete'] as Action[]).map(action => (
                        <td key={action} className="p-4 text-center border-r border-border last:border-0">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={perms?.[action] || false}
                              onChange={() => togglePermission(mod, action)}
                              disabled={activeRole === 'ADMIN'}
                            />
                            <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
                          </label>
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
