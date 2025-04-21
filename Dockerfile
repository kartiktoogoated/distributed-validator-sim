# 1) Builder stage
FROM node:18-alpine AS builder
WORKDIR /app

# Pin PNPM to the same version you're using locally
RUN corepack enable && corepack prepare pnpm@10.6.3 --activate

# Copy root manifests (including turbo.json for monorepo)
COPY package.json pnpm-lock.yaml turbo.json ./
COPY . .

# Install all workspaces
RUN pnpm install --frozen-lockfile

# Generate Prisma client (inside your db package)
WORKDIR /app/packages/db
RUN pnpm prisma generate

# Build your server app
WORKDIR /app/apps/server
RUN pnpm run build

# 2) Runtime stage
FROM node:18-alpine AS runner
WORKDIR /app

# Pin the same PNPM version at runtime, so the lockfile works
RUN corepack enable && corepack prepare pnpm@10.6.3 --activate

# Copy the compiled server code
COPY --from=builder /app/apps/server/dist ./dist

# Copy the full hoisted node_modules (includes @prisma/client and its .prisma)
COPY --from=builder /app/node_modules ./node_modules

# Copy minimal package files (for health checks / metadata)
COPY apps/server/package.json ./
COPY pnpm-lock.yaml ./

EXPOSE 3000
CMD ["node", "dist/src/routes/api/v1/server.js"]
