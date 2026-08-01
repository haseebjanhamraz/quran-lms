'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  XCircle, ChevronRight, ChevronLeft, User, Shield, GraduationCap,
  CreditCard, CheckCircle, Loader2, Check, Lock, Globe, UserCheck
} from 'lucide-react';
import ProfilePhotoPicker from './ProfilePhotoPicker';

interface TeacherWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingTeacher?: any | null;
}

const COUNTRIES = [
  { code: 'PK', name: 'Pakistan', currency: 'PKR' },
  { code: 'US', name: 'United States', currency: 'USD' },
  { code: 'UK', name: 'United Kingdom', currency: 'GBP' },
  { code: 'EU', name: 'European Union', currency: 'EUR' },
  { code: 'CA', name: 'Canada', currency: 'CAD' },
  { code: 'SA', name: 'Saudi Arabia', currency: 'SAR' },
  { code: 'AE', name: 'United Arab Emirates', currency: 'AED' },
];

export default function TeacherWizard({
  isOpen,
  onClose,
  onSuccess,
  editingTeacher = null,
}: TeacherWizardProps) {
  const [step, setStep] = useState(1);

  // Step 1: Personal Info & Profile Picture
  const [personalInfo, setPersonalInfo] = useState({
    name: '',
    preferredName: '',
    email: '',
    password: '',
    phone: '',
    cnicOrId: '',
    gender: 'Male',
    dob: '',
    timezone: 'Asia/Karachi',
    profilePicture: '',
  });

  // Step 2: Qualifications & Bio
  const [qualificationsInfo, setQualificationsInfo] = useState({
    specialization: 'Nazira & Tajweed',
    qualification: 'Certified Hafiz & Qari',
    employeeId: '',
    joiningDate: new Date().toISOString().split('T')[0],
    bio: '',
  });

  // Step 3: Salary & Compensation Setup
  const [salaryInfo, setSalaryInfo] = useState({
    payType: 'MONTHLY',
    baseSalary: '35000',
    hourlyRate: '1000',
    country: 'Pakistan',
    currency: 'PKR',
  });

  // Step 4: Guarantor / Emergency Contact Info
  const [guarantorInfo, setGuarantorInfo] = useState({
    g1Name: '',
    g1Phone: '',
    g1Email: '',
    g1Relationship: 'Father',
    g1Cnic: '',
    g1Address: '',
  });

  // Step 5: Admin Permission Controls
  const [canEditProfile, setCanEditProfile] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [completedMessage, setCompletedMessage] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setCompletedMessage(null);
      setStep(1);

      if (editingTeacher) {
        setPersonalInfo({
          name: editingTeacher.name || '',
          preferredName: editingTeacher.preferredName || '',
          email: editingTeacher.email || '',
          password: '',
          phone: editingTeacher.phone || '',
          cnicOrId: editingTeacher.cnicOrId || '',
          gender: editingTeacher.gender || 'Male',
          dob: editingTeacher.dob ? new Date(editingTeacher.dob).toISOString().split('T')[0] : (editingTeacher.dateOfBirth ? new Date(editingTeacher.dateOfBirth).toISOString().split('T')[0] : ''),
          timezone: editingTeacher.timezone || 'Asia/Karachi',
          profilePicture: editingTeacher.profilePicture || editingTeacher.avatar || editingTeacher.teacherProfile?.profile?.profilePicture || editingTeacher.profile?.profilePicture || '',
        });

        setQualificationsInfo({
          specialization: editingTeacher.specialization || 'Nazira & Tajweed',
          qualification: editingTeacher.qualification || 'Certified Hafiz & Qari',
          employeeId: editingTeacher.employeeId || '',
          joiningDate: editingTeacher.joiningDate ? new Date(editingTeacher.joiningDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          bio: editingTeacher.bio || '',
        });

        setSalaryInfo({
          payType: editingTeacher.payType || 'MONTHLY',
          baseSalary: editingTeacher.salary ? String(editingTeacher.salary) : '35000',
          hourlyRate: editingTeacher.hourlyRate ? String(editingTeacher.hourlyRate) : '1000',
          country: editingTeacher.country || 'Pakistan',
          currency: editingTeacher.currency || 'PKR',
        });

        const g1 = editingTeacher.guarantors?.[0] || {};
        setGuarantorInfo({
          g1Name: g1.name || '',
          g1Phone: g1.phone || '',
          g1Email: g1.email || '',
          g1Relationship: g1.relationship || 'Father',
          g1Cnic: g1.cnicOrId || '',
          g1Address: g1.address || '',
        });

        setCanEditProfile(editingTeacher.canEditProfile !== false);
      } else {
        // Reset for new teacher
        setPersonalInfo({
          name: '',
          preferredName: '',
          email: '',
          password: '',
          phone: '',
          cnicOrId: '',
          gender: 'Male',
          dob: '',
          timezone: 'Asia/Karachi',
          profilePicture: '',
        });
        setQualificationsInfo({
          specialization: 'Nazira & Tajweed',
          qualification: 'Certified Hafiz & Qari',
          employeeId: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
          joiningDate: new Date().toISOString().split('T')[0],
          bio: '',
        });
        setSalaryInfo({
          payType: 'MONTHLY',
          baseSalary: '35000',
          hourlyRate: '1000',
          country: 'Pakistan',
          currency: 'PKR',
        });
        setGuarantorInfo({
          g1Name: '',
          g1Phone: '',
          g1Email: '',
          g1Relationship: 'Father',
          g1Cnic: '',
          g1Address: '',
        });
        setCanEditProfile(true);
      }
    }
  }, [isOpen, editingTeacher]);

  if (!isOpen) return null;

  const handleNext = () => {
    setErrorMsg(null);
    if (step === 1) {
      if (!personalInfo.name || !personalInfo.email || (!editingTeacher && !personalInfo.password)) {
        setErrorMsg('Please fill required fields (Name, Email, Password).');
        return;
      }
    }
    setStep((prev) => Math.min(prev + 1, 5));
  };

  const handleBack = () => {
    setErrorMsg(null);
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const teacherPayload: any = {
        name: personalInfo.name,
        preferredName: personalInfo.preferredName,
        email: personalInfo.email,
        role: 'TEACHER',
        gender: personalInfo.gender,
        dob: personalInfo.dob || undefined,
        dateOfBirth: personalInfo.dob || undefined,
        timezone: personalInfo.timezone,
        profilePicture: personalInfo.profilePicture || undefined,
        phone: personalInfo.phone,
        cnicOrId: personalInfo.cnicOrId,
        specialization: qualificationsInfo.specialization,
        qualification: qualificationsInfo.qualification,
        employeeId: qualificationsInfo.employeeId,
        joiningDate: qualificationsInfo.joiningDate,
        bio: qualificationsInfo.bio,
        salary: Number(salaryInfo.baseSalary),
        payType: salaryInfo.payType,
        hourlyRate: Number(salaryInfo.hourlyRate),
        country: salaryInfo.country,
        currency: salaryInfo.currency,
        canEditProfile,
        guarantors: guarantorInfo.g1Name
          ? [
              {
                name: guarantorInfo.g1Name,
                phone: guarantorInfo.g1Phone,
                email: guarantorInfo.g1Email,
                relationship: guarantorInfo.g1Relationship,
                cnicOrId: guarantorInfo.g1Cnic,
                address: guarantorInfo.g1Address,
              },
            ]
          : [],
      };

      if (personalInfo.password) {
        teacherPayload.password = personalInfo.password;
      }

      let teacherData: any = null;

      if (editingTeacher) {
        const targetId = editingTeacher.id || editingTeacher._id;
        const res = await fetch(`${API_URL}/users/${targetId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(teacherPayload),
        });

        teacherData = await res.json();
        if (!res.ok) {
          throw new Error(teacherData.message || 'Failed to update teacher profile.');
        }

        setCompletedMessage(`Teacher ${teacherData.name} has been successfully updated.`);
      } else {
        const res = await fetch(`${API_URL}/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(teacherPayload),
        });

        teacherData = await res.json();
        if (!res.ok) {
          const errMsg = Array.isArray(teacherData.message)
            ? teacherData.message.join(', ')
            : teacherData.message || 'Failed to register teacher.';
          throw new Error(errMsg);
        }

        setCompletedMessage(`Teacher ${teacherData.name} has been successfully registered.`);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during submission.');
    } finally {
      setSubmitting(false);
    }
  };

  const STEPS = [
    { num: 1, label: 'Personal & Photo', icon: User },
    { num: 2, label: 'Qualifications', icon: GraduationCap },
    { num: 3, label: 'Salary & Currency', icon: CreditCard },
    { num: 4, label: 'Guarantor / Contact', icon: Shield },
    { num: 5, label: 'Permissions', icon: Lock },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="glass-panel w-full max-w-2xl rounded-2xl p-6 md:p-8 shadow-2xl relative border border-border my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/40 pb-4 mb-6">
          <div>
            <h2 className="text-2xl font-display font-bold text-foreground">
              {editingTeacher ? 'Update Teacher Account' : 'Teacher Onboarding Wizard'}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {editingTeacher
                ? 'Modify teacher credentials, compensation model, and profile update permissions.'
                : 'Complete the multi-step wizard to register a new teacher.'}
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <XCircle className="h-6 w-6" />
          </button>
        </div>

        {/* Stepper Progress Bar */}
        {!completedMessage && (
          <div className="flex items-center justify-between mb-8 px-2">
            {STEPS.map((s, idx) => {
              const Icon = s.icon;
              const isDone = step > s.num;
              const isCurrent = step === s.num;
              return (
                <React.Fragment key={s.num}>
                  <div className="flex flex-col items-center gap-1.5 cursor-pointer" onClick={() => setStep(s.num)}>
                    <div
                      className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                        isDone
                          ? 'bg-primary text-primary-foreground shadow-md'
                          : isCurrent
                          ? 'bg-brand text-brand-foreground ring-4 ring-brand/20 shadow-lg'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {isDone ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                    </div>
                    <span className={`text-[10px] font-semibold hidden sm:block ${isCurrent ? 'text-brand font-bold' : 'text-muted-foreground'}`}>
                      {s.label}
                    </span>
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 transition-colors ${step > s.num ? 'bg-primary' : 'bg-border'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-6 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        {/* SUCCESS VIEW */}
        {completedMessage ? (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
            <div className="h-20 w-20 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
              <CheckCircle className="h-12 w-12" />
            </div>
            <h3 className="text-2xl font-bold font-display text-foreground">
              {editingTeacher ? 'Teacher Updated!' : 'Teacher Registered!'}
            </h3>
            <p className="text-sm text-muted-foreground max-w-md">{completedMessage}</p>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  onSuccess();
                  onClose();
                }}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-bold shadow-md transition-all"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* STEP 1: Personal Info & Optional Photo */}
            {step === 1 && (
              <div className="space-y-4 animate-fadeIn">
                <h3 className="text-base font-bold font-display text-foreground mb-3 flex items-center gap-2">
                  <User className="h-5 w-5 text-brand" />
                  <span>Step 1: Personal Details &amp; Profile Picture</span>
                </h3>

                <div className="flex flex-col sm:flex-row items-center gap-6 pb-2 border-b border-border/40">
                  <ProfilePhotoPicker
                    currentPhotoUrl={personalInfo.profilePicture}
                    onPhotoSelected={(url) => setPersonalInfo((prev) => ({ ...prev, profilePicture: url }))}
                  />

                  <div className="flex-1 space-y-3 w-full">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground uppercase">Full Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Qari Muneeb"
                        value={personalInfo.name}
                        onChange={(e) => setPersonalInfo({ ...personalInfo, name: e.target.value })}
                        className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-2.5 text-sm outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground uppercase">Preferred Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Muneeb"
                        value={personalInfo.preferredName}
                        onChange={(e) => setPersonalInfo({ ...personalInfo, preferredName: e.target.value })}
                        className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-2.5 text-sm outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="muneeb@lms.com"
                      value={personalInfo.email}
                      onChange={(e) => setPersonalInfo({ ...personalInfo, email: e.target.value })}
                      className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-2.5 text-sm outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">
                      {editingTeacher ? 'Change Password (Optional)' : 'Account Password *'}
                    </label>
                    <input
                      type="password"
                      required={!editingTeacher}
                      placeholder="••••••••"
                      value={personalInfo.password}
                      onChange={(e) => setPersonalInfo({ ...personalInfo, password: e.target.value })}
                      className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-2.5 text-sm outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Phone Number</label>
                    <input
                      type="tel"
                      placeholder="+92 300 1234567"
                      value={personalInfo.phone}
                      onChange={(e) => setPersonalInfo({ ...personalInfo, phone: e.target.value })}
                      className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-2.5 text-sm outline-none font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">CNIC / Passport / National ID</label>
                    <input
                      type="text"
                      placeholder="35202-1234567-1"
                      value={personalInfo.cnicOrId}
                      onChange={(e) => setPersonalInfo({ ...personalInfo, cnicOrId: e.target.value })}
                      className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-2.5 text-sm outline-none font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Gender</label>
                    <select
                      value={personalInfo.gender}
                      onChange={(e) => setPersonalInfo({ ...personalInfo, gender: e.target.value })}
                      className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-2.5 text-sm outline-none"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Timezone</label>
                    <select
                      value={personalInfo.timezone}
                      onChange={(e) => setPersonalInfo({ ...personalInfo, timezone: e.target.value })}
                      className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-2.5 text-sm outline-none"
                    >
                      <option value="Asia/Karachi">PKT (Islamabad)</option>
                      <option value="UTC">UTC</option>
                      <option value="EST">EST (New York)</option>
                      <option value="GMT">GMT (London)</option>
                      <option value="Asia/Riyadh">AST (Riyadh)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Qualifications & Experience */}
            {step === 2 && (
              <div className="space-y-4 animate-fadeIn">
                <h3 className="text-base font-bold font-display text-foreground mb-3 flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-brand" />
                  <span>Step 2: Qualifications &amp; Specialization</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Specialization</label>
                    <input
                      type="text"
                      placeholder="e.g. Nazira & Tajweed"
                      value={qualificationsInfo.specialization}
                      onChange={(e) => setQualificationsInfo({ ...qualificationsInfo, specialization: e.target.value })}
                      className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-2.5 text-sm outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Qualification Degree</label>
                    <input
                      type="text"
                      placeholder="e.g. Certified Hafiz & Qari"
                      value={qualificationsInfo.qualification}
                      onChange={(e) => setQualificationsInfo({ ...qualificationsInfo, qualification: e.target.value })}
                      className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-2.5 text-sm outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Employee ID</label>
                    <input
                      type="text"
                      placeholder="EMP-1001"
                      value={qualificationsInfo.employeeId}
                      onChange={(e) => setQualificationsInfo({ ...qualificationsInfo, employeeId: e.target.value })}
                      className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-2.5 text-sm outline-none font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Joining Date</label>
                    <input
                      type="date"
                      value={qualificationsInfo.joiningDate}
                      onChange={(e) => setQualificationsInfo({ ...qualificationsInfo, joiningDate: e.target.value })}
                      className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-2.5 text-sm outline-none"
                    />
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Teacher Biography</label>
                    <textarea
                      rows={3}
                      placeholder="Short introduction..."
                      value={qualificationsInfo.bio}
                      onChange={(e) => setQualificationsInfo({ ...qualificationsInfo, bio: e.target.value })}
                      className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-2.5 text-sm outline-none resize-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Salary & Compensation Setup */}
            {step === 3 && (
              <div className="space-y-4 animate-fadeIn">
                <h3 className="text-base font-bold font-display text-foreground mb-3 flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-brand" />
                  <span>Step 3: Salary &amp; Multi-Currency Setup</span>
                </h3>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Payment Basis</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setSalaryInfo({ ...salaryInfo, payType: 'MONTHLY' })}
                        className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-colors ${
                          salaryInfo.payType === 'MONTHLY'
                            ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                            : 'bg-background border-border text-muted-foreground'
                        }`}
                      >
                        Monthly Salary
                      </button>
                      <button
                        type="button"
                        onClick={() => setSalaryInfo({ ...salaryInfo, payType: 'HOURLY' })}
                        className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-colors ${
                          salaryInfo.payType === 'HOURLY'
                            ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                            : 'bg-background border-border text-muted-foreground'
                        }`}
                      >
                        Hourly Basis
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground uppercase">Country</label>
                      <select
                        value={salaryInfo.country}
                        onChange={(e) => {
                          const cName = e.target.value;
                          const found = COUNTRIES.find((c) => c.name === cName);
                          setSalaryInfo({
                            ...salaryInfo,
                            country: cName,
                            currency: found ? found.currency : salaryInfo.currency,
                          });
                        }}
                        className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-2.5 text-sm outline-none"
                      >
                        {COUNTRIES.map((c) => (
                          <option key={c.code} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground uppercase">Payout Currency</label>
                      <select
                        value={salaryInfo.currency}
                        onChange={(e) => setSalaryInfo({ ...salaryInfo, currency: e.target.value })}
                        className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-2.5 text-sm outline-none font-mono"
                      >
                        <option value="PKR">PKR (Rs)</option>
                        <option value="USD">USD ($)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="CAD">CAD ($)</option>
                        <option value="SAR">SAR (SR)</option>
                        <option value="AED">AED (Dh)</option>
                      </select>
                    </div>

                    {salaryInfo.payType === 'HOURLY' ? (
                      <div className="space-y-1 md:col-span-2 p-3 rounded-xl bg-purple-500/5 border border-purple-500/20">
                        <label className="text-xs font-semibold text-muted-foreground uppercase">Hourly Rate ({salaryInfo.currency}) *</label>
                        <input
                          type="number"
                          required
                          value={salaryInfo.hourlyRate}
                          onChange={(e) => setSalaryInfo({ ...salaryInfo, hourlyRate: e.target.value })}
                          className="w-full bg-background border border-border rounded-lg p-2.5 text-sm outline-none font-mono font-bold text-purple-500"
                        />
                      </div>
                    ) : (
                      <div className="space-y-1 md:col-span-2">
                        <label className="text-xs font-semibold text-muted-foreground uppercase">Base Monthly Salary ({salaryInfo.currency}) *</label>
                        <input
                          type="number"
                          required
                          value={salaryInfo.baseSalary}
                          onChange={(e) => setSalaryInfo({ ...salaryInfo, baseSalary: e.target.value })}
                          className="w-full bg-background border border-border rounded-lg p-2.5 text-sm outline-none font-mono font-bold"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: Guarantor / Emergency Contact */}
            {step === 4 && (
              <div className="space-y-4 animate-fadeIn">
                <h3 className="text-base font-bold font-display text-foreground mb-3 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-brand" />
                  <span>Step 4: Guarantor / Emergency Contact</span>
                </h3>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Guarantor Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Usman Ali (Father)"
                      value={guarantorInfo.g1Name}
                      onChange={(e) => setGuarantorInfo({ ...guarantorInfo, g1Name: e.target.value })}
                      className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-2.5 text-sm outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground uppercase">Guarantor Phone</label>
                      <input
                        type="tel"
                        placeholder="+92 300 1234567"
                        value={guarantorInfo.g1Phone}
                        onChange={(e) => setGuarantorInfo({ ...guarantorInfo, g1Phone: e.target.value })}
                        className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-2.5 text-sm outline-none font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground uppercase">Relationship</label>
                      <input
                        type="text"
                        placeholder="Father / Uncle / Brother"
                        value={guarantorInfo.g1Relationship}
                        onChange={(e) => setGuarantorInfo({ ...guarantorInfo, g1Relationship: e.target.value })}
                        className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-2.5 text-sm outline-none"
                      />
                    </div>

                    <div className="space-y-1 md:col-span-2">
                      <label className="text-xs font-semibold text-muted-foreground uppercase">Guarantor CNIC / ID Number</label>
                      <input
                        type="text"
                        placeholder="35202-1234567-1"
                        value={guarantorInfo.g1Cnic}
                        onChange={(e) => setGuarantorInfo({ ...guarantorInfo, g1Cnic: e.target.value })}
                        className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-2.5 text-sm outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5: Permissions & Profile Control Toggle */}
            {step === 5 && (
              <div className="space-y-4 animate-fadeIn">
                <h3 className="text-base font-bold font-display text-foreground mb-3 flex items-center gap-2">
                  <Lock className="h-5 w-5 text-brand" />
                  <span>Step 5: Admin Permission Controls</span>
                </h3>

                <div className="p-5 rounded-2xl bg-card border border-border space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-foreground">Allow Teacher to Edit Profile</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        When enabled, the teacher can update their bio, qualification, and contact details from their profile dashboard.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={canEditProfile}
                        onChange={(e) => setCanEditProfile(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  <div className="p-3 rounded-xl bg-muted/40 border border-border text-xs text-muted-foreground flex items-start gap-2">
                    <UserCheck className="h-4 w-4 text-brand shrink-0 mt-0.5" />
                    <span>
                      Status: <strong>{canEditProfile ? 'Allowed' : 'Restricted (Admin Only)'}</strong>. Disabling this setting prevents the teacher from self-editing their profile information.
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Wizard Controls Footer */}
            <div className="flex items-center justify-between pt-6 border-t border-border mt-8">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex items-center gap-1 bg-muted hover:bg-muted/80 text-foreground py-2 px-4 rounded-xl text-sm font-semibold transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Back</span>
                </button>
              ) : (
                <div />
              )}

              {step < 5 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center gap-1 bg-primary hover:bg-primary/90 text-primary-foreground py-2 px-5 rounded-xl text-sm font-bold shadow-md transition-all"
                >
                  <span>Next Step</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 px-6 rounded-xl text-sm font-bold shadow-lg transition-all disabled:opacity-50"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>{editingTeacher ? 'Update Teacher' : 'Register Teacher'}</span>
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
