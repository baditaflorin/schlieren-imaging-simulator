import type { DensitySolver, ScenarioId, SimulationParams } from "./types";

export const scenarioIndex: Record<ScenarioId, number> = {
  heat: 0,
  sound: 1,
  gas: 2,
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const smoothstep = (edge0: number, edge1: number, value: number) => {
  const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};

const gaussian = (value: number, width: number) =>
  Math.exp(-(value * value) / Math.max(width * width, 0.0001));

const pseudoNoise = (x: number, y: number, time: number) => {
  const raw = Math.sin(x * 12.9898 + y * 78.233 + time * 4.719) * 43758.5453;
  return raw - Math.floor(raw);
};

export function computeDensityAt(
  x: number,
  y: number,
  params: SimulationParams,
): number {
  const audioLift = clamp(params.audioLevel, 0, 1);
  const strength = params.strength * (0.7 + audioLift * 0.6);
  const turbulence = params.turbulence;

  if (params.scenario === "heat") {
    const vertical = smoothstep(-0.88, 0.9, y);
    const plumeMask = smoothstep(-0.95, -0.78, y);
    const curl = Math.sin(y * 8.3 + params.time * 1.8) * 0.1 * vertical;
    const center =
      curl + Math.sin(params.time * 1.2 + y * 3.0) * audioLift * 0.035;
    const spread = 0.035 + vertical * (0.2 + params.flow * 0.14);
    const core =
      gaussian(x - center, spread) * Math.exp(-vertical * 0.58) * plumeMask;
    const shimmer =
      Math.sin(x * 28 + y * 14 - params.time * 4.1) *
      Math.sin(y * 13 + params.time * 2.2) *
      turbulence *
      0.18;
    return clamp((core + shimmer * core) * strength, -1, 1);
  }

  if (params.scenario === "sound") {
    const r = Math.hypot(x, y);
    const speed = 4.2 + params.frequency * 8.5;
    const envelope = Math.exp(-r * (1.25 + (1 - params.flow) * 0.8));
    const wave = Math.sin(r * 42 - params.time * speed);
    const reflected =
      Math.sin((x + 1.0) * 18 - params.time * speed * 0.72) * 0.22;
    const roomMode = Math.sin(y * 14 + params.time * 1.4) * turbulence * 0.18;
    return clamp((wave + reflected + roomMode) * envelope * strength, -1, 1);
  }

  const streamX = clamp((x + 0.92) / 1.86, 0, 1);
  const active = smoothstep(-0.94, -0.78, x);
  const centerline =
    -0.18 +
    Math.sin(streamX * 6.0 - params.time * (1.4 + params.flow * 3.4)) *
      (0.08 + turbulence * 0.08);
  const spread = 0.025 + streamX * (0.18 + params.flow * 0.16);
  const jet =
    gaussian(y - centerline, spread) *
    Math.exp(-streamX * (1.05 - params.flow * 0.35)) *
    active;
  const pockets =
    (pseudoNoise(
      Math.floor((x + params.time * 0.15) * 18),
      Math.floor(y * 22),
      params.time,
    ) -
      0.5) *
    0.22;
  return clamp((jet + pockets * jet * turbulence) * strength, -1, 1);
}

export function densityToByte(value: number) {
  return Math.round((clamp(value, -1, 1) * 0.5 + 0.5) * 255);
}

export class CpuDensitySolver implements DensitySolver {
  readonly kind = "cpu";
  readonly width: number;
  readonly height: number;
  private readonly field: Float32Array;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.field = new Float32Array(width * height);
  }

  async step(params: SimulationParams) {
    for (let y = 0; y < this.height; y += 1) {
      const ny = (y / (this.height - 1)) * 2 - 1;
      for (let x = 0; x < this.width; x += 1) {
        const nx = (x / (this.width - 1)) * 2 - 1;
        this.field[y * this.width + x] = computeDensityAt(nx, ny, params);
      }
    }
    return this.field;
  }

  dispose() {
    this.field.fill(0);
  }
}
