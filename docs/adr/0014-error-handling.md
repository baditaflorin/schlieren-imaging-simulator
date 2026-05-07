# 0014 - Error Handling Conventions

## Status

Accepted

## Context

Failures may come from missing WebGPU support, denied microphone permission, unsupported audio files, or unavailable local storage.

## Decision

Use typed return states and visible status messages for recoverable errors. Fall back from WebGPU to CPU automatically. Do not throw from UI event handlers except for programmer errors caught by tests.

## Consequences

The app remains usable in constrained browsers and communicates why features degrade.

## Alternatives Considered

Hard-failing on missing WebGPU was rejected because the teaching experience should remain accessible.
