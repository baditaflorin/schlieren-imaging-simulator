# Architecture

## Context

```mermaid
C4Context
  title Schlieren Imaging Simulator
  Person(user, "Learner or educator", "Explores invisible air-density gradients")
  System_Boundary(pages, "GitHub Pages") {
    System(app, "Static simulator", "React, TypeScript, WebGPU, Three.js, Web Audio")
  }
  Rel(user, app, "Uses in browser")
```

## Container

```mermaid
C4Container
  title Static Browser Containers
  Person(user, "Browser user")
  System_Boundary(pages, "GitHub Pages static boundary") {
    Container(ui, "React UI", "TypeScript", "Controls, links, status, version")
    Container(sim, "Density solver", "WebGPU compute + CPU fallback", "Heat, sound, gas fields")
    Container(render, "Schlieren renderer", "Three.js/WebGL", "Synthetic optical bench and gradient visualization")
    Container(audio, "Audio analyzer", "Web Audio", "Microphone and uploaded audio levels")
    Container(storage, "Settings storage", "localStorage + zod", "Validated local preferences")
    Container(build, "Build metadata", "Static JSON", "Version and commit")
  }
  Rel(user, ui, "Interacts")
  Rel(ui, sim, "Sends scene parameters")
  Rel(audio, sim, "Modulates density")
  Rel(sim, render, "Provides density texture")
  Rel(ui, storage, "Persists settings")
  Rel(ui, build, "Reads build metadata")
```

## Boundaries

- `src/features/simulation/` owns the density-field model, WebGPU compute shader, and CPU fallback.
- `src/features/rendering/` owns the Three.js viewport and Schlieren shader.
- `src/features/audio/` owns microphone, uploaded audio playback, and meter state.
- `src/features/settings/` owns localStorage persistence and zod validation.
- `docs/` contains both GitHub Pages output and project documentation; the build cleaner preserves documentation files.

Complete live URL: https://baditaflorin.github.io/schlieren-imaging-simulator/

Complete repository URL: https://github.com/baditaflorin/schlieren-imaging-simulator
