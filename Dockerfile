# 1) Builder
FROM node:18-alpine AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.6.3 --activate

# monorepo manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY . .

RUN pnpm install --frozen-lockfile

WORKDIR /app/packages/db
RUN pnpm prisma generate

WORKDIR /app/apps/server
RUN pnpm run build


# 2) Runner
FROM node:18-alpine AS runner
WORKDIR /app

# grab *everything* you built in the previous stage
COPY --from=builder /app . 

EXPOSE 3000

# point directly at your built server entrypoint
CMD ["node", "apps/server/dist/src/routes/api/v1/server.js"]
