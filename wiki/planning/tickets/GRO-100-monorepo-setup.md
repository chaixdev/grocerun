# GRO-100: Monorepo Setup

**Status:** ✅ Done  
**Phase:** 0 - Architecture Foundation  
**User Story:** N/A (Infrastructure)

## Description
Initialize the npm workspaces monorepo structure to support separate client and server applications with shared packages.

## Acceptance Criteria
- [x] Root `package.json` with workspaces configuration
- [x] `apps/client` workspace for Vite + React
- [x] `apps/server` workspace for NestJS
- [x] `packages/shared` placeholder for shared types
- [x] `npm install` works from root
- [x] `npm run dev` starts both apps concurrently

## Implementation Notes
- Using npm workspaces (not Turborepo) for simplicity
- Concurrently package for running both dev servers
- Workspace names: `grocerun-client`, `grocerun-server`
