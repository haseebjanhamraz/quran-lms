'use client';

import React, { useState } from 'react';
import { Calendar as CalendarIcon, Clock, Filter, Users, Move, CheckCircle2, AlertCircle } from 'lucide-react';

interface TeacherItem {
  name: string;
  days: number;
  color: string;
}

const TEACHERS: TeacherItem[] = [
  { name: 'Qari Muneeb', days: 5, color: 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30' },
  { name: 'Sheikh Abdullah', days: 2, color: 'bg-blue-500/20 text-blue-500 border-blue-500/30' },
  { name: 'Ustadh Asad', days: 3, color: 'bg-purple-500/20 text-purple-500 border-purple-500/30' },
  { name: 'Qari Talha', days: 3, color: 'bg-orange-500/20 text-orange-500 border-orange-500/30' },
  { name: 'Sheikh Aziz', days: 2, color: 'bg-red-500/20 text-red-500 border-red-500/30' },
  { name: 'Qari Aamir', days: 5, color: 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30' },
  { name: 'Ustadh Aahil', days: 6, color: 'bg-pink-500/20 text-pink-500 border-pink-500/30' },
];

const TIME_SLOTS = [
  '09:00 - 09:30', '09:30 - 10:00', '10:00 - 10:30', '10:30 - 11:00',
  '11:00 - 11:30', '11:30 - 12:00', '12:00 - 12:30', '12:30 - 01:00',
  '01:00 - 01:30', '01:30 - 02:00', '02:00 - 02:30', '02:30 - 03:00'
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const INITIAL_ASSIGNMENTS: Record<string, string> = {};
DAYS.forEach((day, dayIdx) => {
  if (day !== 'Saturday' && day !== 'Sunday') {
    TIME_SLOTS.forEach((_, timeIdx) => {
      if ((timeIdx + dayIdx) % 3 === 0) {
        const teacher = TEACHERS[(timeIdx + dayIdx) % TEACHERS.length];
        INITIAL_ASSIGNMENTS[`${day}-${timeIdx}`] = teacher.name;
      }
    });
  }
});

const DAILY_SCHEDULE_DATA = [
  { id: 1, teacherTime: '12:30 am - 1:00 am', studentTime: '3:30 pm (00:30)', studentName: 'Ali Khan', courseName: 'Quran Reading', history: '5 months', status: 'Regular' },
  { id: 2, teacherTime: '1:00 am - 1:30 am', studentTime: '4:00 pm (00:30)', studentName: 'Sara Ahmed', courseName: 'Tajweed', history: '2 months', status: 'Trial' },
  { id: 3, teacherTime: '1:30 am - 2:00 am', studentTime: '4:30 pm (00:30)', studentName: 'Omar Farooq', courseName: 'Hifz', history: '1 year', status: 'Regular' }
];

export default function ScheduleManagement() {
  const [view, setView] = useState<'weekly' | 'daily'>('weekly');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [gridAssignments, setGridAssignments] = useState<Record<string, string>>(INITIAL_ASSIGNMENTS);

  // Drag and drop state
  const [draggedTeacher, setDraggedTeacher] = useState<{ teacherName: string; sourceSlotKey: string } | null>(null);
  const [dragOverSlotKey, setDragOverSlotKey] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleDragStart = (e: React.DragEvent, teacherName: string, slotKey: string) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ teacherName, slotKey }));
    setDraggedTeacher({ teacherName, sourceSlotKey: slotKey });
  };

  const handleDragOver = (e: React.DragEvent, slotKey: string) => {
    e.preventDefault();
    setDragOverSlotKey(slotKey);
  };

  const handleDragLeave = () => {
    setDragOverSlotKey(null);
  };

  const handleDrop = (e: React.DragEvent, targetDay: string, targetTimeIdx: number) => {
    e.preventDefault();
    setDragOverSlotKey(null);
    if (targetDay === 'Saturday' || targetDay === 'Sunday') {
      showNotification('Cannot schedule classes on weekend off days!');
      return;
    }

    const targetSlotKey = `${targetDay}-${targetTimeIdx}`;
    const rawData = e.dataTransfer.getData('text/plain');
    if (!rawData) return;

    try {
      const { teacherName, slotKey: sourceSlotKey } = JSON.parse(rawData);

      setGridAssignments((prev) => {
        const updated = { ...prev };
        delete updated[sourceSlotKey];
        updated[targetSlotKey] = teacherName;
        return updated;
      });

      showNotification(`Rescheduled ${teacherName}'s class to ${targetDay} (${TIME_SLOTS[targetTimeIdx]})`);
    } catch (_) { }
  };

  const calculateDailyClasses = (day: string) => {
    if (day === 'Saturday' || day === 'Sunday') return 0;
    let count = 0;
    TIME_SLOTS.forEach((_, index) => {
      const teacherName = gridAssignments[`${day}-${index}`];
      if (teacherName && (!activeFilter || activeFilter === teacherName)) {
        count++;
      }
    });
    return count;
  };

  return (
    <div className="relative mx-auto max-w-7xl space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-display font-bold">Schedule & Timetable Drag & Drop</h1>
          <p className="text-muted-foreground mt-1">Drag and drop class slots across the grid to reschedule teachers and manage rosters.</p>
        </div>
        
        {/* View Switcher */}
        <div className="flex items-center p-1 bg-card border border-border rounded-xl shadow-sm">
          <button
            onClick={() => setView('weekly')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              view === 'weekly' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            <CalendarIcon size={16} />
            Weekly Interactive Grid
          </button>
          <button
            onClick={() => setView('daily')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              view === 'daily' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            <Clock size={16} />
            Daily Timetable View
          </button>
        </div>
      </div>

      {toastMsg && (
        <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="h-4 w-4" />
          <span>{toastMsg}</span>
        </div>
      )}

      {view === 'weekly' ? (
        <div className="space-y-6 animate-fadeIn">
          {/* Header Metric */}
          <div className="glass-panel p-6 rounded-2xl flex items-center justify-between shadow-sm border border-border/50">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-brand/10 rounded-xl text-brand">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Active Capacity</p>
                <h3 className="text-2xl font-bold font-display">12 CLASSES / 6 HOURS DAILY</h3>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-semibold">
              <Move className="h-4 w-4 text-brand animate-bounce" />
              <span>Drag teacher cards to reschedule</span>
            </div>
          </div>

          {/* Teacher Legend & Filter */}
          <div className="glass-panel p-4 rounded-xl flex items-center flex-wrap gap-3 border border-border/50">
            <div className="flex items-center gap-2 mr-2">
              <Filter size={16} className="text-muted-foreground" />
              <span className="text-sm font-semibold text-muted-foreground">Filter:</span>
            </div>
            <button
              onClick={() => setActiveFilter(null)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all ${
                activeFilter === null ? 'bg-foreground text-background border-foreground' : 'bg-card text-foreground hover:bg-muted'
              }`}
            >
              All Teachers
            </button>
            {TEACHERS.map((t) => (
              <button
                key={t.name}
                onClick={() => setActiveFilter(t.name === activeFilter ? null : t.name)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all ${
                  activeFilter === t.name ? t.color.replace('/20', '/40') : t.color
                } hover:opacity-80`}
              >
                {t.name} ({t.days} Days)
              </button>
            ))}
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
                        const teacherName = gridAssignments[slotKey];
                        const isWeekend = day === 'Saturday' || day === 'Sunday';
                        const isOver = dragOverSlotKey === slotKey;

                        if (isWeekend) {
                          return (
                            <td key={slotKey} className="p-3 text-center border-r border-border bg-card/20 text-[10px] text-muted-foreground/50 font-bold">
                              WEEKEND OFF
                            </td>
                          );
                        }

                        const teacher = TEACHERS.find((t) => t.name === teacherName);
                        const isVisible = !activeFilter || activeFilter === teacherName;

                        return (
                          <td
                            key={slotKey}
                            onDragOver={(e) => handleDragOver(e, slotKey)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, day, timeIdx)}
                            className={`p-3 text-center border-r border-border last:border-0 transition-all ${
                              isOver ? 'bg-primary/20 ring-2 ring-primary ring-inset' : ''
                            }`}
                          >
                            {teacherName && teacher && isVisible ? (
                              <div
                                draggable
                                onDragStart={(e) => handleDragStart(e, teacherName, slotKey)}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-all ${teacher.color}`}
                              >
                                <Move className="h-3 w-3 opacity-60" />
                                <span>{teacher.name}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground/30 text-xs">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  {/* Summary Footer */}
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
