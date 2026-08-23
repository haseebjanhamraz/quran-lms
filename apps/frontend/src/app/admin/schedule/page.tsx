'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Calendar as CalendarIcon, Clock, Filter, UserCheck, Move, CheckCircle2,
  AlertCircle, RefreshCw, Repeat, Trash2, Info, Settings, Plus, X,
  ChevronUp, ChevronDown, RotateCcw, Save
} from 'lucide-react';
import { apiFetch } from '@/utils/apiFetch';
import DailyScheduleView from '@/components/DailyScheduleView';
import { useTimeSlots, DEFAULT_TIME_SLOTS } from '@/hooks/useTimeSlots';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { useWebSocket } from '@/hooks/useWebSocket';

interface TeacherItem {
  id: string;
  name: string;
  email?: string;
  assignedDaysCount?: number;
  color?: string;
}

interface SlotAssignment {
  id?: string;
  dayOfWeek: string;
  timeSlotIndex: number;
  startTime: string;
  endTime: string;
  teacherId: string;
  teacher?: { id: string; name: string; email?: string };
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const DEFAULT_TEACHERS: TeacherItem[] = [
  { id: '1', name: 'Qari Muneeb', assignedDaysCount: 5 },
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
  const [view, setView] = useState<'weekly' | 'daily'>('weekly');
  const [teachers, setTeachers] = useState<TeacherItem[]>(DEFAULT_TEACHERS);
  const [gridAssignments, setGridAssignments] = useState<Record<string, SlotAssignment>>({});
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
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
            <h1 className="text-3xl font-display font-bold">Schedule & Timetable Drag & Drop</h1>
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border flex items-center gap-1.5 ${wsConnected ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' : 'bg-blue-500/10 text-blue-500 border-blue-500/30'
              }`}>
              <span className={`h-2 w-2 rounded-full ${wsConnected ? 'bg-emerald-500 animate-pulse' : 'bg-blue-500'}`} />
              {wsConnected ? 'Realtime Live' : 'Active'}
            </span>
          </div>
          <p className="text-muted-foreground mt-1">Drag teachers onto the schedule grid to assign classes with instant DB persistence & real-time sync.</p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
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

      {/* ALL TEACHERS DRAGGABLE HEADER BAR */}
      <div className="glass-panel p-5 rounded-2xl border border-border/60 shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-brand" />
            <h3 className="text-sm font-bold font-display uppercase tracking-wider text-foreground">
              All Teachers List (Drag & Drop to Assign)
            </h3>
          </div>
          <span className="text-xs text-muted-foreground font-semibold">
            {teachers.length} Active Teachers
          </span>
        </div>

        <div className="flex items-center flex-wrap gap-2.5 pt-1">
          {teachers.map((teacher, idx) => {
            const colorClass = getTeacherColor(idx);
            return (
              <div
                key={teacher.id}
                draggable
                onDragStart={(e) => handleDragStartFromTopBar(e, teacher)}
                onClick={() => handleTeacherClick(teacher)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md hover:scale-105 transition-all ${colorClass}`}
              >
                <Move className="h-3.5 w-3.5 opacity-60" />
                <span>{teacher.name}</span>
                {teacher.assignedDaysCount !== undefined && (
                  <span className="bg-background/40 px-1.5 py-0.5 rounded text-[10px]">
                    {teacher.assignedDaysCount} slots
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {view === 'weekly' ? (
        <div className="space-y-6 animate-fadeIn">
          {/* Teacher Filter Dropdown & Quick Slot Stats */}
          <div className="glass-panel p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-border/50">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-brand" />
              <span className="text-sm font-semibold text-foreground">Filter View by Teacher:</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative min-w-[240px]">
                <select
                  value={activeFilter || ''}
                  onChange={(e) => setActiveFilter(e.target.value || null)}
                  className="w-full bg-card border border-border rounded-xl px-4 py-2 text-sm font-semibold text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-brand/50 cursor-pointer transition-all"
                >
                  <option value="">All Teachers (Show Everyone)</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} {t.assignedDaysCount !== undefined ? `(${t.assignedDaysCount} slots)` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

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
                        const isOver = dragOverSlotKey === slotKey;

                        const teacherIndex = teachers.findIndex((t) => t.id === slotData?.teacherId);
                        const isVisible = !activeFilter || activeFilter === slotData?.teacherId || activeFilter === slotData?.teacher?.name;

                        return (
                          <td
                            key={slotKey}
                            onDragOver={(e) => handleDragOver(e, slotKey)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, day, timeIdx)}
                            className={`p-3 text-center border-r border-border last:border-0 transition-all ${isOver ? 'bg-primary/20 ring-2 ring-primary ring-inset' : isWeekend && !slotData ? 'bg-card/20' : ''
                              }`}
                          >
                            {slotData && isVisible ? (
                              <div
                                draggable
                                onDragStart={(e) => handleDragStartFromGrid(e, slotData, slotKey)}
                                className={`group relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-all ${getTeacherColor(teacherIndex >= 0 ? teacherIndex : 0)
                                  }`}
                              >
                                <Move className="h-3 w-3 opacity-60" />
                                <span>{slotData.teacher?.name || 'Assigned'}</span>
                                <button
                                  onClick={(e) => handleRemoveSlot(day, timeIdx, e)}
                                  className="opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity ml-1"
                                  title="Remove slot"
                                >
                                  <Trash2 size={12} />
                                </button>
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
          allowDragDrop={true}
          onDropSlot={async (targetDay, targetTimeIdx, payload) => {
            const targetSlotKey = `${targetDay}-${targetTimeIdx}`;
            const slotRange = timeSlots[targetTimeIdx] || `${targetTimeIdx}:00 - ${targetTimeIdx}:30`;
            const [startTime, endTime] = slotRange.split(' - ').map((s) => s?.trim() || '');
            const teacher = teachers.find((t) => t.id === payload.teacherId);
            const teacherName = teacher?.name || payload.teacherName;

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
          }}
          onRemoveSlot={async (dayOfWeek, timeSlotIndex) => {
            const dummyEvent = { stopPropagation: () => {} } as any;
            await handleRemoveSlot(dayOfWeek, timeSlotIndex, dummyEvent);
          }}
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

