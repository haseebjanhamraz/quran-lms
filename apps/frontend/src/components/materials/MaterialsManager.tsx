'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { apiFetch } from '@/utils/apiFetch';
import { useAuth } from '@/context/AuthContext';
import { MaterialItem, MaterialsManagerProps, CourseOption } from './types';
import MaterialsHeader from './MaterialsHeader';
import MaterialsStats from './MaterialsStats';
import MaterialsFilterBar from './MaterialsFilterBar';
import MaterialsGrid from './MaterialsGrid';
import UploadMaterialModal from './UploadMaterialModal';

export type { MaterialItem, MaterialsManagerProps } from './types';

export default function MaterialsManager({
  userRole,
  title = 'Course Materials & Curriculum Resources',
  subtitle = 'Browse, read, and share curriculum PDFs, tajweed manuals, and student lesson notes.',
  className = '',
}: MaterialsManagerProps) {
  const { user } = useAuth();
  const canDelete = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedLevel, setSelectedLevel] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`${API_URL}/materials`);
      if (res.ok) {
        const data = await res.json();
        setMaterials(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error fetching materials:', err);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  const fetchCourses = useCallback(async () => {
    try {
      const res = await apiFetch(`${API_URL}/courses`);
      if (res.ok) {
        const data = await res.json();
        setCourses(Array.isArray(data) ? data : []);
      }
    } catch (_) {}
  }, [API_URL]);

  useEffect(() => {
    fetchMaterials();
    fetchCourses();
  }, [fetchMaterials, fetchCourses]);

  const filteredMaterials = useMemo(() => {
    return materials.filter((item) => {
      if (selectedCategory !== 'ALL' && item.category !== selectedCategory) return false;
      if (selectedLevel !== 'ALL' && item.targetLevel !== selectedLevel) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const tMatch = item.title?.toLowerCase().includes(q);
        const dMatch = item.description?.toLowerCase().includes(q);
        const fMatch = item.fileName?.toLowerCase().includes(q);
        if (!tMatch && !dMatch && !fMatch) return false;
      }
      return true;
    });
  }, [materials, selectedCategory, selectedLevel, searchQuery]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this PDF material?')) return;
    try {
      const res = await apiFetch(`${API_URL}/materials/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchMaterials();
      } else {
        alert('Failed to delete material.');
      }
    } catch (err) {
      console.error('Error deleting material:', err);
    }
  };

  const hasFilters = Boolean(
    searchQuery.trim() || selectedCategory !== 'ALL' || selectedLevel !== 'ALL'
  );

  return (
    <div className={`space-y-8 animate-fadeIn ${className}`}>
      {/* Top Banner */}
      <MaterialsHeader
        title={title}
        subtitle={subtitle}
        loading={loading}
        onRefresh={fetchMaterials}
        onOpenUpload={() => setIsUploadModalOpen(true)}
      />

      {/* Stats Cards */}
      <MaterialsStats materials={materials} />

      {/* Search and Secondary Filter Bar */}
      <MaterialsFilterBar
        materials={materials}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedLevel={selectedLevel}
        onSelectLevel={setSelectedLevel}
      />

      {/* Materials Grid / States */}
      <MaterialsGrid
        loading={loading}
        materials={filteredMaterials}
        hasFilters={hasFilters}
        canDelete={canDelete}
        onDelete={handleDelete}
        onOpenUpload={() => setIsUploadModalOpen(true)}
      />

      {/* Upload Material Modal */}
      <UploadMaterialModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={fetchMaterials}
        courses={courses}
      />
    </div>
  );
}
