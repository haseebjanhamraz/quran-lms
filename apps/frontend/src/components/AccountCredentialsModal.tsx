'use client';

import React, { useState, useEffect } from 'react';
import {
  KeyRound, Mail, Lock, User, Sparkles, Copy, Check, Eye, EyeOff,
  AlertCircle, CheckCircle2, X, Loader2, Shield
} from 'lucide-react';
import { apiFetch } from '@/utils/apiFetch';
import { toast } from 'react-toastify';

interface AccountCredentialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    _id?: string;
    name: string;
    preferredName?: string;
    email: string;
    role: string;
    profilePicture?: string;
    avatar?: string;
  } | null;
  onCredentialsUpdated: () => void;
}

export default function AccountCredentialsModal({
  isOpen,
  onClose,
  user,
  onCredentialsUpdated,
}: AccountCredentialsModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

  useEffect(() => {
    if (isOpen && user) {
      setEmail(user.email || '');
      setPassword('');
      setShowPassword(false);
      setCopiedPassword(false);
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [isOpen, user]);

  if (!isOpen || !user) return null;

  const userId = user.id || user._id;

  const generateSecurePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*';
    let pass = '';
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(pass);
    setShowPassword(true);
  };

  const handleCopyPassword = () => {
    if (password) {
      navigator.clipboard.writeText(password);
      setCopiedPassword(true);
      setTimeout(() => setCopiedPassword(false), 2000);
    }
  };

  const getFullImageUrl = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:5000';
    return `${baseUrl}${url}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const trimmedEmail = email.trim().toLowerCase();
    const hasEmailChanged = trimmedEmail !== (user.email || '').toLowerCase();
    const hasPasswordChanged = password.trim().length > 0;

    if (!hasEmailChanged && !hasPasswordChanged) {
      setErrorMsg('No changes detected. Please update the email or enter a new password.');
      return;
    }

    if (hasEmailChanged && !trimmedEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setErrorMsg('Please provide a valid email address.');
      return;
    }

    if (hasPasswordChanged && password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      const payload: { email?: string; password?: string } = {};
      if (hasEmailChanged) payload.email = trimmedEmail;
      if (hasPasswordChanged) payload.password = password;

      const res = await apiFetch(`${API_URL}/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to update credentials.');
      }

      toast.success('Account credentials updated successfully!');
      setSuccessMsg('Account credentials have been updated.');
      onCredentialsUpdated();
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while updating credentials.');
    } finally {
      setLoading(false);
    }
  };

  const photo = user.profilePicture || user.avatar;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-background/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg rounded-3xl border border-border shadow-2xl bg-card overflow-hidden relative flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-border/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-display text-foreground">Change Credentials</h2>
              <p className="text-xs text-muted-foreground">Update login email address or reset password.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* User Preview Card */}
          <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-muted/40 border border-border/70">
            <div className="w-11 h-11 rounded-full bg-muted border border-border flex items-center justify-center overflow-hidden shrink-0">
              {photo ? (
                <img src={getFullImageUrl(photo)} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <User className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-foreground text-sm truncate">
                  {user.name} {user.preferredName && `(${user.preferredName})`}
                </p>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand/10 text-brand border border-brand/20">
                  {user.role}
                </span>
              </div>
              <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                <Mail className="h-3 w-3 shrink-0" />
                <span className="font-mono">{user.email}</span>
              </p>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form id="credentials-form" onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-brand" />
                <span>Login Email Address</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full bg-background border border-border focus:border-brand focus:ring-2 focus:ring-brand/20 rounded-xl p-3 text-sm font-medium outline-none transition-all"
              />
              <p className="text-[11px] text-muted-foreground">
                This email is used by the user to sign into their portal.
              </p>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-amber-500" />
                  <span>New Password (Optional)</span>
                </label>
                <button
                  type="button"
                  onClick={generateSecurePassword}
                  className="text-[11px] text-brand hover:text-brand/80 font-bold flex items-center gap-1 transition-colors"
                >
                  <Sparkles className="h-3 w-3" />
                  <span>Auto Generate</span>
                </button>
              </div>
              <div className="relative flex items-center">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password or leave blank to keep unchanged"
                  className="w-full bg-background border border-border focus:border-brand focus:ring-2 focus:ring-brand/20 rounded-xl p-3 pr-20 text-sm font-mono font-medium outline-none transition-all"
                />
                <div className="absolute right-2 flex items-center gap-1">
                  {password && (
                    <button
                      type="button"
                      onClick={handleCopyPassword}
                      title={copiedPassword ? 'Copied to Clipboard!' : 'Copy Password'}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                    >
                      {copiedPassword ? (
                        <Check className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? 'Hide Password' : 'View Password'}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Leave empty if you do not wish to change the current password.
              </p>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-border/60 bg-muted/20 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="credentials-form"
            disabled={loading}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-5 py-2.5 rounded-xl text-xs shadow-md transition-all disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Shield className="h-4 w-4" />
                <span>Update Credentials</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
