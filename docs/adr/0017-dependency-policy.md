# 0017 - Dependency Policy

## Status

Accepted

## Context

The simulator uses advanced browser APIs and should avoid custom implementations where proven libraries exist.

## Decision

Use production-ready dependencies for UI, rendering, validation, tests, icons, and PWA support. Keep physics logic local because the v1 educational model is small and needs tight shader parity between CPU and WebGPU paths.

## Consequences

Dependency count stays moderate while the app avoids hand-rolling UI or rendering foundations.

## Alternatives Considered

A full fluid simulation library was considered but rejected because v1 presets need controllable, teachable density fields rather than high-fidelity CFD.
