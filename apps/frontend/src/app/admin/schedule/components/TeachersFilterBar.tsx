'use client';

import React from 'react';
import { UserCheck } from 'lucide-react';
import { TeacherItem, getTeacherColor } from './types';

interface TeachersFilterBarProps {
  teachers: TeacherItem[];
  activeFilter: string | null;
  onSelectTeacher: (id: string | null) => void;
}

export default function TeachersFilterBar({
  teachers,
  activeFilter,
  onSelectTeacher,
}: TeachersFilterBarProps) {
  return (
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
          onClick={() => onSelectTeacher(null)}
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border shadow-sm transition-all cursor-pointer ${
            !activeFilter
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
              onClick={() => onSelectTeacher(isSelected ? null : teacher.id)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border shadow-sm hover:shadow-md transition-all cursor-pointer ${colorClass} ${
                isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-105' : 'opacity-85 hover:opacity-100'
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
  );
}
