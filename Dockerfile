# # 1) Builder Stage
# FROM node:18-alpine AS builder
# WORKDIR /app

# RUN apk add --no-cache curl

# # Use PNPM
# RUN corepack enable && corepack prepare pnpm@10.10.0 --activate

# # Copy monorepo configs first
# COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./

# # Install deps
# RUN pnpm install --frozen-lockfile

# # Copy all source
# COPY . .

# # Prisma
# WORKDIR /app/packages/db
# RUN pnpm prisma generate

# # Build everything
# WORKDIR /app
# RUN pnpm run build


# # 2) Runner Stage
# FROM node:18-alpine AS runner
# WORKDIR /app

# # Copy from builder
# COPY --from=builder /app .

# # Expose default port
# EXPOSE 3000

# # Dummy fallback CMD — overridden in docker-compose
# CMD ["node", "server/dist/dummy.js"]
