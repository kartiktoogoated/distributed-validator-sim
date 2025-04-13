# Dockerfile

FROM node:18-alpine AS builder

WORKDIR /app

# Copy package.json and pnpm-lock.yaml first for caching.
COPY package.json pnpm-lock.yaml ./

RUN npm install -g pnpm \
    && pnpm install --frozen-lockfile

# Copy the rest of the application source code.
COPY . .

# Generate Prisma client
RUN pnpm run generate

# Build the TypeScript code.
RUN pnpm run build

FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY package.json pnpm-lock.yaml ./

RUN npm install -g pnpm \
    && pnpm install --prod --frozen-lockfile

EXPOSE 3000

CMD ["node", "dist/routes/api/v1/server.js"]
