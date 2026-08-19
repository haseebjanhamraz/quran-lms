'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  XCircle, ChevronRight, ChevronLeft, User, Shield, GraduationCap,
  CreditCard, CheckCircle, Loader2, Check, Lock, Globe, UserCheck, VideoOff
} from 'lucide-react';
import ProfilePhotoPicker from './ProfilePhotoPicker';
import CountrySelect from './CountrySelect';
import CountryPhoneInput, { PhoneInput } from './CountryPhoneInput';
import { apiFetch } from '@/utils/apiFetch';
import { CountryInfo, getAllCurrencies, getAllTimezones } from '@/utils/countries';

interface TeacherWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingTeacher?: any | null;
}

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
    phoneCode: '+92',
    country: 'PK',
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

    g2Name: '',
    g2Phone: '',
    g2Email: '',
    g2Relationship: 'Brother',
    g2Cnic: '',
    g2Address: '',
  });

  // Step 5: Admin Permission Controls
  const [canEditProfile, setCanEditProfile] = useState(false);
  const [cameraRestricted, setCameraRestricted] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [completedMessage, setCompletedMessage] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

  const timezonesList = useMemo(() => getAllTimezones(), []);
  const currenciesList = useMemo(() => getAllCurrencies(), []);

  const handleCountryChange = (country: CountryInfo) => {
    setPersonalInfo((prev) => ({
      ...prev,
      country: country.code,
      phoneCode: country.phoneCode,
      timezone: country.timezone || prev.timezone,
    }));
    setSalaryInfo((prev) => ({
      ...prev,
      country: country.name,
      currency: country.currency || prev.currency,
    }));
  };

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
          phoneCode: editingTeacher.phoneCode || '+92',
          country: editingTeacher.country || 'PK',
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
        const g2 = editingTeacher.guarantors?.[1] || {};
        setGuarantorInfo({
          g1Name: g1.name || '',
          g1Phone: g1.phone || '',
          g1Email: g1.email || '',
          g1Relationship: g1.relationship || 'Father',
          g1Cnic: g1.cnicOrId || '',
          g1Address: g1.address || '',

          g2Name: g2.name || '',
          g2Phone: g2.phone || '',
          g2Email: g2.email || '',
          g2Relationship: g2.relationship || 'Brother',
          g2Cnic: g2.cnicOrId || '',
          g2Address: g2.address || '',
        });

        setCanEditProfile(Boolean(editingTeacher.canEditProfile ?? true));
        setCameraRestricted(Boolean(editingTeacher.cameraRestricted));
      } else {
        setPersonalInfo({
          name: '',
          preferredName: '',
          email: '',
          password: '',
          phone: '',
          phoneCode: '+92',
          country: 'PK',
          cnicOrId: '',
          gender: 'Male',
          dob: '',
          timezone: 'Asia/Karachi',
          profilePicture: '',
        });

        setQualificationsInfo({
          specialization: 'Nazira & Tajweed',
          qualification: 'Certified Hafiz & Qari',
          employeeId: '',
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

          g2Name: '',
          g2Phone: '',
          g2Email: '',
          g2Relationship: 'Brother',
          g2Cnic: '',
          g2Address: '',
        });

        setCanEditProfile(true);
        setCameraRestricted(false);
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
        phoneCode: personalInfo.phoneCode,
        cnicOrId: personalInfo.cnicOrId,
        country: personalInfo.country,
        specialization: qualificationsInfo.specialization,
        qualification: qualificationsInfo.qualification,
        employeeId: qualificationsInfo.employeeId,
        joiningDate: qualificationsInfo.joiningDate,
        bio: qualificationsInfo.bio,
        salary: Number(salaryInfo.baseSalary),
        payType: salaryInfo.payType,
        hourlyRate: Number(salaryInfo.hourlyRate),
        currency: salaryInfo.currency,
        canEditProfile,
        cameraRestricted,
        guarantors: (() => {
          const list: any[] = [];
          if (guarantorInfo.g1Name) {
            list.push({
              name: guarantorInfo.g1Name,
              phone: guarantorInfo.g1Phone,
              email: guarantorInfo.g1Email || undefined,
              relationship: guarantorInfo.g1Relationship,
              cnicOrId: guarantorInfo.g1Cnic,
              address: guarantorInfo.g1Address || undefined,
            });
          }
          if (guarantorInfo.g2Name) {
            list.push({
              name: guarantorInfo.g2Name,
              phone: guarantorInfo.g2Phone,
              email: guarantorInfo.g2Email || undefined,
              relationship: guarantorInfo.g2Relationship,
              cnicOrId: guarantorInfo.g2Cnic,
              address: guarantorInfo.g2Address || undefined,
            });
          }
          return list;
        })(),
      };

      if (personalInfo.password) {
        teacherPayload.password = personalInfo.password;
      }

      let teacherData: any = null;

      if (editingTeacher) {
        const targetId = editingTeacher.id || editingTeacher._id;
        const res = await apiFetch(`${API_URL}/users/${targetId}`, {
          method: 'PUT',
          body: JSON.stringify(teacherPayload),
        });

        teacherData = await res.json();
        if (!res.ok) {
          throw new Error(teacherData.message || 'Failed to update teacher profile.');
        }

        setCompletedMessage(`Teacher ${teacherData.name} has been successfully updated.`);
      } else {
        const res = await apiFetch(`${API_URL}/users`, {
          method: 'POST',
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
    { num: 1, label: 'Personal & Country', icon: User },
    { num: 2, label: 'Qualifications', icon: GraduationCap },
    { num: 3, label: 'Salary & Currency', icon: CreditCard },
    { num: 4, label: 'Guarantors / Contact', icon: Shield },
    { num: 5, label: 'Permissions & Video', icon: Lock },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="glass-panel w-full max-w-2xl rounded-2xl p-6 md:p-8 shadow-2xl relative border border-border my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/40 pb-4 mb-6">
          <div>
            <h2 className="text-2xl font-display font-bold text-foreground">
              {editingTeacher ? 'Update Teacher Profile' : 'Teacher Admission Onboarding'}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {editingTeacher
                ? 'Update instructor profile, salary structure, guarantors, and permissions.'
                : 'Complete the multi-step onboarding wizard to register a new teacher.'}
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
                  <span>Step 1: Personal Details & Profile Picture</span>
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

                  {/* Country Selector with Flag & Code */}
                  <div className="space-y-1">
                    <CountrySelect
                      label="Country / Region *"
                      value={personalInfo.country}
                      onChange={handleCountryChange}
                    />
                  </div>

                  {/* Phone with dial code */}
                  <div className="space-y-1">
                    <CountryPhoneInput
                      label="Phone Number"
                      countryCode={personalInfo.country}
                      phoneCode={personalInfo.phoneCode}
                      value={personalInfo.phone}
                      onChange={(full, code) => {
                        setPersonalInfo((prev) => ({ ...prev, phone: full, phoneCode: code }));
                      }}
                      placeholder="300 1234567"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">CNIC / Passport / National ID</label>
                    <input
                      type="text"
                      maxLength={15}
                      placeholder="35202-1234567-1"
                      value={personalInfo.cnicOrId}
                      onChange={(e) => {
                        let value = e.target.value.replace(/\D/g, '');
                        if (value.length > 5) {
                          value = value.slice(0, 5) + '-' + value.slice(5, 13);
                        }
                        if (value.length > 13) {
                          value = value.slice(0, 13) + '-' + value.slice(13, 15);
                        }
                        setPersonalInfo({ ...personalInfo, cnicOrId: value });
                      }}
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

                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Timezone (Auto-filled from Country)</label>
                    <select
                      value={personalInfo.timezone}
                      onChange={(e) => setPersonalInfo({ ...personalInfo, timezone: e.target.value })}
                      className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-2.5 text-sm outline-none font-mono"
                    >
                      {timezonesList.map((tz) => (
                        <option key={tz} value={tz}>
                          {tz}
                        </option>
                      ))}
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
                  <span>Step 2: Qualifications & Specialization</span>
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
                  <span>Step 3: Salary & Multi-Currency Setup</span>
                </h3>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Payment Basis</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setSalaryInfo({ ...salaryInfo, payType: 'MONTHLY' })}
                        className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-colors ${salaryInfo.payType === 'MONTHLY'
                          ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                          : 'bg-background border-border text-muted-foreground'
                          }`}
                      >
                        Monthly Salary
                      </button>
                      <button
                        type="button"
                        onClick={() => setSalaryInfo({ ...salaryInfo, payType: 'HOURLY' })}
                        className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-colors ${salaryInfo.payType === 'HOURLY'
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
                      <label className="text-xs font-semibold text-muted-foreground uppercase">Compensation Currency</label>
                      <select
                        value={salaryInfo.currency}
                        onChange={(e) => setSalaryInfo({ ...salaryInfo, currency: e.target.value })}
                        className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-2.5 text-sm outline-none font-mono font-bold"
                      >
                        {currenciesList.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {salaryInfo.payType === 'MONTHLY' ? (
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-muted-foreground uppercase">Monthly Salary Amount *</label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            placeholder="35000"
                            value={salaryInfo.baseSalary}
                            onChange={(e) => setSalaryInfo({ ...salaryInfo, baseSalary: e.target.value })}
                            className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-2.5 text-sm outline-none font-mono font-bold pl-3"
                          />
                          <span className="absolute right-3 top-2.5 text-xs text-muted-foreground font-mono font-semibold">
                            {salaryInfo.currency}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-muted-foreground uppercase">Hourly Rate *</label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            placeholder="1000"
                            value={salaryInfo.hourlyRate}
                            onChange={(e) => setSalaryInfo({ ...salaryInfo, hourlyRate: e.target.value })}
                            className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-2.5 text-sm outline-none font-mono font-bold pl-3"
                          />
                          <span className="absolute right-3 top-2.5 text-xs text-muted-foreground font-mono font-semibold">
                            {salaryInfo.currency} / hr
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: Guarantor & Emergency Contacts */}
            {step === 4 && (
              <div className="space-y-4 animate-fadeIn">
                <h3 className="text-base font-bold font-display text-foreground mb-1 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-brand" />
                  <span>Step 4: Guarantor &amp; Emergency Contacts</span>
                </h3>
                <p className="text-xs text-muted-foreground">Add verified contact information for primary and secondary guarantors.</p>

                {/* PRIMARY GUARANTOR (#1) */}
                <div className="p-4 rounded-xl bg-card/60 border border-border space-y-3">
                  <div className="flex items-center justify-between border-b border-border/40 pb-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                      <Shield className="h-4 w-4" />
                      <span>Primary Guarantor (#1)</span>
                    </h4>
                    <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded">Required</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-muted-foreground uppercase">Guarantor Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Tariq Khan"
                        value={guarantorInfo.g1Name}
                        onChange={(e) => setGuarantorInfo({ ...guarantorInfo, g1Name: e.target.value })}
                        className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-2 text-xs outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-muted-foreground uppercase">Relationship</label>
                      <input
                        type="text"
                        placeholder="e.g. Father / Brother"
                        value={guarantorInfo.g1Relationship}
                        onChange={(e) => setGuarantorInfo({ ...guarantorInfo, g1Relationship: e.target.value })}
                        className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-2 text-xs outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <PhoneInput
                        label="Phone Number"
                        placeholder="300 1234567"
                        countryCode={personalInfo.country}
                        phoneCode={personalInfo.phoneCode}
                        value={guarantorInfo.g1Phone}
                        onChange={(full) => setGuarantorInfo({ ...guarantorInfo, g1Phone: full })}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-muted-foreground uppercase">CNIC / ID Number</label>
                      <input
                        type="text"
                        maxLength={15}
                        placeholder="35202-1234567-1"
                        value={guarantorInfo.g1Cnic}
                        onChange={(e) => {
                          let value = e.target.value.replace(/\D/g, '');
                          if (value.length > 5) value = value.slice(0, 5) + '-' + value.slice(5, 13);
                          if (value.length > 13) value = value.slice(0, 13) + '-' + value.slice(13, 15);
                          setGuarantorInfo({ ...guarantorInfo, g1Cnic: value });
                        }}
                        className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-2 text-xs outline-none font-mono"
                      />
                    </div>

                    <div className="space-y-1 md:col-span-2">
                      <label className="text-[11px] font-semibold text-muted-foreground uppercase">Email Address (Optional)</label>
                      <input
                        type="email"
                        placeholder="usman@example.com"
                        value={guarantorInfo.g1Email}
                        onChange={(e) => setGuarantorInfo({ ...guarantorInfo, g1Email: e.target.value })}
                        className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-2 text-xs outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* SECONDARY GUARANTOR (#2) */}
                <div className="p-4 rounded-xl bg-card/60 border border-border space-y-3">
                  <div className="flex items-center justify-between border-b border-border/40 pb-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-500 flex items-center gap-1.5">
                      <Shield className="h-4 w-4" />
                      <span>Secondary Guarantor (#2)</span>
                    </h4>
                    <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded">Optional</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-muted-foreground uppercase">Guarantor Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Hamza Ali"
                        value={guarantorInfo.g2Name}
                        onChange={(e) => setGuarantorInfo({ ...guarantorInfo, g2Name: e.target.value })}
                        className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-2 text-xs outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-muted-foreground uppercase">Relationship</label>
                      <input
                        type="text"
                        placeholder="e.g. Brother / Uncle"
                        value={guarantorInfo.g2Relationship}
                        onChange={(e) => setGuarantorInfo({ ...guarantorInfo, g2Relationship: e.target.value })}
                        className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-2 text-xs outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <PhoneInput
                        label="Phone Number"
                        placeholder="300 7654321"
                        countryCode={personalInfo.country}
                        phoneCode={personalInfo.phoneCode}
                        value={guarantorInfo.g2Phone}
                        onChange={(full) => setGuarantorInfo({ ...guarantorInfo, g2Phone: full })}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-muted-foreground uppercase">CNIC / ID Number</label>
                      <input
                        type="text"
                        maxLength={15}
                        placeholder="35202-7654321-1"
                        value={guarantorInfo.g2Cnic}
                        onChange={(e) => {
                          let value = e.target.value.replace(/\D/g, '');
                          if (value.length > 5) value = value.slice(0, 5) + '-' + value.slice(5, 13);
                          if (value.length > 13) value = value.slice(0, 13) + '-' + value.slice(13, 15);
                          setGuarantorInfo({ ...guarantorInfo, g2Cnic: value });
                        }}
                        className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-2 text-xs outline-none font-mono"
                      />
                    </div>

                    <div className="space-y-1 md:col-span-2">
                      <label className="text-[11px] font-semibold text-muted-foreground uppercase">Email Address (Optional)</label>
                      <input
                        type="email"
                        placeholder="hamza@example.com"
                        value={guarantorInfo.g2Email}
                        onChange={(e) => setGuarantorInfo({ ...guarantorInfo, g2Email: e.target.value })}
                        className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-2 text-xs outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5: Permissions & Camera Restriction */}
            {step === 5 && (
              <div className="space-y-4 animate-fadeIn">
                <h3 className="text-base font-bold font-display text-foreground mb-3 flex items-center gap-2">
                  <Lock className="h-5 w-5 text-brand" />
                  <span>Step 5: Admin Controls &amp; Camera Permissions</span>
                </h3>

                <div className="space-y-4">
                  {/* Camera Restriction Toggle */}
                  <div className="p-4 rounded-xl bg-card border border-border flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <VideoOff className="h-5 w-5 text-amber-500 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-foreground">Restrict Teacher Camera</p>
                        <p className="text-[10px] text-muted-foreground">Disables video camera publishing during online classes</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={cameraRestricted}
                        onChange={(e) => setCameraRestricted(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                  </div>

                  {/* Profile Edit Permission */}
                  <div className="p-4 rounded-xl bg-card border border-border flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-foreground">Allow Teacher to Edit Profile</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        When enabled, the teacher can update their bio and qualification.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={canEditProfile}
                        onChange={(e) => setCanEditProfile(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                    </label>
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
