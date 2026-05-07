# 0003 - Frontend Framework and Build Tooling

## Status

Accepted

## Context

The UI needs stateful controls, strict TypeScript, fast local iteration, and static output.

## Decision

Use React, TypeScript strict mode, Vite, Three.js, lucide-react, zod, TanStack Query, Vitest, Playwright, and vite-plugin-pwa.

## Consequences

The app has a familiar component model, fast builds, and a production-ready static pipeline.

## Alternatives Considered

Vanilla TypeScript was considered but would increase UI state complexity. Next.js was rejected because static Vite is lighter for Pages.
