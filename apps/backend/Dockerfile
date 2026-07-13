FROM node:24-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:24-alpine AS runner

# Install runtime dependencies: ffmpeg for audio extraction
RUN apk add --no-cache ffmpeg

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/v1/health || exit 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

# Copy runtime node_modules, build outputs, and prisma directory for migrations
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./

# Create recordings and temp-transcripts directories and set ownership
RUN mkdir -p /app/recordings /app/temp-transcripts \
  && chown -R nestjs:nodejs /app

USER nestjs

EXPOSE 4000

CMD ["node", "dist/src/main"]
