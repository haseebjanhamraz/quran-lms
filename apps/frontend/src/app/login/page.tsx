'use client';

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, Mail, Lock, Loader2, ShieldAlert } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  
  const { login } = useAuth();

  const handleQuickLogin = async (quickEmail: string, quickPass: string) => {
    setEmail(quickEmail);
    setPassword(quickPass);
    setIsSubmitting(true);
    setFormError(null);
    try {
      await login(quickEmail, quickPass);
    } catch (err: any) {
      setFormError(err.message || 'Incorrect email or password.');
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setFormError('Please enter both email and password.');
      return;
    }
    
    setIsSubmitting(true);
    setFormError(null);
    
    try {
      await login(email, password);
    } catch (err: any) {
      setFormError(err.message || 'Incorrect email or password.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-background">
      {/* Dynamic Background Gradients */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-primary/10 blur-[120px] pointer-events-none animate-pulse duration-5000"></div>
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-accent/5 blur-[120px] pointer-events-none animate-pulse duration-5000"></div>

      {/* Outer Card Container */}
      <div className="relative w-full max-w-md mx-4 z-10">
        <div className="glass-card rounded-2xl p-8 shadow-2xl flex flex-col items-center">
          
          {/* Brand Header */}
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="h-16 w-16 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center mb-4 hover:scale-105 transition-transform duration-300">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-display font-bold tracking-tight text-foreground">
              Quran <span className="text-primary">LMS</span>
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              E-Learning &amp; Quality Monitoring Portal
            </p>
          </div>

          {/* Form Area */}
          <form onSubmit={handleSubmit} className="w-full space-y-5">
            {/* Error Notification Alert */}
            {formError && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg p-4 flex items-start gap-3 animate-shake">
                <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground/60">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@academy.com"
                  className="w-full bg-background/50 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg py-3 pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-all duration-300"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Password
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground/60">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-background/50 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg py-3 pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-all duration-300"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg py-3 px-4 shadow-lg hover:shadow-primary/20 transition-all duration-300 flex items-center justify-center gap-2 outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed hover-lift"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          {/* Quick Roles Login Buttons */}
          <div className="mt-8 pt-6 border-t border-border w-full">
            <p className="text-xs text-muted-foreground/80 text-center mb-3">
              Quick Roles Sign-In (Dev Mode):
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleQuickLogin('admin@lms.com', 'adminpassword')}
                disabled={isSubmitting}
                className="border border-blue-500/30 hover:bg-blue-500/10 text-xs font-semibold text-foreground py-2 px-3 rounded-lg transition-colors duration-200 outline-none"
              >
                Admin Portal
              </button>
              <button
                onClick={() => handleQuickLogin('teacher@lms.com', 'teacherpassword')}
                disabled={isSubmitting}
                className="border border-emerald-500/30 hover:bg-emerald-500/10 text-xs font-semibold text-foreground py-2 px-3 rounded-lg transition-colors duration-200 outline-none"
              >
                Teacher Portal
              </button>
              <button
                onClick={() => handleQuickLogin('student@lms.com', 'studentpassword')}
                disabled={isSubmitting}
                className="border border-purple-500/30 hover:bg-purple-500/10 text-xs font-semibold text-foreground py-2 px-3 rounded-lg transition-colors duration-200 outline-none"
              >
                Student Portal
              </button>
              <button
                onClick={() => handleQuickLogin('reviewer@lms.com', 'reviewerpassword')}
                disabled={isSubmitting}
                className="border border-amber-500/30 hover:bg-amber-500/10 text-xs font-semibold text-foreground py-2 px-3 rounded-lg transition-colors duration-200 outline-none"
              >
                Reviewer Portal
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
