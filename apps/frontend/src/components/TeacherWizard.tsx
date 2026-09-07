'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  User, Shield, GraduationCap, CreditCard, Lock, CheckCircle, AlertCircle, XCircle
} from 'lucide-react';
import { apiFetch } from '@/utils/apiFetch';
import { CountryInfo, getAllCurrencies, getAllTimezones } from '@/utils/countries';
import { getLanguagesForCountry } from '@/utils/country-languages';

// Subcomponents
import {
  StepItem,
  TeacherPersonalInfo,
  TeacherQualificationsInfo,
  TeacherSalaryInfo,
  TeacherGuarantorInfo
} from './teacher-admission/types';
import TeacherHeader from './teacher-admission/TeacherHeader';
import TeacherStepper from './teacher-admission/TeacherStepper';
import Step1PersonalDetails from './teacher-admission/Step1PersonalDetails';
import Step2Qualifications from './teacher-admission/Step2Qualifications';
import Step3SalarySetup from './teacher-admission/Step3SalarySetup';
import Step4Guarantors from './teacher-admission/Step4Guarantors';
import Step5Permissions from './teacher-admission/Step5Permissions';
import TeacherFooter from './teacher-admission/TeacherFooter';

interface TeacherWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingTeacher?: any | null;
}

const STEPS: StepItem[] = [
  { num: 1, label: 'Personal & Country', icon: User },
  { num: 2, label: 'Qualifications & Bio', icon: GraduationCap },
  { num: 3, label: 'Salary & Currency', icon: CreditCard },
  { num: 4, label: 'Guarantor Contacts', icon: Shield },
  { num: 5, label: 'Permissions & Video', icon: Lock },
];

const DRAFT_KEY = 'quran_lms_teacher_wizard_draft';

export default function TeacherWizard({
  isOpen,
  onClose,
  onSuccess,
  editingTeacher = null,
}: TeacherWizardProps) {
  const [step, setStep] = useState(1);

  // Step 1: Personal Info
  const [personalInfo, setPersonalInfo] = useState<TeacherPersonalInfo>({
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
    languages: getLanguagesForCountry('PK'),
  });

  // Step 2: Qualifications & Bio
  const [qualificationsInfo, setQualificationsInfo] = useState<TeacherQualificationsInfo>({
    specialization: ['Nazira & Tajweed'],
    qualification: ['Certified Hafiz & Qari'],
    employeeId: '',
    joiningDate: new Date().toISOString().split('T')[0],
    bio: '',
  });

  // Step 3: Salary Setup
  const [salaryInfo, setSalaryInfo] = useState<TeacherSalaryInfo>({
    payType: 'MONTHLY',
    baseSalary: '35000',
    hourlyRate: '1000',
    country: 'Pakistan',
    currency: 'PKR',
  });

  // Step 4: Guarantor Info
  const [guarantorInfo, setGuarantorInfo] = useState<TeacherGuarantorInfo>({
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

  // Step 5: Permissions
  const [canEditProfile, setCanEditProfile] = useState(false);
  const [cameraRestricted, setCameraRestricted] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [completedMessage, setCompletedMessage] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

  const timezonesList = useMemo(() => getAllTimezones(), []);
  const currenciesList = useMemo(() => getAllCurrencies(), []);

  const handleCountryChange = (country: CountryInfo) => {
    const suggestedLangs = getLanguagesForCountry(country.code);
    setPersonalInfo((prev) => ({
      ...prev,
      country: country.code,
      phoneCode: country.phoneCode,
      timezone: country.timezone || prev.timezone,
      languages: prev.languages && prev.languages.length > 0 ? prev.languages : suggestedLangs,
    }));
    setSalaryInfo((prev) => ({
      ...prev,
      country: country.name,
      currency: country.currency || prev.currency,
    }));
  };

  // Helper to parse string or array into string[]
  const parseStringOrArray = (val: any, defaultVal: string[]): string[] => {
    if (!val) return defaultVal;
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') {
      const parts = val.split(',').map((s) => s.trim()).filter(Boolean);
      return parts.length > 0 ? parts : defaultVal;
    }
    return defaultVal;
  };

  // Initialize form or restore from draft
  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setCompletedMessage(null);

      let loadedFromDraft = false;
      try {
        const savedDraftRaw = typeof window !== 'undefined' ? localStorage.getItem(DRAFT_KEY) : null;
        if (savedDraftRaw) {
          const draft = JSON.parse(savedDraftRaw);
          if (draft && draft.isOpen) {
            const currentEditingId = editingTeacher ? (editingTeacher.id || editingTeacher._id) : null;
            const draftEditingId = draft.editingTeacher ? (draft.editingTeacher.id || draft.editingTeacher._id) : null;

            if (currentEditingId === draftEditingId) {
              if (draft.step) setStep(draft.step);
              if (draft.personalInfo) setPersonalInfo(draft.personalInfo);
              if (draft.qualificationsInfo) setQualificationsInfo(draft.qualificationsInfo);
              if (draft.salaryInfo) setSalaryInfo(draft.salaryInfo);
              if (draft.guarantorInfo) setGuarantorInfo(draft.guarantorInfo);
              if (draft.canEditProfile !== undefined) setCanEditProfile(draft.canEditProfile);
              if (draft.cameraRestricted !== undefined) setCameraRestricted(draft.cameraRestricted);
              loadedFromDraft = true;
            }
          }
        }
      } catch (e) {
        console.error('Failed to restore teacher admission draft from localStorage:', e);
      }

      if (!loadedFromDraft) {
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
            dob: editingTeacher.dob || editingTeacher.dateOfBirth
              ? new Date(editingTeacher.dob || editingTeacher.dateOfBirth).toISOString().split('T')[0]
              : '',
            timezone: editingTeacher.timezone || 'Asia/Karachi',
            profilePicture: editingTeacher.profilePicture || editingTeacher.avatar || '',
            languages: editingTeacher.languages || editingTeacher.profile?.languages || getLanguagesForCountry(editingTeacher.country || 'PK'),
          });

          setQualificationsInfo({
            specialization: parseStringOrArray(
              editingTeacher.specialization || editingTeacher.profile?.specialization,
              ['Nazira & Tajweed']
            ),
            qualification: parseStringOrArray(
              editingTeacher.qualification || editingTeacher.profile?.qualification,
              ['Certified Hafiz & Qari']
            ),
            employeeId: editingTeacher.employeeId || editingTeacher.profile?.employeeId || '',
            joiningDate: editingTeacher.joiningDate || editingTeacher.profile?.joiningDate
              ? new Date(editingTeacher.joiningDate || editingTeacher.profile?.joiningDate).toISOString().split('T')[0]
              : new Date().toISOString().split('T')[0],
            bio: editingTeacher.bio || editingTeacher.profile?.bio || '',
          });

          const sal = editingTeacher.salaryProfile || editingTeacher.profile || {};
          setSalaryInfo({
            payType: sal.payType || 'MONTHLY',
            baseSalary: sal.baseSalary !== undefined ? String(sal.baseSalary) : (sal.salary !== undefined ? String(sal.salary) : '35000'),
            hourlyRate: sal.hourlyRate !== undefined ? String(sal.hourlyRate) : '1000',
            country: sal.country || 'Pakistan',
            currency: sal.currency || 'PKR',
          });

          const guarantors = editingTeacher.guarantors || editingTeacher.profile?.guarantors || [];
          const g1 = guarantors[0] || {};
          const g2 = guarantors[1] || {};

          setGuarantorInfo({
            g1Name: g1.name || '',
            g1Phone: g1.phone || '',
            g1Email: g1.email || '',
            g1Relationship: g1.relationship || 'Father',
            g1Cnic: g1.cnicOrId || g1.cnic || '',
            g1Address: g1.address || '',

            g2Name: g2.name || '',
            g2Phone: g2.phone || '',
            g2Email: g2.email || '',
            g2Relationship: g2.relationship || 'Brother',
            g2Cnic: g2.cnicOrId || g2.cnic || '',
            g2Address: g2.address || '',
          });

          setCanEditProfile(Boolean(editingTeacher.canEditProfile || editingTeacher.profile?.canEditProfile));
          setCameraRestricted(Boolean(editingTeacher.cameraRestricted || editingTeacher.profile?.cameraRestricted));
        } else {
          // Reset for new teacher
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
            languages: getLanguagesForCountry('PK'),
          });

          setQualificationsInfo({
            specialization: ['Nazira & Tajweed'],
            qualification: ['Certified Hafiz & Qari'],
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
    }
  }, [isOpen, editingTeacher]);

  // Persist form draft to localStorage across page reloads
  useEffect(() => {
    if (!isOpen || completedMessage) return;
    try {
      const draft = {
        isOpen: true,
        step,
        editingTeacher: editingTeacher ? editingTeacher : null,
        personalInfo,
        qualificationsInfo,
        salaryInfo,
        guarantorInfo,
        canEditProfile,
        cameraRestricted,
        savedAt: Date.now(),
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch (err) {
      console.error('Failed to save teacher draft to localStorage:', err);
    }
  }, [
    isOpen,
    completedMessage,
    step,
    editingTeacher,
    personalInfo,
    qualificationsInfo,
    salaryInfo,
    guarantorInfo,
    canEditProfile,
    cameraRestricted,
  ]);

  const handleClose = () => {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch (_) {}
    onClose();
  };

  if (!isOpen) return null;

  // Comprehensive Step-by-Step Validation
  const validateStep = (stepNumber: number): string | null => {
    if (stepNumber === 1) {
      if (!personalInfo.name.trim()) return 'Full Name is required on Step 1.';
      if (personalInfo.name.trim().length < 2) return 'Full Name must be at least 2 characters on Step 1.';
      if (!personalInfo.email.trim()) return 'Email Address is required on Step 1.';
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(personalInfo.email.trim())) return 'Please enter a valid Email Address on Step 1.';
      if (!editingTeacher && (!personalInfo.password || personalInfo.password.length < 6)) {
        return 'Account Password is required for new teacher registration on Step 1 (minimum 6 characters).';
      }
      if (!personalInfo.country || !personalInfo.country.trim()) return 'Country is required on Step 1.';
      if (!personalInfo.phone || !personalInfo.phone.trim()) return 'Phone Number is required on Step 1.';
      const digits = personalInfo.phone.replace(/\D/g, '');
      if (digits.length < 7) return 'Phone Number must contain at least 7 digits on Step 1.';
      if (!personalInfo.languages || personalInfo.languages.length === 0) {
        return 'Please select at least one Spoken/Teaching Language on Step 1.';
      }
      if (!personalInfo.gender) return 'Gender is required on Step 1.';
      if (!personalInfo.dob) return 'Date of Birth is required on Step 1.';
      const dobDate = new Date(personalInfo.dob);
      if (isNaN(dobDate.getTime()) || dobDate >= new Date()) {
        return 'Date of Birth must be a valid date in the past on Step 1.';
      }
      if (!personalInfo.timezone || !personalInfo.timezone.trim()) return 'Timezone is required on Step 1.';
    } else if (stepNumber === 2) {
      if (!qualificationsInfo.specialization || qualificationsInfo.specialization.length === 0) {
        return 'Please select or specify at least one Specialization on Step 2.';
      }
      if (!qualificationsInfo.qualification || qualificationsInfo.qualification.length === 0) {
        return 'Please select or specify at least one Degree / Qualification on Step 2.';
      }
      if (!qualificationsInfo.employeeId || !qualificationsInfo.employeeId.trim()) {
        return 'Employee ID / System Code is required on Step 2.';
      }
      if (!qualificationsInfo.joiningDate) {
        return 'Academy Joining Date is required on Step 2.';
      }
    } else if (stepNumber === 3) {
      if (salaryInfo.payType === 'MONTHLY') {
        if (salaryInfo.baseSalary === '' || isNaN(Number(salaryInfo.baseSalary)) || Number(salaryInfo.baseSalary) < 0) {
          return 'Monthly Base Salary must be a valid non-negative number on Step 3.';
        }
      } else {
        if (salaryInfo.hourlyRate === '' || isNaN(Number(salaryInfo.hourlyRate)) || Number(salaryInfo.hourlyRate) < 0) {
          return 'Hourly Rate must be a valid non-negative number on Step 3.';
        }
      }
      if (!salaryInfo.currency || !salaryInfo.currency.trim()) {
        return 'Compensation Currency is required on Step 3.';
      }
    } else if (stepNumber === 4) {
      if (!guarantorInfo.g1Name.trim()) {
        return 'Primary Guarantor (#1) Name is required on Step 4.';
      }
      if (guarantorInfo.g1Name.trim().length < 2) {
        return 'Primary Guarantor (#1) Name must be at least 2 characters on Step 4.';
      }
      if (!guarantorInfo.g1Relationship.trim()) {
        return 'Primary Guarantor (#1) Relationship is required on Step 4.';
      }
      if (!guarantorInfo.g1Phone.trim()) {
        return 'Primary Guarantor (#1) Phone Number is required on Step 4.';
      }
      const g1Digits = guarantorInfo.g1Phone.replace(/\D/g, '');
      if (g1Digits.length < 7) {
        return 'Primary Guarantor (#1) Phone Number must contain at least 7 digits on Step 4.';
      }
      if (guarantorInfo.g1Email && guarantorInfo.g1Email.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(guarantorInfo.g1Email.trim())) {
          return 'Please provide a valid email address for Primary Guarantor (#1) on Step 4, or leave it blank.';
        }
      }

      // Check secondary guarantor if any field is filled
      const g2Filled = Boolean(
        guarantorInfo.g2Name.trim() ||
        guarantorInfo.g2Phone.trim() ||
        guarantorInfo.g2Cnic.trim() ||
        guarantorInfo.g2Email.trim()
      );
      if (g2Filled) {
        if (!guarantorInfo.g2Name.trim() || guarantorInfo.g2Name.trim().length < 2) {
          return 'Secondary Guarantor (#2) Name must be at least 2 characters on Step 4.';
        }
        if (!guarantorInfo.g2Relationship.trim()) {
          return 'Secondary Guarantor (#2) Relationship is required on Step 4.';
        }
        if (!guarantorInfo.g2Phone.trim()) {
          return 'Secondary Guarantor (#2) Phone Number is required on Step 4.';
        }
        const g2Digits = guarantorInfo.g2Phone.replace(/\D/g, '');
        if (g2Digits.length < 7) {
          return 'Secondary Guarantor (#2) Phone Number must contain at least 7 digits on Step 4.';
        }
        if (guarantorInfo.g2Email && guarantorInfo.g2Email.trim()) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(guarantorInfo.g2Email.trim())) {
            return 'Please provide a valid email address for Secondary Guarantor (#2) on Step 4, or leave it blank.';
          }
        }
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
    setStep((prev) => Math.min(prev + 1, 5));
  };

  const handleStepClick = (targetStep: number) => {
    setErrorMsg(null);
    if (targetStep < step) {
      setStep(targetStep);
      return;
    }
    // Validate all intervening steps before allowing skip
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

    // Guard: strictly do not allow submission unless on final step (Step 5)
    if (step < 5) {
      handleNext();
      return;
    }

    // Comprehensive validation across all steps before submitting
    for (let s = 1; s <= 5; s++) {
      const err = validateStep(s);
      if (err) {
        setErrorMsg(err);
        setStep(s);
        return;
      }
    }

    setSubmitting(true);

    try {
      const teacherPayload: any = {
        name: personalInfo.name.trim(),
        preferredName: personalInfo.preferredName?.trim() || undefined,
        email: personalInfo.email.trim(),
        role: 'TEACHER',
        gender: personalInfo.gender,
        dob: personalInfo.dob || undefined,
        dateOfBirth: personalInfo.dob || undefined,
        timezone: personalInfo.timezone,
        profilePicture: personalInfo.profilePicture || undefined,
        phone: personalInfo.phone?.trim() || undefined,
        phoneCode: personalInfo.phoneCode || undefined,
        cnicOrId: personalInfo.cnicOrId?.trim() || undefined,
        country: personalInfo.country,
        languages: personalInfo.languages || [],

        // Step 2: Qualifications
        specialization: Array.isArray(qualificationsInfo.specialization)
          ? qualificationsInfo.specialization.join(', ')
          : qualificationsInfo.specialization || '',
        qualification: Array.isArray(qualificationsInfo.qualification)
          ? qualificationsInfo.qualification.join(', ')
          : qualificationsInfo.qualification || '',
        employeeId: qualificationsInfo.employeeId?.trim() || undefined,
        joiningDate: qualificationsInfo.joiningDate || undefined,
        bio: qualificationsInfo.bio?.trim() || undefined,

        // Step 3: Salary Setup (direct top-level fields for backend DTO)
        payType: salaryInfo.payType || 'MONTHLY',
        salary: salaryInfo.payType === 'MONTHLY' ? (Number(salaryInfo.baseSalary) || 0) : undefined,
        hourlyRate: salaryInfo.payType === 'HOURLY' ? (Number(salaryInfo.hourlyRate) || 0) : 0,
        currency: salaryInfo.currency || 'PKR',

        // Step 4: Guarantor Info
        guarantors: (() => {
          const list: any[] = [];
          if (guarantorInfo.g1Name.trim()) {
            list.push({
              name: guarantorInfo.g1Name.trim(),
              phone: guarantorInfo.g1Phone.trim(),
              email: guarantorInfo.g1Email?.trim() || undefined,
              relationship: guarantorInfo.g1Relationship?.trim() || 'Father',
              cnicOrId: guarantorInfo.g1Cnic?.trim() || '',
              cnic: guarantorInfo.g1Cnic?.trim() || '',
              address: guarantorInfo.g1Address?.trim() || undefined,
            });
          }
          if (guarantorInfo.g2Name.trim()) {
            list.push({
              name: guarantorInfo.g2Name.trim(),
              phone: guarantorInfo.g2Phone.trim(),
              email: guarantorInfo.g2Email?.trim() || undefined,
              relationship: guarantorInfo.g2Relationship?.trim() || 'Brother',
              cnicOrId: guarantorInfo.g2Cnic?.trim() || '',
              cnic: guarantorInfo.g2Cnic?.trim() || '',
              address: guarantorInfo.g2Address?.trim() || undefined,
            });
          }
          return list;
        })(),

        // Step 5: Permissions
        canEditProfile,
        cameraRestricted,
      };

      if (!editingTeacher && personalInfo.password) {
        teacherPayload.password = personalInfo.password;
      }

      let teacherData: any = null;

      if (editingTeacher) {
        // When editing an existing teacher, email and password are intentionally not updated here
        // as they are handled via the separate Account Credentials dialog.
        delete teacherPayload.password;
        delete teacherPayload.email;

        const targetId = editingTeacher.id || editingTeacher._id;
        const res = await apiFetch(`${API_URL}/users/${targetId}`, {
          method: 'PUT',
          body: JSON.stringify(teacherPayload),
        });

        teacherData = await res.json();
        if (!res.ok) {
          const errMsg = Array.isArray(teacherData.message)
            ? teacherData.message.join(', ')
            : teacherData.message || 'Failed to update teacher profile.';
          throw new Error(errMsg);
        }

        try {
          localStorage.removeItem(DRAFT_KEY);
        } catch (_) {}

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

        try {
          localStorage.removeItem(DRAFT_KEY);
        } catch (_) {}

        setCompletedMessage(`Teacher ${teacherData.name} has been successfully registered.`);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during submission.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 md:p-6 lg:p-8 bg-background/80 backdrop-blur-md animate-fadeIn overflow-hidden">
      <div className="w-full max-w-5xl h-[92vh] max-h-[920px] rounded-3xl border border-border shadow-2xl bg-card text-foreground flex flex-col overflow-hidden relative">
        {/* 1. Header */}
        <TeacherHeader
          step={step}
          totalSteps={5}
          editingTeacher={editingTeacher}
          onClose={handleClose}
        />

        {/* 2. Top Stepper Progression Bar */}
        {!completedMessage && (
          <TeacherStepper
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
              <div className="mb-6 p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold flex items-center gap-2 shadow-sm animate-fadeIn">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* SUCCESS VIEW */}
            {completedMessage ? (
              <div className="py-16 flex flex-col items-center justify-center text-center space-y-4 max-w-lg mx-auto animate-fadeIn">
                <div className="h-20 w-20 rounded-3xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20 shadow-xl">
                  <CheckCircle className="h-12 w-12" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold font-display text-foreground">
                  {editingTeacher ? 'Teacher Profile Updated!' : 'Teacher Registration Completed!'}
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
                    Return to Teachers List
                  </button>
                </div>
              </div>
            ) : (
              <form
                id="teacher-wizard-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (step < 5) {
                    handleNext();
                  } else {
                    handleSubmit(e);
                  }
                }}
                className="space-y-6"
              >
                {step === 1 && (
                  <Step1PersonalDetails
                    personalInfo={personalInfo}
                    setPersonalInfo={setPersonalInfo}
                    editingTeacher={editingTeacher}
                    timezonesList={timezonesList}
                    onCountryChange={handleCountryChange}
                  />
                )}

                {step === 2 && (
                  <Step2Qualifications
                    qualificationsInfo={qualificationsInfo}
                    setQualificationsInfo={setQualificationsInfo}
                  />
                )}

                {step === 3 && (
                  <Step3SalarySetup
                    salaryInfo={salaryInfo}
                    setSalaryInfo={setSalaryInfo}
                    currenciesList={currenciesList}
                  />
                )}

                {step === 4 && (
                  <Step4Guarantors
                    guarantorInfo={guarantorInfo}
                    setGuarantorInfo={setGuarantorInfo}
                    countryCode={personalInfo.country}
                    phoneCode={personalInfo.phoneCode}
                  />
                )}

                {step === 5 && (
                  <Step5Permissions
                    cameraRestricted={cameraRestricted}
                    setCameraRestricted={setCameraRestricted}
                    canEditProfile={canEditProfile}
                    setCanEditProfile={setCanEditProfile}
                    personalInfo={personalInfo}
                    qualificationsInfo={qualificationsInfo}
                    salaryInfo={salaryInfo}
                  />
                )}
              </form>
            )}
          </div>
        </div>

        {/* 4. Pinned Bottom Footer Navigation */}
        {!completedMessage && (
          <TeacherFooter
            step={step}
            totalSteps={5}
            steps={STEPS}
            submitting={submitting}
            editingTeacher={editingTeacher}
            onBack={handleBack}
            onNext={handleNext}
            onSubmit={handleSubmit}
            onClose={handleClose}
          />
        )}
      </div>
    </div>
  );
}
