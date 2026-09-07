'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { User, Shield, GraduationCap, CreditCard, BookOpen, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { apiFetch } from '@/utils/apiFetch';
import { CountryInfo, getAllCurrencies, getAllTimezones } from '@/utils/countries';
import { getLanguagesForCountry } from '@/utils/country-languages';

// Subcomponents & Types
import { TeacherUser, PersonalInfoState, GuardianInfoState, EnrollmentStatusState, FeeInfoState, ClassDaySchedule } from './admission/types';
import AdmissionHeader from './admission/AdmissionHeader';
import AdmissionStepper, { StepItem } from './admission/AdmissionStepper';
import AdmissionFooter from './admission/AdmissionFooter';
import Step1PersonalInfo from './admission/Step1PersonalInfo';
import Step2GuardianInfo from './admission/Step2GuardianInfo';
import Step3ScheduleTier from './admission/Step3ScheduleTier';
import Step4FeesBilling from './admission/Step4FeesBilling';
import Step5TeacherAssignment from './admission/Step5TeacherAssignment';
import Step6ClassSchedule from './admission/Step6ClassSchedule';

interface AdmissionWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingStudent?: any | null;
}

const DEFAULT_DAYS: ClassDaySchedule[] = [
  { day: 'Mon', studentTime: '04:00 PM', teacherTime: '04:00 PM' },
  { day: 'Tue', studentTime: '04:00 PM', teacherTime: '04:00 PM' },
  { day: 'Wed', studentTime: '04:00 PM', teacherTime: '04:00 PM' },
  { day: 'Thu', studentTime: '04:00 PM', teacherTime: '04:00 PM' },
  { day: 'Fri', studentTime: '04:00 PM', teacherTime: '04:00 PM' },
];

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
    languages: getLanguagesForCountry('PK'),
  });

  // Track strict schedule conflicts with teacher
  const [hasScheduleConflicts, setHasScheduleConflicts] = useState(false);

  // Step 2: Guardian Info (Mandatory)
  const [guardianInfo, setGuardianInfo] = useState<GuardianInfoState>({
    guardianType: 'Father',
    guardianTypeOther: '',
    guardianName: '',
    guardianPhone: '',
    guardianPhoneCode: '+92',
    guardianEmail: '',
  });

  // Step 3 & 6: Enrollment Status & Class Schedule
  // Default class duration is 30 minutes as requested
  const [enrollmentStatus, setEnrollmentStatus] = useState<EnrollmentStatusState>({
    enrollmentDate: new Date().toISOString().split('T')[0],
    status: 'Regular',
    trialStatus: 'N/A',
    isDiscontinued: false,
    classDuration: 30,
    classesPerWeek: 5,
    classDays: DEFAULT_DAYS,
    tier: 'Beginner',
  });

  // Bulk time helpers for Step 6 (individual for student and teacher)
  const [bulkStudentTime, setBulkStudentTime] = useState('04:00 PM');
  const [bulkTeacherTime, setBulkTeacherTime] = useState('04:00 PM');

  // Step 4: Fees & Billing
  const [feeInfo, setFeeInfo] = useState<FeeInfoState>({
    monthlyFee: '30',
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
    let rateMultiplier = 6;
    if (duration === 60) rateMultiplier = 10;
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
    const suggestedLangs = getLanguagesForCountry(country.code);
    setPersonalInfo((prev) => ({
      ...prev,
      country: country.code,
      phoneCode: country.phoneCode,
      timezone: country.timezone || prev.timezone,
      languages: prev.languages && prev.languages.length > 0 ? prev.languages : suggestedLangs,
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
              if (draft.bulkStudentTime) setBulkStudentTime(draft.bulkStudentTime);
              if (draft.bulkTeacherTime) setBulkTeacherTime(draft.bulkTeacherTime);
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
            languages: editingStudent.languages || editingStudent.profile?.languages || getLanguagesForCountry(editingStudent.country || 'PK'),
          });

          setGuardianInfo({
            guardianType: editingStudent.guardianType || 'Father',
            guardianTypeOther: editingStudent.guardianTypeOther || '',
            guardianName: editingStudent.guardianName || '',
            guardianPhone: editingStudent.guardianPhone || '',
            guardianPhoneCode: editingStudent.guardianPhoneCode || editingStudent.phoneCode || '+92',
            guardianEmail: editingStudent.guardianEmail || '',
          });

          const initialDays: ClassDaySchedule[] = editingStudent.classDays && Array.isArray(editingStudent.classDays) && editingStudent.classDays.length > 0
            ? editingStudent.classDays.map((d: any) => ({
                day: d.day,
                studentTime: d.studentTime || d.time || '04:00 PM',
                teacherTime: d.teacherTime || d.time || '04:00 PM',
                time: d.time || d.studentTime || '04:00 PM',
              }))
            : DEFAULT_DAYS;

          setEnrollmentStatus({
            enrollmentDate: editingStudent.enrollmentDate
              ? new Date(editingStudent.enrollmentDate).toISOString().split('T')[0]
              : new Date().toISOString().split('T')[0],
            status: editingStudent.studentStatus || editingStudent.status || 'Regular',
            trialStatus: editingStudent.trialStatus || 'N/A',
            isDiscontinued: editingStudent.discontinued || false,
            classDuration: editingStudent.classDuration || 30,
            classesPerWeek: initialDays.length,
            classDays: initialDays,
            tier: editingStudent.tier || 'Beginner',
          });

          setFeeInfo({
            monthlyFee: editingStudent.monthlyFee ? String(editingStudent.monthlyFee) : (editingStudent.monthlyFeeOverride ? String(editingStudent.monthlyFeeOverride) : '30'),
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
          // Reset for new student (default duration = 30)
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
            languages: getLanguagesForCountry('PK'),
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
            classDuration: 30,
            classesPerWeek: 5,
            classDays: DEFAULT_DAYS,
            tier: 'Beginner',
          });
          setFeeInfo({
            monthlyFee: '30',
            currency: 'USD',
            feeWaiverPercent: '0',
            customFeeNotes: '',
            isFeeManuallyEdited: false,
          });
          setNoteToTeacher('');
          setSelectedTeacherId('');
          setAssignTeacherLater(false);
          setBulkStudentTime('04:00 PM');
          setBulkTeacherTime('04:00 PM');
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
        bulkStudentTime,
        bulkTeacherTime,
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
    bulkStudentTime,
    bulkTeacherTime,
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

  // Weekday selection & dual-time handlers for Step 6
  const toggleDay = (dayKey: string) => {
    setEnrollmentStatus((prev) => {
      const exists = prev.classDays.some((d) => d.day === dayKey);
      let updatedDays: ClassDaySchedule[];
      if (exists) {
        updatedDays = prev.classDays.filter((d) => d.day !== dayKey);
      } else {
        updatedDays = [
          ...prev.classDays,
          {
            day: dayKey,
            studentTime: bulkStudentTime || '04:00 PM',
            teacherTime: bulkTeacherTime || '04:00 PM',
          },
        ];
      }
      return {
        ...prev,
        classDays: updatedDays,
        classesPerWeek: updatedDays.length,
      };
    });
  };

  const updateDayStudentTime = (dayKey: string, newTime: string) => {
    setEnrollmentStatus((prev) => ({
      ...prev,
      classDays: prev.classDays.map((d) => (d.day === dayKey ? { ...d, studentTime: newTime } : d)),
    }));
  };

  const updateDayTeacherTime = (dayKey: string, newTime: string) => {
    setEnrollmentStatus((prev) => ({
      ...prev,
      classDays: prev.classDays.map((d) => (d.day === dayKey ? { ...d, teacherTime: newTime } : d)),
    }));
  };

  const applyBulkStudentTimeToAll = () => {
    if (!bulkStudentTime) return;
    setEnrollmentStatus((prev) => ({
      ...prev,
      classDays: prev.classDays.map((d) => ({ ...d, studentTime: bulkStudentTime })),
    }));
  };

  const applyBulkTeacherTimeToAll = () => {
    if (!bulkTeacherTime) return;
    setEnrollmentStatus((prev) => ({
      ...prev,
      classDays: prev.classDays.map((d) => ({ ...d, teacherTime: bulkTeacherTime })),
    }));
  };

  if (!isOpen) return null;

  // Step-by-step validation function
  const validateStep = (stepNumber: number): string | null => {
    if (stepNumber === 1) {
      if (!personalInfo.name.trim()) return 'Full Name is required on Step 1.';
      if (personalInfo.name.trim().length < 2) return 'Full Name must be at least 2 characters on Step 1.';
      if (!personalInfo.email.trim()) return 'Email Address is required on Step 1.';
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(personalInfo.email.trim())) return 'Please enter a valid Email Address on Step 1.';
      if (!editingStudent && (!personalInfo.password || personalInfo.password.length < 6)) {
        return 'Account Password is required for new student on Step 1 (minimum 6 characters).';
      }
      if (!personalInfo.country || !personalInfo.country.trim()) return 'Student Country is required on Step 1.';
      if (!personalInfo.phone || !personalInfo.phone.trim()) return 'Student Phone Number is required on Step 1.';
      const digits = personalInfo.phone.replace(/\D/g, '');
      if (digits.length < 7) return 'Student Phone Number must contain at least 7 digits on Step 1.';
      if (!personalInfo.languages || personalInfo.languages.length === 0) {
        return 'Please select at least one Spoken/Preferred Language on Step 1.';
      }
      if (!personalInfo.gender) return 'Please select a Gender on Step 1.';
      if (!personalInfo.dob) return 'Date of Birth is required on Step 1.';
      const dobDate = new Date(personalInfo.dob);
      if (isNaN(dobDate.getTime()) || dobDate >= new Date()) {
        return 'Date of Birth must be a valid date in the past on Step 1.';
      }
      if (!personalInfo.timezone || !personalInfo.timezone.trim()) return 'Timezone is required on Step 1.';
    } else if (stepNumber === 2) {
      if (!guardianInfo.guardianType) return 'Guardian Relationship is required on Step 2.';
      if (guardianInfo.guardianType === 'Other' && (!guardianInfo.guardianTypeOther || guardianInfo.guardianTypeOther.trim().length < 2)) {
        return 'Please specify the guardian relationship on Step 2 (minimum 2 characters).';
      }
      if (!guardianInfo.guardianName || !guardianInfo.guardianName.trim()) return 'Guardian Full Name is required on Step 2.';
      if (guardianInfo.guardianName.trim().length < 2) return 'Guardian Full Name must be at least 2 characters on Step 2.';
      if (!guardianInfo.guardianPhone || !guardianInfo.guardianPhone.trim()) return 'Guardian Contact Phone is required on Step 2.';
      const guardianDigits = guardianInfo.guardianPhone.replace(/\D/g, '');
      if (guardianDigits.length < 7) return 'Guardian Contact Phone must contain at least 7 digits on Step 2.';
      if (guardianInfo.guardianEmail && guardianInfo.guardianEmail.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(guardianInfo.guardianEmail.trim())) {
          return 'Please provide a valid Guardian Email Address on Step 2, or leave it blank.';
        }
      }
    } else if (stepNumber === 3) {
      if (!enrollmentStatus.tier) return 'Student Tier / Level is required on Step 3.';
      if (!enrollmentStatus.classDuration || ![30, 60, 120].includes(Number(enrollmentStatus.classDuration))) {
        return 'Class Duration is required on Step 3.';
      }
      if (!enrollmentStatus.enrollmentDate) return 'Enrollment Start Date is required on Step 3.';
      if (!enrollmentStatus.status) return 'Student Admission Status is required on Step 3.';
    } else if (stepNumber === 4) {
      if (feeInfo.monthlyFee === '' || isNaN(Number(feeInfo.monthlyFee)) || Number(feeInfo.monthlyFee) < 0) {
        return 'Monthly Tuition Fee must be a valid non-negative number on Step 4.';
      }
      if (!feeInfo.currency || !feeInfo.currency.trim()) return 'Billing Currency is required on Step 4.';
      if (feeInfo.feeWaiverPercent !== '' && (isNaN(Number(feeInfo.feeWaiverPercent)) || Number(feeInfo.feeWaiverPercent) < 0 || Number(feeInfo.feeWaiverPercent) > 100)) {
        return 'Fee Waiver must be a percentage between 0 and 100 on Step 4.';
      }
    } else if (stepNumber === 5) {
      if (!assignTeacherLater && (!selectedTeacherId || !selectedTeacherId.trim())) {
        return 'Please select an Instructor / Teacher on Step 5, or check "Assign teacher later".';
      }
    } else if (stepNumber === 6) {
      if (!enrollmentStatus.classDays || enrollmentStatus.classDays.length === 0) {
        return 'Please select at least one active class weekday on Step 6.';
      }
      for (const d of enrollmentStatus.classDays) {
        if (!d.studentTime || !d.studentTime.trim()) {
          return `Please configure student time for ${d.day} on Step 6.`;
        }
        if (!d.teacherTime || !d.teacherTime.trim()) {
          return `Please configure teacher time for ${d.day} on Step 6.`;
        }
      }
      if (hasScheduleConflicts) {
        return 'Cannot proceed: The selected teacher already has another class scheduled during one or more selected time slots. A single slot cannot be assigned to multiple students. Please resolve conflicting timings.';
      }
    }
    return null;
  };

  const handleNext = () => {
    setErrorMsg(null);
    const err = validateStep(step);
    if (err) {
      setErrorMsg(err);
      return;
    }
    setStep((prev) => Math.min(prev + 1, 6));
  };

  const handleStepClick = (targetStep: number) => {
    setErrorMsg(null);
    if (targetStep < step) {
      setStep(targetStep);
      return;
    }
    // Validate each step before allowing skip to targetStep
    for (let s = 1; s < targetStep; s++) {
      const err = validateStep(s);
      if (err) {
        setErrorMsg(err);
        setStep(s);
        return;
      }
    }
    setStep(targetStep);
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

    // Guard: strictly do not allow submission unless on the final step (Step 6)
    if (step < 6) {
      handleNext();
      return;
    }

    // Comprehensive validation across all steps before submitting
    for (let s = 1; s <= 6; s++) {
      const err = validateStep(s);
      if (err) {
        setErrorMsg(err);
        setStep(s);
        return;
      }
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
        languages: personalInfo.languages || [],

        // Step 2: Guardian
        guardianType: guardianInfo.guardianType,
        guardianTypeOther: guardianInfo.guardianType === 'Other' ? guardianInfo.guardianTypeOther?.trim() : undefined,
        guardianName: guardianInfo.guardianName.trim(),
        guardianPhone: guardianInfo.guardianPhone.trim(),
        guardianEmail: guardianInfo.guardianEmail?.trim() || undefined,

        // Step 3 & 6: Enrollment & Schedule
        enrollmentDate: enrollmentStatus.enrollmentDate || undefined,
        studentStatus: enrollmentStatus.status,
        trialStatus: enrollmentStatus.trialStatus,
        discontinued: enrollmentStatus.isDiscontinued,
        classDuration: enrollmentStatus.classDuration ? Number(enrollmentStatus.classDuration) : 30,
        classesPerWeek: enrollmentStatus.classDays.length,
        classDays: enrollmentStatus.classDays.map((d) => ({
          day: d.day,
          studentTime: d.studentTime || '04:00 PM',
          teacherTime: d.teacherTime || '04:00 PM',
          time: d.studentTime || '04:00 PM', // legacy support
        })),
        tier: enrollmentStatus.tier,

        // Step 4: Fees
        monthlyFee: feeInfo.monthlyFee ? Number(feeInfo.monthlyFee) : 30,
        monthlyFeeOverride: feeInfo.monthlyFee ? Number(feeInfo.monthlyFee) : 30,
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

  const STEPS: StepItem[] = [
    { num: 1, label: 'Personal & Country', icon: User },
    { num: 2, label: 'Guardian Details', icon: Shield },
    { num: 3, label: 'Tier & Enrollment', icon: GraduationCap },
    { num: 4, label: 'Fees & Billing', icon: CreditCard },
    { num: 5, label: 'Teacher Assignment', icon: BookOpen },
    { num: 6, label: 'Class Schedule', icon: Calendar },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 md:p-6 lg:p-8 bg-background/80 backdrop-blur-md animate-fadeIn overflow-hidden">
      <div className="w-full max-w-5xl h-[92vh] max-h-[920px] rounded-3xl border border-border shadow-2xl bg-card text-foreground flex flex-col overflow-hidden relative">
        {/* 1. Header */}
        <AdmissionHeader
          step={step}
          totalSteps={6}
          editingStudent={editingStudent}
          onClose={handleClose}
        />

        {/* 2. Top Stepper Progression Bar */}
        {!completedMessage && (
          <AdmissionStepper
            steps={STEPS}
            currentStep={step}
            onStepClick={handleStepClick}
          />
        )}

        {/* 3. Main Independent Scrollable Body */}
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
              <form
                id="admission-wizard-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (step < 6) {
                    handleNext();
                  } else {
                    handleSubmit(e);
                  }
                }}
                className="space-y-6"
              >
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
                    noteToTeacher={noteToTeacher}
                    setNoteToTeacher={setNoteToTeacher}
                    cameraRestricted={personalInfo.cameraRestricted}
                    setCameraRestricted={(val) => setPersonalInfo((prev) => ({ ...prev, cameraRestricted: val }))}
                  />
                )}

                {step === 6 && (
                  <Step6ClassSchedule
                    enrollmentStatus={enrollmentStatus}
                    setEnrollmentStatus={setEnrollmentStatus}
                    selectedTeacherId={selectedTeacherId}
                    teachers={teachers}
                    onToggleDay={toggleDay}
                    onUpdateDayStudentTime={updateDayStudentTime}
                    onUpdateDayTeacherTime={updateDayTeacherTime}
                    bulkStudentTime={bulkStudentTime}
                    setBulkStudentTime={setBulkStudentTime}
                    bulkTeacherTime={bulkTeacherTime}
                    setBulkTeacherTime={setBulkTeacherTime}
                    onApplyBulkStudentTime={applyBulkStudentTimeToAll}
                    onApplyBulkTeacherTime={applyBulkTeacherTimeToAll}
                    onConflictsChange={setHasScheduleConflicts}
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
            totalSteps={6}
            currentStepItem={STEPS[step - 1]}
            submitting={submitting}
            editingStudent={editingStudent}
            onBack={handleBack}
            onNext={handleNext}
            onSubmit={handleSubmit}
          />
        )}
      </div>
    </div>
  );
}
