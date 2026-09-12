'use client';

import React, { useState } from 'react';
import PublicHomeNavbar from '@/components/home/PublicHomeNavbar';
import CourseModal, { CourseDetail } from '@/components/home/CourseModal';
import HeroSection from '@/components/home/HeroSection';
import StatsBar from '@/components/home/StatsBar';
import BentoFeatures from '@/components/home/BentoFeatures';
import CourseCatalog from '@/components/home/CourseCatalog';
import HowItWorksSection from '@/components/home/HowItWorksSection';
import QaSupervisionSection from '@/components/home/QaSupervisionSection';
import TestimonialsSection from '@/components/home/TestimonialsSection';
import FaqSection from '@/components/home/FaqSection';
import AdmissionCtaSection from '@/components/home/AdmissionCtaSection';
import PublicHomeFooter from '@/components/home/PublicHomeFooter';

export default function HomePage() {
  const [selectedCourse, setSelectedCourse] = useState<CourseDetail | null>(null);

  return (
    <div className="min-h-screen flex flex-col bg-[#f8f9ff] dark:bg-[#070D1A] text-slate-800 dark:text-slate-100 transition-colors duration-300 overflow-x-hidden font-body selection:bg-blue-500/25 selection:text-blue-600">
      {/* Fixed Navigation Bar */}
      <PublicHomeNavbar />

      {/* Hero Section */}
      <HeroSection />

      {/* Stats & Trust Metrics */}
      <StatsBar />

      {/* Bento Grid Features */}
      <BentoFeatures />

      {/* Curriculum & Courses */}
      <CourseCatalog onSelectCourse={setSelectedCourse} />

      {/* 4-Step Learning Process */}
      <HowItWorksSection />

      {/* Dual-Layer QA Supervision */}
      <QaSupervisionSection />

      {/* Parent Testimonials & Reviews */}
      <TestimonialsSection />

      {/* Frequently Asked Questions */}
      <FaqSection />

      {/* Admission Inquiry & Application */}
      <AdmissionCtaSection />

      {/* Public Footer */}
      <PublicHomeFooter onSelectCourse={setSelectedCourse} />

      {/* Interactive Course Details Modal */}
      <CourseModal
        course={selectedCourse}
        onClose={() => setSelectedCourse(null)}
      />
    </div>
  );
}
