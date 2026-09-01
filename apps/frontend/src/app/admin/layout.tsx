'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground overflow-x-hidden">
      <Navbar
        role="ADMIN"
        subHeader="Compliance & Academy Administration Portal"
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full p-4 md:p-6 lg:p-8">
        <div className="mx-auto w-full max-w-7xl">
          {children}
        </div>
      </main>

      <Footer />
    </div>
  );
}
