'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { apiFetch } from '@/utils/apiFetch';
import DailyScheduleView from '@/components/DailyScheduleView';
import { useTimeSlots } from '@/hooks/useTimeSlots';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { useWebSocket } from '@/hooks/useWebSocket';
import { useUrlState } from '@/hooks/useUrlState';
import { Loader2 } from 'lucide-react';

// Subcomponents
import { TeacherItem, SlotAssignment, DEFAULT_TEACHERS } from './components/types';
import ScheduleHeader from './components/ScheduleHeader';
import TeachersFilterBar from './components/TeachersFilterBar';
import WeeklyScheduleGrid from './components/WeeklyScheduleGrid';

function ScheduleManagementContent() {
  const { timeSlots, refetch: refetchTimeSlots } = useTimeSlots();
  const [view, setView] = useUrlState<'weekly' | 'daily'>('view', 'weekly');
  const [activeFilter, setActiveFilter] = useUrlState<string | null>('filter', null);
  const [teachers, setTeachers] = useState<TeacherItem[]>(DEFAULT_TEACHERS);
  const [gridAssignments, setGridAssignments] = useState<Record<string, SlotAssignment>>({});
  const [loading, setLoading] = useState<boolean>(true);

  const clientIdRef = useRef<string>(Math.random().toString(36).substring(7));
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

  const showNotification = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    if (type === 'error') {
      toast.error(msg, { position: 'top-right', autoClose: 3500 });
    } else if (type === 'info') {
      toast.info(msg, { position: 'top-right', autoClose: 3500 });
    } else {
      toast.success(msg, { position: 'top-right', autoClose: 3500 });
    }
  };

  // Fetch real data from DB with fallback for existing endpoints
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // 1. Fetch teachers
      let loadedTeachers: TeacherItem[] = [];
      try {
        const teachersRes = await apiFetch(`${API_URL}/schedule/teachers`);
        if (teachersRes.ok) {
          const raw = await teachersRes.json();
          loadedTeachers = Array.isArray(raw)
            ? raw.map((u: any, idx: number) => ({
                id: (u.id || u._id)?.toString() || String(idx + 1),
                name: u.name,
                email: u.email,
                assignedDaysCount: u.assignedDaysCount,
              }))
            : [];
        } else {
          const usersRes = await apiFetch(`${API_URL}/users/role/TEACHER`);
          if (usersRes.ok) {
            const rawUsers = await usersRes.json();
            loadedTeachers = Array.isArray(rawUsers)
              ? rawUsers.map((u: any, idx: number) => ({
                  id: (u._id || u.id)?.toString() || String(idx + 1),
                  name: u.name,
                  email: u.email,
                }))
              : [];
          }
        }
      } catch (_) { }

      if (loadedTeachers.length > 0) {
        setTeachers(loadedTeachers);

        // If activeFilter was an index (e.g., '1', '2', '3'), seamlessly resolve to real teacher ID
        if (activeFilter && !isNaN(Number(activeFilter))) {
          const num = Number(activeFilter);
          const target = loadedTeachers[num - 1] || loadedTeachers[num];
          if (target?.id && target.id !== activeFilter) {
            setActiveFilter(target.id);
          }
        }
      }

      // 2. Fetch grid slots
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
    } catch (_) {
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  const fetchDataRef = useRef(fetchData);
  fetchDataRef.current = fetchData;

  const refetchTimeSlotsRef = useRef(refetchTimeSlots);
  refetchTimeSlotsRef.current = refetchTimeSlots;

  // Real-time WebSocket connection
  useWebSocket({
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

  return (
    <div className="relative mx-auto max-w-7xl space-y-6">
      {/* Toast Notification Container */}
      <ToastContainer theme="dark" position="top-right" autoClose={3500} />

      {/* 1. Header Bar with Actions & View Switcher */}
      <ScheduleHeader
        view={view}
        setView={setView}
      />

      {/* 2. Teachers Filter Bar (Click to filter by teacher) */}
      <TeachersFilterBar
        teachers={teachers}
        activeFilter={activeFilter}
        onSelectTeacher={(tId) => setActiveFilter(tId)}
      />

      {/* 3. Main Schedule View (Weekly Grid vs Daily View) - Displays Teacher & Student Times */}
      {view === 'weekly' ? (
        <WeeklyScheduleGrid
          timeSlots={timeSlots}
          gridAssignments={gridAssignments}
          teachers={teachers}
          activeFilter={activeFilter}
          loading={loading}
        />
      ) : (
        <DailyScheduleView
          role="ADMIN"
          teachers={teachers}
          activeFilter={activeFilter}
          onSelectTeacher={(tId) => setActiveFilter(tId)}
          gridAssignments={gridAssignments}
          timeSlots={timeSlots}
          allowDragDrop={false}
          onDropSlot={async () => { }}
          loading={loading}
        />
      )}
    </div>
  );
}

export default function ScheduleManagement() {
  return (
    <React.Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="animate-spin text-brand" size={32} />
        </div>
      }
    >
      <ScheduleManagementContent />
    </React.Suspense>
  );
}
