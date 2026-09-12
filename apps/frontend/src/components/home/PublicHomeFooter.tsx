import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MessageCircle, Heart } from 'lucide-react';
import { CourseDetail } from './CourseModal';
import { COURSES } from './homeData';

interface PublicHomeFooterProps {
  onSelectCourse: (course: CourseDetail) => void;
}

export default function PublicHomeFooter({ onSelectCourse }: PublicHomeFooterProps) {
  return (
    <footer className="bg-[#0A1628] dark:bg-[#040914] text-white border-t border-blue-900/60 dark:border-slate-800/80 w-full pt-16 pb-12 px-4 sm:px-6 lg:px-8 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-10 mb-12">
        {/* Column 1: Brand & Mission */}
        <div className="flex flex-col gap-4 max-w-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 p-1 flex items-center justify-center border border-white/20">
              <Image
                src="/logo.png"
                alt="Ain Ul Quran"
                width={36}
                height={36}
                className="object-contain"
              />
            </div>
            <span className="font-headline font-bold text-2xl text-white tracking-tight">
              Ain Ul Quran
            </span>
          </div>
          <p className="text-blue-100/80 dark:text-slate-400 text-sm leading-relaxed">
            Dedicated to providing high-quality, authentic Quranic education globally through modern, secure, and monitored e-learning platforms.
          </p>
          <div className="flex items-center gap-3 pt-2">
            <a
              href="https://wa.me/15552345678"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-blue-900/80 hover:bg-blue-800 text-xs font-semibold text-blue-100 transition-colors"
            >
              <MessageCircle className="w-4 h-4 text-sky-400" />
              <span>WhatsApp Admissions</span>
            </a>
          </div>
        </div>

        {/* Column 2: Navigation Links */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
          <div className="flex flex-col gap-3">
            <h4 className="font-headline text-xs font-bold uppercase tracking-wider text-blue-400">
              Courses
            </h4>
            <button
              onClick={() => onSelectCourse(COURSES[0])}
              className="text-left text-sm text-blue-100/80 dark:text-slate-400 hover:text-white transition-colors"
            >
              Noorani Qaida
            </button>
            <button
              onClick={() => onSelectCourse(COURSES[1])}
              className="text-left text-sm text-blue-100/80 dark:text-slate-400 hover:text-white transition-colors"
            >
              Tajweed Recitation
            </button>
            <button
              onClick={() => onSelectCourse(COURSES[2])}
              className="text-left text-sm text-blue-100/80 dark:text-slate-400 hover:text-white transition-colors"
            >
              Hifz Program
            </button>
            <button
              onClick={() => onSelectCourse(COURSES[3])}
              className="text-left text-sm text-blue-100/80 dark:text-slate-400 hover:text-white transition-colors"
            >
              Islamic Studies
            </button>
          </div>

          <div className="flex flex-col gap-3">
            <h4 className="font-headline text-xs font-bold uppercase tracking-wider text-blue-400">
              Academy
            </h4>
            <a href="#features" className="text-sm text-blue-100/80 dark:text-slate-400 hover:text-white transition-colors">
              Why Us
            </a>
            <a href="#how-it-works" className="text-sm text-blue-100/80 dark:text-slate-400 hover:text-white transition-colors">
              How It Works
            </a>
            <a href="#qa-monitoring" className="text-sm text-blue-100/80 dark:text-slate-400 hover:text-white transition-colors">
              QA Monitoring
            </a>
            <a href="#testimonials" className="text-sm text-blue-100/80 dark:text-slate-400 hover:text-white transition-colors">
              Reviews
            </a>
            <a href="#faq" className="text-sm text-blue-100/80 dark:text-slate-400 hover:text-white transition-colors">
              FAQ
            </a>
          </div>

          <div className="flex flex-col gap-3 col-span-2 sm:col-span-1">
            <h4 className="font-headline text-xs font-bold uppercase tracking-wider text-blue-400">
              Portal Access
            </h4>
            <Link href="/login" className="text-sm text-blue-100/80 dark:text-slate-400 hover:text-white transition-colors">
              Student Portal
            </Link>
            <Link href="/login" className="text-sm text-blue-100/80 dark:text-slate-400 hover:text-white transition-colors">
              Parent Portal
            </Link>
            <Link href="/login" className="text-sm text-blue-100/80 dark:text-slate-400 hover:text-white transition-colors">
              Teacher Login
            </Link>
            <Link href="/login" className="text-sm text-blue-100/80 dark:text-slate-400 hover:text-white transition-colors">
              Admin Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="max-w-7xl mx-auto pt-8 border-t border-blue-900/60 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-blue-200/70 dark:text-slate-500">
        <p>© {new Date().getFullYear()} Ain Ul Quran Academy. All rights reserved.</p>
        <div className="flex items-center gap-4">
          <Link href="#" className="hover:text-white transition-colors">
            Privacy Policy
          </Link>
          <span>•</span>
          <Link href="#" className="hover:text-white transition-colors">
            Terms of Service
          </Link>
          <span>•</span>
          <span className="flex items-center gap-1">
            Made with <Heart className="w-3 h-3 text-red-400 fill-red-400" /> for the Ummah
          </span>
        </div>
      </div>
    </footer>
  );
}
