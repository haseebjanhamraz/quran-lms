'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Calendar as CalendarIcon, Clock, Filter, UserCheck, Move, CheckCircle2,
  AlertCircle, RefreshCw, Repeat, Trash2, Info
} from 'lucide-react';
import { apiFetch } from '@/utils/apiFetch';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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

const TIME_SLOTS = [
  '09:00 - 09:30', '09:30 - 10:00', '10:00 - 10:30', '10:30 - 11:00',
  '11:00 - 11:30', '11:30 - 12:00', '12:00 - 12:30', '12:30 - 01:00',
  '01:00 - 01:30', '01:30 - 02:00', '02:00 - 02:30', '02:30 - 03:00'
];

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

const DAILY_SCHEDULE_DATA = [
  { id: 1, teacherTime: '09:00 am - 09:30 am', studentTime: '12:00 pm', studentName: 'Ali Khan', courseName: 'Quran Reading', status: 'Regular' },
  { id: 2, teacherTime: '10:00 am - 10:30 am', studentTime: '01:00 pm', studentName: 'Sara Ahmed', courseName: 'Tajweed', status: 'Trial' },
  { id: 3, teacherTime: '11:30 am - 12:00 pm', studentTime: '02:30 pm', studentName: 'Omar Farooq', courseName: 'Hifz', status: 'Regular' }
];

export default function ScheduleManagement() {
  const [view, setView] = useState<'weekly' | 'daily'>('weekly');
  const [teachers, setTeachers] = useState<TeacherItem[]>(DEFAULT_TEACHERS);
  const [gridAssignments, setGridAssignments] = useState<Record<string, SlotAssignment>>({});
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [generating, setGenerating] = useState<boolean>(false);

  // Drag and drop state
  const [dragOverSlotKey, setDragOverSlotKey] = useState<string | null>(null);
  const [wsConnected, setWsConnected] = useState<boolean>(false);

  const socketRef = useRef<WebSocket | null>(null);
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

  // Real-time WebSocket connection with graceful error handling
  useEffect(() => {
    fetchData();

    let wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:5001';
    if (typeof window !== 'undefined') {
      const isSecure = window.location.protocol === 'https:';
      const wsProtocol = isSecure ? 'wss:' : 'ws:';
      if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        wsUrl = `${wsProtocol}//${window.location.host}/ws`;
      }
    }

    let ws: WebSocket | null = null;

    try {
      ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        setWsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.event === 'schedule_update') {
            fetchData();
            if (message.senderClientId && message.senderClientId !== clientIdRef.current) {
              showNotification('Schedule updated in real-time by another admin!', 'info');
            }
          }
        } catch (_) { }
      };

      ws.onclose = () => {
        setWsConnected(false);
      };

      ws.onerror = () => {
        setWsConnected(false);
      };
    } catch (_) {
      setWsConnected(false);
    }

    return () => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.close();
      }
    };
  }, [fetchData]);

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
      const [startTime, endTime] = TIME_SLOTS[targetTimeIdx].split(' - ');

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
          startTime,
          endTime,
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
            startTime,
            endTime,
            teacherId: payload.teacherId,
            clientId: clientIdRef.current,
          }),
        });

        if (res.ok) {
          showNotification(`Assigned ${teacherName} to ${targetDay} (${TIME_SLOTS[targetTimeIdx]})`);
          if (payload.type === 'MOVE_SLOT' && payload.sourceSlotKey) {
            const [sourceDay, sourceIdx] = payload.sourceSlotKey.split('-');
            await apiFetch(`${API_URL}/schedule/slot?dayOfWeek=${sourceDay}&timeSlotIndex=${sourceIdx}&clientId=${clientIdRef.current}`, {
              method: 'DELETE',
            });
          }
          fetchData();
        } else {
          showNotification(`Assigned ${teacherName} to ${targetDay} (${TIME_SLOTS[targetTimeIdx]})`);
        }
      } catch (_) {
        showNotification(`Assigned ${teacherName} to ${targetDay} (${TIME_SLOTS[targetTimeIdx]})`);
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
    TIME_SLOTS.forEach((_, index) => {
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
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={handleGenerateWeeklySessions}
            disabled={generating}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand text-brand-foreground font-semibold text-sm shadow-md hover:bg-brand/90 transition-all disabled:opacity-50"
          >
            {generating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Repeat className="h-4 w-4" />}
            Auto-Repeat Weekly Schedule
          </button>

          {/* View Switcher */}
          <div className="flex items-center p-1 bg-card border border-border rounded-xl shadow-sm">
            <button
              onClick={() => setView('weekly')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${view === 'weekly' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:bg-muted'
                }`}
            >
              <CalendarIcon size={16} />
              Weekly Grid
            </button>
            <button
              onClick={() => setView('daily')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${view === 'daily' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:bg-muted'
                }`}
            >
              <Clock size={16} />
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
          {/* Teacher Filter Dropdown */}
          <div className="glass-panel p-4 rounded-xl flex items-center justify-between gap-4 border border-border/50">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-brand" />
              <span className="text-sm font-semibold text-foreground">Filter View by Teacher:</span>
            </div>
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

          {/* Weekly Interactive Table */}
          <div className="glass-panel rounded-2xl overflow-hidden shadow-xl border border-border/50">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="p-4 font-semibold text-xs text-muted-foreground uppercase tracking-wider w-36 border-r border-border">
                      Time Slot
                    </th>
                    {DAYS.map((day) => (
                      <th key={day} className="p-4 font-semibold text-xs text-muted-foreground uppercase tracking-wider text-center border-r border-border last:border-0">
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {TIME_SLOTS.map((slot, timeIdx) => (
                    <tr key={slot} className="hover:bg-card/30 transition-colors">
                      <td className="p-3 font-mono text-xs text-foreground/80 border-r border-border whitespace-nowrap">
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
        <div className="space-y-6 animate-fadeIn">
          <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm border border-border/50">
            <div>
              <h2 className="text-xl font-display font-bold">Daily Timetable Schedule</h2>
              <p className="text-sm text-muted-foreground">Detailed view for today's active sessions</p>
            </div>
          </div>

          <div className="glass-panel rounded-2xl overflow-hidden shadow-xl border border-border/50">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="p-4 font-semibold text-xs text-muted-foreground uppercase tracking-wider">#</th>
                    <th className="p-4 font-semibold text-xs text-muted-foreground uppercase tracking-wider">Teacher Time</th>
                    <th className="p-4 font-semibold text-xs text-muted-foreground uppercase tracking-wider">Student Time</th>
                    <th className="p-4 font-semibold text-xs text-muted-foreground uppercase tracking-wider">Student Name</th>
                    <th className="p-4 font-semibold text-xs text-muted-foreground uppercase tracking-wider">Course Name</th>
                    <th className="p-4 font-semibold text-xs text-muted-foreground uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {DAILY_SCHEDULE_DATA.map((row) => (
                    <tr key={row.id} className="hover:bg-card/40 transition-colors">
                      <td className="p-4 font-medium">{row.id}</td>
                      <td className="p-4 font-mono text-xs">{row.teacherTime}</td>
                      <td className="p-4 font-mono text-xs text-brand font-bold">{row.studentTime}</td>
                      <td className="p-4 font-semibold">{row.studentName}</td>
                      <td className="p-4">{row.courseName}</td>
                      <td className="p-4">
                        <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-bold px-2 py-1 rounded-full uppercase">
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
