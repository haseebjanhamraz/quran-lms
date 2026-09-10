'use client';

import React, { useState } from 'react';
import { Upload, X, AlertCircle, FileText, Loader2 } from 'lucide-react';
import { CourseOption, MaterialCategory } from './types';
import { formatBytes } from './utils';

interface UploadMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  courses: CourseOption[];
}

export default function UploadMaterialModal({
  isOpen,
  onClose,
  onSuccess,
  courses,
}: UploadMaterialModalProps) {
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadCategory, setUploadCategory] = useState<MaterialCategory>('QAIDA');
  const [uploadLevel, setUploadLevel] = useState('All');
  const [uploadCourseId, setUploadCourseId] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  if (!isOpen) return null;

  const resetForm = () => {
    setUploadFile(null);
    setUploadTitle('');
    setUploadDescription('');
    setUploadCategory('QAIDA');
    setUploadLevel('All');
    setUploadCourseId('');
    setUploadError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

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

      resetForm();
      onClose();
      onSuccess();
    } catch (err: any) {
      setUploadError(err.message || 'An error occurred during upload.');
    } finally {
      setUploading(false);
    }
  };

  return (
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
            type="button"
            onClick={handleClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg cursor-pointer"
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
                onChange={(e) => setUploadCategory(e.target.value as MaterialCategory)}
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
                  {c.title} {c.type ? `(${c.type})` : ''}
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
              onClick={handleClose}
              className="px-5 py-2.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-lg hover:bg-primary/90 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{uploading ? 'Uploading PDF...' : 'Upload Material'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
