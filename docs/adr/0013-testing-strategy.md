# 0013 - Testing Strategy

## Status

Accepted

## Context

The app needs fast checks that can run in git hooks without GitHub Actions.

## Decision

Use Vitest for logic tests, Playwright for a static Pages smoke test, ESLint and Prettier for code quality, and gitleaks in pre-commit.

## Consequences

`make test`, `make build`, and `make smoke` run locally and in pre-push.

## Alternatives Considered

Browser-only manual testing was rejected because shader and routing regressions are easy to miss.
