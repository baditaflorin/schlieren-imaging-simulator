# 0005 - Client-Side Storage Strategy

## Status

Accepted

## Context

Users benefit from persisted scene controls, but v1 does not need cloud sync.

## Decision

Use `localStorage` for small validated UI preferences and simulation parameters. Validate loaded values with zod.

## Consequences

State persists across sessions without auth or a backend. Corrupt values reset safely to defaults.

## Alternatives Considered

IndexedDB and OPFS were considered but are unnecessary for the small settings payload in v1.
