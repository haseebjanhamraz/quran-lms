'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import StudentInquiryForm from '@/components/StudentInquiryForm';
import { ArrowLeft, ShieldCheck, Award, HeartHandshake } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';

export default function StudentInquiryPage() {
  return (
    <div className="min-h-screen bg-background text-foreground py-8 px-4 sm:px-6 lg:px-8">
      {/* Top Bar */}
      <div className="max-w-4xl mx-auto flex items-center justify-between pb-6 border-b border-border/60 mb-8">
        <Link href="/" className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition">
          <ArrowLeft size={16} />
          <span>Back to Home</span>
        </Link>

        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="rounded-xl border border-primary/30 bg-primary/10 p-1.5 flex items-center justify-center shadow-sm">
            <Image src="/logo.png" width={26} height={26} alt="Ain Ul Quran Logo" priority />
          </div>
          <span className="text-base font-bold font-display tracking-tight text-foreground">
            Ain Ul Quran
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <ThemeToggle variant="default" />
          <Link
            href="/login"
            className="text-xs font-bold px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow transition"
          >
            Portal Login
          </Link>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-3xl mx-auto">
        <StudentInquiryForm variant="card" />

        {/* Value Props & Trust Badges */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="p-4 rounded-2xl bg-card/60 border border-border flex flex-col items-center">
            <Award className="h-6 w-6 text-amber-500 mb-2" />
            <h4 className="text-xs font-bold text-foreground">Certified Scholars</h4>
            <p className="text-[11px] text-muted-foreground mt-0.5">Al-Azhar & Wafaq certified teachers</p>
          </div>

          <div className="p-4 rounded-2xl bg-card/60 border border-border flex flex-col items-center">
            <ShieldCheck className="h-6 w-6 text-blue-500 mb-2" />
            <h4 className="text-xs font-bold text-foreground">Dual Quality Supervision</h4>
            <p className="text-[11px] text-muted-foreground mt-0.5">Continuous lesson auditing and reports</p>
          </div>

          <div className="p-4 rounded-2xl bg-card/60 border border-border flex flex-col items-center">
            <HeartHandshake className="h-6 w-6 text-emerald-500 mb-2" />
            <h4 className="text-xs font-bold text-foreground">100% Free Trial</h4>
            <p className="text-[11px] text-muted-foreground mt-0.5">No credit card or prepayment required</p>
          </div>
        </div>
      </div>
    </div>
  );
}
