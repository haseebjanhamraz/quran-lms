# Ain Ul Quran — Online Class Recording & AI Evaluation Platform

An enterprise-grade Learning Management System (LMS) designed for online Quran education. Featuring role-based dashboards, live video classrooms (via LiveKit), automated session recording, secure cloud backups (Google Drive), speech-to-text transcription, and post-class AI evaluation.

---

## Architecture Overview

The project is structured as an npm workspaces monorepo:

| Service | Description | Port |
|---|---|---|
| **`apps/backend/`** | NestJS API — Mongoose ODM (MongoDB Atlas), Passport JWT, BullMQ (Redis), LiveKit SDK | `5000` |
| **`apps/frontend/`** | Next.js 15 — React 19, Tailwind CSS, LiveKit video components | `3030` |
| **MongoDB Atlas** | Hosted Cloud document database for application data | Configured via `MONGODB_URI` |
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

## Getting Started

### Prerequisites

- **Docker & Docker Compose** installed and running (recommended for full stack dev)
- **MongoDB Atlas** cluster URI (or cloud database)
- **Node.js** v20+ and **npm** v9+ (if running outside Docker)

### 1. Environment Configuration

Create a `.env` file at the project root:

```bash
cp .env.example .env
```

Ensure `MONGODB_URI` is set to your MongoDB Atlas connection string:
```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/quran_lms?retryWrites=true&w=majority
```

---

### Option A: Docker Development Workflow (Hot-Reload Enabled)

Run the entire application stack in Docker with instant hot-reloading for code edits (no manual container/image rebuilds needed):

```bash
# Start all containers in development mode
npm run docker:dev
# (or: docker compose up)
```

- **Frontend**: `http://localhost:3030`
- **Backend API**: `http://localhost:5000/api/v1`
- **LiveKit**: `ws://localhost:7880`

To seed the database inside Docker:
```bash
docker exec -it quran-lms-nestjs npm run seed
```

---

### Option B: Local Host Development Workflow

1. Install dependencies:
   ```bash
   npm install
   ```

2. Spin up supporting infrastructure in Docker (Redis & LiveKit):
   ```bash
   docker compose up -d redis livekit
   ```

3. Seed the database:
   ```bash
   npm run db:seed
   ```

4. Start dev servers:
   ```bash
   npm run dev
   ```
