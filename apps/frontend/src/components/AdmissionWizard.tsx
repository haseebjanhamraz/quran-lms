'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  XCircle, ChevronRight, ChevronLeft, User, Shield, GraduationCap, BookOpen,
  CheckCircle, Loader2, Check, BookUser, CreditCard, Clock, Calendar, VideoOff,
  Sparkles, FileText, Globe, Eye, EyeOff, Copy, RotateCcw
} from 'lucide-react';
import ProfilePhotoPicker from './ProfilePhotoPicker';
import CountrySelect from './CountrySelect';
import CountryPhoneInput from './CountryPhoneInput';
import { apiFetch } from '@/utils/apiFetch';
import { CountryInfo, getAllCurrencies, getAllTimezones } from '@/utils/countries';

const WEEKDAYS = [
  { key: 'Mon', label: 'Monday', short: 'Mon' },
  { key: 'Tue', label: 'Tuesday', short: 'Tue' },
  { key: 'Wed', label: 'Wednesday', short: 'Wed' },
  { key: 'Thu', label: 'Thursday', short: 'Thu' },
  { key: 'Fri', label: 'Friday', short: 'Fri' },
  { key: 'Sat', label: 'Saturday', short: 'Sat' },
  { key: 'Sun', label: 'Sunday', short: 'Sun' },
];

interface TeacherUser {
  id: string;
  _id?: string;
  name: string;
  email: string;
}

interface AdmissionWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingStudent?: any | null;
}

export default function AdmissionWizard({
  isOpen,
  onClose,
  onSuccess,
  editingStudent = null,
}: AdmissionWizardProps) {
  const [step, setStep] = useState(1);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [teachers, setTeachers] = useState<TeacherUser[]>([]);

  // Password view/copy states
  const [showPassword, setShowPassword] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);

  // Step 1: Personal Info & Profile Picture
  const [personalInfo, setPersonalInfo] = useState({
    name: '',
    preferredName: '',
    email: '',
    password: '',
    gender: 'Male',
    dob: '',
    country: 'PK',
    phoneCode: '+92',
    phone: '',
    timezone: 'Asia/Karachi',
    profilePicture: '',
    cameraRestricted: false,
  });

  // Step 2: Guardian Info (Mandatory)
  const [guardianInfo, setGuardianInfo] = useState({
    guardianType: 'Father',
    guardianTypeOther: '',
    guardianName: '',
    guardianPhone: '',
    guardianPhoneCode: '+92',
    guardianEmail: '',
  });

  // Step 3: Enrollment Status, Weekdays & Time Slots
  const [enrollmentStatus, setEnrollmentStatus] = useState<{
    enrollmentDate: string;
    status: string;
    trialStatus: string;
    isDiscontinued: boolean;
    classDuration: number;
    classesPerWeek: number;
    classDays: Array<{ day: string; time: string }>;
    tier: string;
  }>({
    enrollmentDate: new Date().toISOString().split('T')[0],
    status: 'Regular',
    trialStatus: 'N/A',
    isDiscontinued: false,
    classDuration: 60, // 30, 60, 120
    classesPerWeek: 5,
    classDays: [
      { day: 'Mon', time: '16:00' },
      { day: 'Tue', time: '16:00' },
      { day: 'Wed', time: '16:00' },
      { day: 'Thu', time: '16:00' },
      { day: 'Fri', time: '16:00' },
    ],
    tier: 'Beginner',
  });

  // Quick time setting helper state
  const [bulkTime, setBulkTime] = useState('16:00');

  // Step 4: Fees & Billing
  const [feeInfo, setFeeInfo] = useState({
    monthlyFee: '50',
    currency: 'USD',
    feeWaiverPercent: '0',
    customFeeNotes: '',
    isFeeManuallyEdited: false,
  });

  // Step 5: Teacher Assignment & Instructions
  const [assignTeacherLater, setAssignTeacherLater] = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [noteToTeacher, setNoteToTeacher] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [completedMessage, setCompletedMessage] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

  // Available Timezones and Currencies from shared list
  const timezonesList = useMemo(() => getAllTimezones(), []);
  const currenciesList = useMemo(() => getAllCurrencies(), []);

  // Secure Password Generator
  const generateSecurePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*';
    let pass = '';
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPersonalInfo((prev) => ({ ...prev, password: pass }));
    setShowPassword(true);
  };

  const handleCopyPassword = () => {
    if (personalInfo.password) {
      navigator.clipboard.writeText(personalInfo.password);
      setCopiedPassword(true);
      setTimeout(() => setCopiedPassword(false), 2000);
    }
  };

  // Compute recommended monthly fee from duration & days per week
  const calculateDefaultFee = (duration: number, days: number, currency: string) => {
    let rateMultiplier = 10;
    if (duration === 30) rateMultiplier = 6;
    else if (duration === 120) rateMultiplier = 18;

    let baseUSD = Math.max(days, 1) * rateMultiplier;

    if (currency === 'PKR') return String(baseUSD * 280);
    if (currency === 'GBP') return String(Math.round(baseUSD * 0.8));
    if (currency === 'EUR') return String(Math.round(baseUSD * 0.92));
    if (currency === 'SAR' || currency === 'AED') return String(Math.round(baseUSD * 3.75));
    if (currency === 'CAD' || currency === 'AUD') return String(Math.round(baseUSD * 1.4));
    return String(baseUSD);
  };

  // Auto calculate fee when duration, classDays, or currency changes, unless manually overridden
  useEffect(() => {
    if (!feeInfo.isFeeManuallyEdited && !editingStudent) {
      const calculated = calculateDefaultFee(
        enrollmentStatus.classDuration,
        enrollmentStatus.classDays.length,
        feeInfo.currency
      );
      setFeeInfo((prev) => ({ ...prev, monthlyFee: calculated }));
    }
  }, [enrollmentStatus.classDuration, enrollmentStatus.classDays.length, feeInfo.currency, feeInfo.isFeeManuallyEdited, editingStudent]);

  // Handle Country selection change
  const handleCountryChange = (country: CountryInfo) => {
    setPersonalInfo((prev) => ({
      ...prev,
      country: country.code,
      phoneCode: country.phoneCode,
      timezone: country.timezone || prev.timezone,
    }));
    setGuardianInfo((prev) => ({
      ...prev,
      guardianPhoneCode: country.phoneCode,
    }));
    setFeeInfo((prev) => ({
      ...prev,
      currency: country.currency || prev.currency,
    }));
  };

  // Initialize form when opened or editingStudent changes
  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setCompletedMessage(null);
      setStep(1);
      setShowPassword(false);
      setCopiedPassword(false);

      if (editingStudent) {
        setPersonalInfo({
          name: editingStudent.name || '',
          preferredName: editingStudent.preferredName || '',
          email: editingStudent.email || '',
          password: '', // blank unless changing
          gender: editingStudent.gender || 'Male',
          dob: editingStudent.dob ? new Date(editingStudent.dob).toISOString().split('T')[0] : (editingStudent.dateOfBirth ? new Date(editingStudent.dateOfBirth).toISOString().split('T')[0] : ''),
          country: editingStudent.country || 'PK',
          phoneCode: editingStudent.phoneCode || '+92',
          phone: editingStudent.phone || '',
          timezone: editingStudent.timezone || 'Asia/Karachi',
          profilePicture: editingStudent.profilePicture || editingStudent.avatar || '',
          cameraRestricted: Boolean(editingStudent.cameraRestricted),
        });

        setGuardianInfo({
          guardianType: editingStudent.guardianType || 'Father',
          guardianTypeOther: editingStudent.guardianTypeOther || '',
          guardianName: editingStudent.guardianName || '',
          guardianPhone: editingStudent.guardianPhone || '',
          guardianPhoneCode: editingStudent.phoneCode || '+92',
          guardianEmail: editingStudent.guardianEmail || '',
        });

        // Initialize classDays
        let initialDays: Array<{ day: string; time: string }> = [];
        if (Array.isArray(editingStudent.classDays) && editingStudent.classDays.length > 0) {
          initialDays = editingStudent.classDays;
        } else {
          const count = Number(editingStudent.classesPerWeek) || 5;
          const defaultWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
          initialDays = defaultWeek.slice(0, count).map((d) => ({ day: d, time: '16:00' }));
        }

        setEnrollmentStatus({
          enrollmentDate: editingStudent.enrollmentDate ? new Date(editingStudent.enrollmentDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          status: editingStudent.studentStatus || editingStudent.status || 'Regular',
          trialStatus: editingStudent.trialStatus || 'N/A',
          isDiscontinued: Boolean(editingStudent.discontinued || editingStudent.isDiscontinued),
          classDuration: Number(editingStudent.classDuration) || 60,
          classesPerWeek: initialDays.length,
          classDays: initialDays,
          tier: editingStudent.tier || 'Beginner',
        });

        setFeeInfo({
          monthlyFee: editingStudent.monthlyFee ? String(editingStudent.monthlyFee) : (editingStudent.monthlyFeeOverride ? String(editingStudent.monthlyFeeOverride) : '50'),
          currency: editingStudent.currency || 'USD',
          feeWaiverPercent: editingStudent.feeWaiverPercent ? String(editingStudent.feeWaiverPercent) : '0',
          customFeeNotes: editingStudent.customFeeNotes || '',
          isFeeManuallyEdited: true,
        });

        setNoteToTeacher(editingStudent.noteToTeacher || '');

        const teacherId = editingStudent.assignedTeacher?._id || editingStudent.assignedTeacher?.id || editingStudent.assignedTeacher || editingStudent.teacherId || '';
        setSelectedTeacherId(teacherId);
        setAssignTeacherLater(!teacherId);
      } else {
        // Reset for new student
        setPersonalInfo({
          name: '',
          preferredName: '',
          email: '',
          password: '',
          gender: 'Male',
          dob: '',
          country: 'PK',
          phoneCode: '+92',
          phone: '',
          timezone: 'Asia/Karachi',
          profilePicture: '',
          cameraRestricted: false,
        });
        setGuardianInfo({
          guardianType: 'Father',
          guardianTypeOther: '',
          guardianName: '',
          guardianPhone: '',
          guardianPhoneCode: '+92',
          guardianEmail: '',
        });
        setEnrollmentStatus({
          enrollmentDate: new Date().toISOString().split('T')[0],
          status: 'Regular',
          trialStatus: 'N/A',
          isDiscontinued: false,
          classDuration: 60,
          classesPerWeek: 5,
          classDays: [
            { day: 'Mon', time: '16:00' },
            { day: 'Tue', time: '16:00' },
            { day: 'Wed', time: '16:00' },
            { day: 'Thu', time: '16:00' },
            { day: 'Fri', time: '16:00' },
          ],
          tier: 'Beginner',
        });
        setFeeInfo({
          monthlyFee: '50',
          currency: 'USD',
          feeWaiverPercent: '0',
          customFeeNotes: '',
          isFeeManuallyEdited: false,
        });
        setNoteToTeacher('');
        setSelectedTeacherId('');
        setAssignTeacherLater(false);
      }

      fetchTeachers();
    }
  }, [isOpen, editingStudent]);

  const fetchTeachers = async () => {
    setLoadingTeachers(true);
    try {
      const tRes = await apiFetch(`${API_URL}/users/role/TEACHER`);
      if (tRes.ok) {
        const tData = await tRes.json();
        setTeachers(Array.isArray(tData) ? tData : []);
      }
    } catch (_) {}
    setLoadingTeachers(false);
  };

  const calculateAgeAndType = (dob: string) => {
    if (!dob) return { age: '-', type: '-' };
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return { age, type: age < 18 ? 'Child' : 'Adult' };
  };

  const computedAge = useMemo(() => calculateAgeAndType(personalInfo.dob), [personalInfo.dob]);

  // Weekday selection & time helper handlers
  const toggleDay = (dayKey: string) => {
    setEnrollmentStatus((prev) => {
      const exists = prev.classDays.some((d) => d.day === dayKey);
      let updatedDays;
      if (exists) {
        updatedDays = prev.classDays.filter((d) => d.day !== dayKey);
      } else {
        updatedDays = [...prev.classDays, { day: dayKey, time: bulkTime || '16:00' }];
      }
      return {
        ...prev,
        classDays: updatedDays,
        classesPerWeek: updatedDays.length,
      };
    });
  };

  const updateDayTime = (dayKey: string, newTime: string) => {
    setEnrollmentStatus((prev) => ({
      ...prev,
      classDays: prev.classDays.map((d) => (d.day === dayKey ? { ...d, time: newTime } : d)),
    }));
  };

  const applyBulkTimeToAll = () => {
    if (!bulkTime) return;
    setEnrollmentStatus((prev) => ({
      ...prev,
      classDays: prev.classDays.map((d) => ({ ...d, time: bulkTime })),
    }));
  };

  if (!isOpen) return null;

  const handleNext = () => {
    setErrorMsg(null);
    if (step === 1) {
      if (!personalInfo.name || !personalInfo.email || (!editingStudent && !personalInfo.password)) {
        setErrorMsg('Please complete all required fields (Name, Email, Password).');
        return;
      }
    } else if (step === 2) {
      if (!guardianInfo.guardianName.trim()) {
        setErrorMsg('Guardian Full Name is required.');
        return;
      }
      if (guardianInfo.guardianType === 'Other' && !guardianInfo.guardianTypeOther.trim()) {
        setErrorMsg('Please specify the guardian relationship.');
        return;
      }
      if (!guardianInfo.guardianPhone.trim()) {
        setErrorMsg('Guardian Contact Phone is required.');
        return;
      }
    }
    setStep((prev) => Math.min(prev + 1, 5));
  };

  const handleBack = () => {
    setErrorMsg(null);
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const toggleCourseSelection = (courseId: string) => {
    if (selectedCourseIds.includes(courseId)) {
      setSelectedCourseIds(selectedCourseIds.filter((id) => id !== courseId));
    } else {
      setSelectedCourseIds([...selectedCourseIds, courseId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const userPayload: any = {
        name: personalInfo.name,
        preferredName: personalInfo.preferredName,
        email: personalInfo.email,
        role: 'STUDENT',
        gender: personalInfo.gender,
        dob: personalInfo.dob || undefined,
        dateOfBirth: personalInfo.dob || undefined,
        country: personalInfo.country,
        phone: personalInfo.phone,
        phoneCode: personalInfo.phoneCode,
        timezone: personalInfo.timezone,
        profilePicture: personalInfo.profilePicture || undefined,
        cameraRestricted: personalInfo.cameraRestricted,

        // Step 2: Guardian
        guardianType: guardianInfo.guardianType,
        guardianTypeOther: guardianInfo.guardianTypeOther,
        guardianName: guardianInfo.guardianName,
        guardianPhone: guardianInfo.guardianPhone,
        guardianEmail: guardianInfo.guardianEmail,

        // Step 3: Enrollment
        enrollmentDate: enrollmentStatus.enrollmentDate,
        studentStatus: enrollmentStatus.status,
        trialStatus: enrollmentStatus.trialStatus,
        discontinued: enrollmentStatus.isDiscontinued,
        classDuration: enrollmentStatus.classDuration,
        classesPerWeek: enrollmentStatus.classDays.length,
        classDays: enrollmentStatus.classDays,
        tier: enrollmentStatus.tier,

        // Step 4: Fees
        monthlyFee: feeInfo.monthlyFee ? Number(feeInfo.monthlyFee) : 50,
        monthlyFeeOverride: feeInfo.monthlyFee ? Number(feeInfo.monthlyFee) : 50,
        currency: feeInfo.currency || 'USD',
        feeWaiverPercent: feeInfo.feeWaiverPercent ? Number(feeInfo.feeWaiverPercent) : 0,
        customFeeNotes: feeInfo.customFeeNotes,

        // Step 5: Teacher & Note
        assignedTeacher: assignTeacherLater ? null : (selectedTeacherId || undefined),
        noteToTeacher,
      };

      if (personalInfo.password) {
        userPayload.password = personalInfo.password;
      }

      let studentData: any = null;

      if (editingStudent) {
        const targetId = editingStudent.id || editingStudent._id;
        const res = await apiFetch(`${API_URL}/users/${targetId}`, {
          method: 'PUT',
          body: JSON.stringify(userPayload),
        });

        studentData = await res.json();
        if (!res.ok) {
          throw new Error(studentData.message || 'Failed to update student profile.');
        }

        setCompletedMessage(`Student ${studentData.name} has been successfully updated.`);
      } else {
        const res = await apiFetch(`${API_URL}/users`, {
          method: 'POST',
          body: JSON.stringify(userPayload),
        });

        studentData = await res.json();
        if (!res.ok) {
          const errMsg = Array.isArray(studentData.message)
            ? studentData.message.join(', ')
            : studentData.message || 'Failed to admit student.';
          throw new Error(errMsg);
        }

        setCompletedMessage(`Student ${studentData.name} has been successfully admitted.`);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during submission.');
    } finally {
      setSubmitting(false);
    }
  };

  const STEPS = [
    { num: 1, label: 'Personal & Country', icon: User },
    { num: 2, label: 'Guardian Details', icon: Shield },
    { num: 3, label: 'Schedule & Tier', icon: GraduationCap },
    { num: 4, label: 'Fees & Billing', icon: CreditCard },
    { num: 5, label: 'Teacher & Note', icon: BookOpen },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="glass-panel w-full max-w-2xl rounded-2xl p-6 md:p-8 shadow-2xl relative border border-border my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/40 pb-4 mb-6">
          <div>
            <h2 className="text-2xl font-display font-bold text-foreground">
              {editingStudent ? 'Update Student Profile' : 'Student Admission Onboarding'}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {editingStudent
                ? 'Modify profile, guardian info, duration, schedule, and course assignments.'
                : 'Complete the comprehensive admission wizard to onboard a new student.'}
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
              {editingStudent ? 'Student Updated!' : 'Admission Completed!'}
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
            {/* STEP 1: Personal Info & Country Selection */}
            {step === 1 && (
              <div className="space-y-4 animate-fadeIn">
                <h3 className="text-base font-bold font-display text-foreground mb-3 flex items-center gap-2">
                  <User className="h-5 w-5 text-brand" />
                  <span>Step 1: Personal Information & Profile Photo</span>
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
                        value={personalInfo.name}
                        onChange={(e) => setPersonalInfo({ ...personalInfo, name: e.target.value })}
                        placeholder="e.g. Ali Khan"
                        className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-2.5 text-sm outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground uppercase">Preferred Name</label>
                      <input
                        type="text"
                        value={personalInfo.preferredName}
                        onChange={(e) => setPersonalInfo({ ...personalInfo, preferredName: e.target.value })}
                        placeholder="e.g. Ali"
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
                      value={personalInfo.email}
                      onChange={(e) => setPersonalInfo({ ...personalInfo, email: e.target.value })}
                      placeholder="ali@example.com"
                      className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-2.5 text-sm outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-muted-foreground uppercase">
                        {editingStudent ? 'Change Password (Optional)' : 'Account Password *'}
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
                        required={!editingStudent}
                        value={personalInfo.password}
                        onChange={(e) => setPersonalInfo({ ...personalInfo, password: e.target.value })}
                        placeholder="••••••••"
                        className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-2.5 pr-20 text-sm outline-none font-mono"
                      />
                      <div className="absolute right-2 flex items-center gap-1">
                        {personalInfo.password && (
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
                  </div>

                  {/* Country Selector (Auto-selects Timezone, Currency & Dial Code) */}
                  <div className="space-y-1">
                    <CountrySelect
                      label="Student Country *"
                      value={personalInfo.country}
                      onChange={handleCountryChange}
                    />
                  </div>

                  {/* Phone with Country Dial Code */}
                  <div className="space-y-1">
                    <CountryPhoneInput
                      label="Student Phone Number"
                      countryCode={personalInfo.country}
                      phoneCode={personalInfo.phoneCode}
                      value={personalInfo.phone}
                      onChange={(full, code, local) => {
                        setPersonalInfo((prev) => ({ ...prev, phone: full, phoneCode: code }));
                      }}
                      placeholder="300 1234567"
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
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Date of Birth</label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="date"
                        value={personalInfo.dob}
                        onChange={(e) => setPersonalInfo({ ...personalInfo, dob: e.target.value })}
                        className="flex-1 bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-2.5 text-sm outline-none"
                      />
                      {personalInfo.dob && (
                        <div className="bg-muted px-3 py-1.5 rounded-lg border border-border text-xs flex flex-col justify-center shrink-0">
                          <span className="font-bold">{computedAge.age} yrs</span>
                          <span className="text-[10px] text-muted-foreground">{computedAge.type}</span>
                        </div>
                      )}
                    </div>
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

            {/* STEP 2: Guardian Info (ALWAYS REQUIRED) */}
            {step === 2 && (
              <div className="space-y-4 animate-fadeIn">
                <h3 className="text-base font-bold font-display text-foreground mb-1 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-brand" />
                  <span>Step 2: Guardian / Parent Information</span>
                </h3>
                <p className="text-xs text-muted-foreground">Guardian contact details are required for all student accounts.</p>

                <div className="space-y-4 pt-2">
                  {/* Guardian Type Selector */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Guardian Relationship / Type *</label>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                      {['Father', 'Mother', 'Brother', 'Sister', 'Other'].map((type) => {
                        const isSelected = guardianInfo.guardianType === type;
                        return (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setGuardianInfo({ ...guardianInfo, guardianType: type })}
                            className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                              isSelected
                                ? 'bg-primary text-primary-foreground border-primary shadow-sm ring-2 ring-primary/20'
                                : 'bg-background hover:bg-card border-border text-foreground'
                            }`}
                          >
                            {type}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* If Guardian Type is "Other", show custom text input */}
                  {guardianInfo.guardianType === 'Other' && (
                    <div className="space-y-1 animate-fadeIn">
                      <label className="text-xs font-semibold text-muted-foreground uppercase">Specify Other Guardian Relationship *</label>
                      <input
                        type="text"
                        required
                        value={guardianInfo.guardianTypeOther}
                        onChange={(e) => setGuardianInfo({ ...guardianInfo, guardianTypeOther: e.target.value })}
                        placeholder="e.g. Uncle, Grandparent, Legal Guardian"
                        className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-2.5 text-sm outline-none"
                      />
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Guardian Full Name *</label>
                    <input
                      type="text"
                      required
                      value={guardianInfo.guardianName}
                      onChange={(e) => setGuardianInfo({ ...guardianInfo, guardianName: e.target.value })}
                      placeholder={`e.g. Mohammad Khan (${guardianInfo.guardianType})`}
                      className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-2.5 text-sm outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Guardian Contact Phone */}
                    <div className="space-y-1">
                      <CountryPhoneInput
                        label="Guardian Contact Phone *"
                        required
                        countryCode={personalInfo.country}
                        phoneCode={guardianInfo.guardianPhoneCode}
                        value={guardianInfo.guardianPhone}
                        onChange={(full, code, local) => {
                          setGuardianInfo((prev) => ({ ...prev, guardianPhone: full, guardianPhoneCode: code }));
                        }}
                        placeholder="300 1234567"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground uppercase">Guardian Email Address</label>
                      <input
                        type="email"
                        value={guardianInfo.guardianEmail}
                        onChange={(e) => setGuardianInfo({ ...guardianInfo, guardianEmail: e.target.value })}
                        placeholder="parent@example.com"
                        className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-2.5 text-sm outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Class Duration, Days/Week & Student Tier */}
            {step === 3 && (
              <div className="space-y-5 animate-fadeIn">
                <h3 className="text-base font-bold font-display text-foreground mb-1 flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-brand" />
                  <span>Step 3: Class Duration, Schedule & Tier</span>
                </h3>

                {/* 1. Class Duration */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-brand" />
                    <span>Class Duration *</span>
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { duration: 30, label: '30 Minutes', desc: 'Short focus session' },
                      { duration: 60, label: '1 Hour', desc: 'Standard class session' },
                      { duration: 120, label: '2 Hours', desc: 'Extended intensive class' },
                    ].map((d) => {
                      const isSelected = enrollmentStatus.classDuration === d.duration;
                      return (
                        <div
                          key={d.duration}
                          onClick={() => setEnrollmentStatus({ ...enrollmentStatus, classDuration: d.duration })}
                          className={`p-3 rounded-xl border cursor-pointer transition-all text-center ${
                            isSelected
                              ? 'bg-primary/10 border-primary ring-2 ring-primary/20 shadow-sm'
                              : 'bg-card/40 border-border/70 hover:bg-card/80'
                          }`}
                        >
                          <p className={`text-sm font-bold ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                            {d.label}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{d.desc}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Weekdays & Assigned Time Slots */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-brand" />
                      <span>Assigned Class Weekdays *</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-muted-foreground">Default Time:</span>
                      <input
                        type="time"
                        value={bulkTime}
                        onChange={(e) => setBulkTime(e.target.value)}
                        className="bg-background border border-border rounded-lg px-2 py-1 text-xs font-mono font-semibold outline-none"
                      />
                      <button
                        type="button"
                        onClick={applyBulkTimeToAll}
                        className="text-[10px] bg-secondary hover:bg-secondary/80 text-secondary-foreground font-semibold px-2 py-1 rounded-md transition-colors"
                      >
                        Apply to All
                      </button>
                    </div>
                  </div>

                  {/* 7-day Weekday Chips */}
                  <div className="grid grid-cols-7 gap-1.5">
                    {WEEKDAYS.map((w) => {
                      const isSelected = enrollmentStatus.classDays.some((d) => d.day === w.key);
                      return (
                        <button
                          key={w.key}
                          type="button"
                          onClick={() => toggleDay(w.key)}
                          className={`py-2 rounded-xl text-xs font-bold border transition-all text-center ${
                            isSelected
                              ? 'bg-primary text-primary-foreground border-primary shadow-sm ring-2 ring-primary/20'
                              : 'bg-card border-border hover:bg-muted text-foreground'
                          }`}
                        >
                          <div>{w.short}</div>
                          {isSelected && (
                            <div className="text-[9px] font-normal opacity-90">
                              {enrollmentStatus.classDays.find((d) => d.day === w.key)?.time || bulkTime}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Individual Day Time Pickers */}
                  {enrollmentStatus.classDays.length === 0 ? (
                    <p className="text-xs text-amber-500 font-medium">
                      Please select at least one weekday for the student's class schedule.
                    </p>
                  ) : (
                    <div className="rounded-xl border border-border/80 bg-card/40 p-3 space-y-2">
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase">
                        Scheduled Days &amp; Timings ({enrollmentStatus.classDays.length} Days/Week):
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {enrollmentStatus.classDays.map((slot) => {
                          const weekdayObj = WEEKDAYS.find((w) => w.key === slot.day);
                          return (
                            <div
                              key={slot.day}
                              className="flex items-center justify-between gap-2 p-2 rounded-lg bg-background border border-border/80"
                            >
                              <span className="text-xs font-bold text-foreground">
                                {weekdayObj?.label || slot.day}
                              </span>
                              <input
                                type="time"
                                required
                                value={slot.time}
                                onChange={(e) => updateDayTime(slot.day, e.target.value)}
                                className="bg-muted/60 border border-border focus:border-primary rounded px-2 py-1 text-xs font-mono font-bold outline-none"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <p className="text-[11px] text-muted-foreground">
                    Selected: {enrollmentStatus.classDays.length} classes per week ({enrollmentStatus.classDuration} mins each)
                  </p>
                </div>

                {/* 3. Student Tier */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-brand" />
                    <span>Student Tier / Level *</span>
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { tier: 'Beginner', color: 'border-emerald-500/40 hover:bg-emerald-500/5', desc: 'Noorani Qaida & Basics' },
                      { tier: 'Intermediate', color: 'border-blue-500/40 hover:bg-blue-500/5', desc: 'Tajweed & Nazra Recitation' },
                      { tier: 'Advanced', color: 'border-purple-500/40 hover:bg-purple-500/5', desc: 'Hifz & Advanced Qiraat' },
                    ].map((t) => {
                      const isSelected = enrollmentStatus.tier === t.tier;
                      return (
                        <div
                          key={t.tier}
                          onClick={() => setEnrollmentStatus({ ...enrollmentStatus, tier: t.tier })}
                          className={`p-3 rounded-xl border cursor-pointer transition-all text-center ${
                            isSelected
                              ? 'bg-primary text-primary-foreground border-primary shadow-md ring-2 ring-primary/20 font-bold'
                              : `bg-card/40 ${t.color} text-foreground`
                          }`}
                        >
                          <p className="text-sm font-bold">{t.tier}</p>
                          <p className={`text-[10px] mt-0.5 ${isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                            {t.desc}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Enrollment Date & Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-border/40">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Enrollment Date</label>
                    <input
                      type="date"
                      value={enrollmentStatus.enrollmentDate}
                      onChange={(e) => setEnrollmentStatus({ ...enrollmentStatus, enrollmentDate: e.target.value })}
                      className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-2.5 text-sm outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Student Status</label>
                    <select
                      value={enrollmentStatus.status}
                      onChange={(e) => setEnrollmentStatus({ ...enrollmentStatus, status: e.target.value })}
                      className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-2.5 text-sm outline-none"
                    >
                      <option value="Regular">Regular</option>
                      <option value="Trial">Trial</option>
                      <option value="On Hold">On Hold</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: Fees & Billing */}
            {step === 4 && (
              <div className="space-y-4 animate-fadeIn">
                <h3 className="text-base font-bold font-display text-foreground mb-1 flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-brand" />
                  <span>Step 4: Student Individual Fees &amp; Billing Setup</span>
                </h3>
                <p className="text-xs text-muted-foreground">
                  Fee is automatically suggested based on {enrollmentStatus.classDuration} mins class × {enrollmentStatus.classDays.length} days/week.
                </p>

                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground uppercase">Monthly Tuition Fee *</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="e.g. 50"
                        value={feeInfo.monthlyFee}
                        onChange={(e) => setFeeInfo({ ...feeInfo, monthlyFee: e.target.value, isFeeManuallyEdited: true })}
                        className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-2.5 text-sm outline-none font-mono font-bold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground uppercase">Billing Currency</label>
                      <select
                        value={feeInfo.currency}
                        onChange={(e) => setFeeInfo({ ...feeInfo, currency: e.target.value })}
                        className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-2.5 text-sm outline-none font-mono font-bold"
                      >
                        {currenciesList.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground uppercase">Fee Waiver (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={feeInfo.feeWaiverPercent}
                        onChange={(e) => setFeeInfo({ ...feeInfo, feeWaiverPercent: e.target.value })}
                        className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-2.5 text-sm outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Special Fee Notes / Discount Remarks</label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Sibling discount applied, custom payment schedule..."
                      value={feeInfo.customFeeNotes}
                      onChange={(e) => setFeeInfo({ ...feeInfo, customFeeNotes: e.target.value })}
                      className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-2.5 text-sm outline-none resize-none"
                    />
                  </div>

                  {/* Summary Card */}
                  <div className="p-4 rounded-xl bg-card border border-border/80 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold">Net Calculated Monthly Billing</p>
                      <p className="text-xs text-muted-foreground">
                        {enrollmentStatus.classDuration}m class × {enrollmentStatus.classDays.length}d/wk • Base: {feeInfo.monthlyFee || 0} {feeInfo.currency} ({feeInfo.feeWaiverPercent || 0}% Waiver)
                      </p>
                    </div>
                    <span className="text-lg font-mono font-bold text-brand">
                      {Math.max(0, Math.round(Number(feeInfo.monthlyFee || 0) * (1 - Number(feeInfo.feeWaiverPercent || 0) / 100)))} {feeInfo.currency} / mo
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5: Teacher Assignment & Instructions */}
            {step === 5 && (
              <div className="space-y-4 animate-fadeIn">
                <h3 className="text-base font-bold font-display text-foreground mb-1 flex items-center gap-2">
                  <BookUser className="h-5 w-5 text-brand" />
                  <span>Step 5: Teacher Assignment &amp; Instructions</span>
                </h3>

                {/* 1. Teacher Assignment */}
                <div className="rounded-xl bg-card border border-border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-foreground uppercase flex items-center gap-1.5">
                      <User className="h-4 w-4 text-brand" />
                      <span>Assigned Teacher *</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-muted-foreground hover:text-foreground">
                      <input
                        type="checkbox"
                        checked={assignTeacherLater}
                        onChange={(e) => setAssignTeacherLater(e.target.checked)}
                        className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                      />
                      <span>Assign teacher later</span>
                    </label>
                  </div>

                  {!assignTeacherLater && (
                    <div className="space-y-1">
                      {loadingTeachers ? (
                        <div className="py-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          <span>Loading active teachers...</span>
                        </div>
                      ) : (
                        <select
                          required={!assignTeacherLater}
                          value={selectedTeacherId}
                          onChange={(e) => setSelectedTeacherId(e.target.value)}
                          className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-3 text-sm outline-none font-medium"
                        >
                          <option value="">-- Select Teacher --</option>
                          {teachers.map((t) => (
                            <option key={t.id || t._id} value={t.id || t._id}>
                              {t.name} ({t.email})
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  )}
                </div>

                {/* 2. Note to Teacher */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-brand" />
                    <span>Note to Teacher (Instructions / Student Background)</span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Focus on Quran pronunciation and Makharij. Student is at Beginner tier and prefers slower pace..."
                    value={noteToTeacher}
                    onChange={(e) => setNoteToTeacher(e.target.value)}
                    className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-2.5 text-sm outline-none resize-none"
                  />
                </div>

                {/* 3. Admin Camera Restriction Toggle */}
                <div className="p-3.5 rounded-xl bg-card border border-border flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <VideoOff className="h-5 w-5 text-amber-500 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-foreground">Restrict Student Camera</p>
                      <p className="text-[10px] text-muted-foreground">Disables video camera publishing during online classes</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={personalInfo.cameraRestricted}
                      onChange={(e) => setPersonalInfo({ ...personalInfo, cameraRestricted: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
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
                  <span>{editingStudent ? 'Update Student' : 'Admit Student'}</span>
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
