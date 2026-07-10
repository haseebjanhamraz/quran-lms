# Quran LMS — Online Class Recording & AI Evaluation Platform

An enterprise-grade Learning Management System (LMS) designed for online Quran education. Featuring role-based dashboards, live video classrooms (via LiveKit), automated session recording, secure cloud backups (Google Drive), speech-to-text transcription, and post-class AI evaluation.

---

## Architecture Overview

The project is structured as an npm workspaces monorepo:

| Service | Description | Port |
|---|---|---|
| **`apps/backend/`** | NestJS API — Prisma ORM (PostgreSQL), Passport JWT, BullMQ (Redis), LiveKit SDK | `4000` |
| **`apps/frontend/`** | Next.js 15 — React 19, Tailwind CSS, LiveKit video components | `3000` |
| **PostgreSQL** | Relational database for all application data | `5432` |
| **Redis** | Message broker for BullMQ background job queues | `6379` |
| **LiveKit** | WebRTC media server for live video classrooms | `7880` / `7882` |
| **LiveKit Egress** | Session recording service (MP4 output) | — |

> **Note:** Nginx is intentionally excluded from Docker Compose. Configure your own reverse proxy on the host server (Nginx, Caddy, etc.) pointing to ports `3000` (frontend) and `4000` (backend).

---

## Key Features

1. **Role-Based Portals** — Custom dashboards for Admin, Teacher, Student, and Compliance Reviewer roles.
2. **Live Video Classrooms** — Google Meet-style audio/video conferencing with screen sharing and participant management.
3. **Automated Recording & Cloud Upload** — Sessions auto-record and upload to Google Drive via BullMQ background queues upon completion.
4. **Speech-to-Text Pipeline** — FFmpeg extracts audio; STT parses timestamped dialogue segments.
5. **AI Evaluation Scorecard** — Evaluates transcripts via Google Gemini (`gemini-1.5-flash`) for teaching quality, relevance, and policy violations.
6. **Unified Notifications & Audit Trail** — Realtime user alerts and a paginated audit logging feed for administrators.

---

## Getting Started: Local Development

### Prerequisites

- **Node.js** v20+
- **Docker & Docker Compose** installed and running
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
DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/quran_lms?schema=public"

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
LIVEKIT_PUBLIC_URL="http://localhost:7880" # Optional in dev, required when dockerized or in prod

# Google Gemini (AI evaluation)
GEMINI_API_KEY="your-gemini-api-key"

# Google Drive (optional — falls back to local storage if omitted)
GOOGLE_DRIVE_CLIENT_ID="your-client-id"
GOOGLE_DRIVE_CLIENT_SECRET="your-client-secret"
GOOGLE_DRIVE_REDIRECT_URI="https://developers.google.com/oauthplayground"
GOOGLE_DRIVE_REFRESH_TOKEN="your-refresh-token"
```

**Frontend** — create `apps/frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL="http://localhost:4000/api/v1"
```

### 3. Spin Up Infrastructure (DB, Redis, LiveKit)

```bash
docker compose up -d postgres redis livekit
```

### 4. Initialize the Database

```bash
# Generate Prisma client
npm run db:generate

# Push schema to the database
npx prisma db push --schema=apps/backend/prisma/schema.prisma
```

### 5. Start Dev Servers

```bash
npm run dev
```

- **Frontend**: `http://localhost:3000`
- **Backend API**: `http://localhost:4000/api/v1`
- **LiveKit**: `ws://localhost:7880`

---

## Google Drive API Setup

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Click the project dropdown → **New Project** → Name it (e.g. `Quran LMS`) → **Create**.

### Step 2: Enable the Google Drive API

1. Navigate to **APIs & Services** → **Library**.
2. Search for `Google Drive API` and click **Enable**.

### Step 3: Configure OAuth Consent Screen

1. Navigate to **APIs & Services** → **OAuth consent screen**.
2. Select **External** user type → **Create**.
3. Fill in App name (`Quran LMS`), support email, and developer contact.
4. Click **Save and Continue** through Scopes and Test Users.
5. On the Test Users screen, add the Google account you'll use for Drive access.

### Step 4: Create OAuth 2.0 Credentials

1. Navigate to **APIs & Services** → **Credentials** → **+ Create Credentials** → **OAuth client ID**.
2. Select **Web application** as the type.
3. Under **Authorized redirect URIs**, add: `https://developers.google.com/oauthplayground`
4. Click **Create**. Copy the **Client ID** and **Client Secret**.

### Step 5: Generate Refresh Token

1. Go to [OAuth 2.0 Playground](https://developers.google.com/oauthplayground).
2. Click the **Gear icon** → check **Use your own OAuth credentials** → enter your Client ID and Secret.
3. In Step 1, expand **Drive API v3** and select `https://www.googleapis.com/auth/drive`.
4. Click **Authorize APIs** → log in → click **Exchange authorization code for tokens**.
5. Copy the **Refresh Token** into `GOOGLE_DRIVE_REFRESH_TOKEN`.

---

## Production Deployment (Docker)

### 1. Update Secrets in `docker-compose.yml`

Edit the `nestjs` service environment block with strong production values:

```yaml
JWT_SECRET: "a-long-random-production-secret"
JWT_REFRESH_SECRET: "another-long-random-production-secret"
POSTGRES_PASSWORD: "strong-db-password"
GEMINI_API_KEY: "your-real-gemini-key"
LIVEKIT_PUBLIC_URL: "https://your.livekit.domain.com"
```

Also update `NEXT_PUBLIC_API_URL` in the `nextjs` service to your real domain:

```yaml
NEXT_PUBLIC_API_URL: "https://api.yourdomain.com/api/v1"
```

### 2. Update `livekit.yaml` for Production

```yaml
keys:
  your_production_key: your_production_secret

rtc:
  tcp_port: 7881
  udp_port: 7882
  use_external_ip: true   # set to true in production with a real public IP

turn:
  enabled: true
  domain: your.livekit.domain.com
  tls_port: 5349
  udp_port: 3478
```

### 3. Build & Start All Containers

```bash
docker compose up -d --build
```

This starts:
- `quran-lms-postgres` on port `5432`
- `quran-lms-redis` on port `6379`
- `quran-lms-livekit` on ports `7880`, `7881`, `7882/udp`, `3478/udp`
- `quran-lms-egress` (internal)
- `quran-lms-nestjs` on port `4000`
- `quran-lms-nextjs` on port `3000`

### 4. Run Database Migrations

```bash
docker exec -it quran-lms-nestjs npx prisma db push --schema=apps/backend/prisma/schema.prisma
```

Or using Prisma migrate in production:

```bash
docker exec -it quran-lms-nestjs npx prisma migrate deploy --schema=apps/backend/prisma/schema.prisma
```

### 5. Configure Your Host Nginx (Ubuntu)

Install Nginx on your Ubuntu host and create a site config at `/etc/nginx/sites-available/quran-lms`:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend (Next.js)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API (NestJS)
    location /api/ {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Enable the site and reload:

```bash
sudo ln -s /etc/nginx/sites-available/quran-lms /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

For HTTPS, use Certbot:

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

---

## QA Compliance Flow

```
Class Ends
    ↓
LiveKit Egress saves MP4 → /recordings/
    ↓
BullMQ uploads MP4 to Google Drive
    ↓
BullMQ downloads audio stream → FFmpeg extracts MP3
    ↓
Speech-to-Text parses timestamped dialogue
    ↓
Gemini scans transcript → calculates risk score → flags violations
    ↓
Notification sent to Admin dashboard
```

---

## Port Reference

| Port | Service | Protocol |
|---|---|---|
| `3000` | Next.js Frontend | HTTP |
| `4000` | NestJS Backend API | HTTP |
| `5432` | PostgreSQL | TCP |
| `6379` | Redis | TCP |
| `7880` | LiveKit Signaling | HTTP/WS |
| `7881` | LiveKit ICE-TCP | TCP |
| `7882` | LiveKit Media | UDP |
| `3478` | LiveKit TURN | UDP |
