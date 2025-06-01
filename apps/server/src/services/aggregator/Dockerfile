# 1) Builder Stage
FROM node:18-alpine AS builder
WORKDIR /app

# Install curl for health checks or debugging
RUN apk add --no-cache curl

# Enable PNPM without prompts
ENV PNPM_HOME="/root/.local/share/pnpm"
ENV PATH="${PNPM_HOME}:${PATH}"
RUN corepack enable && corepack prepare pnpm@10.10.0 --activate

# Install dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Generate Prisma Client (runs in builder stage)
WORKDIR /app/packages/db
RUN pnpm install --frozen-lockfile && pnpm prisma generate

# Build app
WORKDIR /app
RUN pnpm turbo run build --filter=distributed-validator-sim...

# 2) Runner Stage
FROM node:18-alpine AS runner
WORKDIR /app

# Install curl and openssl
RUN apk add --no-cache openssl curl

# Copy built app from builder
COPY --from=builder /app .

# Important: Copy Prisma schema and migrations folder (if using migrations)
COPY --from=builder /app/packages/db/prisma /app/packages/db/prisma

# Default environment variables
ENV NODE_ENV=production

# Expose port (same for validator and aggregator)
EXPOSE 3000

# Note: Entry point is set via docker-compose.yml 'command'
