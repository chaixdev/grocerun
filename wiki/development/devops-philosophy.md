# DevOps Philosophy

## Core Principles

### 1. Trunk-Based Development
**Practice:**
- Single `main` branch is always deployable
- Feature branches are short-lived (< 24 hours ideally)
- Continuous integration on every commit

**Rationale:**
- Reduces merge conflicts
- Encourages small, incremental changes
- Faster feedback loops
- Simplifies rollback procedures

**Implementation:**
- CI pipeline runs on every push to `main`
- Feature flags for incomplete features
- Automated testing gates before merge

### 2. Immutable Infrastructure
**Practice:**
- Docker containers are built once, deployed many times
- No manual changes to running containers
- Configuration via environment variables
- Destroy and recreate rather than patch

**Rationale:**
- Reproducible builds
- Eliminates "works on my machine"
- Simplified rollback (redeploy previous image)
- Audit trail via container registry

**Implementation:**
- Multi-stage Docker builds for production optimization
- Versioned images tagged with git commit SHA
- Health checks for zero-downtime deployments

### 3. Configuration as Code
**Practice:**
- All deployment configuration in version control
- Infrastructure defined in Dockerfiles, docker-compose
- Secrets managed via environment variables (not committed)

**Rationale:**
- Reproducible environments
- Change history and review process
- Disaster recovery
- Documentation is the code itself

**Implementation:**
```yaml
# docker-compose.prod.yml
services:
  web:
    image: grocerun:${VERSION}
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - CLERK_SECRET_KEY=${CLERK_SECRET_KEY}
```

### 4. Open Source First
**Practice:**
- Prefer open-source tools over proprietary services
- Contribute back to projects we use
- License our code permissively (MIT)

**Rationale:**
- Community support and longevity
- No vendor lock-in
- Transparency and security audits
- Portability across platforms

**Examples:**
- PostgreSQL (not DynamoDB)
- Docker (not proprietary PaaS)
- Prisma ORM (not closed-source tools)

## Deployment Architecture

### Current State: Single Container
```
┌─────────────────────────────┐
│   grocerun Docker Container │
│                             │
│  ┌──────────────────────┐  │
│  │   Next.js App        │  │
│  │   (Port 3000)        │  │
│  └──────────────────────┘  │
│           │                 │
│           ▼                 │
│  ┌──────────────────────┐  │
│  │   Prisma Client      │  │
│  └──────────────────────┘  │
└─────────────┬───────────────┘
              │
              ▼
    ┌──────────────────┐
    │   PostgreSQL     │
    │   (Neon/Supabase)│
    └──────────────────┘
```

### Future State: Microservices (Phase 4)
```
┌─────────────────┐     ┌─────────────────┐
│   Next.js Web   │────▶│   NestJS API    │
│   (Client)      │     │   (Server)      │
└─────────────────┘     └────────┬────────┘
         │                       │
         │                       ▼
         │              ┌─────────────────┐
         │              │   PostgreSQL    │
         │              └─────────────────┘
         ▼
┌─────────────────┐
│   RxDB Local    │
│   (IndexedDB)   │
└─────────────────┘
```

## Quality Gates

### Pre-Merge Checks
1. **Type Safety**: `tsc --noEmit` must pass
2. **Linting**: ESLint with zero errors
3. **Unit Tests**: Vitest with 80%+ coverage on critical paths
4. **Build**: `npm run build` must succeed

### Pre-Deploy Checks
1. **Integration Tests**: E2E tests with Playwright (future)
2. **Security Scans**: 
   - SAST (Static Application Security Testing)
   - Dependency vulnerability scanning (`npm audit`)
3. **Performance Benchmarks**: Lighthouse CI scores (future)

## Monitoring & Observability

### Health Checks
```typescript
// /api/health endpoint
{
  "status": "healthy",
  "database": "connected",
  "version": "1.2.3",
  "uptime": 86400
}
```

### Logging Strategy
- **Structured Logging**: JSON format for easy parsing
- **Levels**: ERROR (alert), WARN (investigate), INFO (audit), DEBUG (development only)
- **Correlation IDs**: Track requests across services (future microservices)

### Metrics (Future)
- Request latency (p50, p95, p99)
- Error rates by endpoint
- Database query performance
- Active user sessions

## Release Process

### Versioning
- **Semantic Versioning**: MAJOR.MINOR.PATCH
- **Tagging**: Git tags for releases (`v1.2.3`)
- **Changelog**: Automated from commit messages (conventional commits)

### Deployment Cadence
- **Development**: Continuous deployment on merge to `main`
- **Production**: Weekly releases (or hotfixes as needed)
- **Rollback**: Redeploy previous container version

### Post-Deployment
1. Verify health check endpoint
2. Monitor error logs for 15 minutes
3. Run smoke tests (critical user flows)
4. Update status page

---

**Last Updated:** January 9, 2026
