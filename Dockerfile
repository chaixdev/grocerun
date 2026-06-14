# ── Stage 1: Base ──
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat openssl ca-certificates

# ── Stage 2: Install ALL dependencies (dev + prod) for building ──
FROM base AS deps
RUN apk add --no-cache python3 make g++
WORKDIR /app

# Copy workspace root manifests
COPY package.json package-lock.json* ./
COPY turbo.json ./

# Copy workspace package.json files (needed for npm workspaces install)
COPY apps/web/package.json ./apps/web/
COPY apps/server/package.json ./apps/server/
COPY packages/dto/package.json ./packages/dto/

RUN npm ci

# ── Stage 3: Build everything ──
FROM base AS builder
WORKDIR /app

# Copy installed node_modules
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/apps/server/node_modules ./apps/server/node_modules

# Copy full source
COPY . .

# DATABASE_URL needed for Prisma client generation at build time
ENV DATABASE_URL="file:./db.sqlite"

# Generate Prisma clients for both apps
RUN npx prisma generate --schema=apps/web/prisma/schema.prisma
RUN npx prisma generate --schema=apps/server/prisma/schema.prisma

# Build shared packages first, then apps (turbo handles ordering)
ARG NEXT_PUBLIC_APP_VERSION
ENV NEXT_PUBLIC_APP_VERSION=$NEXT_PUBLIC_APP_VERSION
RUN npx turbo build

# ── Stage 4: Production dependencies only ──
FROM base AS prod-deps
RUN apk add --no-cache python3 make g++
WORKDIR /app

COPY package.json package-lock.json* ./
COPY turbo.json ./
COPY apps/web/package.json ./apps/web/
COPY apps/server/package.json ./apps/server/
COPY packages/dto/package.json ./packages/dto/

RUN npm ci --omit=dev && npm cache clean --force

# ── Stage 5: Runner ──
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

ARG NEXT_PUBLIC_APP_VERSION
ENV NEXT_PUBLIC_APP_VERSION=$NEXT_PUBLIC_APP_VERSION
# APP_VERSION is read at runtime by the NestJS health endpoint
ENV APP_VERSION=$NEXT_PUBLIC_APP_VERSION

# ── Production node_modules (root + workspaces) ──
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=prod-deps /app/apps/server/node_modules ./apps/server/node_modules
# Root package.json needed for workspace resolution
COPY --from=builder /app/package.json ./

# ── NestJS server ──
COPY --from=builder /app/apps/server/dist ./apps/server/dist
COPY --from=builder /app/apps/server/package.json ./apps/server/
COPY --from=builder /app/apps/server/prisma ./apps/server/prisma
COPY --from=builder /app/apps/server/prisma.config.ts ./apps/server/

# ── Shared DTO package ──
COPY --from=builder /app/packages/dto/dist ./packages/dto/dist
COPY --from=builder /app/packages/dto/package.json ./packages/dto/

# ── Next.js web app (standalone output preserves monorepo structure) ──
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

# ── Prisma schema for db push at startup ──
COPY --from=builder /app/apps/web/prisma ./apps/web/prisma
COPY --from=builder /app/apps/web/prisma.config.ts ./apps/web/prisma.config.ts

# ── Entrypoint ──
COPY --chown=nextjs:nodejs scripts/docker-entrypoint.sh ./

# Create data directory for SQLite volume
RUN mkdir -p /app/data && chown nextjs:nodejs /app/data
RUN chmod +x docker-entrypoint.sh

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:3001/health || exit 1

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
# Internal: NestJS API runs in same container
ENV API_URL="http://localhost:3001"

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "apps/web/server.js"]

LABEL org.opencontainers.image.source="https://github.com/chaixdev/grocerun"
LABEL org.opencontainers.image.description="Grocerun - A self-hostable grocery list app"
LABEL org.opencontainers.image.licenses="MIT"
