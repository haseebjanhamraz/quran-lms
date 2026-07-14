# Quran LMS — Production Deployment Guide for Ubuntu LTS

This guide provides step-by-step instructions for deploying the Quran LMS application on an Ubuntu LTS server (Xeon Workstation, 64GB RAM). All services run in **Docker** and are exposed publicly via **Cloudflare Tunnels** using **subdomain-based routing** — no Nginx required.

---

## 1. Architecture Overview

The platform is split between Dockerized services and a host-level LiveKit server. Public traffic is routed through a Cloudflare Tunnel using dedicated subdomains for each service:

```mermaid
graph TD
    User([User Browser]) -->|HTTPS| CF[Cloudflare Tunnel]
    User -->|WebRTC Media: 7881, 7882, 3478| LiveKit[Host LiveKit Server]
    
    subgraph Docker Compose Network
        CF -->|quran-lms.kpcybers.com → :3030| NextJS[Next.js Frontend]
        CF -->|api.quran-lms.kpcybers.com → :5000| NestJS[NestJS Backend API]
        NestJS -->|Internal| PG[(PostgreSQL)]
        NestJS -->|Internal| Redis[(Redis)]
        NestJS -->|Internal| Vosk[Vosk STT]
        Egress[LiveKit Egress] -->|Internal| Redis
    end
    
    LiveKit -->|Webhooks| NestJS
    LiveKit -->|State Coordination| Redis
    Egress -->|Recordings| Volume[Shared Recordings Volume]
    NestJS -->|Process recordings| Volume
```

### Host Port Mapping

Because default ports (`3000`, `4000`, `5432`, `6379`) are commonly occupied by other services already running on the server, this project re-maps host bindings to unique ports:

| Service | Internal (Container) Port | Host Mapping (Configured in `.env`) |
|---|---|---|
| **Next.js Frontend** | `3030` | **`127.0.0.1:3030`** |
| **NestJS Backend API** | `5000` | **`127.0.0.1:5000`** |
| **PostgreSQL DB** | `5333` | **`127.0.0.1:5333`** |
| **Redis Queue Broker** | `6380` | **`127.0.0.1:6380`** |
| **Vosk Speech-to-Text** | `2700` | **`127.0.0.1:2700`** |

> All host port bindings are restricted to `127.0.0.1` (loopback) so they are **not exposed to the public internet**. Public access is exclusively through the Cloudflare Tunnel.

---

## 2. Prerequisites & DNS Setup

### Server Requirements
- Operating System: Ubuntu 22.04 LTS or 24.04 LTS
- Specs: Xeon Workstation with 64GB RAM (more than sufficient)
- Docker & Docker Compose installed: [Docker Install Guide](https://docs.docker.com/engine/install/ubuntu/)

### DNS Configurations (Cloudflare)

You must configure **three** DNS records in your Cloudflare dashboard. The first two are CNAME records that point to the Cloudflare Tunnel, and the third is a DNS-only A record for LiveKit WebRTC:

| Subdomain | Type | Target | Proxy Status | Purpose |
|---|---|---|---|---|
| `quran-lms.kpcybers.com` | `CNAME` | `<TUNNEL_ID>.cfargotunnel.com` | **Proxied (Orange Cloud)** | Next.js Frontend |
| `api.quran-lms.kpcybers.com` | `CNAME` | `<TUNNEL_ID>.cfargotunnel.com` | **Proxied (Orange Cloud)** | NestJS Backend API |
| `livekit.kpcybers.com` | `A` | `YOUR_SERVER_PUBLIC_IP` | **DNS-only (Grey Cloud)** | LiveKit WebRTC — **CRITICAL**: UDP media traffic cannot be proxied! |

> **Note**: The CNAME records for the tunnel are created automatically by the `cloudflared tunnel route dns` command (see Step 4). You do not need to add them manually.

### Cloudflare Dashboard Configuration
- **SSL/TLS Mode**: Set encryption mode to **Full (Strict)**.
- **WebSockets**: Navigate to **Network** → Ensure **WebSockets** is toggled **ON** (required for video session signaling).

### Ubuntu Firewall (UFW) Configuration
Since all HTTP/HTTPS traffic goes through the Cloudflare Tunnel (outbound connection), you only need to allow SSH and LiveKit RTC ports:

```bash
# Allow SSH
sudo ufw allow OpenSSH

# Allow LiveKit RTC Ports (WebRTC Media — bypasses Tunnel, direct connection)
sudo ufw allow 7880/tcp   # LiveKit HTTP/WS Signaling
sudo ufw allow 7881/tcp   # LiveKit ICE-TCP
sudo ufw allow 7882/udp   # LiveKit Media UDP
sudo ufw allow 3478/udp   # LiveKit TURN UDP

# No need to open ports 80/443 — Cloudflare Tunnel uses outbound connections

# Enable Firewall
sudo ufw enable
sudo ufw status
```

---

## 3. Deployment Steps

### Step 1: Clone the Repository
On your server, clone the repository to your deployment directory (e.g., `/var/www/quran-lms`):

```bash
sudo mkdir -p /var/www
sudo chown -R $USER:$USER /var/www
cd /var/www
git clone <your-repository-url> quran-lms
cd quran-lms
```

### Step 2: Configure Environment Variables
Copy the production environment template and edit the secrets:

```bash
cp .env.example .env
nano .env
```

Ensure the following variables are configured with the **unique ports** to prevent clashing with existing applications:
```env
# Host Port Bindings (Loopback-only — Cloudflare Tunnel handles public routing)
POSTGRES_PORT_BINDING=127.0.0.1:5333:5333
REDIS_PORT_BINDING=127.0.0.1:6380:6380
NESTJS_PORT_BINDING=127.0.0.1:5000:5000
NEXTJS_PORT_BINDING=127.0.0.1:3030:3030
VOSK_PORT_BINDING=127.0.0.1:2700:2700

# NestJS Backend Port (must match the internal port in NESTJS_PORT_BINDING)
PORT=5000

# Next.js client variables (uses dedicated API subdomain, no path prefix routing)
NEXT_PUBLIC_API_URL=https://api.quran-lms.kpcybers.com/api/v1
NEXT_PUBLIC_LIVEKIT_URL=wss://livekit.kpcybers.com

# Backend CORS allowance
CORS_ORIGIN=https://quran-lms.kpcybers.com

# Database Connection (uses internal Docker service name 'postgres', not host port)
DATABASE_URL=postgresql://postgres:secure_production_db_password_change_me@postgres:5333/quran_lms?schema=public

# Redis (internal Docker network)
REDIS_HOST=redis
REDIS_PORT=6380

# LiveKit (Webhooks must point to NestJS on port 5000)
LIVEKIT_HOST=http://host.docker.internal:7880
LIVEKIT_PUBLIC_URL=wss://livekit.kpcybers.com
```

---

### Step 3: Install & Configure LiveKit Server (Host)
Download and install the LiveKit binary on the Ubuntu host:

```bash
# Download and install LiveKit Server
curl -sSL https://get.livekit.io | bash

# Copy the production LiveKit configuration template
cp livekit-prod.yaml /etc/livekit.yaml
```

Now, edit `/etc/livekit.yaml` and set the keys to match the `LIVEKIT_API_KEY` and `LIVEKIT_API_SECRET` you generated in your `.env` file. Ensure the webhook URL targets the NestJS port (`5000`):

```yaml
webhook:
  api_key: livekit_prod_api_key_generate_me
  urls:
    - http://127.0.0.1:5000/api/v1/livekit/webhook
```

Create a systemd service file to keep LiveKit running in the background and restart on boot:

```bash
sudo nano /etc/systemd/system/livekit.service
```

Paste the following service definition:

```ini
[Unit]
Description=LiveKit Server
After=network.target

[Service]
Type=simple
User=root
LimitNOFILE=65535
ExecStart=/usr/local/bin/livekit-server --config /etc/livekit.yaml
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Enable and start the LiveKit service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable livekit
sudo systemctl start livekit
sudo systemctl status livekit
```

---

### Step 4: Cloudflare Tunnel Setup (Subdomain Routing)

Cloudflare Tunnel securely exposes the Dockerized services without opening ports 80/443 on the server. Each service gets its own subdomain.

1. **Install Cloudflared on Ubuntu Host**:
   ```bash
   # Add Cloudflare package repository
   sudo mkdir -p --mode=0755 /etc/apt/keyrings
   curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg | sudo tee /etc/apt/keyrings/cloudflare-main.gpg >/dev/null
   echo 'deb [signed-by=/etc/apt/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared bullseye main' | sudo tee /etc/apt/sources.list.d/cloudflared.list
   sudo apt update && sudo apt install -y cloudflared
   ```

2. **Authenticate Cloudflared**:
   ```bash
   cloudflared tunnel login
   # Click the link generated in the terminal to authorize kpcybers.com domain
   ```

3. **Create the Tunnel**:
   ```bash
   cloudflared tunnel create quran-lms-tunnel
   # Note the generated Tunnel ID (UUID) and Credentials JSON path
   ```

4. **Create Cloudflare Tunnel Configuration**:
   Create a directory and write the config file:
   ```bash
   mkdir -p ~/.cloudflared
   nano ~/.cloudflared/config.yml
   ```
   Paste the following config (replace `<TUNNEL_ID>` with your UUID and `ubuntu` with your username path):
   ```yaml
   tunnel: <TUNNEL_ID>
   credentials-file: /home/ubuntu/.cloudflared/<TUNNEL_ID>.json

   ingress:
     # 1. Route API subdomain to the NestJS Backend (Port 5000)
     - hostname: api.quran-lms.kpcybers.com
       service: http://localhost:5000

     # 2. Route main domain to the Next.js Frontend (Port 3030)
     - hostname: quran-lms.kpcybers.com
       service: http://localhost:3030

     # 3. Catch-all fallback (required by cloudflared)
     - service: http_status:404
   ```

5. **Configure DNS Records for Tunnel**:
   Route both subdomains to your tunnel:
   ```bash
   cloudflared tunnel route dns quran-lms-tunnel quran-lms.kpcybers.com
   cloudflared tunnel route dns quran-lms-tunnel api.quran-lms.kpcybers.com
   ```
   > These commands automatically create the CNAME records in Cloudflare DNS.

6. **Run Cloudflare Tunnel as a Systemd Service**:
   ```bash
   sudo cloudflared --config /home/ubuntu/.cloudflared/config.yml service install
   sudo systemctl enable cloudflared
   sudo systemctl start cloudflared
   sudo systemctl status cloudflared
   ```

---

### Step 5: Start Dockerized Services
With the configured ports in `.env`, start the Docker services:

```bash
# Build and start services in detached mode
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Verify that all containers are running and healthy:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
```

---

### Step 6: Initialize Database & Run Migrations
Run Prisma migrations inside the NestJS container to configure the database schema:

```bash
docker exec -it quran-lms-nestjs npx prisma migrate deploy
```

*(Optional)* Run the seed script to create initial roles and credentials (Admin: `admin@quran-lms.com`, Password: `password123`):

```bash
docker exec -it quran-lms-nestjs npm run seed
```

---

## 4. Updates & Zero-Downtime Redeployment

When you push new changes, run this workflow on your server to update the application:

```bash
# Pull latest code
git pull origin main

# Rebuild and restart app containers
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build --remove-orphans

# Apply new database migrations if any
docker exec -it quran-lms-nestjs npx prisma migrate deploy
```

---

## 5. Backup & Maintenance

### PostgreSQL Database Backups
Create a daily cron job to backup the database. Create the script:

```bash
nano /home/ubuntu/backup_db.sh
```

Paste the following script (note the backup targets the postgres container database):

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/quran-lms"
mkdir -p $BACKUP_DIR
DATE=$(date +%F_%H-%M-%S)
docker exec quran-lms-postgres pg_dump -U postgres quran_lms > $BACKUP_DIR/db_backup_$DATE.sql
# Keep only last 14 days of backups
find $BACKUP_DIR -type f -mtime +14 -delete
```

Make it executable and configure it in cron:

```bash
chmod +x /home/ubuntu/backup_db.sh
crontab -e
# Add line: 0 2 * * * /home/ubuntu/backup_db.sh (Runs daily at 2:00 AM)
```

---

## 6. Troubleshooting

- **Check container logs**: `docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f <service_name>` (e.g. `nestjs`, `nextjs`).
- **Check LiveKit logs**: `sudo journalctl -u livekit -f -n 100`
- **Check Cloudflare Tunnel logs**: `sudo journalctl -u cloudflared -f -n 100`
- **Tunnel not connecting**: Verify `cloudflared` is running (`systemctl status cloudflared`) and the credentials JSON file exists at the path specified in `config.yml`.
- **API subdomain not working**: Ensure `cloudflared tunnel route dns quran-lms-tunnel api.quran-lms.kpcybers.com` was run and the CNAME record exists in Cloudflare DNS.
- **LiveKit / WebRTC Handshake fails**: Verify ports `7880`, `7881`, and `7882/udp` are fully open in UFW, and that `livekit.kpcybers.com` is configured as **DNS-only** in Cloudflare (grey cloud). Direct UDP port routing is required for WebRTC.
