# 1) Builder
FROM node:18-alpine AS builder
WORKDIR /app

# Ensure corepack works well in alpine
RUN apk add --no-cache curl

# Use latest safe PNPM version explicitly (10.10.0 recommended)
RUN corepack enable && corepack prepare pnpm@10.10.0 --activate

# Monorepo manifests first for proper cache
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./

# Install dependencies first (before full context copy) to optimize layer caching
RUN pnpm install --frozen-lockfile

# Then copy full source code
COPY . .

# Disable update check & speed up installs in CI/docker
ENV PNPM_DISABLE_SELF_UPDATE_CHECK=1
ENV CI=true

# Prisma
WORKDIR /app/packages/db
RUN pnpm prisma generate

# Build the server
WORKDIR /app/apps/server
RUN pnpm run build


# 2) Runner
FROM node:18-alpine AS runner
WORKDIR /app

# Copy built app from builder
COPY --from=builder /app .

EXPOSE 3000

CMD ["node", "apps/server/dist/src/routes/api/v1/server.js"]
