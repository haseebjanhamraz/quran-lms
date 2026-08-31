# Ain Ul Quran — Production Deployment Guide for Ubuntu LTS

This guide provides step-by-step instructions for deploying the Ain Ul Quran application on an Ubuntu LTS server. All services run in **Docker** and are exposed publicly via **Cloudflare Tunnels** using **subdomain-based routing**.

---

## 1. Architecture Overview

The platform runs entirely as Dockerized services. Public traffic is routed through Cloudflare Tunnels or direct host port bindings for WebRTC media:

```mermaid
graph TD
    User([User Browser]) -->|HTTPS| CF[Cloudflare Tunnel / Direct]
    User -->|WebRTC Media: 7880, 7881, 7882, 3478| LiveKit[LiveKit Server Container]
    
    subgraph Docker Compose Network (quran-lms-net)
        CF -->|quran-lms.kpcybers.com → :3030| NextJS[Next.js Frontend]
        CF -->|api.quran-lms.kpcybers.com → :5000| NestJS[NestJS Backend API]
        NestJS -->|Internal| Mongo[(MongoDB Container)]
        NestJS -->|Internal| Redis[(Redis Container)]
        NestJS -->|SDK / Egress Client| LiveKit
        LiveKit -->|Webhooks| NestJS
        LiveKit -->|State Coordination| Redis
        Egress[LiveKit Egress Container] -->|Room Composite| LiveKit
        Egress -->|Recordings| Volume[Shared Recordings Volume]
        NestJS -->|Process & Stream| Volume
    end
```

### Host Port Mapping

| Service | Internal (Container) Port | Host Mapping (Configured in `.env`) |
|---|---|---|
| **Next.js Frontend** | `3030` | `3030:3030` / `127.0.0.1:3030` |
| **NestJS Backend API** | `4000` / `5000` | `5000:5000` / `127.0.0.1:5000` |
| **LiveKit Media Server** | `7880`, `7881`, `7882/udp`, `3478/udp` | `7880`, `7881`, `7882/udp`, `3478/udp` |
| **Redis Queue Broker** | `6379` | `6379:6379` / `127.0.0.1:6380` |
| **MongoDB Database** | `27017` | `27017:27017` |


---

## 2. Deployment Steps

### Step 1: Configure Environment Variables

```env
MONGODB_URI=mongodb://127.0.0.1:27017/quran_lms
REDIS_HOST=redis
REDIS_PORT=6379
PORT=5000
```

### Step 2: Start Dockerized Services

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

### Step 3: Seed Database

```bash
docker exec -it quran-lms-nestjs npm run seed
```
