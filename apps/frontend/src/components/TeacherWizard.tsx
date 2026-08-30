'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  User, Shield, GraduationCap, CreditCard, Lock, CheckCircle, AlertCircle
} from 'lucide-react';
import { apiFetch } from '@/utils/apiFetch';
import { CountryInfo, getAllCurrencies, getAllTimezones } from '@/utils/countries';

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
  });

  // Step 2: Qualifications & Bio
  const [qualificationsInfo, setQualificationsInfo] = useState<TeacherQualificationsInfo>({
    specialization: 'Nazira & Tajweed',
    qualification: 'Certified Hafiz & Qari',
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
          dob: editingTeacher.dob || editingTeacher.dateOfBirth
            ? new Date(editingTeacher.dob || editingTeacher.dateOfBirth).toISOString().split('T')[0]
            : '',
          timezone: editingTeacher.timezone || 'Asia/Karachi',
          profilePicture: editingTeacher.profilePicture || editingTeacher.avatar || '',
        });

        setQualificationsInfo({
          specialization: editingTeacher.specialization || 'Nazira & Tajweed',
          qualification: editingTeacher.qualification || 'Certified Hafiz & Qari',
          employeeId: editingTeacher.employeeId || '',
          joiningDate: editingTeacher.joiningDate
            ? new Date(editingTeacher.joiningDate).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0],
          bio: editingTeacher.bio || '',
        });

        const sal = editingTeacher.salaryProfile || {};
        setSalaryInfo({
          payType: sal.payType || 'MONTHLY',
          baseSalary: sal.baseSalary !== undefined ? String(sal.baseSalary) : '35000',
          hourlyRate: sal.hourlyRate !== undefined ? String(sal.hourlyRate) : '1000',
          country: sal.country || 'Pakistan',
          currency: sal.currency || 'PKR',
        });

        const guarantors = editingTeacher.guarantors || [];
        const g1 = guarantors[0] || {};
        const g2 = guarantors[1] || {};

        setGuarantorInfo({
          g1Name: g1.name || '',
          g1Phone: g1.phone || '',
          g1Email: g1.email || '',
          g1Relationship: g1.relationship || 'Father',
          g1Cnic: g1.cnic || '',
          g1Address: g1.address || '',

          g2Name: g2.name || '',
          g2Phone: g2.phone || '',
          g2Email: g2.email || '',
          g2Relationship: g2.relationship || 'Brother',
          g2Cnic: g2.cnic || '',
          g2Address: g2.address || '',
        });

        setCanEditProfile(Boolean(editingTeacher.canEditProfile));
        setCameraRestricted(Boolean(editingTeacher.cameraRestricted));
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
      if (!personalInfo.name.trim()) {
        setErrorMsg('Please enter the Teacher Full Name.');
        return;
      }
      if (!personalInfo.email.trim()) {
        setErrorMsg('Please enter a valid Email Address.');
        return;
      }
      if (!editingTeacher && !personalInfo.password) {
        setErrorMsg('Account Password is required for new teacher registration.');
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
        canEditProfile,
        cameraRestricted,
        salaryProfile: {
          payType: salaryInfo.payType,
          baseSalary: Number(salaryInfo.baseSalary) || 0,
          hourlyRate: Number(salaryInfo.hourlyRate) || 0,
          currency: salaryInfo.currency,
          country: salaryInfo.country,
        },
        guarantors: (() => {
          const list: any[] = [];
          if (guarantorInfo.g1Name.trim()) {
            list.push({
              name: guarantorInfo.g1Name,
              phone: guarantorInfo.g1Phone,
              email: guarantorInfo.g1Email,
              relationship: guarantorInfo.g1Relationship,
              cnic: guarantorInfo.g1Cnic,
              address: guarantorInfo.g1Address,
            });
          }
          if (guarantorInfo.g2Name.trim()) {
            list.push({
              name: guarantorInfo.g2Name,
              phone: guarantorInfo.g2Phone,
              email: guarantorInfo.g2Email,
              relationship: guarantorInfo.g2Relationship,
              cnic: guarantorInfo.g2Cnic,
              address: guarantorInfo.g2Address,
            });
          }
          return list;
        })(),
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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 md:p-6 lg:p-8 bg-background/80 backdrop-blur-md animate-fadeIn overflow-hidden">
      <div className="w-full max-w-5xl h-[92vh] max-h-[920px] rounded-3xl border border-border shadow-2xl bg-card text-foreground flex flex-col overflow-hidden relative">
        {/* 1. Header */}
        <TeacherHeader
          step={step}
          totalSteps={5}
          editingTeacher={editingTeacher}
          onClose={onClose}
        />

        {/* 2. Top Stepper Progression Bar */}
        {!completedMessage && (
          <TeacherStepper
            steps={STEPS}
            currentStep={step}
            onStepClick={(sNum) => setStep(sNum)}
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
                      onClose();
                    }}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-2xl text-sm font-bold shadow-xl hover:scale-105 transition-all"
                  >
                    Return to Teachers List
                  </button>
                </div>
              </div>
            ) : (
              <form id="teacher-wizard-form" onSubmit={handleSubmit} className="space-y-6">
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
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
}
