# 1. Base
FROM node:22-alpine AS base
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat openssl ca-certificates

# 2. Deps
FROM base AS deps
RUN apk add --no-cache python3 make g++
WORKDIR /app

# Install dependencies based on the preferred package manager
# Cache buster: fontsource added
COPY package.json ./
COPY package-lock.json* ./
RUN npm ci

# 3. Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Dummy DB URL for build time (Prisma Client generation)
ENV DATABASE_URL="file:./db.sqlite"
ENV AUTH_SECRET="dummy_secret"
ENV AUTH_GOOGLE_ID="dummy_id"
ENV AUTH_GOOGLE_SECRET="dummy_secret"

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js app
ARG NEXT_PUBLIC_APP_VERSION
ENV NEXT_PUBLIC_APP_VERSION=$NEXT_PUBLIC_APP_VERSION
RUN npm run build

# 4. Runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
# Disable telemetry during runtime.
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

ARG NEXT_PUBLIC_APP_VERSION
ENV NEXT_PUBLIC_APP_VERSION=$NEXT_PUBLIC_APP_VERSION

# Restore full node_modules from deps stage
# This ensures all transitive dependencies (e.g. valibot) are present for the Prisma CLI
# avoiding "Cannot find module" errors.
# We copy this BEFORE the standalone build so that the app's optimized runtime files take precedence later.
COPY --from=deps /app/node_modules ./node_modules

# Cleanup unused Prisma binaries (Introspection, Format) to save space. 
RUN rm -rf node_modules/@prisma/engines/*introspection* \
    && rm -rf node_modules/@prisma/engines/*fmt*

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma schema and config for auto-init
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts ./
# Patch prisma.config.ts to remove dotenv requirement (env vars are injected in prod)
RUN sed -i "s/import 'dotenv\/config'/\/\/ import 'dotenv\/config'/" prisma.config.ts
# Copy entrypoint script
COPY --chown=nextjs:nodejs scripts/docker-entrypoint.sh ./

# Create data directory and set permissions (for optional volume inheritance)
RUN mkdir -p /app/data && chown nextjs:nodejs /app/data

USER nextjs

EXPOSE 3000

ENV PORT=3000
# set hostname to localhost
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["./docker-entrypoint.sh"]

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/next-config-js/output
CMD ["node", "server.js"]

LABEL org.opencontainers.image.source="https://github.com/chaixdev/grocerun"
LABEL org.opencontainers.image.description="Grocerun - A self-hostable grocery list app"
LABEL org.opencontainers.image.licenses="MIT"
