'use client';

import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { Shield, Key, MessageSquare, Clock, Info, Loader2, CheckCircle2 } from 'lucide-react';
import { apiFetch } from '@/utils/apiFetch';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function StudentAccount() {
  const { user } = useAuth();
  
  const studentData = {
    studentId: user?.studentId || 'STU-10293',
    name: user?.name || 'Student Name',
    dob: user?.dateOfBirth || user?.dob || '2012-05-14',
    age: 12,
    studentType: 'Child',
    timezone: user?.timezone || 'EST (New York)',
    enrollmentDate: user?.enrollmentDate ? new Date(user.enrollmentDate).toLocaleDateString() : '2023-01-10'
  };

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  
  const [feedbackCategory, setFeedbackCategory] = useState('Technical Issue');
  const [feedbackSubject, setFeedbackSubject] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  const [feedbackHistory, setFeedbackHistory] = useState([
    { id: 'FB-001', date: '2023-10-25', category: 'Technical Issue', subject: 'Audio not working', status: 'Resolved', adminResponse: 'We have tested the portal and found a mic permissions issue. Please allow mic in your browser.' }
  ]);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long.');
      return;
    }
    if (confirmPassword && newPassword !== confirmPassword) {
      toast.error('New password and confirmation do not match.');
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await apiFetch(`${API_URL}/users/change-password`, {
        method: 'PATCH',
        body: JSON.stringify({
          oldPassword: currentPassword,
          newPassword: newPassword,
        }),
      });

      if (res.ok) {
        toast.success('Password updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        const err = await res.json();
        toast.error(err.message || 'Failed to update password');
      }
    } catch (err: any) {
      toast.error(err.message || 'Network error updating password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    const newFb = {
      id: `FB-${Math.floor(Math.random() * 1000)}`,
      date: new Date().toISOString().split('T')[0],
      category: feedbackCategory,
      subject: feedbackSubject,
      status: 'Open',
      adminResponse: ''
    };
    setFeedbackHistory([newFb, ...feedbackHistory]);
    setFeedbackSubject('');
    setFeedbackMessage('');
    toast.success('Feedback submitted successfully!');
  };

  return (
    <div className="relative mx-auto max-w-5xl space-y-8 p-4 md:p-8">
      <div>
        <h1 className="text-3xl font-display font-bold">Account Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your profile, security, and submit feedback.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Column: Read-Only Profile */}
        <div className="md:col-span-1 space-y-6">
          <div className="glass-panel p-6 rounded-2xl shadow-sm">
            <h2 className="text-lg font-bold font-display flex items-center gap-2 mb-4">
              <Shield className="h-5 w-5 text-brand" /> Profile Overview
            </h2>
            
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Student ID</p>
                <p className="font-mono text-sm font-semibold">{studentData.studentId}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Name</p>
                <p className="text-sm font-semibold">{studentData.name}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">DOB / Age</p>
                  <p className="text-sm font-semibold">{studentData.dob} <span className="text-muted-foreground">({studentData.age}y)</span></p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Type</p>
                  <p className="text-sm font-semibold">{studentData.studentType}</p>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Timezone</p>
                <p className="text-sm font-semibold">{studentData.timezone}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Enrollment Date</p>
                <p className="text-sm font-semibold">{studentData.enrollmentDate}</p>
              </div>
            </div>

            <div className="mt-6 bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-500/90 font-medium leading-relaxed">Profile details are managed by Admin. Please submit a request if you need to update them.</p>
            </div>
          </div>
        </div>

        {/* Right Column: Security & Feedback */}
        <div className="md:col-span-2 space-y-8">
          
          {/* Change Password */}
          <div className="glass-panel p-6 rounded-2xl shadow-sm">
            <h2 className="text-lg font-bold font-display flex items-center gap-2 mb-4">
              <Key className="h-5 w-5 text-brand" /> Security
            </h2>
            <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Current Password</label>
                <input 
                  type="password" required 
                  value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-2.5 text-sm outline-none" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">New Password</label>
                <input 
                  type="password" required 
                  minLength={6}
                  value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-2.5 text-sm outline-none" 
                  placeholder="At least 6 characters"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Confirm New Password</label>
                <input 
                  type="password" required 
                  minLength={6}
                  value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-2.5 text-sm outline-none" 
                  placeholder="Re-type new password"
                />
              </div>
              <button
                type="submit"
                disabled={passwordLoading}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-5 py-2.5 rounded-xl text-xs shadow-md transition-all flex items-center gap-2"
              >
                {passwordLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>{passwordLoading ? 'Updating Password...' : 'Save & Update Password'}</span>
              </button>
            </form>
          </div>

          {/* Feedback Form */}
          <div className="glass-panel p-6 rounded-2xl shadow-sm">
            <h2 className="text-lg font-bold font-display flex items-center gap-2 mb-4">
              <MessageSquare className="h-5 w-5 text-brand" /> Report Issue / Parent Feedback
            </h2>
            <form onSubmit={handleSubmitFeedback} className="space-y-4 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Category</label>
                  <select 
                    value={feedbackCategory} onChange={(e) => setFeedbackCategory(e.target.value)}
                    className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-2.5 text-sm outline-none"
                  >
                    <option value="Technical Issue">Technical Issue</option>
                    <option value="Complaint">Complaint</option>
                    <option value="Suggestion">Suggestion</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Subject</label>
                  <input 
                    type="text" required 
                    value={feedbackSubject} onChange={(e) => setFeedbackSubject(e.target.value)}
                    className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-2.5 text-sm outline-none" 
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Message</label>
                <textarea 
                  required 
                  value={feedbackMessage} onChange={(e) => setFeedbackMessage(e.target.value)}
                  className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-3 text-sm outline-none min-h-[100px] resize-none" 
                  placeholder="Describe your issue or feedback in detail..."
                />
              </div>
              <button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-4 py-2 rounded-lg text-sm shadow-md transition-all">
                Submit Feedback
              </button>
            </form>

            {/* Feedback History */}
            <div className="border-t border-border pt-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Past Submissions</h3>
              <div className="space-y-4">
                {feedbackHistory.map(fb => (
                  <div key={fb.id} className="bg-background border border-border rounded-xl p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-sm">{fb.subject} <span className="text-xs text-muted-foreground ml-2">({fb.category})</span></p>
                        <p className="text-xs text-muted-foreground mt-0.5"><Clock className="inline h-3 w-3 mr-1" />{fb.date}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${
                        fb.status === 'Resolved' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                      }`}>
                        {fb.status}
                      </span>
                    </div>
                    {fb.adminResponse && (
                      <div className="mt-3 bg-card p-3 rounded-lg border border-border">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Admin Response</p>
                        <p className="text-xs">{fb.adminResponse}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
