# 1) Builder stage
FROM node:18-alpine AS builder
WORKDIR /app

# Pin pnpm to your workspace version
RUN corepack enable && corepack prepare pnpm@10.6.3 --activate

# Copy monorepo root manifests
COPY package.json pnpm-lock.yaml turbo.json ./

# Copy everything (so both packages/db and apps/server come along)
COPY . .

# Install all workspaces
RUN pnpm install --frozen-lockfile

# Generate Prisma client from your DB package schema
WORKDIR /app/packages/db
RUN pnpm prisma generate --schema=./schema.prisma

# Build your server app
WORKDIR /app/apps/server
RUN pnpm run build

# 2) Runtime image
FROM node:18-alpine AS run
WORKDIR /app

# Pin same pnpm
RUN corepack enable && corepack prepare pnpm@10.6.3 --activate

# Copy compiled server
COPY --from=builder /app/apps/server/dist ./dist

# Copy hoisted dependencies (including @prisma/client and its .prisma folder)
COPY --from=builder /app/node_modules ./node_modules

# Copy Prisma runtime artifacts (they live under root node_modules)
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copy package.json for healthchecks, etc
COPY apps/server/package.json ./
COPY pnpm-lock.yaml ./

EXPOSE 3000
CMD ["node", "dist/src/routes/api/v1/server.js"]
