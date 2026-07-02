# Quran LMS — Online Class Recording & AI Evaluation Platform

An enterprise-grade Learning Management System (LMS) designed for online Quran education. Featuring roll-based dashboards, live video classrooms (via LiveKit), automated session recording, secure cloud backups (Google Drive), speech-to-text transcription, and post-class AI evaluation.

---

## Architecture Overview

The project is structured as an npm workspaces monorepo:
- **`apps/backend/`**: A NestJS API server built with Prisma ORM (PostgreSQL), Passport JWT, BullMQ background job queues (Redis), and LiveKit integrations. Runs on port `4000`.
- **`apps/frontend/`**: A Next.js 15 client dashboard built with React 19, Tailwind CSS, and LiveKit audio/video components. Runs on port `3000`.
- **`nginx/`**: Reverse proxy mapping port `80` to Next.js (`/`), NestJS API (`/api/v1/`), and LiveKit WebSockets (`/livekit/`).

---

## Key Features

1. **Role-Based Portals**: Custom dashboards tailored for Admin, Teacher, Student, and Compliance Reviewer roles.
2. **Google Meet Classroom Style**: Responsive audio/video conferencing layout with screen sharing, participant trays, and hover-expandable bubbles.
3. **Automated Recording & Cloud Upload**: Sessions auto-record and upload to Google Drive via background queues (BullMQ) upon completion, with failure-retry monitoring.
4. **Speech-to-Text Pipeline**: Extracts audio from class recordings and utilizes Speech-to-Text translation to index timestamped dialogue segments.
5. **AI Evaluation Scorecard**: Evaluates transcripts using Google Gemini (`gemini-1.5-flash`) for teaching quality, relevance, and policy violations (e.g. contact sharing, inappropriate language, off-topic discussions).
6. **Unified Notifications & Audit Trail**: Realtime user alerts for ready reports/recordings and a paginated audit logging feed for system administrators.
7. **Production Containerization**: Multi-container Docker configuration with pre-built production Nginx reverse proxy routes.

---

## Getting Started: Local Development

### 1. Prerequisites
- **Node.js**: v20 or higher.
- **Docker & Docker Compose**: Installed and running.
- **Google Drive OAuth API credentials**: Optional for mock fallback, required for real drive uploads.

### 2. Environment Variables Configuration
Create a `.env` file in `apps/backend/.env` with the following configuration:

```env
# Database Configuration
DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/quran_lms?schema=public"

# JWT Auth Keys
JWT_SECRET="your_secure_development_jwt_token_secret_key"
JWT_REFRESH_SECRET="your_secure_development_jwt_refresh_token_secret_key"
JWT_EXPIRY="15m"
JWT_REFRESH_EXPIRY="7d"

# Redis Server Configuration (for BullMQ)
REDIS_HOST="localhost"
REDIS_PORT=6379

# LiveKit WebRTC Configuration
LIVEKIT_API_KEY="devkey"
LIVEKIT_API_SECRET="secret"
LIVEKIT_HOST="http://localhost:7880"

# Google Gemini API Key (for Compliance Audits)
GEMINI_API_KEY="your-gemini-api-key-here"

# Google Drive Cloud Storage (Optional - falls back to local temp files if not set)
GOOGLE_DRIVE_CLIENT_ID="your-client-id"
GOOGLE_DRIVE_CLIENT_SECRET="your-client-secret"
GOOGLE_DRIVE_REDIRECT_URI="your-redirect-uri"
GOOGLE_DRIVE_REFRESH_TOKEN="your-refresh-token"
```

Configure `apps/frontend/.env.local` to point to the backend API:
```env
NEXT_PUBLIC_API_URL="http://localhost:4000/api/v1"
```

### 3. Google Drive API Setup Guide 🛠️

To configure the Google Drive integration, you must generate OAuth 2.0 credentials from the Google Cloud Console. Follow this step-by-step process:

#### Step 1: Create a Google Cloud Project
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Click on the project dropdown at the top navigation bar and select **New Project**.
3. Name your project (e.g., `Quran LMS Storage`) and click **Create**.

#### Step 2: Enable the Google Drive API
1. In the sidebar menu, navigate to **APIs & Services** > **Library**.
2. Search for `Google Drive API` in the search bar.
3. Click on the **Google Drive API** result and click the **Enable** button.

#### Step 3: Configure the OAuth Consent Screen
1. Navigate to **APIs & Services** > **OAuth consent screen**.
2. Select **External** User Type (if you are not using Google Workspace) and click **Create**.
3. Fill in the required App Information:
   - **App name**: `Quran LMS`
   - **User support email**: *Your email*
   - **Developer contact information**: *Your email*
4. Click **Save and Continue** through the Scopes and Test Users screens.
   - *Note: On the Test Users screen, make sure to add the Google account you wish to connect as a test user.*
5. Return to the dashboard and click **Publish App** to move it out of testing (this prevents authorization tokens from expiring quickly).

#### Step 4: Create OAuth 2.0 Credentials
1. Navigate to **APIs & Services** > **Credentials**.
2. Click **+ Create Credentials** at the top and select **OAuth client ID**.
3. Select **Web application** as the Application type.
4. Set the name to `Quran LMS Credentials`.
5. Under **Authorized redirect URIs**, add:
   - `https://developers.google.com/oauthplayground` (highly recommended for generating the refresh token).
6. Click **Create**.
7. Copy the generated **Client ID** and **Client Secret** values. These correspond to:
   - `GOOGLE_DRIVE_CLIENT_ID`
   - `GOOGLE_DRIVE_CLIENT_SECRET`
   - `GOOGLE_DRIVE_REDIRECT_URI="https://developers.google.com/oauthplayground"`

#### Step 5: Generate the Google Drive Refresh Token
1. Go to the [Google OAuth 2.0 Playground](https://developers.google.com/oauthplayground).
2. Click the **Gear Icon** (OAuth 2.0 configuration) in the top-right corner.
3. Check the box **Use own OAuth credentials**.
4. Enter your **OAuth Client ID** and **OAuth Client Secret** copied in Step 4.
5. In the left panel (Step 1 - Select & authorize APIs), scroll down to **Drive API v3**.
6. Expand it and select the scope: `https://www.googleapis.com/auth/drive` (allows file creation and sharing).
7. Click the blue **Authorize APIs** button. You will be redirected to log in with your Google account.
   - *If you see an "unverified app" screen, click Advanced > Go to Quran LMS (unsafe).*
8. Once authorized, click the **Exchange authorization code for tokens** button.
9. Copy the generated **Refresh Token** from the text field. This corresponds to:
   - `GOOGLE_DRIVE_REFRESH_TOKEN`

### 4. Step-by-Step Installation & Dev Start

1. **Install Monorepo Dependencies**:
   ```bash
   npm install
   ```

2. **Spin up Infrastructure Containers (PostgreSQL, Redis, LiveKit)**:
   ```bash
   docker compose up -d postgres redis livekit
   ```

3. **Initialize Database Schema & Client**:
   ```bash
   # Generate Prisma Client
   npm run db:generate
   
   # Push schema tables directly to DB
   npx prisma db push --schema=apps/backend/prisma/schema.prisma
   ```

4. **Launch Dev Servers (Backend + Frontend concurrently)**:
   ```bash
   npm run dev
   ```
   - **Frontend**: Access at `http://localhost:3000`
   - **Backend API**: Running at `http://localhost:4000/api/v1`

---

## Production Deployment: Multi-Container Setup

To build and run the entire application (including frontend, backend, database, queue, and Nginx proxy) in production container mode:

1. **Configure Environment Variables**:
   Update `docker-compose.yml` environment values with production secrets (stronger JWT passwords, real DB passwords, valid Gemini key).

2. **Build and Run All Services**:
   ```bash
   docker compose up --build -d
   ```

3. **Database Migration Inside Docker**:
   Once database container is up, synchronize tables inside the NestJS container:
   ```bash
   docker exec -it quran-lms-nestjs npx prisma db push --schema=apps/backend/prisma/schema.prisma
   ```

4. **Access the System**:
   Open `http://localhost:80` (or your production domain mapped to port 80). Nginx automatically forwards:
   - `/` to Next.js client
   - `/api/v1/*` to NestJS API
   - `/livekit/*` to LiveKit WebSockets

---

## QA Compliance Flow Details

1. **Recording READY Trigger**: Class completed → bullmq uploads MP4 to Google Drive.
2. **STT Pipeline Trigger**: Google Drive upload finished → bullmq downloads audio stream → FFmpeg extracts MP3 → Whisper/Mock STT parses timestamped segment dialogues.
3. **AI Evaluation Trigger**: STT finished → Gemini scans segments → logs violations → calculates risk score (e.g. 80%) → sends notifications to Admin dashboard.
