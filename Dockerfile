# ── Stage 1: Base ──
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat openssl ca-certificates

# ── Stage 2: Install all dependencies for building ──
FROM base AS deps
RUN apk add --no-cache python3 make g++
WORKDIR /app

COPY package.json package-lock.json* ./
COPY turbo.json ./
COPY apps/web/package.json ./apps/web/
COPY apps/server/package.json ./apps/server/
COPY packages/dto/package.json ./packages/dto/

RUN --mount=type=cache,target=/root/.npm npm ci

# ── Stage 3: Build server, SPA, and shared packages ──
FROM base AS builder
WORKDIR /app

# All workspace deps are hoisted to root node_modules by npm workspaces
# — workspace-specific node_modules directories do not exist post-install.
COPY --from=deps /app/node_modules ./node_modules

COPY . .

# Prisma needs DATABASE_URL when generating the client.
ENV DATABASE_URL="file:./db.sqlite"
RUN npx prisma generate --schema=apps/server/prisma/schema.prisma

# Runtime OIDC config — set at container start (not build time):
#   OIDC_CLIENT_ID     — Google OAuth client ID (served to browser via /config.js)
#   OIDC_CLIENT_SECRET — Google OAuth client secret (served to browser via /config.js)
#   OIDC_AUDIENCE      — Must match OIDC_CLIENT_ID (validated by server on startup)
ARG VITE_INVITATION_TIMEOUT_MINUTES=1440

RUN VITE_INVITATION_TIMEOUT_MINUTES=$VITE_INVITATION_TIMEOUT_MINUTES \
  npx turbo build

# ── Stage 4: Production dependencies only ──
FROM base AS prod-deps
RUN apk add --no-cache python3 make g++
WORKDIR /app

COPY package.json package-lock.json* ./
COPY turbo.json ./
COPY apps/web/package.json ./apps/web/
COPY apps/server/package.json ./apps/server/
COPY packages/dto/package.json ./packages/dto/

RUN --mount=type=cache,target=/root/.npm npm ci --omit=dev --workspace apps/server --include-workspace-root=false

# Strip packages unnecessary at runtime.
# - typescript: pulled by @prisma/client but not needed at runtime (~23MB)
# - @electric-sql: extraneous on Linux, only needed by @prisma/dev for PG (~25MB)
# - sharp + @img + next: legacy from Next.js era if still present
# Note: @prisma/studio* and @prisma/dev are required by the Prisma CLI.
RUN rm -rf node_modules/typescript node_modules/@electric-sql \
  node_modules/sharp node_modules/next node_modules/@img \
  node_modules/.cache

# ── Stage 5: Runner ──
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

RUN addgroup --system --gid 1001 grocerun \
  && adduser --system --uid 1001 --ingroup grocerun grocerun

ARG APP_VERSION
ENV APP_VERSION=$APP_VERSION

# Runtime dependencies and workspace metadata.
# Server production deps are hoisted to root node_modules by npm workspaces
# — apps/server/node_modules does not exist in the prod-deps stage.
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# NestJS server.
COPY --from=builder /app/apps/server/dist ./apps/server/dist
COPY --from=builder /app/apps/server/package.json ./apps/server/
COPY --from=builder /app/apps/server/prisma ./apps/server/prisma
COPY --from=builder /app/apps/server/prisma.config.ts ./apps/server/

# Vite SPA served by NestJS ServeStaticModule.
COPY --from=builder /app/apps/web/dist ./apps/web/dist

# Shared DTO workspace package.
COPY --from=builder /app/packages/dto/dist ./packages/dto/dist
COPY --from=builder /app/packages/dto/package.json ./packages/dto/

COPY --chown=grocerun:grocerun scripts/docker-entrypoint.sh ./

RUN mkdir -p /app/data \
  && chown -R grocerun:grocerun /app/data docker-entrypoint.sh apps/web/dist \
  && chmod +x docker-entrypoint.sh

USER grocerun

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "apps/server/dist/src/main.js"]

LABEL org.opencontainers.image.source="https://github.com/chaixdev/grocerun"
LABEL org.opencontainers.image.description="Grocerun - A self-hostable grocery list app"
LABEL org.opencontainers.image.licenses="MIT"
