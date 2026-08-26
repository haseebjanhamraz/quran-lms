'use client';

import React from 'react';
import { Lock, VideoOff, UserCheck } from 'lucide-react';
import { TeacherPersonalInfo, TeacherQualificationsInfo, TeacherSalaryInfo } from './types';

interface Step5PermissionsProps {
  cameraRestricted: boolean;
  setCameraRestricted: React.Dispatch<React.SetStateAction<boolean>>;
  canEditProfile: boolean;
  setCanEditProfile: React.Dispatch<React.SetStateAction<boolean>>;
  personalInfo: TeacherPersonalInfo;
  qualificationsInfo: TeacherQualificationsInfo;
  salaryInfo: TeacherSalaryInfo;
}

export default function Step5Permissions({
  cameraRestricted,
  setCameraRestricted,
  canEditProfile,
  setCanEditProfile,
  personalInfo,
  qualificationsInfo,
  salaryInfo,
}: Step5PermissionsProps) {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between pb-3 border-b border-border/40">
        <div>
          <h3 className="text-lg font-bold font-display text-foreground flex items-center gap-2">
            <Lock className="h-5 w-5 text-brand" />
            <span>Step 5: Admin Controls &amp; Camera Permissions</span>
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Set instructor classroom camera restrictions and self-profile editing rights.
          </p>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-3xl border border-border/60 space-y-5 bg-card/60">
        {/* Camera Restriction Toggle */}
        <div className="p-5 rounded-2xl bg-card border border-border flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl border border-amber-500/20 shrink-0">
              <VideoOff className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Restrict Teacher Camera in Classrooms</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                When enabled, the teacher&apos;s camera video publishing is restricted during live lessons.
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer ml-4">
            <input
              type="checkbox"
              checked={cameraRestricted}
              onChange={(e) => setCameraRestricted(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-12 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500 shadow-inner"></div>
          </label>
        </div>

        {/* Profile Edit Permission */}
        <div className="p-5 rounded-2xl bg-card border border-border flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-brand/10 text-brand rounded-xl border border-brand/20 shrink-0">
              <UserCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Allow Teacher to Self-Edit Profile</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Allows the instructor to update their personal introduction bio, profile picture, and qualifications.
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer ml-4">
            <input
              type="checkbox"
              checked={canEditProfile}
              onChange={(e) => setCanEditProfile(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-12 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary shadow-inner"></div>
          </label>
        </div>

        {/* Summary Card */}
        <div className="p-5 rounded-2xl bg-muted/40 border border-border/80 space-y-2 text-xs">
          <p className="font-bold text-foreground uppercase tracking-wider text-[11px]">Teacher Account Summary</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-muted-foreground pt-1">
            <div>
              <span>Name: </span>
              <strong className="text-foreground">{personalInfo.name || '—'}</strong>
            </div>
            <div>
              <span>Email: </span>
              <strong className="text-foreground">{personalInfo.email || '—'}</strong>
            </div>
            <div>
              <span>Specialization: </span>
              <strong className="text-foreground">{qualificationsInfo.specialization || '—'}</strong>
            </div>
            <div>
              <span>Compensation: </span>
              <strong className="text-foreground">
                {salaryInfo.payType === 'MONTHLY'
                  ? `${salaryInfo.baseSalary} ${salaryInfo.currency}/mo`
                  : `${salaryInfo.hourlyRate} ${salaryInfo.currency}/hr`}
              </strong>
            </div>
            <div>
              <span>Timezone: </span>
              <strong className="text-foreground font-mono">{personalInfo.timezone}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
