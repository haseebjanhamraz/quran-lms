'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen, Plus, Trash2, Edit, Eye, Sparkles, BookUser, CheckCircle, Award
} from 'lucide-react';
import { apiFetch } from '@/utils/apiFetch';
import DataTable, { Column, FilterOption } from '@/components/DataTable';
import CourseModal, { CourseItem, TeacherItem } from '@/components/CourseModal';
import CourseDetailModal from '@/components/CourseDetailModal';

export default function CourseManagementPage() {
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CourseItem | null>(null);
  const [viewingCourse, setViewingCourse] = useState<CourseItem | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch courses
      const courseRes = await apiFetch(`${API_URL}/courses`);
      if (courseRes.ok) {
        const coursesData = await courseRes.json();
        setCourses(Array.isArray(coursesData) ? coursesData : []);
      } else {
        setCourses([]);
      }

      // Fetch users to filter teachers
      const usersRes = await apiFetch(`${API_URL}/users`);
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        const teachersOnly = Array.isArray(usersData) ? usersData.filter((u: any) => u.role === 'TEACHER') : [];
        setTeachers(teachersOnly);
      } else {
        setTeachers([]);
      }
    } catch (err) {
      console.error('Error loading courses or teachers:', err);
      setCourses([]);
      setTeachers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteCourse = async (id: string) => {
    if (!confirm('Are you sure you want to delete this course? All associated schedules will be deleted.')) {
      return;
    }

    try {
      const res = await apiFetch(`${API_URL}/courses/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchData();
      } else {
        alert('Failed to delete course.');
      }
    } catch (err) {
      console.error('Error deleting course:', err);
    }
  };

  // Stats ribbon math
  const stats = useMemo(() => {
    const total = courses.length;
    const tajweedAndNazira = courses.filter(c => c.type === 'TAJWEED' || c.type === 'NAZIRA').length;
    const hifz = courses.filter(c => c.type === 'HIFZ_UL_QURAN').length;
    const islamic = courses.filter(c => c.type === 'ISLAMIC_STUDIES').length;
    return { total, tajweedAndNazira, hifz, islamic };
  }, [courses]);

  // Filters for DataTable
  const filterOptions: FilterOption[] = [
    { key: 'ALL', label: 'All Courses', predicate: () => true },
    { key: 'TAJWEED', label: 'Tajweed', predicate: (c) => c.type === 'TAJWEED' },
    { key: 'NAZIRA', label: 'Nazira', predicate: (c) => c.type === 'NAZIRA' },
    { key: 'HIFZ_UL_QURAN', label: 'Hifz-ul-Quran', predicate: (c) => c.type === 'HIFZ_UL_QURAN' },
    { key: 'ISLAMIC_STUDIES', label: 'Islamic Studies', predicate: (c) => c.type === 'ISLAMIC_STUDIES' },
  ];

  // Helper for category badge styling
  const getCategoryBadge = (type: string) => {
    switch (type) {
      case 'TAJWEED':
        return 'bg-brand/10 text-brand border-brand/20';
      case 'HIFZ_UL_QURAN':
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'NAZIRA':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'ISLAMIC_STUDIES':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  // Columns definition for DataTable
  const columns: Column<CourseItem>[] = [
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
      render: (c) => (
        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${getCategoryBadge(c.type)}`}>
          {c.type}
        </span>
      ),
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
                setIsModalOpen(true);
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
            <span>Manage Courses</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure subjects, define day-to-day syllabi, and assign primary instructors.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingCourse(null);
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-primary/10 transition-all duration-300 outline-none hover-lift self-start"
        >
          <Plus className="h-5 w-5" />
          <span>Create Course</span>
        </button>
      </div>

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
        columns={columns}
        data={courses}
        searchKeys={['title', 'type', 'curriculum']}
        searchPlaceholder="Search courses by title, category, or curriculum..."
        filters={filterOptions}
        initialItemsPerPage={10}
        itemsPerPageOptions={[5, 10, 20, 50, 100]}
        loading={loading}
        emptyMessage="No courses configured yet matching your filter criteria."
        keyExtractor={(c) => c.id || c._id || c.title}
      />

      {/* CREATE / EDIT COURSE MODAL */}
      <CourseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => fetchData()}
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
          setIsModalOpen(true);
        }}
        onDelete={(courseId) => {
          setViewingCourse(null);
          handleDeleteCourse(courseId);
        }}
      />
    </div>
  );
}
