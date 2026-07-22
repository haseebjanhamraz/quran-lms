import React from 'react';
import { Calendar, Clock, TrendingUp, Users, Video, ChevronRight } from 'lucide-react';

interface StatsRowProps {
  stats: {
    today: number;
    totalHours: number;
    completed: number;
    totalStudents: number;
    live: number;
  } | null;
}

function StatCard({ icon, value, label, gradient }: any) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-border p-5 ${gradient} backdrop-blur-sm transition-transform duration-200 hover:-translate-y-1 shadow-sm`}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="rounded-xl border border-border/40 bg-card/40 p-2">{icon}</div>
        <ChevronRight size={16} className="text-muted-foreground" />
      </div>
      <p className="text-3xl font-bold text-foreground">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
      <div className="pointer-events-none absolute -bottom-4 -right-4 h-20 w-20 rounded-full bg-primary/5 blur-xl" />
    </div>
  );
}

export default function StatsRow({ stats }: StatsRowProps) {
  return (
    <section className="mb-10 grid grid-cols-2 gap-4 lg:grid-cols-5">
      <StatCard
        icon={<Calendar size={18} className="text-emerald-400" />}
        value={stats?.today ?? 0}
        label="Classes Today"
        gradient="bg-emerald-500/10 border-emerald-500/20"
      />
      <StatCard
        icon={<Clock size={18} className="text-sky-400" />}
        value={stats?.totalHours ?? 0}
        label="Total Hours Taught"
        gradient="bg-sky-500/10 border-sky-500/20"
      />
      <StatCard
        icon={<TrendingUp size={18} className="text-violet-400" />}
        value={stats?.completed ?? 0}
        label="Completed Sessions"
        gradient="bg-violet-500/10 border-violet-500/20"
      />
      <StatCard
        icon={<Users size={18} className="text-amber-400" />}
        value={stats?.totalStudents ?? 0}
        label="Enrolled Students"
        gradient="bg-amber-500/10 border-amber-500/20"
      />
      <StatCard
        icon={
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            <Video size={18} className="text-emerald-400" />
          </span>
        }
        value={stats?.live ?? 0}
        label="Live Classes Now"
        gradient="bg-emerald-400/10 border-emerald-400/20"
      />
    </section>
  );
}
