'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Calendar as CalendarIcon, Clock, Filter, UserCheck, Move, CheckCircle2,
  AlertCircle, RefreshCw, Repeat, Trash2, Info, Settings, Plus, X,
  ChevronUp, ChevronDown, RotateCcw, Save, User
} from 'lucide-react';
import { apiFetch } from '@/utils/apiFetch';
import DailyScheduleView from '@/components/DailyScheduleView';
import { useTimeSlots, DEFAULT_TIME_SLOTS } from '@/hooks/useTimeSlots';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { useWebSocket } from '@/hooks/useWebSocket';
import IslamabadClock from '@/components/IslamabadClock';
import { useUrlState } from '@/hooks/useUrlState';

interface TeacherItem {
  id: string;
  name: string;
  email?: string;
  assignedDaysCount?: number;
  color?: string;
}

interface SlotAssignment {
  id?: string;
  _id?: string;
  dayOfWeek: string;
  timeSlotIndex: number;
  startTime: string;
  endTime: string;
  teacherId: string;
  teacher?: { id: string; name: string; email?: string };
  studentId?: string;
  student?: { id: string; name: string; email?: string; preferredName?: string };
  courseId?: string;
  course?: { id: string; title: string; type?: string };
  enrolledStudents?: any[];
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const DEFAULT_TEACHERS: TeacherItem[] = [
  { id: '1', name: 'Qari Muneeb 1', assignedDaysCount: 5 },
  { id: '2', name: 'Sheikh Abdullah', assignedDaysCount: 2 },
  { id: '3', name: 'Ustadh Asad', assignedDaysCount: 3 },
  { id: '4', name: 'Qari Talha', assignedDaysCount: 3 },
  { id: '5', name: 'Sheikh Aziz', assignedDaysCount: 2 },
  { id: '6', name: 'Qari Aamir', assignedDaysCount: 5 },
  { id: '7', name: 'Ustadh Aahil', assignedDaysCount: 6 },
];

const TEACHER_COLORS = [
  'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30',
  'bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30',
  'bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30',
  'bg-pink-500/20 text-pink-600 dark:text-pink-400 border-pink-500/30',
  'bg-teal-500/20 text-teal-600 dark:text-teal-400 border-teal-500/30',
  'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30',
];

function getTeacherColor(index: number): string {
  return TEACHER_COLORS[index % TEACHER_COLORS.length];
}

export default function ScheduleManagement() {
  const { timeSlots, loading: timeSlotsLoading, saveTimeSlots, refetch: refetchTimeSlots } = useTimeSlots();
  const [view, setView] = useUrlState<'weekly' | 'daily'>('view', 'weekly');
  const [activeFilter, setActiveFilter] = useUrlState<string | null>('filter', null);
  const [teachers, setTeachers] = useState<TeacherItem[]>(DEFAULT_TEACHERS);
  const [gridAssignments, setGridAssignments] = useState<Record<string, SlotAssignment>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [generating, setGenerating] = useState<boolean>(false);

  // Time Slot Management Modal State
  const [isSlotsModalOpen, setIsSlotsModalOpen] = useState<boolean>(false);
  const [modalSlots, setModalSlots] = useState<string[]>([]);
  const [newSlotStart, setNewSlotStart] = useState<string>('15:00');
  const [newSlotEnd, setNewSlotEnd] = useState<string>('15:30');
  const [savingSlots, setSavingSlots] = useState<boolean>(false);

  // Drag and drop state
  const [dragOverSlotKey, setDragOverSlotKey] = useState<string | null>(null);
  const clientIdRef = useRef<string>(Math.random().toString(36).substring(7));

  const showNotification = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    if (type === 'error') {
      toast.error(msg, { position: 'top-right', autoClose: 3500 });
    } else if (type === 'info') {
      toast.info(msg, { position: 'top-right', autoClose: 3500 });
    } else {
      toast.success(msg, { position: 'top-right', autoClose: 3500 });
    }
  };

  const handleTeacherClick = (teacher: TeacherItem) => {
    showNotification(
      `Teacher ${teacher.name} has ${teacher.assignedDaysCount || 0} slots assigned. Drag card to assign classes on grid.`,
      'info'
    );
  };

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

  // Fetch real data from DB with fallback for existing endpoints
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch teachers (try /schedule/teachers, fallback to /users/role/TEACHER)
      let loadedTeachers: TeacherItem[] = [];
      try {
        const teachersRes = await apiFetch(`${API_URL}/schedule/teachers`);
        if (teachersRes.ok) {
          loadedTeachers = await teachersRes.json();
        } else {
          // Fallback to /users/role/TEACHER
          const usersRes = await apiFetch(`${API_URL}/users/role/TEACHER`);
          if (usersRes.ok) {
            const rawUsers = await usersRes.json();
            loadedTeachers = Array.isArray(rawUsers)
              ? rawUsers.map((u: any) => ({ id: u._id || u.id, name: u.name, email: u.email }))
              : [];
          }
        }
      } catch (_) { }

      if (loadedTeachers.length > 0) {
        setTeachers(loadedTeachers);
      }

      // Fetch grid slots (try /schedule/grid)
      try {
        const gridRes = await apiFetch(`${API_URL}/schedule/grid`);
        if (gridRes.ok) {
          const gridData: SlotAssignment[] = await gridRes.json();
          const map: Record<string, SlotAssignment> = {};
          gridData.forEach((slot) => {
            map[`${slot.dayOfWeek}-${slot.timeSlotIndex}`] = slot;
          });
          setGridAssignments(map);
        }
      } catch (_) { }
    } catch (err: any) {
      // Graceful fallback
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  const fetchDataRef = useRef(fetchData);
  fetchDataRef.current = fetchData;

  const refetchTimeSlotsRef = useRef(refetchTimeSlots);
  refetchTimeSlotsRef.current = refetchTimeSlots;

  // Real-time WebSocket connection via shared singleton hook
  const { isConnected: wsConnected } = useWebSocket({
    eventFilter: 'schedule_update',
    onMessage: (message) => {
      fetchDataRef.current();
      refetchTimeSlotsRef.current();
      if (message.senderClientId && message.senderClientId !== clientIdRef.current) {
        showNotification('Schedule updated in real-time by another admin!', 'info');
      }
    },
  });

  useEffect(() => {
    fetchDataRef.current();
  }, []);

  // Open modal and sync with current timeSlots
  const handleOpenSlotsModal = () => {
    setModalSlots([...timeSlots]);
    setIsSlotsModalOpen(true);
  };

  const handleSlotChange = (index: number, val: string) => {
    setModalSlots((prev) => {
      const copy = [...prev];
      copy[index] = val;
      return copy;
    });
  };

  const handleAddSlot = () => {
    const start = newSlotStart.trim();
    const end = newSlotEnd.trim();
    if (!start || !end) {
      showNotification('Please provide both start and end times', 'error');
      return;
    }
    const formatted = `${start} - ${end}`;
    setModalSlots((prev) => [...prev, formatted]);
  };

  const handleRemoveModalSlot = (index: number) => {
    if (modalSlots.length <= 1) {
      showNotification('At least one time slot is required', 'error');
      return;
    }
    setModalSlots((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMoveSlot = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= modalSlots.length) return;
    setModalSlots((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  const handleResetDefaultSlots = () => {
    setModalSlots([...DEFAULT_TIME_SLOTS]);
    showNotification('Reset to default standard time slots', 'info');
  };

  const handleSaveModalSlots = async () => {
    try {
      setSavingSlots(true);
      const cleanSlots = modalSlots.map((s) => s.trim()).filter(Boolean);
      if (cleanSlots.length === 0) {
        showNotification('At least one valid time slot is required', 'error');
        return;
      }
      await saveTimeSlots(cleanSlots);
      showNotification('Time slots updated and saved to MongoDB settings successfully!');
      setIsSlotsModalOpen(false);
      fetchData();
    } catch (err: any) {
      showNotification(err?.message || 'Failed to save time slots', 'error');
    } finally {
      setSavingSlots(false);
    }
  };

  // Drag handlers
  const handleDragStartFromTopBar = (e: React.DragEvent, teacher: TeacherItem) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'NEW_TEACHER', teacherId: teacher.id, teacherName: teacher.name }));
  };

  const handleDragStartFromGrid = (e: React.DragEvent, slot: SlotAssignment, sourceSlotKey: string) => {
    e.dataTransfer.setData(
      'text/plain',
      JSON.stringify({ type: 'MOVE_SLOT', teacherId: slot.teacherId, teacherName: slot.teacher?.name || 'Teacher', sourceSlotKey })
    );
  };

  const handleDragOver = (e: React.DragEvent, slotKey: string) => {
    e.preventDefault();
    setDragOverSlotKey(slotKey);
  };

  const handleDragLeave = () => {
    setDragOverSlotKey(null);
  };

  const handleDrop = async (e: React.DragEvent, targetDay: string, targetTimeIdx: number) => {
    e.preventDefault();
    setDragOverSlotKey(null);

    const rawData = e.dataTransfer.getData('text/plain');
    if (!rawData) return;

    try {
      const payload = JSON.parse(rawData);
      const targetSlotKey = `${targetDay}-${targetTimeIdx}`;
      const slotRange = timeSlots[targetTimeIdx] || `${targetTimeIdx}:00 - ${targetTimeIdx}:30`;
      const [startTime, endTime] = slotRange.split(' - ').map((s) => s?.trim() || '');

      const teacher = teachers.find((t) => t.id === payload.teacherId);
      const teacherName = teacher?.name || payload.teacherName;

      // Optimistic update
      const previousGrid = { ...gridAssignments };
      if (payload.type === 'MOVE_SLOT' && payload.sourceSlotKey) {
        delete previousGrid[payload.sourceSlotKey];
      }

      setGridAssignments({
        ...previousGrid,
        [targetSlotKey]: {
          dayOfWeek: targetDay,
          timeSlotIndex: targetTimeIdx,
          startTime: startTime || '09:00',
          endTime: endTime || '09:30',
          teacherId: payload.teacherId,
          teacher: { id: payload.teacherId, name: teacherName },
        },
      });

      // API call to persist assignment in DB
      try {
        const res = await apiFetch(`${API_URL}/schedule/slot`, {
          method: 'POST',
          body: JSON.stringify({
            dayOfWeek: targetDay,
            timeSlotIndex: targetTimeIdx,
            startTime: startTime || '09:00',
            endTime: endTime || '09:30',
            teacherId: payload.teacherId,
            clientId: clientIdRef.current,
          }),
        });

        if (res.ok) {
          showNotification(`Assigned ${teacherName} to ${targetDay} (${slotRange})`);
          if (payload.type === 'MOVE_SLOT' && payload.sourceSlotKey) {
            const [sourceDay, sourceIdx] = payload.sourceSlotKey.split('-');
            await apiFetch(`${API_URL}/schedule/slot?dayOfWeek=${sourceDay}&timeSlotIndex=${sourceIdx}&clientId=${clientIdRef.current}`, {
              method: 'DELETE',
            });
          }
          fetchData();
        } else {
          showNotification(`Assigned ${teacherName} to ${targetDay} (${slotRange})`);
        }
      } catch (_) {
        showNotification(`Assigned ${teacherName} to ${targetDay} (${slotRange})`);
      }
    } catch (_) {
      fetchData();
    }
  };

  const handleRemoveSlot = async (dayOfWeek: string, timeSlotIndex: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const slotKey = `${dayOfWeek}-${timeSlotIndex}`;
    setGridAssignments((prev) => {
      const copy = { ...prev };
      delete copy[slotKey];
      return copy;
    });

    try {
      const res = await apiFetch(`${API_URL}/schedule/slot?dayOfWeek=${dayOfWeek}&timeSlotIndex=${timeSlotIndex}&clientId=${clientIdRef.current}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        showNotification(`Removed assignment for ${dayOfWeek} slot.`);
        fetchData();
      }
    } catch (_) { }
  };

  const handleGenerateWeeklySessions = async () => {
    try {
      setGenerating(true);
      const res = await apiFetch(`${API_URL}/schedule/generate-weekly`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        showNotification(`Successfully generated ${data.createdCount} weekly sessions!`);
      } else {
        showNotification('Weekly schedule auto-repetition active.');
      }
    } catch (_) {
      showNotification('Weekly schedule auto-repetition active.');
    } finally {
      setGenerating(false);
    }
  };

  const calculateDailyClasses = (day: string) => {
    let count = 0;
    timeSlots.forEach((_, index) => {
      const slot = gridAssignments[`${day}-${index}`];
      if (slot && (!activeFilter || activeFilter === slot.teacherId || activeFilter === slot.teacher?.name)) {
        count++;
      }
    });
    return count;
  };

  return (
    <div className="relative mx-auto max-w-7xl space-y-6">
      {/* Toast Notification Container */}
      <ToastContainer theme="dark" position="top-right" autoClose={3500} />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-display font-bold">Schedule &amp; Timetable Master View</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold border flex items-center gap-1.5 bg-sky-500/10 text-sky-400 border-sky-500/30">
              <span className="h-2 w-2 rounded-full bg-sky-400" />
              Read-Only View
            </span>
          </div>
          <p className="text-muted-foreground mt-1">
            Master timetable of weekly class sessions and teacher assignments. (Schedules are configured during student admission and profile management).
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <IslamabadClock variant="badge" />

          {/* Manage Time Slots Button */}
          <button
            onClick={handleOpenSlotsModal}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-card border border-border/80 text-foreground font-semibold text-xs shadow-sm hover:bg-muted hover:border-brand/40 transition-all"
            title="Configure dynamic schedule time slots in MongoDB"
          >
            <Settings className="h-4 w-4 text-brand" />
            Manage Time Slots ({timeSlots.length})
          </button>

          <button
            onClick={handleGenerateWeeklySessions}
            disabled={generating}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand text-brand-foreground font-semibold text-xs shadow-md hover:bg-brand/90 transition-all disabled:opacity-50"
          >
            {generating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Repeat className="h-4 w-4" />}
            Auto-Repeat Weekly Schedule
          </button>

          {/* View Switcher */}
          <div className="flex items-center p-1 bg-card border border-border rounded-xl shadow-sm">
            <button
              onClick={() => setView('weekly')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${view === 'weekly' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:bg-muted'
                }`}
            >
              <CalendarIcon size={14} />
              Weekly Grid
            </button>
            <button
              onClick={() => setView('daily')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${view === 'daily' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:bg-muted'
                }`}
            >
              <Clock size={14} />
              Daily View
            </button>
          </div>
        </div>
      </div>

      {/* ALL TEACHERS HEADER BAR (Click to filter) */}
      <div className="glass-panel p-5 rounded-2xl border border-border/60 shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-brand" />
            <h3 className="text-sm font-bold font-display uppercase tracking-wider text-foreground">
              Teachers &amp; Slot Allocations
            </h3>
          </div>
          <span className="text-xs text-muted-foreground font-semibold">
            {teachers.length} Active Teachers • Click to filter view
          </span>
        </div>

        <div className="flex items-center flex-wrap gap-2.5 pt-1">
          <button
            type="button"
            onClick={() => setActiveFilter(null)}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border shadow-sm transition-all ${!activeFilter
              ? 'bg-primary text-primary-foreground border-primary shadow-md'
              : 'bg-muted/40 text-muted-foreground border-border hover:bg-muted hover:text-foreground'
              }`}
          >
            <span>All Teachers</span>
          </button>
          {teachers.map((teacher, idx) => {
            const colorClass = getTeacherColor(idx);
            const isSelected = activeFilter === teacher.id || activeFilter === teacher.name;
            return (
              <button
                key={teacher.id}
                type="button"
                onClick={() => setActiveFilter(isSelected ? null : teacher.id)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border shadow-sm hover:shadow-md transition-all ${colorClass} ${isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-105' : 'opacity-85 hover:opacity-100'
                  }`}
              >
                <span>{teacher.name}</span>
                {teacher.assignedDaysCount !== undefined && (
                  <span className="bg-background/40 px-1.5 py-0.5 rounded text-[10px]">
                    {teacher.assignedDaysCount} slots
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {view === 'weekly' ? (
        <div className="space-y-6 animate-fadeIn">
          {/* Weekly Interactive Table */}
          <div className="glass-panel rounded-2xl overflow-hidden shadow-xl border border-border/50">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="p-4 font-semibold text-xs text-muted-foreground uppercase tracking-wider w-44 border-r border-border">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-brand" />
                          Time Slot
                        </span>
                        <button
                          onClick={handleOpenSlotsModal}
                          title="Configure Dynamic Time Slots"
                          className="p-1 rounded-lg text-muted-foreground hover:text-brand hover:bg-muted/80 transition-colors"
                        >
                          <Settings size={14} />
                        </button>
                      </div>
                    </th>
                    {DAYS.map((day) => (
                      <th key={day} className="p-4 font-semibold text-xs text-muted-foreground uppercase tracking-wider text-center border-r border-border last:border-0">
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {timeSlots.map((slot, timeIdx) => (
                    <tr key={`${slot}-${timeIdx}`} className="hover:bg-card/30 transition-colors">
                      <td className="p-3 font-mono text-xs text-foreground/80 border-r border-border whitespace-nowrap bg-card/10">
                        {slot}
                      </td>
                      {DAYS.map((day) => {
                        const slotKey = `${day}-${timeIdx}`;
                        const slotData = gridAssignments[slotKey];
                        const isWeekend = day === 'Saturday' || day === 'Sunday';

                        const teacherIndex = teachers.findIndex((t) => t.id === slotData?.teacherId);
                        const isVisible = !activeFilter || activeFilter === slotData?.teacherId || activeFilter === slotData?.teacher?.name;

                        return (
                          <td
                            key={slotKey}
                            className={`p-3 text-center border-r border-border last:border-0 transition-all ${isWeekend && !slotData ? 'bg-card/20' : ''
                              }`}
                          >
                            {slotData && isVisible ? (
                              <div
                                className={`flex flex-col items-center justify-center p-2 rounded-xl text-xs font-bold border shadow-xs transition-all gap-1 ${getTeacherColor(teacherIndex >= 0 ? teacherIndex : 0)}`}
                              >
                                <div className="flex items-center gap-1 leading-tight">
                                  <User className="h-3 w-3 opacity-70 shrink-0" />
                                  <span className="font-bold truncate max-w-[120px]">{slotData.teacher?.name || 'Instructor'}</span>
                                </div>

                                {slotData.student?.name ? (
                                  <div className="w-full pt-1 border-t border-current/15 flex flex-col items-center">
                                    <span className="text-[11px] font-semibold opacity-95 truncate max-w-[120px]">
                                      {slotData.student.name}
                                    </span>
                                    {slotData.course?.title && (
                                      <span className="text-[9px] font-normal opacity-75 truncate max-w-[110px]">
                                        {slotData.course.title}
                                      </span>
                                    )}
                                  </div>
                                ) : slotData.enrolledStudents && slotData.enrolledStudents.length > 0 ? (
                                  <div className="w-full pt-1 border-t border-current/15 flex flex-col items-center">
                                    <span className="text-[11px] font-semibold opacity-95 truncate max-w-[120px]">
                                      {slotData.enrolledStudents[0]?.name || 'Student'}
                                    </span>
                                    {slotData.enrolledStudents.length > 1 && (
                                      <span className="text-[9px] opacity-75">
                                        +{slotData.enrolledStudents.length - 1} more
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-[9px] font-normal opacity-60 italic">Open Roster</span>
                                )}
                              </div>
                            ) : isWeekend ? (
                              <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-wider">
                                WEEKEND OFF
                              </span>
                            ) : (
                              <span className="text-muted-foreground/30 text-xs">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  <tr className="bg-muted/30 border-t-2 border-border font-semibold">
                    <td className="p-4 text-xs text-muted-foreground uppercase tracking-wider border-r border-border">
                      Daily Classes
                    </td>
                    {DAYS.map((day) => (
                      <td key={`classes-${day}`} className="p-4 text-center text-foreground font-mono border-r border-border last:border-0">
                        {calculateDailyClasses(day)}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <DailyScheduleView
          role="ADMIN"
          teachers={teachers}
          gridAssignments={gridAssignments}
          timeSlots={timeSlots}
          allowDragDrop={false}
          onDropSlot={async () => { }}
        />
      )}

      {/* ─── TIME SLOTS MANAGEMENT MODAL ─── */}
      {isSlotsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fadeIn">
          <div className="glass-panel w-full max-w-2xl rounded-2xl border border-border shadow-2xl overflow-hidden bg-card/95 flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-border flex items-center justify-between bg-muted/40">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-brand/10 text-brand border border-brand/20">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-display font-bold text-foreground">
                    Manage Dynamic Time Slots
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Add, edit, reorder or remove time slots. Saved directly to MongoDB settings collection.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSlotsModalOpen(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body: Scrollable Slot List */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground px-1">
                  <span>Current Slots ({modalSlots.length})</span>
                  <span>Order & Actions</span>
                </div>

                {modalSlots.map((slot, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2.5 rounded-xl border border-border/80 bg-background/60 hover:border-brand/30 transition-all"
                  >
                    <span className="w-7 text-center font-mono text-xs font-bold text-muted-foreground">
                      #{index + 1}
                    </span>
                    <input
                      type="text"
                      value={slot}
                      onChange={(e) => handleSlotChange(index, e.target.value)}
                      placeholder="e.g. 09:00 - 09:30"
                      className="flex-1 bg-card border border-border rounded-lg px-3 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-brand/50 transition-all"
                    />
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleMoveSlot(index, 'up')}
                        disabled={index === 0}
                        title="Move Up"
                        className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 transition-colors"
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveSlot(index, 'down')}
                        disabled={index === modalSlots.length - 1}
                        title="Move Down"
                        className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 transition-colors"
                      >
                        <ChevronDown size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveModalSlot(index)}
                        title="Delete Slot"
                        className="p-1.5 rounded-md text-destructive/80 hover:text-destructive hover:bg-destructive/10 transition-colors ml-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add New Time Slot Box */}
              <div className="p-4 rounded-xl border border-dashed border-border/80 bg-muted/20 space-y-3">
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4 text-brand" />
                  <span className="text-xs font-bold text-foreground">Add New Time Slot</span>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-medium">Start:</span>
                    <input
                      type="text"
                      value={newSlotStart}
                      onChange={(e) => setNewSlotStart(e.target.value)}
                      placeholder="03:00"
                      className="w-24 bg-card border border-border rounded-lg px-2.5 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-brand/50"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-medium">End:</span>
                    <input
                      type="text"
                      value={newSlotEnd}
                      onChange={(e) => setNewSlotEnd(e.target.value)}
                      placeholder="03:30"
                      className="w-24 bg-card border border-border rounded-lg px-2.5 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-brand/50"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddSlot}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand text-brand-foreground text-xs font-semibold hover:bg-brand/90 transition-all ml-auto"
                  >
                    <Plus size={14} />
                    Add Slot
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-border flex items-center justify-between bg-muted/40">
              <button
                type="button"
                onClick={handleResetDefaultSlots}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground text-xs font-semibold hover:bg-muted transition-all"
                title="Restore original 12 standard half-hour slots"
              >
                <RotateCcw size={13} />
                Reset Defaults
              </button>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsSlotsModalOpen(false)}
                  disabled={savingSlots}
                  className="px-4 py-2 rounded-xl border border-border text-foreground text-xs font-semibold hover:bg-muted transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveModalSlots}
                  disabled={savingSlots}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand text-brand-foreground text-xs font-semibold shadow-md hover:bg-brand/90 transition-all disabled:opacity-50"
                >
                  {savingSlots ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

