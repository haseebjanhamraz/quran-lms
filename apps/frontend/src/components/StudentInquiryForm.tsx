'use client';

import React, { useState } from 'react';
import {
  User,
  Calendar,
  Clock,
  Mail,
  Phone,
  Globe,
  MessageSquare,
  BookOpen,
  CheckCircle2,
  Sparkles,
  Loader2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

export const AVAILABLE_COURSES = [
  'Noorani Qaida (Beginners)',
  'Quran Reading / Nazira',
  'Tajweed & Rules of Recitation',
  'Quran Memorization (Hifz)',
  'Islamic Studies & Duas',
  'Arabic Language for Quran',
];

export const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export const TIME_SLOTS = [
  'Morning (07:00 AM - 10:00 AM PKT)',
  'Late Morning (10:00 AM - 01:00 PM PKT)',
  'Afternoon (01:00 PM - 04:00 PM PKT)',
  'Evening (04:00 PM - 07:00 PM PKT)',
  'Night (07:00 PM - 10:00 PM PKT)',
  'Late Night (10:00 PM - 01:00 AM PKT)',
  'Flexible / Any Slot',
];

export const LANGUAGES = [
  'English',
  'Urdu',
  'Arabic',
  'Pashto',
  'French',
  'German',
  'Other',
];

interface StudentInquiryFormProps {
  onSuccess?: () => void;
  className?: string;
  variant?: 'card' | 'embedded';
}

export default function StudentInquiryForm({
  onSuccess,
  className = '',
  variant = 'card',
}: StudentInquiryFormProps) {
  const [formData, setFormData] = useState({
    studentName: '',
    age: '',
    courses: [] as string[],
    preferredDays: [] as string[],
    classTime: 'Evening (04:00 PM - 07:00 PM PKT)',
    email: '',
    phoneOrWhatsapp: '',
    classLanguage: 'English',
    message: '',
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

  const handleCourseToggle = (course: string) => {
    setFormData((prev) => {
      const exists = prev.courses.includes(course);
      return {
        ...prev,
        courses: exists
          ? prev.courses.filter((c) => c !== course)
          : [...prev.courses, course],
      };
    });
  };

  const handleDayToggle = (day: string) => {
    setFormData((prev) => {
      const exists = prev.preferredDays.includes(day);
      return {
        ...prev,
        preferredDays: exists
          ? prev.preferredDays.filter((d) => d !== day)
          : [...prev.preferredDays, day],
      };
    });
  };

  const handleSelectAllDays = () => {
    setFormData((prev) => ({
      ...prev,
      preferredDays: prev.preferredDays.length === DAYS_OF_WEEK.length ? [] : [...DAYS_OF_WEEK],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (formData.courses.length === 0) {
      setErrorMessage('Please select at least one course.');
      return;
    }

    if (formData.preferredDays.length === 0) {
      setErrorMessage('Please select at least one preferred class day.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/student-inquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to submit inquiry. Please try again.');
      }

      setSubmitted(true);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error while submitting. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="py-12 px-6 text-center space-y-4 rounded-3xl bg-card border border-border shadow-xl animate-fadeIn">
        <div className="h-16 w-16 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        <h3 className="font-display text-2xl font-bold text-foreground">
          Student Information Received!
        </h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
          JazakAllah Khair! We have registered <span className="font-semibold text-foreground">{formData.studentName}</span>’s admission inquiry. Our academic team will contact you via WhatsApp or Email within 2 to 4 hours to arrange your complimentary trial class.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => {
              setSubmitted(false);
              setFormData({
                studentName: '',
                age: '',
                courses: [],
                preferredDays: [],
                classTime: 'Evening (04:00 PM - 07:00 PM PKT)',
                email: '',
                phoneOrWhatsapp: '',
                classLanguage: 'English',
                message: '',
              });
            }}
            className="px-5 py-2.5 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-muted transition"
          >
            Submit Another Student
          </button>
          <Link
            href="/login"
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition"
          >
            <span>Access Student Portal</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`space-y-6 ${
        variant === 'card'
          ? 'rounded-3xl bg-card/90 backdrop-blur-xl border border-border p-6 sm:p-8 shadow-2xl'
          : ''
      } ${className}`}
    >
      <div className="border-b border-border/60 pb-4">
        <div className="flex items-center gap-2.5 text-blue-600 dark:text-blue-400 mb-1">
          <Sparkles className="h-5 w-5" />
          <span className="text-xs font-bold uppercase tracking-wider">Student Admission & Class Registration</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-display font-bold text-foreground">
          Student Information Form
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Provide the student details below to match with a certified scholar and configure your custom class timetable.
        </p>
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold flex items-center gap-2 animate-shake">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Row 1: Student Name & Age */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <User size={13} className="text-primary" />
            <span>Student’s Name *</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Zayd Abdullah"
            value={formData.studentName}
            onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
            className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-border bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Calendar size={13} className="text-primary" />
            <span>Age *</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. 9 years (or Adults)"
            value={formData.age}
            onChange={(e) => setFormData({ ...formData, age: e.target.value })}
            className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-border bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
          />
        </div>
      </div>

      {/* Row 2: Select Courses (Multi-Select Pills) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <BookOpen size={13} className="text-primary" />
            <span>Select Courses *</span>
          </label>
          <span className="text-[11px] text-muted-foreground font-medium">
            {formData.courses.length} selected
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {AVAILABLE_COURSES.map((course) => {
            const isSelected = formData.courses.includes(course);
            return (
              <button
                type="button"
                key={course}
                onClick={() => handleCourseToggle(course)}
                className={`flex items-center justify-between p-2.5 rounded-xl text-xs font-medium border transition-all text-left ${
                  isSelected
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm font-semibold'
                    : 'bg-muted/40 hover:bg-muted text-foreground border-border/80'
                }`}
              >
                <span>{course}</span>
                {isSelected && <CheckCircle2 size={13} className="shrink-0 ml-1.5" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Row 3: Select Preferred Class Days */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Calendar size={13} className="text-primary" />
            <span>Select your preferred class days *</span>
          </label>
          <button
            type="button"
            onClick={handleSelectAllDays}
            className="text-[11px] text-primary hover:underline font-semibold"
          >
            {formData.preferredDays.length === DAYS_OF_WEEK.length ? 'Clear All' : 'Select All Days'}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {DAYS_OF_WEEK.map((day) => {
            const isSelected = formData.preferredDays.includes(day);
            return (
              <button
                type="button"
                key={day}
                onClick={() => handleDayToggle(day)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm font-semibold'
                    : 'bg-muted/40 hover:bg-muted text-foreground border-border/80'
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>

      {/* Row 4: Select Class Time & Language */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Clock size={13} className="text-primary" />
            <span>Select your class time *</span>
          </label>
          <select
            required
            value={formData.classTime}
            onChange={(e) => setFormData({ ...formData, classTime: e.target.value })}
            className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-border bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
          >
            {TIME_SLOTS.map((slot) => (
              <option key={slot} value={slot}>
                {slot}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Globe size={13} className="text-primary" />
            <span>Class Language *</span>
          </label>
          <select
            required
            value={formData.classLanguage}
            onChange={(e) => setFormData({ ...formData, classLanguage: e.target.value })}
            className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-border bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Row 5: Email & Phone / Whatsapp */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Mail size={13} className="text-primary" />
            <span>Email *</span>
          </label>
          <input
            type="email"
            required
            placeholder="parent.contact@example.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-border bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Phone size={13} className="text-emerald-500" />
            <span>Phone Number / Whatsapp *</span>
          </label>
          <input
            type="tel"
            required
            placeholder="+1 234 567 8900 or +92 300 1234567"
            value={formData.phoneOrWhatsapp}
            onChange={(e) => setFormData({ ...formData, phoneOrWhatsapp: e.target.value })}
            className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-border bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
          />
        </div>
      </div>

      {/* Row 6: Message */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <MessageSquare size={13} className="text-primary" />
          <span>Message (Optional)</span>
        </label>
        <textarea
          rows={3}
          placeholder="Any specific learning goals, previous Quran background, or teacher preferences (e.g. female teacher preference)..."
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-border bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition resize-none"
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg hover:shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-70"
      >
        {loading ? (
          <>
            <Loader2 className="animate-spin h-4 w-4" />
            <span>Submitting Student Information...</span>
          </>
        ) : (
          <>
            <span>Submit Student Information</span>
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>
    </form>
  );
}
