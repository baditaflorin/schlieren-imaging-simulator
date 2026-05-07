# 0012 - Metrics and Observability

## Status

Accepted

## Context

Mode A has no server metrics endpoint. Privacy matters for an educational public site.

## Decision

Ship no analytics in v1. Surface local observability only: FPS, active solver path, grid size, audio level, app version, and the static build commit.

## Consequences

No usage data is collected. Users can still understand local performance.

## Alternatives Considered

Plausible was considered but rejected for v1 to keep the default privacy posture simple.
