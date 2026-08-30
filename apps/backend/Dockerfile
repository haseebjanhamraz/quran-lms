FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm config set registry https://registry.npmjs.org/ \
 && npm config set fetch-retries 5 \
 && npm config set fetch-retry-mintimeout 20000 \
 && npm config set fetch-retry-maxtimeout 120000 \
 && npm install --legacy-peer-deps

COPY . .
RUN npm run build

FROM node:22-alpine AS runner

# Install runtime dependencies: ffmpeg for audio extraction
RUN apk add --no-cache ffmpeg

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Health check endpoints
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/api/v1/health || exit 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

# Copy runtime node_modules and build outputs
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist

# Create recordings, temp-transcripts, and uploads directories and set ownership
RUN mkdir -p /app/recordings /app/temp-transcripts /app/uploads/avatars /app/uploads/materials \
  && chown -R nestjs:nodejs /app

USER nestjs

EXPOSE 5000 5001

CMD ["node", "dist/main"]
