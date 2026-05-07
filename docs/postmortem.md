# Postmortem

## What Was Built

V1 is a static GitHub Pages Schlieren imaging simulator with:

- Interactive heat plume, sound wave, and gas leak presets.
- WebGPU compute-shader density generation with CPU fallback.
- Three.js/WebGL Schlieren-style rendering on a synthetic optical bench.
- Web Audio microphone and uploaded-audio modulation.
- Version, public main commit, repository, and PayPal links in the UI.
- PWA manifest, local settings persistence, local hooks, unit tests, and desktop/mobile Playwright smoke tests.

## Was Mode A Correct?

Yes. The core experience does not need auth, secrets, a database, or a runtime API. Browser compute and public GitHub metadata are enough for v1. Mode B would add needless artifact management, and Mode C would add operational burden without user value.

## What Worked

- GitHub Pages from `main` `/docs` was quick to enable.
- Lazy-loading the renderer kept the initial gzipped JS under 200 KB.
- The CPU fallback made Playwright smoke tests reliable even where WebGPU is unavailable.
- Canvas pixel checks caught a real automation issue with WebGL buffer preservation.

## What Did Not Work

- Building into `docs/` initially erased ADR markdown. The build cleaner now removes only generated Pages assets.
- Injecting git commit and build date into the bundle made repeated builds dirty. The UI now fetches the public main commit at runtime with a stable fallback.

## Surprises

- The local pre-push hook was useful immediately; it caught missing tests, missing smoke wiring, Vitest collecting Playwright specs, and a strict locator issue.
- Three.js dominates the lazy renderer chunk, but the first-load budget remains healthy.

## Accepted Tech Debt

- The density model is analytic and educational rather than physically exact CFD.
- WebGPU readback goes through CPU texture upload for Three.js interop. It is simple and clear for v1 but not the fastest possible architecture.
- The optional librosa helper is a standalone script, not a polished data pipeline.

## Next Improvements

1. Add a pure GPU render path that keeps density data on the GPU between WebGPU compute and rendering.
2. Add classroom presets with annotations and controlled comparison snapshots.
3. Add exportable still images or short clips for teachers preparing material.

## Time Spent vs Estimate

Estimated v1 scaffold and implementation: 3 to 5 hours.

Actual work in this session: about 2 hours of active build, test, documentation, and deployment iteration.
