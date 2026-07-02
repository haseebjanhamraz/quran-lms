# Quran LMS — Project Memory & Context File
# Last Updated: 2026-07-02
# Purpose: Enable any AI assistant to understand and continue development on this project.

---

## 1. Project Overview

**Name:** Online Class Recording & AI Evaluation Platform (Quran LMS)
**Goal:** Provide online Quran classes with attendance tracking, recording management, transcript generation, AI-powered post-class evaluation, and automated reporting.
**SRS Document:** `projectPlan.md` (root of repo)

---

## 2. Architecture

### Monorepo Structure
```
quran-lms/
├── apps/
│   ├── backend/          # NestJS v11 API (Port 4000, prefix /api/v1)
│   └── frontend/         # Next.js 15 (Port 3000)
├── docker-compose.yml    # PostgreSQL 15, Redis 7, LiveKit server
├── nginx.conf            # Reverse proxy config
├── .github/workflows/ci.yml
└── projectPlan.md        # SRS specification
```

### Tech Stack
- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS 3.4, LiveKit components, Lucide icons
- **Backend:** NestJS 11, Prisma 7.8 (PostgreSQL), Passport JWT (cookie-based), BullMQ (Redis), LiveKit SDK, Google Drive API
- **Infrastructure:** PostgreSQL 15, Redis 7, LiveKit server, Nginx reverse proxy

---

## 3. Database Schema (Prisma)

### Models (10 total)
1. **User** — id, name, email, passwordHash, role (ADMIN/TEACHER/STUDENT/REVIEWER), isActive
2. **Course** — id, title, type (NAZIRA/TAJWEED/HIFZ_UL_QURAN/ISLAMIC_STUDIES), curriculum, teacherId
3. **Enrollment** — studentId + courseId (unique constraint)
4. **ClassSession** — courseId, teacherId, scheduledAt, durationMinutes, status (SCHEDULED/LIVE/COMPLETED/CANCELLED), livekitRoomId
5. **Attendance** — sessionId + userId (unique), joinTime, leaveTime, durationSeconds
6. **Recording** — sessionId (unique), localPath, driveFileId, driveUrl, durationSeconds, status (PROCESSING/UPLOADING/READY/FAILED)
7. **ReviewerAssignment** — reviewerId + courseId (unique), isActive
8. **ClassReview** — sessionId, reviewerId, reviewMode, scores (curriculum/teaching/engagement/overall), strengths, improvements, privateNotes, isFlagged, flagSeverity, flagReason, status (DRAFT/SUBMITTED)
9. **ReviewAnnotation** — reviewId, timestamp (float), note, category
10. **AuditLog** — userId, action, metadata (JSON)

### Models NOT YET CREATED (required by SRS)
- `TranscriptSegment` — for storing speech-to-text results
- `AIReport` — for storing AI analysis results
- `Violation` — for storing detected policy violations
- `Notification` — for user notification system

---

## 4. Backend Modules (13 exist)

| Module | Location | Key Endpoints |
|--------|----------|---------------|
| **Auth** | `src/auth/` | POST login, POST refresh, POST logout, GET me |
| **Users** | `src/users/` | CRUD (ADMIN-only), soft-delete |
| **Courses** | `src/courses/` | CRUD, GET by teacher |
| **Enrollments** | `src/enrollments/` | CRUD, stats, by student |
| **ClassSessions** | `src/class-sessions/` | CRUD, calendar (role-aware), stats (role-aware), attendance logging, LiveKit token generation, auto-recording on class start |
| **Recordings** | `src/recordings/` | Start recording, get status, retry upload. BullMQ processor handles Google Drive upload pipeline |
| **GoogleDrive** | `src/google-drive/` | Service-only (no controller), OAuth2 upload with public sharing |
| **ClassReviews** | `src/class-reviews/` | Get/create reviews, annotations, pending/flagged/history queries |
| **ReviewerAssignments** | `src/reviewer-assignments/` | CRUD, by reviewer |
| **LiveKit** | `src/livekit/` | Webhook handler: auto-attendance on join/leave, auto-complete on room_finished, recording upload on egress_ended |
| **AuditLogs** | `src/audit-logs/` | GET paginated logs (ADMIN). NOTE: log() method exists but is NOT called by any other module |
| **Prisma** | `src/prisma/` | Database service |
| **Config** | `src/config/` | Environment validation |

### Modules NOT YET CREATED (required by SRS)
- `src/transcript/` — Speech-to-Text pipeline (FFmpeg + Whisper/Google STT)
- `src/ai-analysis/` — AI transcript analysis (Gemini/OpenAI)
- `src/reports/` — PDF report generation
- `src/notifications/` — User notification system

---

## 5. Frontend Pages (17 routes)

| Route | Purpose |
|-------|---------|
| `/` | Auth redirect to role dashboard |
| `/login` | Email/password login with dev quick-login buttons |
| `/admin/dashboard` | 6 stat cards, enrollment bars, class status overview, audit log feed, flagged reviews |
| `/admin/users` | User CRUD table with search |
| `/admin/courses` | Course CRUD table |
| `/admin/schedule` | Session scheduling table |
| `/admin/enrollments` | Enrollment management |
| `/admin/reviewer-assignments` | Reviewer-to-course assignment |
| `/admin/audit-logs` | Paginated audit event table |
| `/teacher/dashboard` | 4 tabs: Schedule, Courses, Students, Recordings (with upload status polling + retry) |
| `/teacher/schedule` | Schedule a new class |
| `/teacher/feedback` | QA review history list |
| `/teacher/feedback/[id]` | Review detail with video + annotation timeline |
| `/student/dashboard` | 2 tabs: Learning Portal (upcoming classes + courses), Attendance Logs (with recording links + status polling) |
| `/reviewer/dashboard` | 4 tabs: Pending Reviews, Escalated Flags, Completed Evaluations, Assigned Courses |
| `/reviewer/review/[id]` | Split-screen: video player + annotation form | scorecard sliders + feedback + flag workflow |
| `/classroom/[id]` | LiveKit video room: Google Meet-style layout, screen share with fullscreen toggle, expandable participant bubbles, End Class for teacher |

### Pages NOT YET CREATED (required by SRS)
- `/admin/reports` — AI report list with search/filter
- `/admin/reports/[sessionId]` — Full AI report viewer + PDF download
- `/admin/transcripts/[sessionId]` — Transcript viewer with click-to-seek
- Notification dropdown (in all dashboard navbars)

### Frontend Architecture Notes
- **No `src/components/` directory** — all UI is inline in page files
- **Auth context** in `src/context/AuthContext.tsx` (cookie-based JWT)
- **Middleware** in `src/middleware.ts` (route protection + role-based redirects)
- **Admin layout** in `src/app/admin/layout.tsx` (collapsible sidebar with flagged count polling)
- **CSS approach is mixed** — Admin uses Tailwind, student/reviewer use inline styles
- **Dark mode hardcoded** — `<html className="dark">`, no toggle

---

## 6. Key Behaviors & Business Logic

### Class Lifecycle
1. Admin/Teacher creates a `ClassSession` (status: SCHEDULED)
2. Teacher clicks "Start Class" → status changes to LIVE, LiveKit token generated, recording auto-starts
3. Students click "Join Now" → LiveKit token generated with appropriate grants
4. Reviewers can silently monitor (hidden, subscribe-only LiveKit grants)
5. Teacher clicks "End Class for All" → backend sets status to COMPLETED, calculates actual duration from LIVE→now, queues recording upload
6. LiveKit webhook `room_finished` also triggers completion (backup)
7. Recording upload: BullMQ processor → Google Drive upload → recording status becomes READY

### Recording Upload Pipeline
1. `RecordingsService.startRoomRecording()` → LiveKit Egress API → creates Recording record (PROCESSING)
2. On class end or egress webhook → `queueUploadJob()` adds to BullMQ queue
3. `UploadProcessor.process()` → checks local file (creates dummy in dev) → Google Drive upload → updates Recording to READY with driveUrl → cleans up local file
4. On failure → Recording status set to FAILED, localPath preserved for retry
5. Frontend polls every 5 seconds when any recording is PROCESSING/UPLOADING

### Review/Compliance Workflow
1. Admin assigns Reviewer to Course via ReviewerAssignment
2. Reviewer sees pending sessions (completed sessions in assigned courses without submitted reviews)
3. Reviewer opens `/reviewer/review/[id]` → video player + scorecard
4. Reviewer scores (curriculum adherence, teaching quality, engagement), writes feedback, optionally flags with severity
5. Saves as DRAFT or SUBMITTED
6. Flagged reviews appear on Admin dashboard and Reviewer "Escalated Flags" tab

---

## 7. Development Status (as of 2026-07-02)

### Completed Phases
- ✅ Phase 1: Foundation & Authentication
- ✅ Phase 2: Scheduling & Enrollment
- ✅ Phase 3: LiveKit Integration (Google Meet-style classroom)
- ✅ Phase 4: Recording & Google Drive
- ✅ Phase 5: Attendance Tracking
- ✅ Phase 9 (Partial): Dashboards built for all 4 roles

### Remaining Phases
- ❌ Phase 6: Speech-to-Text Pipeline (TranscriptSegment model, FFmpeg + Whisper/STT)
- ❌ Phase 7: AI Analysis Engine (AIReport + Violation models, Gemini/OpenAI integration)
- ❌ Phase 8: Report Generation & PDF Export
- ❌ Phase 9 (Remaining): Notifications module, audit log wiring, component refactoring
- ❌ Phase 10: Testing, Docker containerization, CI/CD deployment

### Known Technical Debt
1. AuditLogsService.log() is never called — audit trail is non-functional
2. No shared component library — large duplicated page files
3. Mixed CSS approach (Tailwind vs inline styles)
4. No API abstraction layer — raw fetch everywhere
5. Google Drive env vars not in validation
6. Soft-delete inconsistency across models
7. No tests (1 boilerplate spec only)
8. No Dockerfiles for app containers

---

## 8. Environment Setup

### Required Environment Variables
```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/quran_lms

# JWT
JWT_SECRET=your-secret
JWT_REFRESH_SECRET=your-refresh-secret

# Redis (BullMQ)
REDIS_HOST=localhost
REDIS_PORT=6379

# LiveKit
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=secret
LIVEKIT_HOST=http://localhost:7880

# Google Drive
GOOGLE_DRIVE_CLIENT_ID=...
GOOGLE_DRIVE_CLIENT_SECRET=...
GOOGLE_DRIVE_REDIRECT_URI=...
GOOGLE_DRIVE_REFRESH_TOKEN=...

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
```

### Development Commands
```bash
# Start infrastructure
docker compose up -d  # PostgreSQL, Redis, LiveKit

# Backend
cd apps/backend
npx prisma generate
npx prisma db push
npm run start:dev

# Frontend
cd apps/frontend
npm run dev

# Build verification
cd apps/backend && npm run build
cd apps/frontend && Remove-Item -Recurse -Force .next; npm run build
```

---

## 9. File Size Reference (largest files to be aware of)

| File | Lines | Notes |
|------|-------|-------|
| `apps/backend/src/class-sessions/class-sessions.service.ts` | ~574 | Largest backend service |
| `apps/frontend/src/app/teacher/dashboard/page.tsx` | ~812 | Largest frontend page |
| `apps/frontend/src/app/student/dashboard/page.tsx` | ~676 | |
| `apps/frontend/src/app/admin/dashboard/page.tsx` | ~550 | |
| `apps/frontend/src/app/reviewer/review/[id]/page.tsx` | ~500 | |
| `apps/backend/prisma/schema.prisma` | ~215 | Database schema |
