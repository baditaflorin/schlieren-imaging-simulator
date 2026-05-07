# 0009 - Configuration and Secrets Management

## Status

Accepted

## Context

Mode A must not expose or require secrets.

## Decision

No runtime secrets are used. Build constants such as version, commit, repository URL, PayPal URL, and Pages base path are injected by Vite. `.env.example` documents the lack of required secrets.

## Consequences

There is no secret rotation burden. Gitleaks scans staged files before commit.

## Alternatives Considered

Runtime API keys were rejected for v1.
