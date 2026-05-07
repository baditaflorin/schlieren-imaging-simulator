# 0016 - Local Git Hooks

## Status

Accepted

## Context

The project explicitly avoids GitHub Actions. Local hooks must guard commits and pushes.

## Decision

Use `.githooks/` wired by `make install-hooks`. Pre-commit runs lint, format check, TypeScript, and gitleaks. Commit-msg validates Conventional Commits. Pre-push runs tests, build, and smoke.

## Consequences

Checks run before code leaves the machine. Contributors must install hooks after cloning.

## Alternatives Considered

Lefthook was considered, but plain hooks are transparent and avoid another dependency.
