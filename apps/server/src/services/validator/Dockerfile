# 1) Builder Stage
FROM node:18-alpine AS builder
WORKDIR /app

RUN apk add --no-cache curl

# Enable PNPM
RUN corepack enable && corepack prepare pnpm@10.10.0 --activate

# Install deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# Copy source
COPY . .

# Generate Prisma Client
WORKDIR /app/packages/db
RUN pnpm install --frozen-lockfile && pnpm prisma generate

# Build app
WORKDIR /app
RUN pnpm turbo run build --filter=distributed-validator-sim...

# 2) Runner Stage
FROM node:18-alpine AS runner
WORKDIR /app

# Install required tools and enable pnpm
RUN apk add --no-cache openssl curl && corepack enable && corepack prepare pnpm@10.10.0 --activate

# Copy output from builder
COPY --from=builder /app .

# Set runtime environment
ENV NODE_ENV=production
ENV IS_VALIDATOR=true

# Expose port
EXPOSE 3000

# Note: CMD is overridden by `command:` in docker-compose.yml
