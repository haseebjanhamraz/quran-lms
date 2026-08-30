'use client';

import React, { useState } from 'react';
import {
  ShieldAlert, UserX, Ban, CheckCircle2, AlertTriangle,
  X, Loader2, Trash2, Info
} from 'lucide-react';
import { apiFetch } from '@/utils/apiFetch';
import { toast } from 'react-toastify';

export type AccountStatus = 'ACTIVE' | 'SUSPENDED' | 'TERMINATED' | 'ON_LEAVE';

interface AccountStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    accountStatus?: AccountStatus;
    accountStatusReason?: string;
  } | null;
  onStatusUpdated: () => void;
  initialAction?: 'SUSPEND' | 'TERMINATE' | 'REACTIVATE' | 'DELETE';
}

export default function AccountStatusModal({
  isOpen,
  onClose,
  user,
  onStatusUpdated,
  initialAction = 'SUSPEND',
}: AccountStatusModalProps) {
  const currentStatus: AccountStatus = user?.accountStatus || 'ACTIVE';

  const [targetStatus, setTargetStatus] = useState<AccountStatus>(() => {
    if (initialAction === 'REACTIVATE') return 'ACTIVE';
    if (initialAction === 'TERMINATE') return 'TERMINATED';
    return 'SUSPENDED';
  });

  const [isDeleteMode, setIsDeleteMode] = useState<boolean>(initialAction === 'DELETE');
  const [reason, setReason] = useState<string>('');
  const [deleteConfirmName, setDeleteConfirmName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  if (!isOpen || !user) return null;

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isDeleteMode) {
      if (deleteConfirmName.trim() !== user.name.trim()) {
        toast.error(`Please type the exact name "${user.name}" to confirm permanent deletion.`);
        return;
      }

      setLoading(true);
      try {
        const res = await apiFetch(`${API_URL}/users/${user.id}/permanent`, {
          method: 'DELETE',
        });
        if (res.ok) {
          toast.success(`Account for ${user.name} was permanently deleted.`);
          onStatusUpdated();
          onClose();
        } else {
          const err = await res.json();
          toast.error(err.message || 'Failed to delete user account');
        }
      } catch (err: any) {
        toast.error(err.message || 'Network error while deleting account');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (targetStatus !== 'ACTIVE' && !reason.trim()) {
      toast.error('Please provide a reason for suspending or terminating this account.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch(`${API_URL}/users/${user.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          accountStatus: targetStatus,
          reason: reason.trim(),
        }),
      });

      if (res.ok) {
        toast.success(`Account status updated to ${targetStatus}`);
        onStatusUpdated();
        onClose();
      } else {
        const err = await res.json();
        toast.error(err.message || 'Failed to update account status');
      }
    } catch (err: any) {
      toast.error(err.message || 'Network error while updating status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fadeIn">
      <div className="glass-panel w-full max-w-lg rounded-2xl p-6 shadow-2xl relative border border-border bg-card">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-muted text-muted-foreground transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-border/60 pb-4 mb-5">
          <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${
            isDeleteMode
              ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
              : targetStatus === 'TERMINATED'
              ? 'bg-red-500/10 text-red-500 border border-red-500/20'
              : targetStatus === 'SUSPENDED'
              ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
              : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
          }`}>
            {isDeleteMode ? (
              <Trash2 className="h-6 w-6" />
            ) : targetStatus === 'TERMINATED' ? (
              <UserX className="h-6 w-6" />
            ) : targetStatus === 'SUSPENDED' ? (
              <Ban className="h-6 w-6" />
            ) : (
              <CheckCircle2 className="h-6 w-6" />
            )}
          </div>
          <div>
            <h2 className="text-lg font-bold font-display text-foreground">
              {isDeleteMode ? 'Permanently Delete Account' : 'Manage Account Status'}
            </h2>
            <p className="text-xs text-muted-foreground">
              {user.name} ({user.role}) &bull; {user.email}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isDeleteMode ? (
            <>
              {/* Current Status Pill */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border/60">
                <span className="text-xs font-semibold text-muted-foreground">Current Status:</span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  currentStatus === 'ACTIVE'
                    ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                    : currentStatus === 'SUSPENDED'
                    ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                    : currentStatus === 'TERMINATED'
                    ? 'bg-rose-500/15 text-rose-500 border border-rose-500/30'
                    : 'bg-sky-500/15 text-sky-500 border border-sky-500/30'
                }`}>
                  {currentStatus}
                </span>
              </div>

              {/* Status Action Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  New Status Action
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setTargetStatus('ACTIVE')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-1 ${
                      targetStatus === 'ACTIVE'
                        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-500 shadow-sm'
                        : 'border-border text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Active</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetStatus('SUSPENDED')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-1 ${
                      targetStatus === 'SUSPENDED'
                        ? 'bg-amber-500/15 border-amber-500 text-amber-500 shadow-sm'
                        : 'border-border text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <Ban className="h-4 w-4" />
                    <span>Suspended</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetStatus('TERMINATED')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-1 ${
                      targetStatus === 'TERMINATED'
                        ? 'bg-rose-500/15 border-rose-500 text-rose-500 shadow-sm'
                        : 'border-border text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <UserX className="h-4 w-4" />
                    <span>Terminate</span>
                  </button>
                </div>
              </div>

              {/* Status Behavior Info Banner */}
              <div className="p-3 rounded-xl bg-muted/40 border border-border/80 text-xs text-muted-foreground flex gap-2.5">
                <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div>
                  {targetStatus === 'ACTIVE' && (
                    <p>Account will be fully active and permitted to schedule and attend live class sessions.</p>
                  )}
                  {targetStatus === 'SUSPENDED' && (
                    <p><strong className="text-amber-500">Suspended:</strong> User can still log in to the portal, but cannot enter classrooms or start/take any class sessions.</p>
                  )}
                  {targetStatus === 'TERMINATED' && (
                    <p><strong className="text-rose-500">Terminated:</strong> User can log in, but will be locked to a Terminated Screen with an official Appeal Form.</p>
                  )}
                </div>
              </div>

              {/* Reason Input */}
              {targetStatus !== 'ACTIVE' && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Reason for {targetStatus === 'SUSPENDED' ? 'Suspension' : 'Termination'} *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder={`Provide clear justification for ${targetStatus.toLowerCase()} status...`}
                    className="w-full rounded-xl border border-input bg-background/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              )}
            </>
          ) : (
            /* Permanent Delete Mode */
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-500 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Warning: Irreversible Action</span>
                </div>
                <p>
                  Permanently deleting this account will remove all user records, student/teacher profile data, and linked rosters.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Type <span className="text-foreground font-mono font-bold">"{user.name}"</span> to confirm:
                </label>
                <input
                  type="text"
                  required
                  value={deleteConfirmName}
                  onChange={(e) => setDeleteConfirmName(e.target.value)}
                  placeholder={user.name}
                  className="w-full rounded-xl border border-rose-500/50 bg-background/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-border/60">
            {!isDeleteMode ? (
              <button
                type="button"
                onClick={() => setIsDeleteMode(true)}
                className="text-xs text-rose-500 hover:text-rose-600 font-semibold flex items-center gap-1"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Permanent Delete</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsDeleteMode(false)}
                className="text-xs text-muted-foreground hover:text-foreground font-semibold"
              >
                &larr; Back to Status Change
              </button>
            )}

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 rounded-xl text-xs font-semibold hover:bg-muted border border-border text-foreground transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className={`px-5 py-2 rounded-xl text-xs font-bold text-white shadow-md flex items-center gap-1.5 transition-all ${
                  isDeleteMode
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : targetStatus === 'TERMINATED'
                    ? 'bg-red-600 hover:bg-red-700'
                    : targetStatus === 'SUSPENDED'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>
                  {isDeleteMode
                    ? 'Delete Account Permanently'
                    : targetStatus === 'ACTIVE'
                    ? 'Reactivate Account'
                    : `Confirm ${targetStatus === 'SUSPENDED' ? 'Suspension' : 'Termination'}`}
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
