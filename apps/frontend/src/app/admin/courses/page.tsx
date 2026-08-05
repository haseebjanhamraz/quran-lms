'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  BookOpen, Plus, Trash2, Edit, Eye, Sparkles, BookUser, CheckCircle, Award,
  Layers, Tag, Loader2, XCircle, Palette, Check
} from 'lucide-react';
import { apiFetch } from '@/utils/apiFetch';
import DataTable, { Column, FilterOption } from '@/components/DataTable';
import CourseModal, { CourseItem, TeacherItem } from '@/components/CourseModal';
import CourseDetailModal from '@/components/CourseDetailModal';

export const dynamic = 'force-dynamic';

interface SubjectCategoryItem {
  id: string;
  _id?: string;
  name: string;
  code: string;
  description?: string;
  color?: string;
  isActive: boolean;
}

const PRESET_COLORS = [
  '#10b981', // Emerald
  '#3b82f6', // Blue
  '#8b5cf6', // Purple
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#6366f1', // Indigo
  '#14b8a6', // Teal
  '#f43f5e', // Rose
];

function CourseManagementContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Active Tab from URL query parameter: 'courses' | 'categories'
  const activeTab = searchParams.get('tab') || 'courses';

  const handleTabChange = (tabKey: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tabKey);
    router.push(`/admin/courses?${params.toString()}`, { scroll: false });
  };

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

  // --- Courses State ---
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);

  // Course Modals state
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CourseItem | null>(null);
  const [viewingCourse, setViewingCourse] = useState<CourseItem | null>(null);

  // --- Subject Categories State ---
  const [categories, setCategories] = useState<SubjectCategoryItem[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Category Modal state
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<SubjectCategoryItem | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [categoryCode, setCategoryCode] = useState('');
  const [categoryDescription, setCategoryDescription] = useState('');
  const [categoryColor, setCategoryColor] = useState('#10b981');
  const [categoryIsActive, setCategoryIsActive] = useState(true);
  const [submittingCategory, setSubmittingCategory] = useState(false);

  // Fetch Courses or Categories depending on active tab
  useEffect(() => {
    fetchCoursesData();
    fetchCategoriesData();
  }, [activeTab]);

  const fetchCoursesData = async () => {
    setLoadingCourses(true);
    try {
      const [courseRes, usersRes] = await Promise.all([
        apiFetch(`${API_URL}/courses`),
        apiFetch(`${API_URL}/users`),
      ]);

      if (courseRes.ok) {
        const coursesData = await courseRes.json();
        setCourses(Array.isArray(coursesData) ? coursesData : []);
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        const teachersOnly = Array.isArray(usersData) ? usersData.filter((u: any) => u.role === 'TEACHER') : [];
        setTeachers(teachersOnly);
      }
    } catch (err) {
      console.error('Error loading courses:', err);
    } finally {
      setLoadingCourses(false);
    }
  };

  const fetchCategoriesData = async () => {
    setLoadingCategories(true);
    try {
      const res = await apiFetch(`${API_URL}/courses/categories`);
      if (res.ok) {
        const data = await res.json();
        setCategories(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error loading categories:', err);
    } finally {
      setLoadingCategories(false);
    }
  };

  // --- Course Handlers ---
  const handleDeleteCourse = async (id: string) => {
    if (!confirm('Are you sure you want to delete this course? All associated schedules will be deleted.')) {
      return;
    }
    try {
      const res = await apiFetch(`${API_URL}/courses/${id}`, { method: 'DELETE' });
      if (res.ok) fetchCoursesData();
    } catch (err) {
      console.error('Error deleting course:', err);
    }
  };

  // --- Category Handlers ---
  const openCategoryModal = (catToEdit: SubjectCategoryItem | null = null) => {
    if (catToEdit) {
      setEditingCategory(catToEdit);
      setCategoryName(catToEdit.name);
      setCategoryCode(catToEdit.code);
      setCategoryDescription(catToEdit.description || '');
      setCategoryColor(catToEdit.color || '#10b981');
      setCategoryIsActive(catToEdit.isActive !== false);
    } else {
      setEditingCategory(null);
      setCategoryName('');
      setCategoryCode('');
      setCategoryDescription('');
      setCategoryColor('#10b981');
      setCategoryIsActive(true);
    }
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim() || !categoryCode.trim()) return;
    setSubmittingCategory(true);

    const payload = {
      name: categoryName.trim(),
      code: categoryCode.trim().toUpperCase(),
      description: categoryDescription.trim(),
      color: categoryColor,
      isActive: categoryIsActive,
    };

    try {
      const catId = editingCategory?.id || editingCategory?._id;
      const url = catId ? `${API_URL}/courses/categories/${catId}` : `${API_URL}/courses/categories`;
      const method = catId ? 'PUT' : 'POST';

      const res = await apiFetch(url, {
        method,
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsCategoryModalOpen(false);
        fetchCategoriesData();
      }
    } catch (err) {
      console.error('Error saving subject category:', err);
    } finally {
      setSubmittingCategory(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this subject category?')) return;
    try {
      const res = await apiFetch(`${API_URL}/courses/categories/${id}`, { method: 'DELETE' });
      if (res.ok) fetchCategoriesData();
    } catch (err) {
      console.error('Error deleting category:', err);
    }
  };

  // --- Computations ---
  const stats = useMemo(() => {
    const total = courses.length;
    const tajweedAndNazira = courses.filter(c => c.type === 'TAJWEED' || c.type === 'NAZIRA').length;
    const hifz = courses.filter(c => c.type === 'HIFZ_UL_QURAN').length;
    const islamic = courses.filter(c => c.type === 'ISLAMIC_STUDIES').length;
    return { total, tajweedAndNazira, hifz, islamic };
  }, [courses]);

  // Filters for Course DataTable
  const courseFilterOptions: FilterOption[] = [
    { key: 'ALL', label: 'All Courses', predicate: () => true },
    { key: 'TAJWEED', label: 'Tajweed', predicate: (c) => c.type === 'TAJWEED' },
    { key: 'NAZIRA', label: 'Nazira', predicate: (c) => c.type === 'NAZIRA' },
    { key: 'HIFZ_UL_QURAN', label: 'Hifz-ul-Quran', predicate: (c) => c.type === 'HIFZ_UL_QURAN' },
    { key: 'ISLAMIC_STUDIES', label: 'Islamic Studies', predicate: (c) => c.type === 'ISLAMIC_STUDIES' },
  ];

  const getCategoryBadgeStyle = (type: string) => {
    const matchingCat = categories.find((cat) => cat.code === type || cat.name === type);
    if (matchingCat?.color) {
      return {
        backgroundColor: `${matchingCat.color}15`,
        color: matchingCat.color,
        borderColor: `${matchingCat.color}30`,
      };
    }
    switch (type) {
      case 'TAJWEED':
        return { backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.2)' };
      case 'HIFZ_UL_QURAN':
        return { backgroundColor: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', borderColor: 'rgba(139, 92, 246, 0.2)' };
      case 'NAZIRA':
        return { backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', borderColor: 'rgba(59, 130, 246, 0.2)' };
      case 'ISLAMIC_STUDIES':
        return { backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.2)' };
      default:
        return { backgroundColor: 'rgba(156, 163, 175, 0.1)', color: '#9ca3af', borderColor: 'rgba(156, 163, 175, 0.2)' };
    }
  };

  // Columns definition for Courses DataTable
  const courseColumns: Column<CourseItem>[] = [
    {
      key: 'serialNo',
      label: '#',
      render: (_c, _idx, globalIdx) => (
        <span className="font-mono text-xs text-muted-foreground/80 font-medium">
          {globalIdx}
        </span>
      ),
    },
    {
      key: 'title',
      label: 'Course Details',
      sortable: true,
      render: (c) => {
        const idStr = c.id || c._id || '';
        return (
          <div>
            <p className="font-semibold text-foreground leading-snug">{c.title}</p>
            <p className="text-[11px] text-muted-foreground font-mono">ID: {idStr.substring(0, 8)}...</p>
          </div>
        );
      },
    },
    {
      key: 'type',
      label: 'Subject Category',
      sortable: true,
      render: (c) => {
        const style = getCategoryBadgeStyle(c.type);
        return (
          <span
            className="text-[11px] font-bold px-2.5 py-1 rounded-full border"
            style={style}
          >
            {c.type}
          </span>
        );
      },
    },
    {
      key: 'teacher',
      label: 'Primary Instructor',
      sortable: true,
      render: (c) => (
        c.teacher ? (
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-full bg-brand/10 text-brand flex items-center justify-center text-xs font-bold shrink-0 border border-brand/20">
              {c.teacher.name?.charAt(0)}
            </div>
            <div>
              <p className="font-semibold text-foreground leading-tight">{c.teacher.name}</p>
              <p className="text-[11px] text-muted-foreground">{c.teacher.email}</p>
            </div>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground italic">Unassigned</span>
        )
      ),
    },
    {
      key: 'curriculum',
      label: 'Curriculum Syllabus',
      render: (c) => (
        <span className="max-w-xs truncate text-xs text-muted-foreground block" title={c.curriculum}>
          {c.curriculum}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      render: (c) => {
        const idStr = c.id || c._id || '';
        return (
          <div className="flex justify-end gap-1">
            <button
              type="button"
              onClick={() => setViewingCourse(c)}
              className="text-muted-foreground hover:text-primary transition-colors p-2 hover:bg-primary/10 rounded-lg"
              title="View Full Course Details"
            >
              <Eye className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingCourse(c);
                setIsCourseModalOpen(true);
              }}
              className="text-muted-foreground hover:text-foreground transition-colors p-2 hover:bg-muted rounded-lg"
              title="Edit Course"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => handleDeleteCourse(idStr)}
              className="text-muted-foreground hover:text-destructive transition-colors p-2 hover:bg-destructive/10 rounded-lg"
              title="Delete Course"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="relative mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-brand" />
            <span>Manage Courses & Subject Categories</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure subjects, define course syllabi, assign instructors, and manage subject categories.
          </p>
        </div>

        {activeTab === 'courses' ? (
          <button
            type="button"
            onClick={() => {
              setEditingCourse(null);
              setIsCourseModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-primary/10 transition-all duration-300 outline-none hover-lift self-start"
          >
            <Plus className="h-5 w-5" />
            <span>Create Course</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => openCategoryModal(null)}
            className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-primary/10 transition-all duration-300 outline-none hover-lift self-start"
          >
            <Plus className="h-5 w-5" />
            <span>Create Subject Category</span>
          </button>
        )}
      </div>

      {/* Main Tab Navigation Bar */}
      <div className="glass-panel p-1.5 rounded-2xl flex items-center gap-2 border border-border/60 bg-card/60 shadow-sm">
        <button
          type="button"
          onClick={() => handleTabChange('courses')}
          className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'courses'
              ? 'bg-primary text-primary-foreground shadow-md'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <BookOpen className="h-4 w-4" />
          <span>Courses List ({courses.length})</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('categories')}
          className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'categories'
              ? 'bg-primary text-primary-foreground shadow-md'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Subject Categories ({categories.length})</span>
        </button>
      </div>

      {/* TAB 1: COURSES LIST */}
      {activeTab === 'courses' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Ribbon Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-panel p-5 rounded-2xl flex items-center gap-4 border border-border/50">
              <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500">
                <BookOpen className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                <p className="text-xs text-muted-foreground font-medium">Total Courses</p>
              </div>
            </div>

            <div className="glass-panel p-5 rounded-2xl flex items-center gap-4 border border-border/50">
              <div className="p-3 rounded-xl bg-purple-500/10 text-purple-500">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-500">{stats.tajweedAndNazira}</p>
                <p className="text-xs text-muted-foreground font-medium">Tajweed & Nazira</p>
              </div>
            </div>

            <div className="glass-panel p-5 rounded-2xl flex items-center gap-4 border border-border/50">
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
                <CheckCircle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-500">{stats.hifz}</p>
                <p className="text-xs text-muted-foreground font-medium">Hifz-ul-Quran</p>
              </div>
            </div>

            <div className="glass-panel p-5 rounded-2xl flex items-center gap-4 border border-border/50">
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500">
                <Award className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-500">{stats.islamic}</p>
                <p className="text-xs text-muted-foreground font-medium">Islamic Studies</p>
              </div>
            </div>
          </div>

          {/* Reusable Paginated & Filterable Data Table */}
          <DataTable
            columns={courseColumns}
            data={courses}
            searchKeys={['title', 'type', 'curriculum']}
            searchPlaceholder="Search courses by title, category, or curriculum..."
            filters={courseFilterOptions}
            initialItemsPerPage={10}
            itemsPerPageOptions={[5, 10, 20, 50, 100]}
            loading={loadingCourses}
            emptyMessage="No courses configured yet matching your filter criteria."
            keyExtractor={(c) => c.id || c._id || c.title}
          />
        </div>
      )}

      {/* TAB 2: SUBJECT CATEGORIES */}
      {activeTab === 'categories' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="glass-panel p-5 rounded-2xl border border-border/50 bg-card/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-brand/15 text-brand border border-brand/20">
                <Layers className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Subject Categories Overview</h3>
                <p className="text-xs text-muted-foreground font-medium">Manage subject classification codes, accent badges, and descriptions</p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-brand/10 text-brand border border-brand/20">
              {categories.length} Categories Configured
            </span>
          </div>

          <div className="glass-panel rounded-2xl overflow-hidden shadow-xl border border-border/50">
            {loadingCategories ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading subject categories...</p>
              </div>
            ) : categories.length === 0 ? (
              <div className="py-20 text-center text-muted-foreground">
                No subject categories configured yet. Click "Create Subject Category" above to add one.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
                  <thead>
                    <tr className="border-b border-border bg-card/20">
                      <th className="py-4 px-6 font-semibold uppercase tracking-wider text-xs text-muted-foreground/80">Category Name</th>
                      <th className="py-4 px-6 font-semibold uppercase tracking-wider text-xs text-muted-foreground/80">Code Key</th>
                      <th className="py-4 px-6 font-semibold uppercase tracking-wider text-xs text-muted-foreground/80">Badge Accent</th>
                      <th className="py-4 px-6 font-semibold uppercase tracking-wider text-xs text-muted-foreground/80">Description</th>
                      <th className="py-4 px-6 font-semibold uppercase tracking-wider text-xs text-muted-foreground/80">Status</th>
                      <th className="py-4 px-6 font-semibold uppercase tracking-wider text-xs text-muted-foreground/80 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {categories.map((cat) => (
                      <tr key={cat.id || cat._id} className="hover:bg-card/20 transition-colors">
                        <td className="py-4 px-6 font-bold text-foreground">
                          {cat.name}
                        </td>
                        <td className="py-4 px-6">
                          <span
                            className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full border"
                            style={{
                              backgroundColor: `${cat.color || '#10b981'}15`,
                              color: cat.color || '#10b981',
                              borderColor: `${cat.color || '#10b981'}30`,
                            }}
                          >
                            {cat.code}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-4 h-4 rounded-full border border-border shrink-0 shadow-sm"
                              style={{ backgroundColor: cat.color || '#10b981' }}
                            />
                            <span className="font-mono text-xs font-semibold text-muted-foreground">{cat.color || '#10b981'}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-xs text-muted-foreground max-w-sm truncate">
                          {cat.description || 'No description provided.'}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                            cat.isActive !== false
                              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                          }`}>
                            {cat.isActive !== false ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex justify-end items-center gap-1">
                            <button
                              onClick={() => openCategoryModal(cat)}
                              className="text-muted-foreground hover:text-foreground p-2 transition-colors rounded-lg hover:bg-muted"
                              title="Edit Category"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(cat.id || cat._id || '')}
                              className="text-muted-foreground hover:text-destructive p-2 transition-colors rounded-lg hover:bg-destructive/10"
                              title="Delete Category"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE / EDIT COURSE MODAL */}
      <CourseModal
        isOpen={isCourseModalOpen}
        onClose={() => setIsCourseModalOpen(false)}
        onSuccess={() => fetchCoursesData()}
        editingCourse={editingCourse}
        teachers={teachers}
      />

      {/* VIEW COURSE DETAILS MODAL */}
      <CourseDetailModal
        isOpen={Boolean(viewingCourse)}
        course={viewingCourse}
        onClose={() => setViewingCourse(null)}
        onEdit={(courseToEdit) => {
          setViewingCourse(null);
          setEditingCourse(courseToEdit);
          setIsCourseModalOpen(true);
        }}
        onDelete={(courseId) => {
          setViewingCourse(null);
          handleDeleteCourse(courseId);
        }}
      />

      {/* CREATE / EDIT SUBJECT CATEGORY MODAL */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="glass-panel w-full max-w-md rounded-2xl p-6 shadow-2xl relative border border-border bg-card">
            <div className="flex justify-between items-center mb-4 border-b border-border/40 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-brand" />
                <h3 className="text-xl font-bold font-display text-foreground">
                  {editingCategory ? 'Edit Subject Category' : 'Create Subject Category'}
                </h3>
              </div>
              <button onClick={() => setIsCategoryModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tajweed & Makharij Rules"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg p-2.5 text-sm outline-none font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Code Key (Uppercase) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TAJWEED"
                  value={categoryCode}
                  onChange={(e) => setCategoryCode(e.target.value.toUpperCase())}
                  className="w-full bg-background border border-border rounded-lg p-2.5 text-sm outline-none font-mono font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                  <Palette className="h-3.5 w-3.5 text-brand" />
                  <span>Badge Accent Color</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={categoryColor}
                    onChange={(e) => setCategoryColor(e.target.value)}
                    className="w-9 h-9 rounded-lg border border-border cursor-pointer bg-transparent p-0.5"
                  />
                  <div className="flex items-center gap-1.5 overflow-x-auto">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCategoryColor(c)}
                        className="w-7 h-7 rounded-full border border-border/80 flex items-center justify-center transition-transform hover:scale-110"
                        style={{ backgroundColor: c }}
                      >
                        {categoryColor === c && <Check className="h-4 w-4 text-white drop-shadow-md" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Description</label>
                <textarea
                  rows={3}
                  placeholder="Overview description of subject category..."
                  value={categoryDescription}
                  onChange={(e) => setCategoryDescription(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg p-2.5 text-sm outline-none resize-none font-medium"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="categoryActiveToggle"
                  checked={categoryIsActive}
                  onChange={(e) => setCategoryIsActive(e.target.checked)}
                  className="w-4 h-4 text-brand rounded border-border focus:ring-brand"
                />
                <label htmlFor="categoryActiveToggle" className="text-xs font-semibold text-foreground cursor-pointer">
                  Category Active & Available for Courses
                </label>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="bg-muted hover:bg-muted/80 text-foreground py-2 px-4 rounded-lg text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingCategory || !categoryName.trim() || !categoryCode.trim()}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground py-2 px-5 rounded-lg text-sm font-bold shadow-md flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submittingCategory && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>{editingCategory ? 'Save Category Changes' : 'Create Category Now'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CourseManagementPage() {
  return (
    <Suspense fallback={
      <div className="py-20 flex justify-center items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
        <p className="text-xs font-semibold text-muted-foreground">Loading Courses & Subject Categories...</p>
      </div>
    }>
      <CourseManagementContent />
    </Suspense>
  );
}
