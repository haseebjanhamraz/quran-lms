'use client';

import React from 'react';
import MaterialsManager from '@/components/materials/MaterialsManager';

export default function AdminMaterialsPage() {
  return (
    <MaterialsManager
      userRole="ADMIN"
      title="Course Materials & PDF Management"
      subtitle="Upload, categorize, preview, and distribute curriculum PDFs, tajweed manuals, and study guides."
    />
  );
}