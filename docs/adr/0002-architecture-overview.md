# 0002 - Architecture Overview and Module Boundaries

## Status

Accepted

## Context

The app must stay static while still delivering a high-end interactive physics teaching surface.

## Decision

Use a client-only architecture:

- `features/simulation/` owns presets, density-field generation, CPU fallback, and WebGPU compute code.
- `features/rendering/` owns the Three.js Schlieren renderer.
- `features/audio/` owns Web Audio capture, file playback, and analysis.
- `features/settings/` owns local persistence.
- `docs/` is generated Pages output.

## Consequences

Simulation, rendering, audio, and persistence remain independently testable. There is no server boundary.

## Alternatives Considered

A backend simulation service was rejected because browser compute is sufficient for v1.
