'use client';

import React, { useState } from 'react';
import {
  ShieldAlert, Send, LogOut, CheckCircle2,
  AlertTriangle, Loader2, FileText, Mail
} from 'lucide-react';
import { apiFetch } from '@/utils/apiFetch';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-toastify';

interface TerminatedScreenProps {
  user: any;
}

export default function TerminatedScreen({ user }: TerminatedScreenProps) {
  const { logout } = useAuth();
  const [subject, setSubject] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

  const handleAppealSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast.error('Please write a detailed explanation for your appeal.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch(`${API_URL}/users/appeal`, {
        method: 'POST',
        body: JSON.stringify({
          subject: subject.trim() || 'Account Termination Appeal',
          reason: reason.trim(),
        }),
      });

      if (res.ok) {
        setSubmitted(true);
        toast.success('Your appeal has been submitted successfully.');
      } else {
        const err = await res.json();
        toast.error(err.message || 'Failed to submit appeal');
      }
    } catch (err: any) {
      toast.error(err.message || 'Network error while submitting appeal');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-background flex flex-col items-center justify-center p-4 md:p-6 overflow-y-auto">
      <div className="w-full max-w-2xl bg-card border border-border shadow-2xl rounded-3xl p-6 md:p-8 space-y-6 animate-fadeIn relative">
        
        {/* Top Warning Banner */}
        <div className="flex items-start gap-4 p-5 rounded-2xl bg-rose-500/10 border border-rose-500/30">
          <div className="h-12 w-12 rounded-2xl bg-rose-500/20 text-rose-500 flex items-center justify-center shrink-0">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-display text-rose-500">
              Account Terminated
            </h1>
            <p className="text-sm text-foreground/80 mt-1">
              Your account for <strong className="text-foreground">{user?.name}</strong> ({user?.email}) has been deactivated by administration.
            </p>
            {user?.accountStatusReason && (
              <div className="mt-3 p-3 rounded-xl bg-background/60 border border-rose-500/20 text-xs">
                <span className="font-semibold text-rose-400">Notice from Admin: </span>
                <span className="text-muted-foreground">{user.accountStatusReason}</span>
              </div>
            )}
          </div>
        </div>

        {/* Appeal Form or Success Message */}
        {!submitted ? (
          <form onSubmit={handleAppealSubmit} className="space-y-4">
            <div className="border-b border-border pb-3">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Submit an Appeal to Administration
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                If you believe this termination was made in error or wish to request reinstatement, please submit your statement below.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Request for Account Review / Reinstatement"
                className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                Statement / Explanation *
              </label>
              <textarea
                rows={5}
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Please describe your appeal in detail..."
                className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="flex items-center justify-between pt-3">
              <button
                type="button"
                onClick={logout}
                className="px-4 py-2 rounded-xl text-xs font-semibold hover:bg-muted border border-border text-foreground transition-colors flex items-center gap-1.5"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Log Out</span>
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary/90 shadow-md flex items-center gap-2 transition-all"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                <span>Submit Appeal</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-4">
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
            <div>
              <h3 className="text-lg font-bold text-emerald-500">Appeal Submitted Successfully</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                Your appeal has been sent directly to the administrative team. You will be contacted via email once your case is reviewed.
              </p>
            </div>
            <button
              onClick={logout}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-muted hover:bg-muted/80 text-foreground transition-colors inline-flex items-center gap-1.5"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
