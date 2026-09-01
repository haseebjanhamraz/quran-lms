'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { HelpCircle, Heart, Phone, Mail, MapPin } from 'lucide-react';
import SupportModal from './SupportModal';
import VersionBadge from './VersionBadge';

export default function Footer() {
  const [isSupportOpen, setIsSupportOpen] = useState(false);

  return (
    <>
      <footer className="w-full border-t border-blue-100 dark:border-blue-950/80 bg-slate-50/90 dark:bg-[#070e1e]/95 backdrop-blur-xl mt-auto py-8 px-4 md:px-8 transition-colors space-y-6">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-6">

          {/* Brand & Tagline */}
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-blue-200 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-500/10 p-1.5 flex items-center justify-center shadow-sm">
              <Image src="/logo.png" width={32} height={32} alt="Ain Ul Quran Logo" className="object-contain" />
            </div>
            <div>
              <p className="font-display text-base font-bold text-blue-600 dark:text-blue-400 leading-tight">Ain Ul Quran</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">E-Learning &amp; Quality Assurance Portal</p>
            </div>
          </div>

          {/* Contact Information Bar */}
          <div className="flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs text-slate-600 dark:text-slate-400">
            <a href="tel:+15552345678" className="flex items-center gap-1.5 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              <Phone className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              <span>+1 (555) 234-5678</span>
            </a>
            <a href="mailto:support@ainulquran.com" className="flex items-center gap-1.5 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              <Mail className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              <span>support@ainulquran.com</span>
            </a>
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              <span>123 Quran Academy Way, Suite 400</span>
            </span>
          </div>

          {/* Right: Social Media & Support Button */}
          <div className="flex items-center gap-4">
            {/* Social Icons */}
            <div className="flex items-center gap-2">
              {/* Facebook */}
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="h-9 w-9 rounded-xl bg-white dark:bg-[#0b1329] border border-blue-100 dark:border-blue-900/40 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-all shadow-sm"
              >
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>

              {/* Instagram */}
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="h-9 w-9 rounded-xl bg-white dark:bg-[#0b1329] border border-blue-100 dark:border-blue-900/40 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-pink-500 hover:border-pink-500/40 hover:bg-pink-50 dark:hover:bg-pink-950/30 transition-all shadow-sm"
              >
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>

              {/* YouTube */}
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                className="h-9 w-9 rounded-xl bg-white dark:bg-[#0b1329] border border-blue-100 dark:border-blue-900/40 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-red-500 hover:border-red-500/40 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all shadow-sm"
              >
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>

              {/* WhatsApp */}
              <a
                href="https://whatsapp.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="h-9 w-9 rounded-xl bg-white dark:bg-[#0b1329] border border-blue-100 dark:border-blue-900/40 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-emerald-500 hover:border-emerald-500/40 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-all shadow-sm"
              >
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
                </svg>
              </a>
            </div>

            {/* Support CTA Button */}
            <button
              onClick={() => setIsSupportOpen(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2 rounded-xl text-xs shadow-md shadow-blue-500/20 transition-all hover-lift"
            >
              <HelpCircle className="h-4 w-4" />
              <span>Get Support</span>
            </button>
          </div>
        </div>

        {/* Version And System Information */}
        <VersionBadge className="mx-auto max-w-7xl mt-6" />

        {/* Bottom Sub-row: Copyright & Legal */}
        <div className="mx-auto max-w-7xl pt-4 border-t border-blue-100/60 dark:border-blue-950/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <p>© {new Date().getFullYear()} Ain Ul Quran Academy. All rights reserved.</p>
          <div className="flex items-center gap-4 text-xs">
            <Link href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Privacy Policy</Link>
            <span>•</span>
            <Link href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Terms of Service</Link>
            <span>•</span>
            <span className="flex items-center gap-1">Made with <Heart className="h-3 w-3 text-red-500 fill-red-500" /> for Quran Education</span>
          </div>
        </div>
      </footer>

      {/* Support Popup Modal */}
      <SupportModal isOpen={isSupportOpen} onClose={() => setIsSupportOpen(false)} />
    </>
  );
}
