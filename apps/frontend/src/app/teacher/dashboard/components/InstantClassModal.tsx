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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl backdrop-blur-xl transition-all duration-300">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
            <PlayCircle size={22} className="text-primary" />
            <span>Start Instant Class</span>
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {error && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
              {error}
            </div>
          )}

          {/* Course select */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              Select Course
            </label>
            {coursesLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground text-sm py-2">
                <Loader2 size={16} className="animate-spin text-primary" />
                <span>Loading courses...</span>
              </div>
            ) : courses.length === 0 ? (
              <p className="text-xs text-amber-500 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-lg">
                No active courses found. You need to be assigned to a course to start a class.
              </p>
            ) : (
              <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                required
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary/50 transition-colors cursor-pointer"
              >
                <option value="" disabled>Select a course to teach</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id} className="bg-card text-foreground">
                    {c.title} ({c.type.replace(/_/g, ' ')})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Duration select */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              Duration
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[30, 45, 60].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDuration(d)}
                  className={`rounded-xl border py-2 text-xs font-semibold transition-all ${
                    duration === d
                      ? 'border-primary/50 bg-primary/10 text-primary'
                      : 'border-border bg-muted/40 text-muted-foreground hover:border-border hover:text-foreground'
                  }`}
                >
                  {d} mins
                </button>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || courses.length === 0}
              className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground shadow-lg hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Starting...</span>
                </>
              ) : (
                <>
                  <PlayCircle size={14} />
                  <span>Launch Class Now</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
