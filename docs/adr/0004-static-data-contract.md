# 0004 - Static Data Contract

## Status

Accepted

## Context

Mode A has no external data pipeline. V1 presets are small and deterministic.

## Decision

Scene presets are versioned TypeScript objects bundled with the app. Optional offline audio feature files may be generated as JSON by the `tools/librosa/` helper, but no such artifact is required for runtime. The app may fetch public GitHub commit metadata directly from the browser to display the current main commit; this is not a private or generated data source.

## Consequences

The app can work offline after install. Breaking preset schema changes are handled through app version bumps.

## Alternatives Considered

Committed JSON presets were rejected because TypeScript gives stronger local typing and simpler imports.
