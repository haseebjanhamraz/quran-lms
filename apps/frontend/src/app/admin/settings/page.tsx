'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  ShieldAlert,
  CheckCircle,
  Save,
  Loader2,
  Database,
  Trash2,
  RefreshCw,
  Sparkles,
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  CreditCard,
  UserCheck,
  FileText,
  LifeBuoy,
  History,
  AlertTriangle,
  X,
  Sliders,
  CheckSquare,
  Square,
  Layers,
} from 'lucide-react';

interface CategoryStat {
  label: string;
  count: number;
  details?: Record<string, number>;
}

interface DatabaseStats {
  success: boolean;
  totalRecords: number;
  categories: Record<string, CategoryStat>;
  timestamp: string;
}

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const [activeTab, setActiveTab] = useState<'general' | 'database'>('general');

  // General Settings State
  const [aiEnabled, setAiEnabled] = useState(false);
  const [loadingGeneral, setLoadingGeneral] = useState(true);
  const [savingGeneral, setSavingGeneral] = useState(false);
  const [generalMessage, setGeneralMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Database Management State
  const [dbStats, setDbStats] = useState<DatabaseStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [selectedTargets, setSelectedTargets] = useState<string[]>([]);
  const [isCleanupModalOpen, setIsCleanupModalOpen] = useState(false);
  const [cleanupConfirmationInput, setCleanupConfirmationInput] = useState('');
  const [isCleaning, setIsCleaning] = useState(false);
  const [isFullReset, setIsFullReset] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<{ type: 'success' | 'error'; text: string; details?: any } | null>(null);

  // Seeder State
  const [seedingType, setSeedingType] = useState<string | null>(null);
  const [seedResult, setSeedResult] = useState<{ type: 'success' | 'error'; text: string; details?: any } | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

  // Load General Settings
  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch(`${API_URL}/system-settings/ai_analysis_enabled`, {
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          setAiEnabled(data.value === 'true');
        }
      } catch (err) {
        console.error('Failed to load settings', err);
      } finally {
        setLoadingGeneral(false);
      }
    }
    loadSettings();
  }, [API_URL]);

  // Load Database Stats
  const fetchStats = async () => {
    if (!isSuperAdmin) return;
    setLoadingStats(true);
    try {
      const res = await fetch(`${API_URL}/database-admin/stats`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setDbStats(data);
      }
    } catch (err) {
      console.error('Failed to load database stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      fetchStats();
    }
  }, [isSuperAdmin]);

  const handleSaveGeneral = async () => {
    setSavingGeneral(true);
    setGeneralMessage(null);
    try {
      const res = await fetch(`${API_URL}/system-settings/ai_analysis_enabled`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ value: aiEnabled ? 'true' : 'false' }),
      });

      if (res.ok) {
        setGeneralMessage({ type: 'success', text: 'Settings saved successfully.' });
      } else {
        throw new Error('Failed to save');
      }
    } catch (err) {
      setGeneralMessage({ type: 'error', text: 'An error occurred while saving settings.' });
    } finally {
      setSavingGeneral(false);
    }
  };

  // Target toggle handler
  const toggleTarget = (key: string) => {
    setSelectedTargets((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]
    );
  };

  const selectAllTargets = () => {
    if (!dbStats?.categories) return;
    const keys = Object.keys(dbStats.categories).filter((k) => k !== 'users');
    setSelectedTargets(keys);
  };

  const deselectAllTargets = () => {
    setSelectedTargets([]);
  };

  const selectPreset = (preset: 'operational' | 'logs') => {
    if (preset === 'operational') {
      setSelectedTargets(['students', 'classes_sessions', 'finance']);
    } else if (preset === 'logs') {
      setSelectedTargets(['logs']);
    }
  };

  const handleOpenCleanupModal = (fullReset: boolean = false) => {
    setIsFullReset(fullReset);
    setCleanupConfirmationInput('');
    setIsCleanupModalOpen(true);
    setCleanupResult(null);
  };

  const handleExecuteCleanup = async () => {
    if (cleanupConfirmationInput.trim().toUpperCase() !== 'CLEANUP' && cleanupConfirmationInput.trim().toUpperCase() !== 'CONFIRM') {
      return;
    }

    setIsCleaning(true);
    setCleanupResult(null);

    const targets = isFullReset ? ['all'] : selectedTargets;

    try {
      const res = await fetch(`${API_URL}/database-admin/cleanup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          targets,
          confirmation: cleanupConfirmationInput.trim().toUpperCase(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to clean database.');
      }

      setCleanupResult({
        type: 'success',
        text: data.message || 'Database cleaned up successfully!',
        details: data.deletedCounts,
      });
      setIsCleanupModalOpen(false);
      setSelectedTargets([]);
      fetchStats();
    } catch (err: any) {
      setCleanupResult({
        type: 'error',
        text: err.message || 'An error occurred during database cleanup.',
      });
    } finally {
      setIsCleaning(false);
    }
  };

  const handleExecuteSeed = async (type: 'comprehensive' | 'students' | 'courses_teachers' | 'finance' | 'materials') => {
    setSeedingType(type);
    setSeedResult(null);

    try {
      const res = await fetch(`${API_URL}/database-admin/seed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ type }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to seed sample data.');
      }

      setSeedResult({
        type: 'success',
        text: data.message || 'Sample data seeded successfully!',
        details: data.createdCounts,
      });
      fetchStats();
    } catch (err: any) {
      setSeedResult({
        type: 'error',
        text: err.message || 'An error occurred while seeding sample data.',
      });
    } finally {
      setSeedingType(null);
    }
  };

  const getCategoryIcon = (key: string) => {
    switch (key) {
      case 'students':
        return <GraduationCap size={18} className="text-emerald-500" />;
      case 'teachers':
        return <Users size={18} className="text-blue-500" />;
      case 'courses':
        return <BookOpen size={18} className="text-indigo-500" />;
      case 'classes_sessions':
        return <Calendar size={18} className="text-amber-500" />;
      case 'finance':
        return <CreditCard size={18} className="text-emerald-600" />;
      case 'supervisors_reviewers':
        return <UserCheck size={18} className="text-purple-500" />;
      case 'materials':
        return <FileText size={18} className="text-rose-500" />;
      case 'support_notifications':
        return <LifeBuoy size={18} className="text-sky-500" />;
      case 'logs':
        return <History size={18} className="text-gray-500" />;
      default:
        return <Database size={18} className="text-muted-foreground" />;
    }
  };

  if (loadingGeneral) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="animate-spin text-brand" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl animate-fadeIn space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">System & Database Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure system AI automations, maintain database hygiene, and seed test data.
          </p>
        </div>

        {isSuperAdmin && (
          <div className="flex items-center gap-1.5 p-1 bg-muted/60 border border-border rounded-xl self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('general')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'general'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Sliders size={14} />
              <span>General Settings</span>
            </button>
            <button
              onClick={() => setActiveTab('database')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'database'
                  ? 'bg-brand text-brand-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Database size={14} />
              <span>Database Management</span>
              <span className="ml-1 px-1.5 py-0.2 bg-black/20 dark:bg-white/20 rounded-full text-[10px] uppercase font-bold">
                Super Admin
              </span>
            </button>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TAB 1: GENERAL / AI SETTINGS
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'general' && (
        <div className="space-y-6">
          {generalMessage && (
            <div
              className={`p-4 rounded-xl flex items-center gap-3 ${
                generalMessage.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                  : 'bg-destructive/10 text-destructive border border-destructive/20'
              }`}
            >
              {generalMessage.type === 'success' ? <CheckCircle size={18} /> : <ShieldAlert size={18} />}
              <p className="text-sm font-medium">{generalMessage.text}</p>
            </div>
          )}

          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-border/60">
              <h2 className="text-lg font-semibold text-foreground">AI Quality Analysis</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Control whether class recordings are automatically analyzed by AI for compliance and quality.
              </p>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-semibold text-foreground">Enable AI Analysis</label>
                  <p className="text-xs text-muted-foreground mt-1">
                    If enabled, transcripts will be analyzed automatically after class ends.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAiEnabled(!aiEnabled)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    aiEnabled ? 'bg-brand' : 'bg-muted'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      aiEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="p-6 bg-muted/40 border-t border-border flex justify-end">
              <button
                onClick={handleSaveGeneral}
                disabled={savingGeneral}
                className="flex items-center gap-2 bg-brand hover:bg-brand/90 text-brand-foreground font-semibold px-4 py-2 rounded-xl text-sm transition disabled:opacity-50"
              >
                {savingGeneral ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                <span>Save Settings</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 2: DATABASE MANAGEMENT (SUPER ADMIN ONLY)
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'database' && isSuperAdmin && (
        <div className="space-y-8 animate-fadeIn">
          {/* Notifications / Feedback Banners */}
          {cleanupResult && (
            <div
              className={`p-4 rounded-xl border flex flex-col gap-2 ${
                cleanupResult.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                  : 'bg-destructive/10 text-destructive border-destructive/20'
              }`}
            >
              <div className="flex items-center gap-2 font-semibold text-sm">
                {cleanupResult.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
                <span>{cleanupResult.text}</span>
              </div>
              {cleanupResult.details && (
                <div className="text-xs opacity-90 font-mono bg-card/60 p-2.5 rounded-lg mt-1 border border-border/40 grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {Object.entries(cleanupResult.details).map(([key, val]) => (
                    <div key={key}>
                      <span className="text-muted-foreground">{key}:</span> <span className="font-bold">{String(val)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {seedResult && (
            <div
              className={`p-4 rounded-xl border flex flex-col gap-2 ${
                seedResult.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                  : 'bg-destructive/10 text-destructive border-destructive/20'
              }`}
            >
              <div className="flex items-center gap-2 font-semibold text-sm">
                {seedResult.type === 'success' ? <Sparkles size={18} /> : <AlertTriangle size={18} />}
                <span>{seedResult.text}</span>
              </div>
              {seedResult.details && (
                <div className="text-xs opacity-90 font-mono bg-card/60 p-2.5 rounded-lg mt-1 border border-border/40 grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {Object.entries(seedResult.details).map(([key, val]) => (
                    <div key={key}>
                      <span className="text-muted-foreground">{key}:</span> <span className="font-bold">{String(val)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Database Health & Record Counter Overview */}
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0">
                <Database size={24} />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Database Storage Overview</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Total Active Records Across Academy Modules:{' '}
                  <span className="font-bold text-foreground">
                    {loadingStats ? 'Counting...' : dbStats?.totalRecords?.toLocaleString() || '0'}
                  </span>
                </p>
              </div>
            </div>

            <button
              onClick={fetchStats}
              disabled={loadingStats}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-muted/60 hover:bg-muted text-foreground border border-border transition disabled:opacity-50"
            >
              <RefreshCw size={14} className={loadingStats ? 'animate-spin text-brand' : ''} />
              <span>Refresh Stats</span>
            </button>
          </div>

          {/* ─────────────────────────────────────────────────────────
              SECTION 1: DATABASE CLEANUP SETUP
          ───────────────────────────────────────────────────────── */}
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Trash2 size={20} className="text-destructive" />
                  <h2 className="text-lg font-bold text-foreground">Database Cleanup Setup</h2>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Select specific modules or categories to clean up safely. Dependent foreign references will be cascaded without corrupting relations.
                </p>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={selectAllTargets}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-muted hover:bg-muted/80 text-foreground transition"
                >
                  <CheckSquare size={14} />
                  <span>Select All</span>
                </button>
                <button
                  type="button"
                  onClick={deselectAllTargets}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-muted hover:bg-muted/80 text-foreground transition"
                >
                  <Square size={14} />
                  <span>Deselect All</span>
                </button>
                <button
                  type="button"
                  onClick={() => selectPreset('operational')}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition"
                >
                  Preset: Operational
                </button>
                <button
                  type="button"
                  onClick={() => selectPreset('logs')}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition"
                >
                  Preset: Logs
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Category Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {dbStats?.categories &&
                  Object.entries(dbStats.categories)
                    .filter(([key]) => key !== 'users')
                    .map(([key, cat]) => {
                      const isSelected = selectedTargets.includes(key);
                      return (
                        <div
                          key={key}
                          onClick={() => toggleTarget(key)}
                          className={`p-4 rounded-xl border transition cursor-pointer flex flex-col justify-between gap-3 select-none ${
                            isSelected
                              ? 'bg-destructive/5 border-destructive/40 shadow-sm ring-1 ring-destructive/30'
                              : 'bg-muted/20 hover:bg-muted/40 border-border/80'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              <div className="p-2 rounded-lg bg-card border border-border/60 shadow-xs">
                                {getCategoryIcon(key)}
                              </div>
                              <div>
                                <h4 className="text-sm font-semibold text-foreground">{cat.label}</h4>
                                <span className="text-xs font-bold text-muted-foreground">
                                  {cat.count.toLocaleString()} records
                                </span>
                              </div>
                            </div>
                            <div className={`w-5 h-5 rounded flex items-center justify-center border transition ${
                              isSelected ? 'bg-destructive border-destructive text-white' : 'border-border bg-card'
                            }`}>
                              {isSelected && <CheckCircle size={14} />}
                            </div>
                          </div>

                          {/* Detailed Breakdown */}
                          {cat.details && (
                            <div className="pt-2 border-t border-border/40 text-[11px] text-muted-foreground flex flex-wrap gap-x-3 gap-y-1">
                              {Object.entries(cat.details).map(([subKey, subVal]) => (
                                <span key={subKey}>
                                  <span className="capitalize">{subKey}</span>: <b className="text-foreground">{subVal}</b>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
              </div>

              {/* Protected Notice */}
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs flex items-center gap-2.5">
                <AlertTriangle size={16} className="shrink-0 text-amber-600 dark:text-amber-400" />
                <span>
                  <b>Security Safeguard:</b> The logged-in Super Admin account and RBAC system permissions are strictly protected and will never be deleted.
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => handleOpenCleanupModal(true)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold text-destructive border border-destructive/30 hover:bg-destructive/10 transition flex items-center justify-center gap-2"
                >
                  <AlertTriangle size={15} />
                  <span>Full Database Wipe (Clean Slate)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenCleanupModal(false)}
                  disabled={selectedTargets.length === 0}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-semibold bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Trash2 size={15} />
                  <span>
                    Clean Selected Data ({selectedTargets.length} {selectedTargets.length === 1 ? 'module' : 'modules'})
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────
              SECTION 2: SAMPLE DATA SEEDER SETUP
          ───────────────────────────────────────────────────────── */}
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border">
              <div className="flex items-center gap-2">
                <Sparkles size={20} className="text-brand" />
                <h2 className="text-lg font-bold text-foreground">Sample Data Seeder Setup</h2>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Instantly populate realistic sample data into the database for testing, feature demonstration, or setting up a fresh test environment.
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* Comprehensive Option Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-brand/10 via-brand/5 to-transparent border border-brand/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand text-brand-foreground uppercase tracking-wider">
                      Recommended
                    </span>
                    <h3 className="text-base font-bold text-foreground">Complete Academy Demo Dataset</h3>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Seeds standard 7 Quran courses, 7 qualified Quran teachers with salaries & bios, 2 supervisors, 12 international students with multi-day weekly schedules, historical & upcoming class sessions, invoices, and Islamic PDF materials.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleExecuteSeed('comprehensive')}
                  disabled={seedingType !== null}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-brand hover:bg-brand/90 text-brand-foreground shadow-sm transition flex items-center gap-2 shrink-0 disabled:opacity-50"
                >
                  {seedingType === 'comprehensive' ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Sparkles size={16} />
                  )}
                  <span>Seed Complete Academy</span>
                </button>
              </div>

              {/* Granular Seeder Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Seed Teachers & Courses */}
                <div className="p-4 rounded-xl border border-border bg-muted/20 flex flex-col justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen size={16} className="text-indigo-500" />
                      <h4 className="text-xs font-bold text-foreground">Standard Courses & Teachers</h4>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Creates the 7 official courses (Nazira, Tajweed, Hifz, Tafseer, Qiraat, etc.) and qualified instructor accounts.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleExecuteSeed('courses_teachers')}
                    disabled={seedingType !== null}
                    className="w-full py-2 px-3 rounded-lg text-xs font-semibold bg-muted hover:bg-muted/80 text-foreground border border-border transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {seedingType === 'courses_teachers' ? (
                      <Loader2 size={14} className="animate-spin text-brand" />
                    ) : (
                      <BookOpen size={14} />
                    )}
                    <span>Seed Courses & Teachers</span>
                  </button>
                </div>

                {/* Seed Students */}
                <div className="p-4 rounded-xl border border-border bg-muted/20 flex flex-col justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <GraduationCap size={16} className="text-emerald-500" />
                      <h4 className="text-xs font-bold text-foreground">12 Sample Students & Slots</h4>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Adds 12 realistic international students with guardian contacts, recurring weekly schedule slots, and classes.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleExecuteSeed('students')}
                    disabled={seedingType !== null}
                    className="w-full py-2 px-3 rounded-lg text-xs font-semibold bg-muted hover:bg-muted/80 text-foreground border border-border transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {seedingType === 'students' ? (
                      <Loader2 size={14} className="animate-spin text-brand" />
                    ) : (
                      <GraduationCap size={14} />
                    )}
                    <span>Seed 12 Students</span>
                  </button>
                </div>

                {/* Seed Finance */}
                <div className="p-4 rounded-xl border border-border bg-muted/20 flex flex-col justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <CreditCard size={16} className="text-emerald-600" />
                      <h4 className="text-xs font-bold text-foreground">Invoices & Salaries</h4>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Generates active month student fee invoices (both paid and pending) and teacher monthly salary disbursements.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleExecuteSeed('finance')}
                    disabled={seedingType !== null}
                    className="w-full py-2 px-3 rounded-lg text-xs font-semibold bg-muted hover:bg-muted/80 text-foreground border border-border transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {seedingType === 'finance' ? (
                      <Loader2 size={14} className="animate-spin text-brand" />
                    ) : (
                      <CreditCard size={14} />
                    )}
                    <span>Seed Finance Data</span>
                  </button>
                </div>

                {/* Seed Materials */}
                <div className="p-4 rounded-xl border border-border bg-muted/20 flex flex-col justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <FileText size={16} className="text-rose-500" />
                      <h4 className="text-xs font-bold text-foreground">PDF Course Materials</h4>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Populates standard Noorani Qaida, Tajweed handbook, Juz 30 Amma, and Masnoon Duas documents.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleExecuteSeed('materials')}
                    disabled={seedingType !== null}
                    className="w-full py-2 px-3 rounded-lg text-xs font-semibold bg-muted hover:bg-muted/80 text-foreground border border-border transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {seedingType === 'materials' ? (
                      <Loader2 size={14} className="animate-spin text-brand" />
                    ) : (
                      <FileText size={14} />
                    )}
                    <span>Seed PDF Materials</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          CONFIRMATION MODAL FOR CLEANUP
      ───────────────────────────────────────────────────────────── */}
      {isCleanupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-destructive">
                <AlertTriangle size={22} />
                <h3 className="text-lg font-bold text-foreground">
                  {isFullReset ? 'Confirm Full Database Wipe' : 'Confirm Data Cleanup'}
                </h3>
              </div>
              <button
                onClick={() => setIsCleanupModalOpen(false)}
                className="text-muted-foreground hover:text-foreground transition"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              {isFullReset
                ? 'This action will permanently delete all students, teachers, courses, classes, schedules, finances, and materials. Your Super Admin account will remain intact.'
                : 'This action will permanently remove selected records and their associated relations from the database.'}
            </p>

            {!isFullReset && (
              <div className="bg-muted/40 p-3 rounded-xl border border-border/60 text-xs space-y-1">
                <span className="font-semibold text-foreground">Categories to be cleaned:</span>
                <ul className="list-disc list-inside text-muted-foreground mt-1 space-y-0.5">
                  {selectedTargets.map((t) => (
                    <li key={t}>
                      {dbStats?.categories[t]?.label || t} (
                      {dbStats?.categories[t]?.count?.toLocaleString() || 0} items)
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Type <span className="font-mono font-bold text-destructive">CLEANUP</span> to confirm:
              </label>
              <input
                type="text"
                value={cleanupConfirmationInput}
                onChange={(e) => setCleanupConfirmationInput(e.target.value)}
                placeholder="CLEANUP"
                className="w-full px-3 py-2 rounded-xl border border-border bg-card text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-destructive/50"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsCleanupModalOpen(false)}
                disabled={isCleaning}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteCleanup}
                disabled={
                  isCleaning ||
                  (cleanupConfirmationInput.trim().toUpperCase() !== 'CLEANUP' &&
                    cleanupConfirmationInput.trim().toUpperCase() !== 'CONFIRM')
                }
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-destructive hover:bg-destructive/90 text-destructive-foreground transition flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isCleaning ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                <span>Execute Cleanup</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
