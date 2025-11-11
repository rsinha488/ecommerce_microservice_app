# ====================================
# Real-Time WebSocket Service
# ====================================

FROM node:20-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Set working directory
WORKDIR /app

# ====================================
# Dependencies Stage
# ====================================
FROM base AS dependencies

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install --no-frozen-lockfile

# ====================================
# Build Stage
# ====================================
FROM base AS build

# Copy dependencies
COPY --from=dependencies /app/node_modules ./node_modules

# Copy source code
COPY . .

# Build application
RUN pnpm run build

# ====================================
# Production Stage
# ====================================
FROM base AS production

# Set NODE_ENV
ENV NODE_ENV=production

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install production dependencies only
RUN pnpm install --no-frozen-lockfile --prod

# Copy built application
COPY --from=build /app/dist ./dist

# Expose ports
# 3009 - HTTP/WebSocket server
EXPOSE 3009

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget -qO- http://localhost:3009/health || exit 1

# Start application
CMD ["node", "dist/main.js"]
