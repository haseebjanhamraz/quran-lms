# Quran LMS — Online Class Recording & AI Evaluation Platform

An enterprise-grade Learning Management System (LMS) designed for online Quran education. Featuring role-based dashboards, live video classrooms (via LiveKit), automated session recording, secure cloud backups (Google Drive), speech-to-text transcription, and post-class AI evaluation.

---

## Architecture Overview

The project is structured as an npm workspaces monorepo:

| Service | Description | Port |
|---|---|---|
| **`apps/backend/`** | NestJS API — Mongoose ODM (MongoDB), Passport JWT, BullMQ (Redis), LiveKit SDK | `5000` |
| **`apps/frontend/`** | Next.js 15 — React 19, Tailwind CSS, LiveKit video components | `3030` |
| **MongoDB** | Document database for application data | `27017` |
| **Redis** | Message broker for BullMQ background job queues | `6379` |
| **LiveKit** | WebRTC media server for live video classrooms | `7880` / `7882` |
| **LiveKit Egress** | Session recording service (MP4 output) | — |

---

## Key Features

1. **Role-Based Portals** — Custom dashboards for Admin, Teacher, Student, and Compliance Reviewer roles.
2. **Live Video Classrooms** — Google Meet-style audio/video conferencing with screen sharing and participant management.
3. **Automated Recording & Cloud Upload** — Sessions auto-record and upload to Google Drive via BullMQ background queues upon completion.
4. **Speech-to-Text Pipeline** — FFmpeg extracts audio; STT parses timestamped dialogue segments.
5. **AI Evaluation Scorecard** — Evaluates transcripts via Google Gemini for teaching quality, relevance, and policy violations.
6. **Unified Notifications & Audit Trail** — Realtime user alerts and a paginated audit logging feed for administrators.

---

## Getting Started: Local Development

### Prerequisites

- **Node.js** v20+
- **Docker & Docker Compose** installed and running
- **MongoDB** running locally or via MongoDB Atlas
- **npm** v9+

### 1. Clone & Install Dependencies

```bash
git clone <repo-url>
cd quran-lms
npm install
```

### 2. Configure Environment Variables

**Backend** — create `apps/backend/.env`:

```env
# Database
MONGODB_URI="mongodb://127.0.0.1:27017/quran_lms"

# JWT Auth
JWT_SECRET="your_secure_development_jwt_secret"
JWT_REFRESH_SECRET="your_secure_development_jwt_refresh_secret"
JWT_EXPIRY="15m"
JWT_REFRESH_EXPIRY="7d"

# Redis (for BullMQ)
REDIS_HOST="localhost"
REDIS_PORT=6379

# LiveKit WebRTC
LIVEKIT_API_KEY="devkey"
LIVEKIT_API_SECRET="secret"
LIVEKIT_HOST="http://localhost:7880"

# Google Gemini (AI evaluation)
GEMINI_API_KEY="your-gemini-api-key"
```

**Frontend** — create `apps/frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL="http://localhost:5000/api/v1"
```

### 3. Spin Up Infrastructure (Redis, LiveKit)

```bash
docker compose up -d redis livekit
```

### 4. Initialize & Seed the Database

```bash
npm run db:seed
```

### 5. Start Dev Servers

```bash
npm run dev
```

- **Frontend**: `http://localhost:3030`
- **Backend API**: `http://localhost:5000/api/v1`
- **LiveKit**: `ws://localhost:7880`
