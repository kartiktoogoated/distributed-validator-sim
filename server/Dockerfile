# 1) Builder stage
FROM node:18-alpine AS builder
WORKDIR /app

# Install deps & generate client
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm \
 && pnpm install --frozen-lockfile

COPY . .
RUN pnpm run generate
RUN pnpm run build

# 2) Final stage
FROM node:18-alpine
WORKDIR /app

# Copy built code
COPY --from=builder /app/dist ./dist

# Copy ALL node_modules (so @prisma/client and .prisma/client come along)
COPY --from=builder /app/node_modules ./node_modules

# Copy package files for health
COPY package.json pnpm-lock.yaml ./

EXPOSE 3000

# Launch your server entrypoint
CMD ["node", "dist/src/routes/api/v1/server.js"]
