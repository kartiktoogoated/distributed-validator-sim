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

# Build the server
WORKDIR /app/apps/server
RUN pnpm exec prisma generate
RUN pnpm run build

# 2) Runner
FROM node:18-alpine AS runner
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy package files
COPY --from=builder --chown=nextjs:nodejs /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml /app/turbo.json ./

# Copy workspace packages
COPY --from=builder --chown=nextjs:nodejs /app/packages/db/package.json ./packages/db/
COPY --from=builder --chown=nextjs:nodejs /app/apps/server/package.json ./apps/server/

# Copy Prisma files
COPY --from=builder --chown=nextjs:nodejs /app/packages/db/prisma ./packages/db/prisma

# Copy built files
COPY --from=builder --chown=nextjs:nodejs /app/apps/server/dist ./apps/server/dist

# Install all dependencies including dev dependencies for Prisma
RUN corepack enable && corepack prepare pnpm@10.10.0 --activate && \
    pnpm install --frozen-lockfile && \
    pnpm approve-builds

# Generate Prisma client and copy it to the correct location
WORKDIR /app/packages/db
RUN pnpm prisma generate && \
    # Find and copy the generated Prisma client
    find /app -name ".prisma" -type d -exec cp -r {}/client /app/node_modules/.prisma/ \; && \
    find /app -name "@prisma" -type d -exec cp -r {} /app/node_modules/ \;

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Set working directory to app root
WORKDIR /app

# Start the server
CMD ["node", "apps/server/dist/src/routes/api/v1/server.js"]
