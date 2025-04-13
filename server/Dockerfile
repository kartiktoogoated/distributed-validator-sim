# Use an official Node.js runtime as the base image.
FROM node:18-alpine AS builder

# Create and set the working directory
WORKDIR /app

# Copy package.json and pnpm-lock.yaml (if you use pnpm) first to leverage Docker cache.
COPY package.json pnpm-lock.yaml ./

# Install dependencies (use pnpm)
RUN npm install -g pnpm \
    && pnpm install --frozen-lockfile

# Copy the rest of the application source code.
COPY . .

# Build the TypeScript code.
RUN pnpm run build

# Use a smaller Node image for running the app.
FROM node:18-alpine

WORKDIR /app

# Copy only the built output and necessary package files.
COPY --from=builder /app/dist ./dist
COPY package.json pnpm-lock.yaml ./

# Install production dependencies.
RUN npm install -g pnpm \
    && pnpm install --prod --frozen-lockfile

# Expose the port your application listens on.
EXPOSE 3000

# Define the command to run your application.
CMD ["node", "dist/index.js"]
