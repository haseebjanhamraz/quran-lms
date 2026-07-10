import React, { useState } from 'react';
import { X, PlayCircle, Loader2 } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  type: string;
}

interface InstantClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  courses: Course[];
  coursesLoading: boolean;
  onStartInstantClass: (courseId: string, durationMinutes: number) => Promise<void>;
}

export default function InstantClassModal({
  isOpen,
  onClose,
  courses,
  coursesLoading,
  onStartInstantClass,
}: InstantClassModalProps) {
  const [courseId, setCourseId] = useState('');
  const [duration, setDuration] = useState(60);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId) {
      setError('Please select a course first.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await onStartInstantClass(courseId, duration);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to start instant class. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md rounded-2xl border border-slate-700/60 bg-slate-900 p-6 shadow-2xl backdrop-blur-xl transition-all duration-300">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="font-display text-xl font-bold text-slate-100 flex items-center gap-2">
            <PlayCircle size={22} className="text-emerald-400" />
            <span>Start Instant Class</span>
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
              {error}
            </div>
          )}

          {/* Course select */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Select Course
            </label>
            {coursesLoading ? (
              <div className="flex items-center gap-2 text-slate-400 text-sm py-2">
                <Loader2 size={16} className="animate-spin text-emerald-400" />
                <span>Loading courses...</span>
              </div>
            ) : courses.length === 0 ? (
              <p className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-lg">
                No active courses found. You need to be assigned to a course to start a class.
              </p>
            ) : (
              <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-700/50 glass-card px-3.5 py-2.5 text-sm text-slate-200 outline-none focus:border-emerald-500/50 transition-colors cursor-pointer"
              >
                <option value="" disabled>Select a course to teach</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id} className="bg-slate-900 text-slate-200">
                    {c.title} ({c.type.replace(/_/g, ' ')})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Duration */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Duration (minutes)
            </label>
            <input
              type="number"
              min={15}
              max={180}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              required
              className="w-full rounded-xl border border-slate-700/50 glass-card px-3.5 py-2.5 text-sm text-slate-200 outline-none focus:border-emerald-500/50 transition-colors"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-slate-700/60 bg-slate-800/40 px-4 py-2 text-xs font-semibold text-slate-350 hover:bg-slate-850 hover:text-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || courses.length === 0}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-[1.02]"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Launching Class...</span>
                </>
              ) : (
                <>
                  <PlayCircle size={14} />
                  <span>Start Class Now</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
