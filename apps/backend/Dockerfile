# ------------------------------------------------------------------------------
# Base stage: common environment & dependencies
# ------------------------------------------------------------------------------
FROM node:22-alpine AS base

WORKDIR /app

# Install runtime dependencies: ffmpeg for audio extraction
RUN apk add --no-cache ffmpeg

COPY package*.json ./
RUN npm config set registry https://registry.npmjs.org/ \
 && npm config set fetch-retries 5 \
 && npm config set fetch-retry-mintimeout 20000 \
 && npm config set fetch-retry-maxtimeout 120000 \
 && npm install --legacy-peer-deps

# ------------------------------------------------------------------------------
# Development stage: for hot-reloading with live source code mounts
# ------------------------------------------------------------------------------
FROM base AS dev

WORKDIR /app
ENV NODE_ENV=development
ENV PORT=5000

# Create upload & recording directories
RUN mkdir -p /app/recordings /app/temp-transcripts /app/uploads/avatars /app/uploads/materials

EXPOSE 5000 5001 9229

CMD ["npm", "run", "start:dev"]

# ------------------------------------------------------------------------------
# Builder stage: compile TypeScript for production
# ------------------------------------------------------------------------------
FROM base AS builder

WORKDIR /app
COPY . .
RUN npm run build

# ------------------------------------------------------------------------------
# Production runner stage: slim production image
# ------------------------------------------------------------------------------
FROM node:22-alpine AS runner

RUN apk add --no-cache ffmpeg

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/api/v1/health || exit 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist

RUN mkdir -p /app/recordings /app/temp-transcripts /app/uploads/avatars /app/uploads/materials \
  && chown -R nestjs:nodejs /app

USER nestjs

EXPOSE 5000 5001

CMD ["node", "dist/main"]
