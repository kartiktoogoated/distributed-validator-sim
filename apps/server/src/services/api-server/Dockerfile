# 1) Builder Stage
FROM node:18-alpine AS builder
WORKDIR /app

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

# Generate Prisma Client
WORKDIR /app/packages/db
RUN pnpm install --frozen-lockfile && pnpm prisma generate

# Build app
WORKDIR /app
RUN pnpm turbo run build --filter=distributed-validator-sim...

# 2) Runner Stage
FROM node:18-alpine AS runner
WORKDIR /app

RUN apk add --no-cache openssl curl

# Copy app output from builder
COPY --from=builder /app .

# Copy Prisma schema and migrations
COPY --from=builder /app/packages/db/prisma /app/packages/db/prisma

# Set environment variables
ENV NODE_ENV=production
ENV IS_API_SERVER=true

EXPOSE 3000

# Note: CMD is overridden by `command:` in docker-compose.yml
