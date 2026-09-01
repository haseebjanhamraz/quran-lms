'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { User, Shield, GraduationCap, CreditCard, BookOpen, CheckCircle, XCircle } from 'lucide-react';
import { apiFetch } from '@/utils/apiFetch';
import { CountryInfo, getAllCurrencies, getAllTimezones } from '@/utils/countries';

// Subcomponents & Types
import { TeacherUser, PersonalInfoState, GuardianInfoState, EnrollmentStatusState, FeeInfoState } from './admission/types';
import AdmissionHeader from './admission/AdmissionHeader';
import AdmissionStepper, { StepItem } from './admission/AdmissionStepper';
import AdmissionFooter from './admission/AdmissionFooter';
import Step1PersonalInfo from './admission/Step1PersonalInfo';
import Step2GuardianInfo from './admission/Step2GuardianInfo';
import Step3ScheduleTier from './admission/Step3ScheduleTier';
import Step4FeesBilling from './admission/Step4FeesBilling';
import Step5TeacherAssignment from './admission/Step5TeacherAssignment';

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
  const [personalInfo, setPersonalInfo] = useState<PersonalInfoState>({
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
  const [guardianInfo, setGuardianInfo] = useState<GuardianInfoState>({
    guardianType: 'Father',
    guardianTypeOther: '',
    guardianName: '',
    guardianPhone: '',
    guardianPhoneCode: '+92',
    guardianEmail: '',
  });

  // Step 3: Enrollment Status, Weekdays & Time Slots
  const [enrollmentStatus, setEnrollmentStatus] = useState<EnrollmentStatusState>({
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

  // Quick time setting helper state
  const [bulkTime, setBulkTime] = useState('16:00');

  // Step 4: Fees & Billing
  const [feeInfo, setFeeInfo] = useState<FeeInfoState>({
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

  const DRAFT_KEY = 'quran_lms_admission_wizard_draft';

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
      setShowPassword(false);
      setCopiedPassword(false);

      // Check if there is a saved draft in localStorage
      let loadedFromDraft = false;
      try {
        const savedDraftRaw = typeof window !== 'undefined' ? localStorage.getItem(DRAFT_KEY) : null;
        if (savedDraftRaw) {
          const draft = JSON.parse(savedDraftRaw);
          if (draft && draft.isOpen) {
            const currentEditingId = editingStudent ? (editingStudent.id || editingStudent._id) : null;
            const draftEditingId = draft.editingStudent ? (draft.editingStudent.id || draft.editingStudent._id) : null;

            if (currentEditingId === draftEditingId) {
              if (draft.step) setStep(draft.step);
              if (draft.personalInfo) setPersonalInfo(draft.personalInfo);
              if (draft.guardianInfo) setGuardianInfo(draft.guardianInfo);
              if (draft.enrollmentStatus) setEnrollmentStatus(draft.enrollmentStatus);
              if (draft.bulkTime) setBulkTime(draft.bulkTime);
              if (draft.feeInfo) setFeeInfo(draft.feeInfo);
              if (draft.selectedTeacherId !== undefined) setSelectedTeacherId(draft.selectedTeacherId);
              if (draft.assignTeacherLater !== undefined) setAssignTeacherLater(draft.assignTeacherLater);
              if (draft.noteToTeacher !== undefined) setNoteToTeacher(draft.noteToTeacher);
              loadedFromDraft = true;
            }
          }
        }
      } catch (e) {
        console.error('Failed to restore admission draft from localStorage:', e);
      }

      if (!loadedFromDraft) {
        setStep(1);
        if (editingStudent) {
          setPersonalInfo({
            name: editingStudent.name || '',
            preferredName: editingStudent.preferredName || '',
            email: editingStudent.email || '',
            password: '',
            gender: editingStudent.gender || 'Male',
            dob: editingStudent.dob ? new Date(editingStudent.dob).toISOString().split('T')[0] : '',
            country: editingStudent.country || 'PK',
            phoneCode: editingStudent.phoneCode || '+92',
            phone: editingStudent.phone || '',
            timezone: editingStudent.timezone || 'Asia/Karachi',
            profilePicture: editingStudent.profilePicture || '',
            cameraRestricted: editingStudent.cameraRestricted || false,
          });

          setGuardianInfo({
            guardianType: editingStudent.guardianType || 'Father',
            guardianTypeOther: editingStudent.guardianTypeOther || '',
            guardianName: editingStudent.guardianName || '',
            guardianPhone: editingStudent.guardianPhone || '',
            guardianPhoneCode: editingStudent.guardianPhoneCode || editingStudent.phoneCode || '+92',
            guardianEmail: editingStudent.guardianEmail || '',
          });

          const initialDays = editingStudent.classDays && Array.isArray(editingStudent.classDays) && editingStudent.classDays.length > 0
            ? editingStudent.classDays
            : [
              { day: 'Mon', time: '16:00' },
              { day: 'Tue', time: '16:00' },
              { day: 'Wed', time: '16:00' },
              { day: 'Thu', time: '16:00' },
              { day: 'Fri', time: '16:00' },
            ];

          setEnrollmentStatus({
            enrollmentDate: editingStudent.enrollmentDate
              ? new Date(editingStudent.enrollmentDate).toISOString().split('T')[0]
              : new Date().toISOString().split('T')[0],
            status: editingStudent.studentStatus || editingStudent.status || 'Regular',
            trialStatus: editingStudent.trialStatus || 'N/A',
            isDiscontinued: editingStudent.discontinued || false,
            classDuration: editingStudent.classDuration || 60,
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
      }

      fetchTeachers();
    }
  }, [isOpen, editingStudent]);

  // Persist form draft to localStorage across page reloads
  useEffect(() => {
    if (!isOpen || completedMessage) return;
    try {
      const draft = {
        isOpen: true,
        step,
        editingStudent: editingStudent ? { id: editingStudent.id || editingStudent._id, name: editingStudent.name } : null,
        personalInfo,
        guardianInfo,
        enrollmentStatus,
        bulkTime,
        feeInfo,
        selectedTeacherId,
        assignTeacherLater,
        noteToTeacher,
        savedAt: Date.now(),
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch (err) {
      console.error('Failed to save admission draft to localStorage:', err);
    }
  }, [
    isOpen,
    completedMessage,
    step,
    editingStudent,
    personalInfo,
    guardianInfo,
    enrollmentStatus,
    bulkTime,
    feeInfo,
    selectedTeacherId,
    assignTeacherLater,
    noteToTeacher,
  ]);

  const handleClose = () => {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch (_) {}
    onClose();
  };

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
      if (!personalInfo.name.trim() || !personalInfo.email.trim() || (!editingStudent && !personalInfo.password)) {
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

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    setErrorMsg(null);

    // Validate step 1 fields
    if (!personalInfo.name.trim() || !personalInfo.email.trim() || (!editingStudent && !personalInfo.password)) {
      setErrorMsg('Please complete all required fields on Step 1 (Name, Email, Password).');
      setStep(1);
      return;
    }

    // Validate step 2 fields
    if (!guardianInfo.guardianName.trim()) {
      setErrorMsg('Guardian Full Name is required on Step 2.');
      setStep(2);
      return;
    }
    if (!guardianInfo.guardianPhone.trim()) {
      setErrorMsg('Guardian Contact Phone is required on Step 2.');
      setStep(2);
      return;
    }
    if (guardianInfo.guardianType === 'Other' && !guardianInfo.guardianTypeOther.trim()) {
      setErrorMsg('Please specify the guardian relationship on Step 2.');
      setStep(2);
      return;
    }

    setSubmitting(true);

    try {
      const userPayload: any = {
        name: personalInfo.name.trim(),
        preferredName: personalInfo.preferredName?.trim() || undefined,
        email: personalInfo.email.trim(),
        role: 'STUDENT',
        gender: personalInfo.gender,
        dob: personalInfo.dob || undefined,
        dateOfBirth: personalInfo.dob || undefined,
        country: personalInfo.country,
        phone: personalInfo.phone?.trim() || undefined,
        phoneCode: personalInfo.phoneCode || undefined,
        timezone: personalInfo.timezone,
        profilePicture: personalInfo.profilePicture || undefined,
        cameraRestricted: personalInfo.cameraRestricted,

        // Step 2: Guardian
        guardianType: guardianInfo.guardianType,
        guardianTypeOther: guardianInfo.guardianType === 'Other' ? guardianInfo.guardianTypeOther?.trim() : undefined,
        guardianName: guardianInfo.guardianName.trim(),
        guardianPhone: guardianInfo.guardianPhone.trim(),
        guardianEmail: guardianInfo.guardianEmail?.trim() || undefined,

        // Step 3: Enrollment
        enrollmentDate: enrollmentStatus.enrollmentDate || undefined,
        studentStatus: enrollmentStatus.status,
        trialStatus: enrollmentStatus.trialStatus,
        discontinued: enrollmentStatus.isDiscontinued,
        classDuration: enrollmentStatus.classDuration ? Number(enrollmentStatus.classDuration) : 60,
        classesPerWeek: enrollmentStatus.classDays.length,
        classDays: enrollmentStatus.classDays,
        tier: enrollmentStatus.tier,

        // Step 4: Fees
        monthlyFee: feeInfo.monthlyFee ? Number(feeInfo.monthlyFee) : 50,
        monthlyFeeOverride: feeInfo.monthlyFee ? Number(feeInfo.monthlyFee) : 50,
        currency: feeInfo.currency || 'USD',
        feeWaiverPercent: feeInfo.feeWaiverPercent ? Number(feeInfo.feeWaiverPercent) : 0,
        customFeeNotes: feeInfo.customFeeNotes?.trim() || undefined,

        // Step 5: Teacher & Note
        assignedTeacher: assignTeacherLater ? null : (selectedTeacherId || undefined),
        noteToTeacher: noteToTeacher?.trim() || undefined,
      };

      if (!editingStudent && personalInfo.password) {
        userPayload.password = personalInfo.password;
      }

      let studentData: any = null;

      if (editingStudent) {
        // When editing an existing student, password and email are handled separately
        delete userPayload.password;
        delete userPayload.email;

        const targetId = editingStudent.id || editingStudent._id;
        const res = await apiFetch(`${API_URL}/users/${targetId}`, {
          method: 'PUT',
          body: JSON.stringify(userPayload),
        });

        studentData = await res.json();
        if (!res.ok) {
          const errMsg = Array.isArray(studentData.message)
            ? studentData.message.join(', ')
            : studentData.message || 'Failed to update student profile.';
          throw new Error(errMsg);
        }

        try {
          localStorage.removeItem(DRAFT_KEY);
        } catch (_) {}

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

        try {
          localStorage.removeItem(DRAFT_KEY);
        } catch (_) {}

        setCompletedMessage(`Student ${studentData.name} has been successfully admitted.`);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during submission.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFooterNext = () => {
    if (step < 5) {
      handleNext();
    } else {
      handleSubmit();
    }
  };

  const STEPS: StepItem[] = [
    { num: 1, label: 'Personal & Country', icon: User },
    { num: 2, label: 'Guardian Details', icon: Shield },
    { num: 3, label: 'Schedule & Tier', icon: GraduationCap },
    { num: 4, label: 'Fees & Billing', icon: CreditCard },
    { num: 5, label: 'Teacher & Note', icon: BookOpen },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 md:p-6 lg:p-8 bg-background/80 backdrop-blur-md animate-fadeIn overflow-hidden">
      <div className="w-full max-w-5xl h-[92vh] max-h-[920px] rounded-3xl border border-border shadow-2xl bg-card text-foreground flex flex-col overflow-hidden relative">
        {/* 1. Header */}
        <AdmissionHeader
          step={step}
          totalSteps={5}
          editingStudent={editingStudent}
          onClose={handleClose}
        />

        {/* 2. Top Stepper Progression Bar */}
        {!completedMessage && (
          <AdmissionStepper
            steps={STEPS}
            currentStep={step}
            onStepClick={(sNum) => setStep(sNum)}
          />
        )}

        {/* 3. Main Independent Scrollable Body with generous bottom spacing */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 md:px-10 py-6 sm:py-7">
          <div className="max-w-4xl mx-auto w-full pb-12">
            {/* Error Alert */}
            {errorMsg && (
              <div className="mb-6 p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold flex items-center gap-2 shadow-sm">
                <XCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* SUCCESS VIEW */}
            {completedMessage ? (
              <div className="py-16 flex flex-col items-center justify-center text-center space-y-4 max-w-lg mx-auto">
                <div className="h-20 w-20 rounded-3xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20 shadow-xl">
                  <CheckCircle className="h-12 w-12" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold font-display text-foreground">
                  {editingStudent ? 'Student Profile Updated!' : 'Admission Completed!'}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{completedMessage}</p>

                <div className="pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      onSuccess();
                      handleClose();
                    }}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-2xl text-sm font-bold shadow-xl hover:scale-105 transition-all"
                  >
                    Return to Students List
                  </button>
                </div>
              </div>
            ) : (
              <form id="admission-wizard-form" onSubmit={handleSubmit} className="space-y-6">
                {step === 1 && (
                  <Step1PersonalInfo
                    personalInfo={personalInfo}
                    setPersonalInfo={setPersonalInfo}
                    editingStudent={editingStudent}
                    timezonesList={timezonesList}
                    computedAge={computedAge}
                    showPassword={showPassword}
                    setShowPassword={setShowPassword}
                    copiedPassword={copiedPassword}
                    onGeneratePassword={generateSecurePassword}
                    onCopyPassword={handleCopyPassword}
                    onCountryChange={handleCountryChange}
                  />
                )}

                {step === 2 && (
                  <Step2GuardianInfo
                    guardianInfo={guardianInfo}
                    setGuardianInfo={setGuardianInfo}
                    countryCode={personalInfo.country}
                  />
                )}

                {step === 3 && (
                  <Step3ScheduleTier
                    enrollmentStatus={enrollmentStatus}
                    setEnrollmentStatus={setEnrollmentStatus}
                    bulkTime={bulkTime}
                    setBulkTime={setBulkTime}
                    onToggleDay={toggleDay}
                    onUpdateDayTime={updateDayTime}
                    onApplyBulkTime={applyBulkTimeToAll}
                  />
                )}

                {step === 4 && (
                  <Step4FeesBilling
                    feeInfo={feeInfo}
                    setFeeInfo={setFeeInfo}
                    currenciesList={currenciesList}
                    classDuration={enrollmentStatus.classDuration}
                    classesPerWeek={enrollmentStatus.classDays.length}
                  />
                )}

                {step === 5 && (
                  <Step5TeacherAssignment
                    teachers={teachers}
                    loadingTeachers={loadingTeachers}
                    selectedTeacherId={selectedTeacherId}
                    setSelectedTeacherId={setSelectedTeacherId}
                    assignTeacherLater={assignTeacherLater}
                    setAssignTeacherLater={setAssignTeacherLater}
                    enrollmentStatus={enrollmentStatus}
                    onToggleDay={toggleDay}
                    onUpdateDayTime={updateDayTime}
                    bulkTime={bulkTime}
                    setBulkTime={setBulkTime}
                    onApplyBulkTime={applyBulkTimeToAll}
                    noteToTeacher={noteToTeacher}
                    setNoteToTeacher={setNoteToTeacher}
                    cameraRestricted={personalInfo.cameraRestricted}
                    setCameraRestricted={(val) => setPersonalInfo((prev) => ({ ...prev, cameraRestricted: val }))}
                  />
                )}
              </form>
            )}
          </div>
        </div>

        {/* 4. Pinned Bottom Footer Navigation Bar */}
        {!completedMessage && (
          <AdmissionFooter
            step={step}
            totalSteps={5}
            currentStepItem={STEPS[step - 1]}
            submitting={submitting}
            editingStudent={editingStudent}
            onBack={handleBack}
            onNext={handleFooterNext}
          />
        )}
      </div>
    </div>
  );
}
