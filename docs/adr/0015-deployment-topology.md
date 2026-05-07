# 0015 - Deployment Topology

## Status

Accepted

## Context

Mode A deployment is GitHub Pages only.

## Decision

Serve the committed `docs/` directory from `main` branch through GitHub Pages at `https://baditaflorin.github.io/schlieren-imaging-simulator/`.

## Consequences

There is no Docker Compose stack, nginx config, backend host, or server runbook.

## Alternatives Considered

A Docker backend topology was rejected in ADR 0001.
