'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  XCircle, ChevronRight, ChevronLeft, User, Shield, GraduationCap, BookOpen,
  CheckCircle, Loader2, Upload, Calendar, Clock, Phone, Mail, Check
} from 'lucide-react';

interface AdmissionWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface CourseItem {
  id: string;
  title: string;
  type: string;
  teacher?: { name: string };
}

export default function AdmissionWizard({ isOpen, onClose, onSuccess }: AdmissionWizardProps) {
  const [step, setStep] = useState(1);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [availableCourses, setAvailableCourses] = useState<CourseItem[]>([]);

  // Step 1: Personal Info
  const [personalInfo, setPersonalInfo] = useState({
    name: '',
    preferredName: '',
    email: '',
    password: '',
    gender: 'Male',
    dob: '',
    timezone: 'UTC',
    avatar: '',
  });

  // Step 2: Guardian Info
  const [guardianInfo, setGuardianInfo] = useState({
    guardianName: '',
    guardianPhone: '',
    guardianEmail: '',
  });

  // Step 3: Enrollment Status
  const [enrollmentStatus, setEnrollmentStatus] = useState({
    enrollmentDate: new Date().toISOString().split('T')[0],
    status: 'Regular',
    trialStatus: 'N/A',
    isDiscontinued: false,
  });

  // Step 4: Selected Courses
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [createdStudent, setCreatedStudent] = useState<any>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

  // Fetch courses on mount or step 4
  useEffect(() => {
    if (isOpen) {
      async function getCourses() {
        setLoadingCourses(true);
        try {
          const res = await fetch(`${API_URL}/courses`, { credentials: 'include' });
          if (res.ok) {
            const data = await res.json();
            setAvailableCourses(Array.isArray(data) ? data : []);
          }
        } catch (_) { }
        setLoadingCourses(false);
      }
      getCourses();
    }
  }, [isOpen, API_URL]);

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

  if (!isOpen) return null;

  const handleNext = () => {
    setErrorMsg(null);
    if (step === 1) {
      if (!personalInfo.name || !personalInfo.email || !personalInfo.password) {
        setErrorMsg('Please complete all required fields (Name, Email, Password).');
        return;
      }
    }
    setStep((prev) => Math.min(prev + 1, 4));
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
      // 1. Create Student User
      const userPayload = {
        name: personalInfo.name,
        preferredName: personalInfo.preferredName,
        email: personalInfo.email,
        password: personalInfo.password,
        role: 'STUDENT',
        gender: personalInfo.gender,
        dob: personalInfo.dob,
        timezone: personalInfo.timezone,
        enrollmentDate: enrollmentStatus.enrollmentDate,
        studentStatus: enrollmentStatus.status,
        trialStatus: enrollmentStatus.trialStatus,
        discontinued: enrollmentStatus.isDiscontinued,
        guardianName: guardianInfo.guardianName,
        guardianPhone: guardianInfo.guardianPhone,
        guardianEmail: guardianInfo.guardianEmail,
      };

      const res = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(userPayload),
      });

      const studentData = await res.json();
      if (!res.ok) {
        throw new Error(studentData.message || 'Failed to admit student.');
      }

      // 2. Enroll student in selected courses
      const studentId = studentData.id || studentData._id;
      if (selectedCourseIds.length > 0 && studentId) {
        for (const cId of selectedCourseIds) {
          try {
            await fetch(`${API_URL}/enrollments`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ studentId, courseId: cId }),
            });
          } catch (_) { }
        }
      }

      setCreatedStudent(studentData);
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during admission.');
    } finally {
      setSubmitting(false);
    }
  };

  const STEPS = [
    { num: 1, label: 'Personal Info', icon: User },
    { num: 2, label: 'Guardian / Parent', icon: Shield },
    { num: 3, label: 'Enrollment Status', icon: GraduationCap },
    { num: 4, label: 'Course Assignment', icon: BookOpen },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="glass-panel w-full max-w-2xl rounded-2xl p-6 md:p-8 shadow-2xl relative border border-border my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/40 pb-4 mb-6">
          <div>
            <h2 className="text-2xl font-display font-bold text-foreground">Student Admission Onboarding</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Complete the multi-step admission wizard to admit a new student.</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <XCircle className="h-6 w-6" />
          </button>
        </div>

        {/* Stepper Progress Bar */}
        {!createdStudent && (
          <div className="flex items-center justify-between mb-8 px-2">
            {STEPS.map((s, idx) => {
              const Icon = s.icon;
              const isDone = step > s.num;
              const isCurrent = step === s.num;
              return (
                <React.Fragment key={s.num}>
                  <div className="flex flex-col items-center gap-1.5">
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
        {createdStudent ? (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
            <div className="h-20 w-20 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
              <CheckCircle className="h-12 w-12" />
            </div>
            <h3 className="text-2xl font-bold font-display text-foreground">Admission Completed!</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Student <strong className="text-foreground">{createdStudent.name}</strong> has been successfully admitted and registered into the platform.
            </p>
            {createdStudent.studentId && (
              <div className="bg-card px-4 py-2 rounded-xl border border-border font-mono text-sm font-bold text-primary">
                Student ID: STU-{createdStudent.studentId}
              </div>
            )}
            <div className="flex gap-3 pt-4">
              <button
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
            {/* STEP 1: Personal Info */}
            {step === 1 && (
              <div className="space-y-4 animate-fadeIn">
                <h3 className="text-base font-bold font-display text-foreground mb-3 flex items-center gap-2">
                  <User className="h-5 w-5 text-brand" />
                  <span>Step 1: Personal Information</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Account Password *</label>
                    <input
                      type="password"
                      required
                      value={personalInfo.password}
                      onChange={(e) => setPersonalInfo({ ...personalInfo, password: e.target.value })}
                      placeholder="••••••••"
                      className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-2.5 text-sm outline-none"
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
                        <div className="bg-muted px-3 py-1.5 rounded-lg border border-border text-xs flex flex-col justify-center">
                          <span className="font-bold">{computedAge.age} yrs</span>
                          <span className="text-[10px] text-muted-foreground">{computedAge.type}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Timezone</label>
                    <select
                      value={personalInfo.timezone}
                      onChange={(e) => setPersonalInfo({ ...personalInfo, timezone: e.target.value })}
                      className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-2.5 text-sm outline-none"
                    >
                      <option value="UTC">UTC</option>
                      <option value="EST">EST (New York)</option>
                      <option value="CST">CST (Chicago)</option>
                      <option value="PST">PST (Los Angeles)</option>
                      <option value="GMT">GMT (London)</option>
                      <option value="Asia/Karachi">PKT (Islamabad)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Guardian Info */}
            {step === 2 && (
              <div className="space-y-4 animate-fadeIn">
                <h3 className="text-base font-bold font-display text-foreground mb-3 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-brand" />
                  <span>Step 2: Guardian / Parent Information</span>
                </h3>
                <p className="text-xs text-muted-foreground">Required for minor students under 18 years of age.</p>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Guardian Full Name</label>
                    <input
                      type="text"
                      value={guardianInfo.guardianName}
                      onChange={(e) => setGuardianInfo({ ...guardianInfo, guardianName: e.target.value })}
                      placeholder="e.g. Mohammad Khan (Father)"
                      className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-2.5 text-sm outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground uppercase">Guardian Contact Phone</label>
                      <input
                        type="tel"
                        value={guardianInfo.guardianPhone}
                        onChange={(e) => setGuardianInfo({ ...guardianInfo, guardianPhone: e.target.value })}
                        placeholder="+1 555-0192"
                        className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-2.5 text-sm outline-none"
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

            {/* STEP 3: Enrollment Details */}
            {step === 3 && (
              <div className="space-y-4 animate-fadeIn">
                <h3 className="text-base font-bold font-display text-foreground mb-3 flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-brand" />
                  <span>Step 3: Enrollment Status & Classification</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Trial Status</label>
                    <select
                      value={enrollmentStatus.trialStatus}
                      onChange={(e) => setEnrollmentStatus({ ...enrollmentStatus, trialStatus: e.target.value })}
                      className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-2.5 text-sm outline-none"
                    >
                      <option value="N/A">N/A</option>
                      <option value="Active">Active</option>
                      <option value="Completed">Completed</option>
                      <option value="Failed">Failed</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-2 mt-7">
                    <input
                      type="checkbox"
                      id="wizardDiscontinued"
                      checked={enrollmentStatus.isDiscontinued}
                      onChange={(e) => setEnrollmentStatus({ ...enrollmentStatus, isDiscontinued: e.target.checked })}
                      className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                    />
                    <label htmlFor="wizardDiscontinued" className="text-sm font-semibold text-foreground">
                      Discontinued (Inactive)
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: Course Assignment */}
            {step === 4 && (
              <div className="space-y-4 animate-fadeIn">
                <h3 className="text-base font-bold font-display text-foreground mb-3 flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-brand" />
                  <span>Step 4: Initial Course Assignment</span>
                </h3>
                <p className="text-xs text-muted-foreground">Select one or more courses to assign the student upon admission.</p>

                {loadingCourses ? (
                  <div className="py-8 flex justify-center"><Loader2 className="animate-spin text-primary" size={24} /></div>
                ) : availableCourses.length === 0 ? (
                  <div className="p-4 rounded-xl bg-card border border-border text-center text-xs text-muted-foreground">
                    No active courses found. You can complete admission now and assign courses later.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[260px] overflow-y-auto pr-1">
                    {availableCourses.map((course) => {
                      const isSelected = selectedCourseIds.includes(course.id);
                      return (
                        <div
                          key={course.id}
                          onClick={() => toggleCourseSelection(course.id)}
                          className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-3 ${
                            isSelected
                              ? 'bg-primary/10 border-primary shadow-sm'
                              : 'bg-card/40 border-border/60 hover:bg-card/80'
                          }`}
                        >
                          <div>
                            <p className="text-sm font-bold text-foreground">{course.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{course.type}</p>
                            {course.teacher && (
                              <p className="text-[10px] text-brand font-semibold mt-1">Instructor: {course.teacher.name}</p>
                            )}
                          </div>
                          <div
                            className={`h-5 w-5 rounded-md flex items-center justify-center border ${
                              isSelected ? 'bg-primary text-primary-foreground border-primary' : 'border-border bg-background'
                            }`}
                          >
                            {isSelected && <Check className="h-3.5 w-3.5" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
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
              ) : <div />}

              {step < 4 ? (
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
                  <span>Admit Student</span>
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
