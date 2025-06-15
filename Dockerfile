# # Build stage
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
# RUN pnpm install --frozen-lockfile && pnpm prisma generate

# # Build everything
# WORKDIR /app
# RUN pnpm turbo run build --filter=distributed-validator-sim...

# # Production stage
# FROM node:18-alpine AS runner
# WORKDIR /app

# # Copy only necessary files from builder
# COPY --from=builder /app/apps/server/dist ./dist
# COPY --from=builder /app/apps/server/node_modules ./node_modules
# COPY --from=builder /app/apps/server/package*.json ./

# # Set environment variables
# ENV NODE_ENV=production

# # Expose default port
# EXPOSE 3000

# # Start the server
# CMD ["node", "dist/server.js"] 