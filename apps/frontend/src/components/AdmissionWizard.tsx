'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  XCircle, ChevronRight, ChevronLeft, User, Shield, GraduationCap, BookOpen,
  CheckCircle, Loader2, Check, BookUser, CreditCard
} from 'lucide-react';
import ProfilePhotoPicker from './ProfilePhotoPicker';

interface CourseItem {
  id: string;
  _id?: string;
  title: string;
  type: string;
  teacherId?: string;
  teacher?: { id?: string; name: string };
}

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
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [availableCourses, setAvailableCourses] = useState<CourseItem[]>([]);
  const [teachers, setTeachers] = useState<TeacherUser[]>([]);

  // Step 1: Personal Info & Profile Picture
  const [personalInfo, setPersonalInfo] = useState({
    name: '',
    preferredName: '',
    email: '',
    password: '',
    gender: 'Male',
    dob: '',
    timezone: 'UTC',
    profilePicture: '',
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

  // Step 4: Fees & Billing
  const [feeInfo, setFeeInfo] = useState({
    feeStructureId: '',
    monthlyFeeOverride: '',
    feeWaiverPercent: '0',
  });
  const [feeStructures, setFeeStructures] = useState<any[]>([]);

  // Step 5: Teacher & Course Assignment
  const [assignTeacherLater, setAssignTeacherLater] = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [completedMessage, setCompletedMessage] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

  // Initialize form when opened or editingStudent changes
  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setCompletedMessage(null);
      setStep(1);

      if (editingStudent) {
        setPersonalInfo({
          name: editingStudent.name || '',
          preferredName: editingStudent.preferredName || '',
          email: editingStudent.email || '',
          password: '', // blank unless changing
          gender: editingStudent.gender || 'Male',
          dob: editingStudent.dob ? new Date(editingStudent.dob).toISOString().split('T')[0] : (editingStudent.dateOfBirth ? new Date(editingStudent.dateOfBirth).toISOString().split('T')[0] : ''),
          timezone: editingStudent.timezone || 'UTC',
          profilePicture: editingStudent.profilePicture || editingStudent.avatar || '',
        });

        setGuardianInfo({
          guardianName: editingStudent.guardianName || '',
          guardianPhone: editingStudent.guardianPhone || '',
          guardianEmail: editingStudent.guardianEmail || '',
        });

        setEnrollmentStatus({
          enrollmentDate: editingStudent.enrollmentDate ? new Date(editingStudent.enrollmentDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          status: editingStudent.studentStatus || editingStudent.status || 'Regular',
          trialStatus: editingStudent.trialStatus || 'N/A',
          isDiscontinued: Boolean(editingStudent.discontinued || editingStudent.isDiscontinued),
        });

        setFeeInfo({
          feeStructureId: editingStudent.feeStructureId || '',
          monthlyFeeOverride: editingStudent.monthlyFeeOverride ? String(editingStudent.monthlyFeeOverride) : '',
          feeWaiverPercent: editingStudent.feeWaiverPercent ? String(editingStudent.feeWaiverPercent) : '0',
        });

        // Fetch student's existing enrollments
        fetchStudentEnrollments(editingStudent.id || editingStudent._id);
      } else {
        // Reset for new student
        setPersonalInfo({
          name: '',
          preferredName: '',
          email: '',
          password: '',
          gender: 'Male',
          dob: '',
          timezone: 'UTC',
          profilePicture: '',
        });
        setGuardianInfo({
          guardianName: '',
          guardianPhone: '',
          guardianEmail: '',
        });
        setEnrollmentStatus({
          enrollmentDate: new Date().toISOString().split('T')[0],
          status: 'Regular',
          trialStatus: 'N/A',
          isDiscontinued: false,
        });
        setFeeInfo({
          feeStructureId: '',
          monthlyFeeOverride: '',
          feeWaiverPercent: '0',
        });
        setSelectedCourseIds([]);
        setSelectedTeacherId('');
        setAssignTeacherLater(false);
      }

      fetchCoursesAndTeachers();
      fetchFeeStructures();
    }
  }, [isOpen, editingStudent]);

  const fetchFeeStructures = async () => {
    try {
      const res = await fetch(`${API_URL}/fees/structures`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setFeeStructures(Array.isArray(data) ? data : []);
      }
    } catch (_) {}
  };

  const fetchStudentEnrollments = async (studentId: string) => {
    try {
      const res = await fetch(`${API_URL}/enrollments/student/${studentId}`, { credentials: 'include' });
      if (res.ok) {
        const enrollments = await res.json();
        if (Array.isArray(enrollments)) {
          const courseIds = enrollments.map((e: any) => e.courseId || e.course?.id || e.course?._id).filter(Boolean);
          setSelectedCourseIds(courseIds);
        }
      }
    } catch (_) {}
  };

  const fetchCoursesAndTeachers = async () => {
    setLoadingCourses(true);
    try {
      const [cRes, tRes] = await Promise.all([
        fetch(`${API_URL}/courses`, { credentials: 'include' }).catch(() => null),
        fetch(`${API_URL}/users/role/TEACHER`, { credentials: 'include' }).catch(() => null),
      ]);

      if (cRes && cRes.ok) {
        const data = await cRes.json();
        setAvailableCourses(Array.isArray(data) ? data : []);
      }

      if (tRes && tRes.ok) {
        const tData = await tRes.json();
        setTeachers(Array.isArray(tData) ? tData : []);
      }
    } catch (_) {}
    setLoadingCourses(false);
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

  // Filter courses by selected teacher if a teacher is selected
  const filteredCourses = useMemo(() => {
    if (!selectedTeacherId || assignTeacherLater) return availableCourses;
    return availableCourses.filter((c) => {
      const tId = c.teacherId || c.teacher?.id;
      return tId === selectedTeacherId;
    });
  }, [availableCourses, selectedTeacherId, assignTeacherLater]);

  if (!isOpen) return null;

  const handleNext = () => {
    setErrorMsg(null);
    if (step === 1) {
      if (!personalInfo.name || !personalInfo.email || (!editingStudent && !personalInfo.password)) {
        setErrorMsg('Please complete all required fields (Name, Email, Password).');
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
        timezone: personalInfo.timezone,
        profilePicture: personalInfo.profilePicture || undefined,
        enrollmentDate: enrollmentStatus.enrollmentDate,
        studentStatus: enrollmentStatus.status,
        trialStatus: enrollmentStatus.trialStatus,
        discontinued: enrollmentStatus.isDiscontinued,
        guardianName: guardianInfo.guardianName,
        guardianPhone: guardianInfo.guardianPhone,
        guardianEmail: guardianInfo.guardianEmail,
        feeStructureId: feeInfo.feeStructureId || undefined,
        monthlyFeeOverride: feeInfo.monthlyFeeOverride ? Number(feeInfo.monthlyFeeOverride) : undefined,
        feeWaiverPercent: feeInfo.feeWaiverPercent ? Number(feeInfo.feeWaiverPercent) : 0,
      };

      if (personalInfo.password) {
        userPayload.password = personalInfo.password;
      }

      let studentData: any = null;

      if (editingStudent) {
        // Update existing student
        const targetId = editingStudent.id || editingStudent._id;
        const res = await fetch(`${API_URL}/users/${targetId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(userPayload),
        });

        studentData = await res.json();
        if (!res.ok) {
          throw new Error(studentData.message || 'Failed to update student profile.');
        }

        setCompletedMessage(`Student ${studentData.name} has been successfully updated.`);
      } else {
        // Create new student
        const res = await fetch(`${API_URL}/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
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

      // Course enrollment logic
      const studentId = studentData.id || studentData._id;
      if (!assignTeacherLater && selectedCourseIds.length > 0 && studentId) {
        for (const cId of selectedCourseIds) {
          try {
            await fetch(`${API_URL}/enrollments`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ studentId, courseId: cId }),
            });
          } catch (_) {}
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during submission.');
    } finally {
      setSubmitting(false);
    }
  };

  const STEPS = [
    { num: 1, label: 'Personal & Photo', icon: User },
    { num: 2, label: 'Guardian / Parent', icon: Shield },
    { num: 3, label: 'Enrollment Status', icon: GraduationCap },
    { num: 4, label: 'Fees & Billing', icon: CreditCard },
    { num: 5, label: 'Teacher & Courses', icon: BookOpen },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="glass-panel w-full max-w-2xl rounded-2xl p-6 md:p-8 shadow-2xl relative border border-border my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/40 pb-4 mb-6">
          <div>
            <h2 className="text-2xl font-display font-bold text-foreground">
              {editingStudent ? 'Update Student Information' : 'Student Admission Onboarding'}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {editingStudent
                ? 'Modify profile, guardian info, enrollment status, and course assignments.'
                : 'Complete the multi-step admission wizard to admit a new student.'}
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
            {/* STEP 1: Personal Info & 1:1 Profile Photo */}
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
                    <label className="text-xs font-semibold text-muted-foreground uppercase">
                      {editingStudent ? 'Change Account Password (Optional)' : 'Account Password *'}
                    </label>
                    <input
                      type="password"
                      required={!editingStudent}
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

            {/* STEP 4: Fees & Billing */}
            {step === 4 && (
              <div className="space-y-4 animate-fadeIn">
                <h3 className="text-base font-bold font-display text-foreground mb-3 flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-brand" />
                  <span>Step 4: Fees & Billing Setup</span>
                </h3>
                <p className="text-xs text-muted-foreground">Select a fee structure or set custom monthly fee for HR fee management.</p>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Assign Fee Structure (Optional)</label>
                    <select
                      value={feeInfo.feeStructureId}
                      onChange={(e) => {
                        const selectedId = e.target.value;
                        const fs = feeStructures.find((s) => (s.id || s._id) === selectedId);
                        setFeeInfo({
                          ...feeInfo,
                          feeStructureId: selectedId,
                          monthlyFeeOverride: fs ? String(fs.monthlyFee) : feeInfo.monthlyFeeOverride,
                        });
                      }}
                      className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-2.5 text-sm outline-none"
                    >
                      <option value="">No pre-set structure (Custom fee)</option>
                      {feeStructures.map((fs) => (
                        <option key={fs.id || fs._id} value={fs.id || fs._id}>
                          {fs.course?.title || 'General'} — {fs.monthlyFee} {fs.currency || 'PKR'} / month
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground uppercase">Monthly Fee Override (Optional)</label>
                      <input
                        type="number"
                        placeholder="e.g. 5000"
                        value={feeInfo.monthlyFeeOverride}
                        onChange={(e) => setFeeInfo({ ...feeInfo, monthlyFeeOverride: e.target.value })}
                        className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-2.5 text-sm outline-none font-mono"
                      />
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
                </div>
              </div>
            )}

            {/* STEP 5: Teacher & Course Assignment */}
            {step === 5 && (
              <div className="space-y-4 animate-fadeIn">
                <h3 className="text-base font-bold font-display text-foreground mb-3 flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-brand" />
                  <span>Step 5: Teacher & Course Assignment</span>
                </h3>

                {/* Optional Teacher Assignment Toggle */}
                <div className="p-3.5 rounded-xl bg-card border border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookUser className="h-5 w-5 text-brand" />
                    <div>
                      <p className="text-xs font-bold text-foreground">Teacher Assignment</p>
                      <p className="text-[10px] text-muted-foreground">Assign a specific teacher or assign later</p>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
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
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Filter Courses by Teacher</label>
                    <select
                      value={selectedTeacherId}
                      onChange={(e) => setSelectedTeacherId(e.target.value)}
                      className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-2.5 text-sm outline-none"
                    >
                      <option value="">All Teachers / All Courses</option>
                      {teachers.map((t) => (
                        <option key={t.id || t._id} value={t.id || t._id}>
                          {t.name} ({t.email})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <p className="text-xs text-muted-foreground">Select one or more courses to assign the student:</p>

                {loadingCourses ? (
                  <div className="py-8 flex justify-center">
                    <Loader2 className="animate-spin text-primary" size={24} />
                  </div>
                ) : filteredCourses.length === 0 ? (
                  <div className="p-4 rounded-xl bg-card border border-border text-center text-xs text-muted-foreground">
                    No active courses found. You can complete admission now and assign courses later.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[240px] overflow-y-auto pr-1">
                    {filteredCourses.map((course) => {
                      const cId = course.id || course._id || '';
                      const isSelected = selectedCourseIds.includes(cId);
                      return (
                        <div
                          key={cId}
                          onClick={() => toggleCourseSelection(cId)}
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
