# 0006 - WASM and Compute Modules

## Status

Accepted

## Context

The original technology direction mentions WebGPU compute shaders, Three.js, Web Audio, and librosa.

## Decision

Use WebGPU compute shaders for accelerated density-field generation where available. Use a CPU TypeScript fallback where WebGPU is absent. Do not ship a WASM module in v1. Keep librosa as an optional offline Python helper for generating audio feature JSON, not as browser runtime code.

## Consequences

The app stays pure GitHub Pages and works in more browsers. WebGPU-capable browsers get the intended accelerated path.

## Alternatives Considered

Pyodide plus librosa was rejected because it would heavily exceed the initial asset budget and require cross-origin isolation strategies GitHub Pages cannot guarantee.
