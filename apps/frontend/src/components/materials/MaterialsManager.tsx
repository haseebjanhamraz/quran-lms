'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FileText, Upload, Plus, Search, Filter, Download, Eye,
  Trash2, X, Loader2, CheckCircle2, AlertCircle,
  BookOpen, Sparkles, Folder, ExternalLink, HardDrive, RefreshCw
} from 'lucide-react';
import { apiFetch } from '@/utils/apiFetch';
import { useAuth } from '@/context/AuthContext';

export interface MaterialItem {
  id: string;
  _id?: string;
  title: string;
  description?: string;
  category: 'QAIDA' | 'TAJWEED' | 'QURAN_PARAH' | 'DUAS_ADHKAR' | 'ISLAMIC_STUDIES' | 'GENERAL';
  targetLevel: string;
  courseId?: string;
  course?: { id: string; title: string };
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
  uploader?: { id: string; name: string; email: string };
  downloadsCount: number;
  createdAt: string;
}

const CATEGORIES = [
  { id: 'ALL', label: 'All Materials' },
  { id: 'QAIDA', label: 'Noorani & Madani Qaida' },
  { id: 'TAJWEED', label: 'Tajweed Rules & Guides' },
  { id: 'QURAN_PARAH', label: 'Quranic Texts & Parahs' },
  { id: 'DUAS_ADHKAR', label: 'Duas & Daily Adhkar' },
  { id: 'ISLAMIC_STUDIES', label: 'Islamic Studies' },
  { id: 'GENERAL', label: 'General Resources' },
];

const CATEGORY_COLORS: Record<string, string> = {
  QAIDA: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  TAJWEED: 'bg-violet-500/10 text-violet-400 border-violet-500/30',
  QURAN_PARAH: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  DUAS_ADHKAR: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
  ISLAMIC_STUDIES: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
  GENERAL: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
};

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export interface MaterialsManagerProps {
  userRole?: 'ADMIN' | 'SUPER_ADMIN' | 'TEACHER';
  title?: string;
  subtitle?: string;
  className?: string;
}

export default function MaterialsManager({
  userRole,
  title = 'Course Materials & Curriculum Resources',
  subtitle = 'Browse, read, and share curriculum PDFs, tajweed manuals, and student lesson notes.',
  className = '',
}: MaterialsManagerProps) {
  const { user } = useAuth();
  const effectiveRole = userRole || user?.role || 'TEACHER';
  const canDelete = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedLevel, setSelectedLevel] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Upload Form State
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadCategory, setUploadCategory] = useState<string>('QAIDA');
  const [uploadLevel, setUploadLevel] = useState('All');
  const [uploadCourseId, setUploadCourseId] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

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

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      setUploadError('Please select a PDF file to upload.');
      return;
    }
    if (!uploadTitle.trim()) {
      setUploadError('Title is required.');
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('title', uploadTitle.trim());
      formData.append('description', uploadDescription.trim());
      formData.append('category', uploadCategory);
      formData.append('targetLevel', uploadLevel);
      if (uploadCourseId) formData.append('courseId', uploadCourseId);

      const token = localStorage.getItem('quran_lms_access_token') || localStorage.getItem('token');
      const res = await fetch(`${API_URL}/materials/upload`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Upload failed');
      }

      setIsUploadModalOpen(false);
      setUploadFile(null);
      setUploadTitle('');
      setUploadDescription('');
      fetchMaterials();
    } catch (err: any) {
      setUploadError(err.message || 'An error occurred during upload.');
    } finally {
      setUploading(false);
    }
  };

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

  const totalDownloads = useMemo(
    () => materials.reduce((acc, m) => acc + (m.downloadsCount || 0), 0),
    [materials]
  );
  const totalSize = useMemo(
    () => materials.reduce((acc, m) => acc + (m.fileSize || 0), 0),
    [materials]
  );

  return (
    <div className={`space-y-8 animate-fadeIn ${className}`}>
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-primary/10 text-primary border border-primary/20">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-foreground tracking-tight">
                {title}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                {subtitle}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchMaterials()}
            className="p-2.5 rounded-xl border border-border bg-card/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Refresh list"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Upload Material</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-2xl border border-border bg-card/40 flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Total Materials
            </p>
            <p className="text-xl font-black text-foreground font-mono mt-0.5">{materials.length}</p>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-border bg-card/40 flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
            <HardDrive className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Total Storage
            </p>
            <p className="text-xl font-black text-foreground font-mono mt-0.5">
              {formatBytes(totalSize)}
            </p>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-border bg-card/40 flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-500 border border-violet-500/20">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Syllabi & Guides
            </p>
            <p className="text-xl font-black text-foreground font-mono mt-0.5">
              {materials.filter((m) => m.category === 'QAIDA' || m.category === 'TAJWEED').length}
            </p>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-border bg-card/40 flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <ExternalLink className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Accesses
            </p>
            <p className="text-xl font-black text-foreground font-mono mt-0.5">{totalDownloads}</p>
          </div>
        </div>
      </div>

      {/* Search and Secondary Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <span className="text-xs font-bold text-muted-foreground whitespace-nowrap">
              Category:
            </span>
        {/* Category Filter Tabs */}
      <div className="w-full sm:w-64">
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-xl bg-card/60 text-foreground border border-border text-xs font-bold transition-all focus:outline-none focus:border-primary"
        >
          {CATEGORIES.map((cat) => {
            const count =
              cat.id === 'ALL'
                ? materials.length
                : materials.filter((m) => m.category === cat.id).length;

            return (
              <option key={cat.id} value={cat.id}>
                {cat.label} ({count})
              </option>
            );
          })}
        </select>
      </div>
          <span className="text-xs font-bold text-muted-foreground whitespace-nowrap">
              Search:
            </span>
        <div className="relative w-full sm:w-80">
          <Search className="h-4 w-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search materials by title or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-card border border-border text-xs focus:outline-none focus:border-primary transition-colors text-foreground"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-bold text-muted-foreground whitespace-nowrap">
              Target Level:
            </span>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="px-3 py-2 rounded-xl bg-card border border-border text-xs font-semibold focus:outline-none focus:border-primary text-foreground"
            >
              <option value="ALL">All Levels</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>
        </div>
      </div>

      {/* Materials Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground font-mono">Loading educational materials...</p>
        </div>
      ) : filteredMaterials.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center border border-dashed border-border bg-card/20 max-w-xl mx-auto space-y-4">
          <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center mx-auto text-muted-foreground">
            <Folder className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">No Materials Found</h3>
            <p className="text-xs text-muted-foreground mt-1">
              {searchQuery || selectedCategory !== 'ALL' || selectedLevel !== 'ALL'
                ? 'Try broadening your search or resetting category filters.'
                : 'No curriculum PDFs have been uploaded yet. Upload the first document!'}
            </p>
          </div>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-md hover:bg-primary/90 transition-all inline-flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            <span>Upload Document</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMaterials.map((mat) => {
            const matId = mat.id || mat._id;
            const categoryBadge = CATEGORY_COLORS[mat.category] || CATEGORY_COLORS.GENERAL;
            const categoryLabel =
              CATEGORIES.find((c) => c.id === mat.category)?.label || mat.category;

            return (
              <div
                key={matId}
                className="glass-panel group rounded-2xl border border-border/80 bg-card hover:border-primary/50 transition-all duration-200 p-5 flex flex-col justify-between space-y-4 hover:shadow-xl hover:shadow-primary/5 relative overflow-hidden"
              >
                <div className="space-y-3">
                  {/* Top Tags */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border ${categoryBadge}`}
                    >
                      {categoryLabel}
                    </span>
                    <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                      {mat.targetLevel}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                      {mat.title}
                    </h3>
                    {mat.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                        {mat.description}
                      </p>
                    )}
                  </div>

                  {/* Associated Course Tag */}
                  {mat.course && (
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground bg-muted/40 p-2 rounded-xl border border-border/40">
                      <BookOpen className="h-3 w-3 text-primary shrink-0" />
                      <span className="truncate">{mat.course.title}</span>
                    </div>
                  )}

                  {/* Metadata info */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50 text-[11px]">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground/70 block">
                        File Size
                      </span>
                      <span className="font-mono font-semibold text-foreground">
                        {formatBytes(mat.fileSize)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground/70 block">
                        Uploaded By
                      </span>
                      <span className="font-medium text-foreground truncate block">
                        {mat.uploader?.name || 'Administrator'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/40">
                  <a
                    href={`/materials/view/${matId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-sm hover:bg-primary/90 transition-all"
                    title="View & Read PDF in Protected Mode"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>View &amp; Read PDF</span>
                  </a>

                  {canDelete && (
                    <button
                      onClick={() => handleDelete(matId!)}
                      className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      title="Delete PDF"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Material Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fadeIn">
          <div className="glass-panel w-full max-w-lg rounded-3xl p-6 shadow-2xl relative border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border/50 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
                  <Upload className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Upload Curriculum PDF</h3>
                  <p className="text-xs text-muted-foreground">Add official syllabus, qaida, or guide</p>
                </div>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {uploadError && (
              <div className="p-3 mb-4 rounded-xl bg-destructive/10 text-destructive text-xs border border-destructive/20 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Document Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Noorani Qaida (Madinah Edition) - Complete"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl p-3 text-xs outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Category *
                  </label>
                  <select
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value)}
                    className="w-full bg-background border border-border focus:border-primary rounded-xl p-3 text-xs outline-none font-semibold"
                  >
                    <option value="QAIDA">Noorani & Madani Qaida</option>
                    <option value="TAJWEED">Tajweed Rules & Guides</option>
                    <option value="QURAN_PARAH">Quranic Texts & Parahs</option>
                    <option value="DUAS_ADHKAR">Duas & Daily Adhkar</option>
                    <option value="ISLAMIC_STUDIES">Islamic Studies</option>
                    <option value="GENERAL">General Resources</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Target Level *
                  </label>
                  <select
                    value={uploadLevel}
                    onChange={(e) => setUploadLevel(e.target.value)}
                    className="w-full bg-background border border-border focus:border-primary rounded-xl p-3 text-xs outline-none font-semibold"
                  >
                    <option value="All">All Levels</option>
                    <option value="Beginner">Beginner (Foundations)</option>
                    <option value="Intermediate">Intermediate (Tajweed / Fluent)</option>
                    <option value="Advanced">Advanced (Hifz / Ijazah)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Linked Course (Optional)
                </label>
                <select
                  value={uploadCourseId}
                  onChange={(e) => setUploadCourseId(e.target.value)}
                  className="w-full bg-background border border-border focus:border-primary rounded-xl p-3 text-xs outline-none"
                >
                  <option value="">-- No specific course link --</option>
                  {courses.map((c) => (
                    <option key={c.id || c._id} value={c.id || c._id}>
                      {c.title} ({c.type})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Description / Synopsis
                </label>
                <textarea
                  rows={2}
                  placeholder="Provide brief guidelines or lesson notes for this material..."
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl p-3 text-xs outline-none resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Select PDF File (Max 50MB) *
                </label>
                <div className="border-2 border-dashed border-border hover:border-primary/50 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-muted/20 relative">
                  <input
                    type="file"
                    accept="application/pdf,.pdf"
                    required
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setUploadFile(e.target.files[0]);
                        if (!uploadTitle) {
                          setUploadTitle(
                            e.target.files[0].name.replace(/\.pdf$/i, '').replace(/[-_]/g, ' ')
                          );
                        }
                      }
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <div className="space-y-2 pointer-events-none">
                    <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                      <FileText className="h-5 w-5" />
                    </div>
                    {uploadFile ? (
                      <div>
                        <p className="text-xs font-bold text-foreground">{uploadFile.name}</p>
                        <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                          {formatBytes(uploadFile.size)}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs font-bold text-foreground">
                          Click to browse or drag and drop PDF
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Adobe PDF documents only (up to 50MB)
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-lg hover:bg-primary/90 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>{uploading ? 'Uploading PDF...' : 'Upload Material'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
