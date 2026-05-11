import type { DensitySolver, ScenarioId, SimulationParams } from "./types";

export const scenarioIndex: Record<ScenarioId, number> = {
  heat: 0,
  sound: 1,
  gas: 2,
  shock: 3,
  breath: 4,
  convection: 5,
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

  if (params.scenario === "shock") {
    // A supersonic projectile travels along y ≈ 0 and the bow shock follows
    // it as a Mach cone. Cone half-angle μ = arcsin(1/M). With M tied to the
    // frequency slider the user can see the cone tighten as Mach number
    // climbs. We render the leading shock as a thin compression jump and
    // trail a turbulent wake behind the projectile.
    const machNumber = 1.2 + params.frequency * 2.8;
    const machAngle = Math.asin(Math.min(0.999, 1 / machNumber));
    const tipX = -0.85 + ((params.time * (0.35 + params.flow * 0.55)) % 1.7);
    const dx = x - tipX;
    if (dx > 0) {
      // Body and wake behind the projectile: turbulent expansion fan.
      const wake = gaussian(y, 0.05 + dx * 0.22) * Math.exp(-dx * 1.7);
      const shimmer =
        Math.sin(x * 28 + params.time * 5.2) *
        Math.cos(y * 12 + params.time * 3.1) *
        turbulence *
        0.4 *
        Math.exp(-dx * 1.2);
      return clamp((-wake + shimmer) * strength * 0.9, -1, 1);
    }
    // In front of and beside the tip: the leading shock as a thin V-shape.
    const radial = Math.abs(y);
    const expectedRadial = -dx * Math.tan(machAngle);
    const shockJump = gaussian(
      radial - expectedRadial,
      0.025 + turbulence * 0.02,
    );
    const muzzleFlash = gaussian(dx, 0.06) * gaussian(radial, 0.04) * 0.8;
    return clamp((shockJump * 1.3 + muzzleFlash) * strength, -1, 1);
  }

  if (params.scenario === "breath") {
    // Exhalation: a warm humid jet emerging from x≈-0.8, drifting right and
    // up under buoyancy. Frequency drives the breath-rate; flow controls
    // forward speed; turbulence controls eddy strength.
    const phase = (params.time * (0.4 + params.frequency * 1.4)) % 1.0;
    const breathStrength = Math.max(0, Math.sin(phase * Math.PI));
    const sourceX = -0.78;
    const sourceY = 0.12;
    const advanceX = x - sourceX - phase * (0.45 + params.flow * 0.85);
    const rise = -(y - sourceY) - phase * 0.18;
    const jetCore =
      gaussian(advanceX, 0.06 + phase * 0.32) *
      gaussian(rise, 0.05 + phase * 0.22) *
      breathStrength;
    const swirl =
      Math.sin((x - sourceX) * 14 - params.time * 3.4) *
      Math.cos((y - sourceY) * 11 + params.time * 2.7) *
      turbulence *
      0.35 *
      jetCore;
    const ambient =
      (audioLift * 0.15 + breathStrength * 0.05) *
      gaussian(x - sourceX, 0.18) *
      gaussian(y - sourceY, 0.14);
    return clamp((jetCore + swirl + ambient) * strength, -1, 1);
  }

  if (params.scenario === "convection") {
    // Rayleigh–Bénard convection over a heated plate: a stack of counter-
    // rotating rolls. We pick the roll wavelength from the flow slider
    // (higher flow = wider rolls) and use turbulence to perturb each cell.
    const wavelength = 0.45 + (1 - params.flow) * 0.55;
    const cellsX = (Math.PI * 2) / Math.max(0.1, wavelength);
    const lift = 1 - smoothstep(-0.95, 0.95, y);
    const rolls =
      Math.sin(x * cellsX + params.time * 0.6) *
      Math.cos(y * cellsX * 0.7 + params.time * 0.4) *
      lift;
    const wobble =
      Math.sin(x * cellsX * 3.1 - params.time * 1.9) * turbulence * 0.25 * lift;
    const floorHeat = gaussian(y - 0.85, 0.12) * 0.4;
    return clamp((rolls + wobble + floorHeat) * strength, -1, 1);
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
