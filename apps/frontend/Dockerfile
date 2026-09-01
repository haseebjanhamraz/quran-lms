# ------------------------------------------------------------------------------
# Base stage: common environment & dependencies
# ------------------------------------------------------------------------------
FROM node:22-alpine AS base

WORKDIR /app

COPY package*.json ./
RUN npm config set registry https://registry.npmjs.org/ \
 && npm config set fetch-retries 5 \
 && npm config set fetch-retry-mintimeout 20000 \
 && npm config set fetch-retry-maxtimeout 120000 \
 && npm install --legacy-peer-deps

# ------------------------------------------------------------------------------
# Development stage: for hot-reloading Next.js dev server
# ------------------------------------------------------------------------------
FROM base AS dev

WORKDIR /app
ENV NODE_ENV=development
ENV PORT=3030
ENV HOSTNAME=0.0.0.0
ENV WATCHPACK_POLLING=true

EXPOSE 3030

CMD ["npm", "run", "dev", "--", "-p", "3030", "-H", "0.0.0.0"]

# ------------------------------------------------------------------------------
# Builder stage: build Next.js standalone application for production
# ------------------------------------------------------------------------------
FROM base AS builder

WORKDIR /app

COPY . .

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

ARG NEXT_PUBLIC_LIVEKIT_URL
ENV NEXT_PUBLIC_LIVEKIT_URL=$NEXT_PUBLIC_LIVEKIT_URL

ARG NEXT_PUBLIC_WS_URL
ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL

RUN npm run build

# ------------------------------------------------------------------------------
# Production runner stage: slim production image
# ------------------------------------------------------------------------------
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3030
ENV HOSTNAME=0.0.0.0

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:${PORT}/ || exit 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

USER nextjs

EXPOSE 3030

CMD ["node", "server.js"]