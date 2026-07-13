# Quran LMS — Production Deployment Guide for Ubuntu LTS

This guide provides step-by-step instructions for deploying the first version of the Quran LMS application on an Ubuntu LTS server (Xeon Workstation, 64GB RAM). It is updated to resolve port conflicts with existing apps and includes support for routing via **Nginx** or **Cloudflare Tunnels**.

---

## 1. Architecture Overview

In production, the platform is split between Dockerized services and host-level services. It can be exposed publicly via a traditional Nginx Reverse Proxy or a Cloudflare Tunnel:

```mermaid
graph TD
    User([User Browser]) -->|HTTPS: 443| Routing[Nginx Reverse Proxy OR Cloudflare Tunnel]
    User -->|WebRTC Media: 7881, 7882, 3478| LiveKit[Host LiveKit Server]
    
    subgraph Docker Compose Network
        Routing -->|Proxy: 3001| NextJS[Next.js Frontend]
        Routing -->|Proxy: 4001| NestJS[NestJS Backend API]
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

### Host Port Conflict Resolution
Because ports `3000`, `4000`, `5432`, and `6379` are commonly occupied by other web services (like `pashto-fonts-web-prod`, PostgreSQL server, or Redis on host), this project's production environment re-maps host bindings to avoid collisions:

| Service | Internal Port | Default Host Mapping | Alternative Mapping (Configured in `.env`) |
|---|---|---|---|
| **Next.js Frontend** | `3000` | `127.0.0.1:3000` | **`127.0.0.1:3001`** |
| **NestJS Backend API** | `4000` | `127.0.0.1:4000` | **`127.0.0.1:4001`** |
| **PostgreSQL DB** | `5432` | `127.0.0.1:5432` | **`127.0.0.1:5434`** |
| **Redis Queue Broker** | `6379` | `127.0.0.1:6379` | **`127.0.0.1:6380`** |
| **Vosk Speech-to-Text** | `2700` | `127.0.0.1:2700` | **`127.0.0.1:2701`** |

---

## 2. Prerequisites & DNS Setup

### Server Requirements
- Operating System: Ubuntu 22.04 LTS or 24.04 LTS
- Specs: Xeon Workstation with 64GB RAM (more than sufficient)
- Docker & Docker Compose installed: [Docker Install Guide](https://docs.docker.com/engine/install/ubuntu/)

### DNS Configurations (Cloudflare)
You must configure two DNS records in your Cloudflare dashboard:

1. **`quran-lms.kpcybers.com`**
   - Type: `A` (or CNAME if using Tunnels)
   - IP: `YOUR_SERVER_PUBLIC_IP`
   - Proxy status: **Proxied (Orange Cloud)**
2. **`livekit.kpcybers.com`**
   - Type: `A`
   - IP: `YOUR_SERVER_PUBLIC_IP`
   - Proxy status: **DNS-only (Grey Cloud)** — **CRITICAL**: WebRTC media traffic (UDP) cannot be proxied through Cloudflare Tunnel or proxy!

### Cloudflare Dashboard Configuration
- **SSL/TLS Mode**: Set encryption mode to **Full (Strict)**.
- **WebSockets**: Navigate to **Network** → Ensure **WebSockets** is toggled **ON** (required for video session signaling).

### Ubuntu Firewall (UFW) Configuration
Run the following commands on your Ubuntu server to configure the firewall:

```bash
# Allow SSH
sudo ufw allow OpenSSH

# Allow HTTP and HTTPS for Nginx/Routing (omit if using ONLY Cloudflare Tunnels)
sudo ufw allow http
sudo ufw allow https

# Allow LiveKit RTC Ports (WebRTC Media - Must bypass Tunnels and go direct)
sudo ufw allow 7880/tcp   # LiveKit HTTP/WS Signaling
sudo ufw allow 7881/tcp   # LiveKit ICE-TCP
sudo ufw allow 7882/udp   # LiveKit Media UDP
sudo ufw allow 3478/udp   # LiveKit TURN UDP

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

Ensure the following variables are configured with the **Alternative Ports** to prevent clashing with existing applications:
```env
# Host Port Bindings (Remapped to avoid collisions)
POSTGRES_PORT_BINDING=127.0.0.1:5434:5432
REDIS_PORT_BINDING=127.0.0.1:6380:6379
NESTJS_PORT_BINDING=127.0.0.1:4001:4000
NEXTJS_PORT_BINDING=127.0.0.1:3001:3000
VOSK_PORT_BINDING=127.0.0.1:2701:2700

# Next.js client variables (Notice port 4001 prefix route)
NEXT_PUBLIC_API_URL=https://quran-lms.kpcybers.com/api/v1
NEXT_PUBLIC_LIVEKIT_URL=wss://livekit.kpcybers.com

# Backend CORS allowance
CORS_ORIGIN=https://quran-lms.kpcybers.com

# Database Connection (Uses internal docker host bridge 'postgres' rather than remapped port)
DATABASE_URL=postgresql://postgres:secure_production_db_password_change_me@postgres:5432/quran_lms?schema=public

# LiveKit (Webhooks must point to NestJS on port 4001)
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

Now, edit `/etc/livekit.yaml` and set the keys to match the `LIVEKIT_API_KEY` and `LIVEKIT_API_SECRET` you generated in your `.env` file. Ensure the webhook URL targets the remapped NestJS port (`4001`):

```yaml
webhook:
  api_key: livekit_prod_api_key_generate_me
  urls:
    - http://127.0.0.1:4001/api/v1/livekit/webhook
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

### Step 4: Routing Setup (Choose Alternative A OR B)

#### Alternative A: Traditional Nginx Reverse Proxy + Certbot SSL
If you want to use local Nginx to proxy traffic:

1. **Install Nginx & Certbot**:
   ```bash
   sudo apt update
   sudo apt install -y nginx certbot python3-certbot-nginx
   ```
2. **Request Certificate**:
   ```bash
   sudo certbot certonly --nginx -d quran-lms.kpcybers.com
   ```
3. **Configure Nginx Site**:
   Copy Nginx config to site directories:
   ```bash
   sudo cp nginx.conf /etc/nginx/sites-available/quran-lms
   sudo ln -s /etc/nginx/sites-available/quran-lms /etc/nginx/sites-enabled/
   sudo rm -f /etc/nginx/sites-enabled/default
   ```
4. **Reload Nginx**:
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

---

#### Alternative B: Cloudflare Tunnel Routing (Recommended)
Cloudflare Tunnel allows you to securely expose Next.js and NestJS to `quran-lms.kpcybers.com` without opening local ports 80/443, setting up Certbot certificates, or configuring local firewalls.

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
     # 1. Route all API traffic to the remapped NestJS Backend (Port 4001)
     - hostname: quran-lms.kpcybers.com
       path: /api/
       service: http://localhost:4001

     # 2. Route all other traffic to the remapped Next.js Frontend (Port 3001)
     - hostname: quran-lms.kpcybers.com
       service: http://localhost:3001

     # 3. Catch-all fallback
     - service: http_status:404
   ```

5. **Configure DNS Records for Tunnel**:
   Route the subdomain to your tunnel:
   ```bash
   cloudflared tunnel route dns quran-lms-tunnel quran-lms.kpcybers.com
   ```

6. **Run Cloudflare Tunnel as a Systemd Service**:
   ```bash
   sudo cloudflared --config /home/ubuntu/.cloudflared/config.yml service install
   sudo systemctl enable cloudflared
   sudo systemctl start cloudflared
   sudo systemctl status cloudflared
   ```

---

### Step 5: Start Dockerized Services
With remapped ports configured in `.env`, start the Docker services:

```bash
# Build and start services in detached mode
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Verify that all containers are running and healthy (none will crash due to port binding conflicts anymore):

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
- **LiveKit / WebRTC Handshake fails**: Verify port `7880` and `7882/udp` are fully open in UFW, and that `livekit.kpcybers.com` is configured as **DNS-only** in Cloudflare (grey cloud). Direct UDP port routing is required for WebRTC.
