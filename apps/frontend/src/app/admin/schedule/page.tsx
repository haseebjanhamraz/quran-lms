'use client';

import React, { useState } from 'react';
import { Calendar as CalendarIcon, Clock, Filter, Users } from 'lucide-react';

const TEACHERS = [
  { name: 'Muneeb', days: 5, color: 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30' },
  { name: 'Abdullah', days: 2, color: 'bg-blue-500/20 text-blue-500 border-blue-500/30' },
  { name: 'Asad', days: 3, color: 'bg-purple-500/20 text-purple-500 border-purple-500/30' },
  { name: 'Talha', days: 3, color: 'bg-orange-500/20 text-orange-500 border-orange-500/30' },
  { name: 'Aziz', days: 2, color: 'bg-red-500/20 text-red-500 border-red-500/30' },
  { name: 'Aamir', days: 5, color: 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30' },
  { name: 'Aahil', days: 6, color: 'bg-pink-500/20 text-pink-500 border-pink-500/30' },
];

const TIME_SLOTS = [
  '09:00 - 09:30', '09:30 - 10:00', '10:00 - 10:30', '10:30 - 11:00',
  '11:00 - 11:30', '11:30 - 12:00', '12:00 - 12:30', '12:30 - 01:00',
  '01:00 - 01:30', '01:30 - 02:00', '02:00 - 02:30', '02:30 - 03:00'
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const DAILY_SCHEDULE_DATA = [
  { id: 1, teacherTime: '12:30 am - 1:00 am', studentTime: '3:30 pm (00:30)', studentName: 'Ali Khan', courseName: 'Quran Reading', history: '5 months', status: 'Regular' },
  { id: 2, teacherTime: '1:00 am - 1:30 am', studentTime: '4:00 pm (00:30)', studentName: 'Sara Ahmed', courseName: 'Tajweed', history: '2 months', status: 'Trial' },
  { id: 3, teacherTime: '1:30 am - 2:00 am', studentTime: '4:30 pm (00:30)', studentName: 'Omar Farooq', courseName: 'Hifz', history: '1 year', status: 'Regular' }
];

export default function ScheduleManagement() {
  const [view, setView] = useState<'weekly' | 'daily'>('weekly');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const getCellContent = (day: string, timeIndex: number) => {
    if (day === 'Saturday' || day === 'Sunday') {
      return <span className="text-xs font-semibold text-muted-foreground/50">WEEKEND OFF</span>;
    }
    if ((timeIndex + DAYS.indexOf(day)) % 3 === 0) {
      const teacher = TEACHERS[(timeIndex + DAYS.indexOf(day)) % TEACHERS.length];
      if (activeFilter && activeFilter !== teacher.name) return '-';
      return (
        <span className={`inline-block px-2 py-1 rounded-md text-[10px] font-bold border ${teacher.color}`}>
          {teacher.name}
        </span>
      );
    }
    return <span className="text-muted-foreground/30">-</span>;
  };

  const calculateDailyClasses = (day: string) => {
    if (day === 'Saturday' || day === 'Sunday') return 0;
    let count = 0;
    TIME_SLOTS.forEach((_, index) => {
      if ((index + DAYS.indexOf(day)) % 3 === 0) {
        const teacher = TEACHERS[(index + DAYS.indexOf(day)) % TEACHERS.length];
        if (!activeFilter || activeFilter === teacher.name) count++;
      }
    });
    return count;
  };

  return (
    <div className="relative mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-display font-bold">Schedule & Timetable</h1>
          <p className="text-muted-foreground mt-1">Manage global class timings and teacher schedules efficiently.</p>
        </div>
        
        {/* View Switcher */}
        <div className="flex items-center p-1 bg-card border border-border rounded-lg shadow-sm">
          <button
            onClick={() => setView('weekly')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-all ${
              view === 'weekly' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            <CalendarIcon size={16} />
            Weekly Grid View
          </button>
          <button
            onClick={() => setView('daily')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-all ${
              view === 'daily' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            <Clock size={16} />
            Daily Timetable View
          </button>
        </div>
      </div>

      {view === 'weekly' ? (
        <div className="space-y-6 animate-in fade-in duration-500">
          {/* Header Metric */}
          <div className="glass-panel p-6 rounded-2xl flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-brand/10 rounded-xl">
                <Users className="text-brand h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Total Daily Capacity</p>
                <h3 className="text-2xl font-bold font-display">12 CLASSES / 6 HOURS</h3>
              </div>
            </div>
          </div>

          {/* Teacher Legend */}
          <div className="glass-panel p-4 rounded-xl flex items-center flex-wrap gap-3">
            <div className="flex items-center gap-2 mr-2">
              <Filter size={16} className="text-muted-foreground" />
              <span className="text-sm font-semibold text-muted-foreground">Filter:</span>
            </div>
            <button
              onClick={() => setActiveFilter(null)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                activeFilter === null ? 'bg-foreground text-background border-foreground' : 'bg-card text-foreground hover:bg-muted'
              }`}
            >
              All Teachers
            </button>
            {TEACHERS.map(t => (
              <button
                key={t.name}
                onClick={() => setActiveFilter(t.name === activeFilter ? null : t.name)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                  activeFilter === t.name ? t.color.replace('/20', '/40') : t.color
                } hover:opacity-80`}
              >
                {t.name} ({t.days} Days)
              </button>
            ))}
          </div>

          {/* Weekly Table */}
          <div className="glass-panel rounded-xl overflow-hidden shadow-xl border border-border">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="p-4 font-semibold text-xs text-muted-foreground uppercase tracking-wider w-32 border-r border-border">
                      Time Slot
                    </th>
                    {DAYS.map(day => (
                      <th key={day} className="p-4 font-semibold text-xs text-muted-foreground uppercase tracking-wider text-center border-r border-border last:border-0">
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {TIME_SLOTS.map((slot, index) => (
                    <tr key={slot} className="hover:bg-card/30 transition-colors">
                      <td className="p-3 font-mono text-xs text-foreground/80 border-r border-border whitespace-nowrap">
                        {slot}
                      </td>
                      {DAYS.map(day => (
                        <td key={`${day}-${slot}`} className="p-3 text-center border-r border-border last:border-0">
                          {getCellContent(day, index)}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {/* Footer Summary */}
                  <tr className="bg-muted/30 border-t-2 border-border font-semibold">
                    <td className="p-4 text-xs text-muted-foreground uppercase tracking-wider border-r border-border">
                      Daily Classes
                    </td>
                    {DAYS.map(day => (
                      <td key={`classes-${day}`} className="p-4 text-center text-foreground border-r border-border last:border-0">
                        {calculateDailyClasses(day)}
                      </td>
                    ))}
                  </tr>
                  <tr className="bg-muted/30 font-semibold">
                    <td className="p-4 text-xs text-muted-foreground uppercase tracking-wider border-r border-border">
                      Total Duration
                    </td>
                    {DAYS.map(day => {
                      const classes = calculateDailyClasses(day);
                      return (
                        <td key={`dur-${day}`} className="p-4 text-center text-foreground border-r border-border last:border-0">
                          {classes > 0 ? `${classes * 0.5} hrs` : '-'}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
            <div>
              <h2 className="text-xl font-display font-bold">Daily Timetable View</h2>
              <p className="text-sm text-muted-foreground">Detailed schedule for today</p>
            </div>
            <div className="flex flex-col text-right">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Dual Timezone Calc</span>
              <div className="flex gap-4 mt-1">
                <div className="bg-card px-3 py-1.5 rounded-lg border border-border">
                  <span className="text-xs text-muted-foreground block">Teacher (PKT)</span>
                  <span className="text-sm font-bold font-mono">12:30 AM</span>
                </div>
                <div className="bg-card px-3 py-1.5 rounded-lg border border-border">
                  <span className="text-xs text-muted-foreground block">Student (EST)</span>
                  <span className="text-sm font-bold font-mono">03:30 PM</span>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-xl overflow-hidden shadow-xl border border-border">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="p-4 font-semibold text-xs text-muted-foreground uppercase tracking-wider">#</th>
                    <th className="p-4 font-semibold text-xs text-muted-foreground uppercase tracking-wider">Teacher Time</th>
                    <th className="p-4 font-semibold text-xs text-muted-foreground uppercase tracking-wider">Student Time</th>
                    <th className="p-4 font-semibold text-xs text-muted-foreground uppercase tracking-wider">Student Name</th>
                    <th className="p-4 font-semibold text-xs text-muted-foreground uppercase tracking-wider">Course Name</th>
                    <th className="p-4 font-semibold text-xs text-muted-foreground uppercase tracking-wider">History</th>
                    <th className="p-4 font-semibold text-xs text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="p-4 font-semibold text-xs text-muted-foreground uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {DAILY_SCHEDULE_DATA.map((row) => (
                    <tr key={row.id} className="hover:bg-card/40 transition-colors">
                      <td className="p-4 font-medium">{row.id}</td>
                      <td className="p-4 font-mono text-xs">{row.teacherTime}</td>
                      <td className="p-4 font-mono text-xs text-brand">{row.studentTime}</td>
                      <td className="p-4 font-semibold">{row.studentName}</td>
                      <td className="p-4">{row.courseName}</td>
                      <td className="p-4 text-muted-foreground">{row.history}</td>
                      <td className="p-4">
                        <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-bold px-2 py-1 rounded-full uppercase">
                          {row.status}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button className="text-xs font-semibold bg-secondary/80 hover:bg-secondary text-secondary-foreground px-3 py-1.5 rounded-lg transition-colors">
                          Leave
                        </button>
                        <button className="text-xs font-semibold bg-brand/10 hover:bg-brand/20 text-brand border border-brand/20 px-3 py-1.5 rounded-lg transition-colors">
                          Advance
                        </button>
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
