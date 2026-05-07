# 0011 - Logging Strategy

## Status

Accepted

## Context

There is no server-side log stream in Mode A.

## Decision

Production browser logging is minimal. Recoverable user-facing failures are shown in the UI. Developer-only diagnostics may use `console.debug` behind explicit development checks.

## Consequences

Users see clear app state without noisy console output.

## Alternatives Considered

Remote logging was rejected because it would add tracking and infrastructure.
