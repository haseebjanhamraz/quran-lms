'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FileText, Upload, Plus, Search, Filter, Download, Eye,
  Trash2, Edit3, X, Loader2, CheckCircle2, AlertCircle,
  BookOpen, Sparkles, Folder, ExternalLink, HardDrive, RefreshCw
} from 'lucide-react';
import { apiFetch } from '@/utils/apiFetch';
import { useAuth } from '@/context/AuthContext';

interface MaterialItem {
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

export default function AdminMaterialsPage() {
  const { user } = useAuth();
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedLevel, setSelectedLevel] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [previewMaterial, setPreviewMaterial] = useState<MaterialItem | null>(null);

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

      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/materials/upload`, {
        method: 'POST',
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

  const handleDownload = async (material: MaterialItem) => {
    try {
      const matId = material.id || material._id;
      apiFetch(`${API_URL}/materials/${matId}/download`, { method: 'POST' }).catch(() => {});
      
      const serverOrigin = API_URL.replace('/api/v1', '');
      const downloadUrl = material.fileUrl.startsWith('http')
        ? material.fileUrl
        : `${serverOrigin}${material.fileUrl}`;
      
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = material.fileName || `${material.title}.pdf`;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setMaterials((prev) =>
        prev.map((m) =>
          (m.id === matId || m._id === matId) ? { ...m, downloadsCount: m.downloadsCount + 1 } : m
        )
      );
    } catch (err) {
      console.error('Error initiating download:', err);
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

  const totalDownloads = useMemo(() => materials.reduce((acc, m) => acc + (m.downloadsCount || 0), 0), [materials]);
  const totalSize = useMemo(() => materials.reduce((acc, m) => acc + (m.fileSize || 0), 0), [materials]);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-primary/10 text-primary border border-primary/20">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-foreground tracking-tight">
                Course Materials & PDF Management
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Upload, categorize, preview, and distribute curriculum PDFs, tajweed manuals, and study guides.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchMaterials()}
            className={`p-2.5 rounded-xl border border-border bg-card/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors`}
            title="Refresh list"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => {
              setUploadError(null);
              setIsUploadModalOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-lg hover:bg-primary/90 hover:scale-105 transition-all"
          >
            <Upload className="h-4 w-4" />
            <span>Upload PDF Material</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Documents</p>
          <p className="text-2xl font-extrabold font-mono text-foreground mt-1">{materials.length}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Active curriculum assets</p>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Downloads</p>
          <p className="text-2xl font-extrabold font-mono text-emerald-400 mt-1">{totalDownloads}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Learner & teacher access</p>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Storage Used</p>
          <p className="text-2xl font-extrabold font-mono text-sky-400 mt-1">{formatBytes(totalSize)}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">PDF assets stored</p>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Categories</p>
          <p className="text-2xl font-extrabold font-mono text-violet-400 mt-1">6 Subject Areas</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Structured syllabi</p>
        </div>
      </div>

      {/* Category Pills & Search */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-3.5 rounded-2xl border border-border/80">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by title, description or filename..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-background border border-border rounded-xl pl-9 pr-4 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary"
            />
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="bg-background border border-border rounded-xl px-3 py-2 text-xs font-semibold text-foreground outline-none focus:border-primary"
            >
              <option value="ALL">All Levels</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>

            <span className="text-xs font-mono font-bold text-muted-foreground whitespace-nowrap px-2">
              {filteredMaterials.length} PDF{filteredMaterials.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Materials Cards Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground">Loading course PDF library...</p>
        </div>
      ) : filteredMaterials.length === 0 ? (
        <div className="py-20 text-center rounded-3xl border border-dashed border-border/80 bg-card/40 space-y-3">
          <div className="h-14 w-14 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto text-muted-foreground">
            <FileText className="h-7 w-7 opacity-60" />
          </div>
          <p className="text-base font-bold text-foreground">No Materials Found</p>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {searchQuery || selectedCategory !== 'ALL'
              ? 'No documents match your filter criteria. Try adjusting the search or category.'
              : 'No PDF documents have been uploaded yet. Click "Upload PDF Material" to add curriculum files.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMaterials.map((mat) => {
            const matId = mat.id || mat._id;
            return (
              <div
                key={matId}
                className="group relative rounded-3xl border border-border/80 bg-card p-6 shadow-sm hover:shadow-md hover:border-primary/40 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        CATEGORY_COLORS[mat.category] || CATEGORY_COLORS.GENERAL
                      }`}
                    >
                      {mat.category?.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] font-semibold text-muted-foreground bg-muted/80 px-2 py-0.5 rounded-md">
                      {mat.targetLevel || 'All Levels'}
                    </span>
                  </div>

                  {/* Document Header */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="h-10 w-10 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0 border border-rose-500/20 group-hover:scale-105 transition-transform">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="overflow-hidden">
                      <h3 className="font-bold text-sm text-foreground leading-snug line-clamp-2" title={mat.title}>
                        {mat.title}
                      </h3>
                      <p className="text-[10px] font-mono text-muted-foreground truncate mt-0.5">
                        {mat.fileName}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  {mat.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
                      {mat.description}
                    </p>
                  )}

                  {/* Meta Details */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground py-3 border-y border-border/50 mb-4">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground/70 block">File Size</span>
                      <span className="font-mono font-semibold text-foreground">{formatBytes(mat.fileSize)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground/70 block">Downloads</span>
                      <span className="font-mono font-semibold text-foreground">{mat.downloadsCount || 0} times</span>
                    </div>
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="flex items-center justify-between gap-2 pt-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setPreviewMaterial(mat)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold transition-colors border border-border"
                      title="Preview PDF Document"
                    >
                      <Eye className="h-3.5 w-3.5 text-primary" />
                      <span>Preview</span>
                    </button>

                    <button
                      onClick={() => handleDownload(mat)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-sm hover:bg-primary/90 transition-all"
                      title="Download PDF"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Download</span>
                    </button>
                  </div>

                  <button
                    onClick={() => handleDelete(matId!)}
                    className="p-1.5 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    title="Delete PDF"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PDF Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fadeIn overflow-y-auto">
          <div className="glass-panel w-full max-w-xl rounded-3xl p-6 sm:p-8 shadow-2xl relative border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border/50 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-primary/10 text-primary border border-primary/20">
                  <Upload className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Upload Course Material (PDF)</h3>
                  <p className="text-xs text-muted-foreground">Add official PDF resources for teachers and students</p>
                </div>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              {uploadError && (
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Document Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Noorani Qaida - Complete Arabic Rules"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl p-3 text-xs outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Subject Category *
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
                          setUploadTitle(e.target.files[0].name.replace(/\.pdf$/i, '').replace(/[-_]/g, ' '));
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
                        <p className="text-[11px] text-muted-foreground font-mono mt-0.5">{formatBytes(uploadFile.size)}</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs font-bold text-foreground">Click to browse or drag and drop PDF</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Adobe PDF documents only (up to 50MB)</p>
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

      {/* PDF Preview Modal */}
      {previewMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fadeIn">
          <div className="glass-panel w-full max-w-5xl h-[85vh] rounded-3xl p-6 shadow-2xl relative border border-border bg-card flex flex-col">
            <div className="flex items-center justify-between border-b border-border/50 pb-4 mb-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground truncate max-w-md">{previewMaterial.title}</h3>
                  <p className="text-xs text-muted-foreground font-mono">{previewMaterial.fileName}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownload(previewMaterial)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-all"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download</span>
                </button>
                <button
                  onClick={() => setPreviewMaterial(null)}
                  className="text-muted-foreground hover:text-foreground transition-colors p-1"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 bg-muted/30 rounded-2xl overflow-hidden border border-border/60 relative">
              <iframe
                src={`${API_URL.replace('/api/v1', '')}${previewMaterial.fileUrl}#toolbar=1`}
                className="w-full h-full border-none"
                title={previewMaterial.title}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}