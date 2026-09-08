'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MaterialsManager from '@/components/materials/MaterialsManager';

export default function TeacherMaterialsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground overflow-x-hidden">
      <Navbar role="TEACHER" subHeader="Teacher Academic & Compliance Portal" />
      <main className="flex-1 w-full p-4 md:p-6 lg:p-8">
        <div className="mx-auto">
          <MaterialsManager
            userRole="TEACHER"
            title="Teaching Materials & Curriculum Guides"
            subtitle="Access, preview, and upload curriculum PDFs, tajweed manuals, and student study guides."
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}
