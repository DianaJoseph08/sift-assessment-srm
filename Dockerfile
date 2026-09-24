# Multi-stage Dockerfile for CogniHire
# Stage 1: Build the frontend
FROM node:22-slim AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install all dependencies including build tooling (Vite, React plugin, etc.)
RUN npm ci

# Copy full application source code
COPY . .

# Build Vite frontend into /app/dist
RUN npm run build

# Stage 2: Production runtime
FROM node:22-slim

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# Copy package manifests and install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled frontend, backend server, and pre-seeded SQLite database
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/sift.db ./sift.db

# Expose standard Cloud Run port (Cloud Run automatically injects PORT=8080)
EXPOSE 8080

# Start server
CMD ["node", "server/index.js"]
