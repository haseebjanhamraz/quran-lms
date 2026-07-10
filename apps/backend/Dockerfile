FROM node:24-alpine AS builder

# Install build dependencies for compiling native C++ Node modules (like vosk)
RUN apk add --no-cache python3 make g++ gcc libc-dev

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:24-alpine

# Install runtime dependencies: ffmpeg for audio extraction, and compatibility libraries for vosk native binaries
RUN apk add --no-cache ffmpeg libstdc++ libc6-compat

WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist

EXPOSE 4000
RUN mkdir -p /app/recordings
CMD ["npm", "run", "start:prod"]
