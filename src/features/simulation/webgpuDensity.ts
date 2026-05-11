import { CpuDensitySolver, scenarioIndex } from "./densityField";
import type { DensitySolver, SimulationParams } from "./types";

const shader = `
struct Params {
  time: f32,
  dt: f32,
  width: f32,
  height: f32,
  scenario: f32,
  strength: f32,
  frequency: f32,
  flow: f32,
  audioLevel: f32,
  turbulence: f32,
  pad0: f32,
  pad1: f32,
}

@group(0) @binding(0) var<storage, read_write> density: array<f32>;
@group(0) @binding(1) var<uniform> params: Params;

fn saturate(v: f32) -> f32 {
  return clamp(v, 0.0, 1.0);
}

fn gaussian(value: f32, width: f32) -> f32 {
  return exp(-(value * value) / max(width * width, 0.0001));
}

fn hash2(x: f32, y: f32, t: f32) -> f32 {
  return fract(sin(x * 12.9898 + y * 78.233 + t * 4.719) * 43758.5453);
}

fn fieldAt(pos: vec2<f32>) -> f32 {
  let x = pos.x;
  let y = pos.y;
  let audioLift = saturate(params.audioLevel);
  let strength = params.strength * (0.7 + audioLift * 0.6);
  let turbulence = params.turbulence;

  if (params.scenario < 0.5) {
    let vertical = smoothstep(-0.88, 0.9, y);
    let plumeMask = smoothstep(-0.95, -0.78, y);
    let curl = sin(y * 8.3 + params.time * 1.8) * 0.1 * vertical;
    let center = curl + sin(params.time * 1.2 + y * 3.0) * audioLift * 0.035;
    let spread = 0.035 + vertical * (0.2 + params.flow * 0.14);
    let core = gaussian(x - center, spread) * exp(-vertical * 0.58) * plumeMask;
    let shimmer = sin(x * 28.0 + y * 14.0 - params.time * 4.1) * sin(y * 13.0 + params.time * 2.2) * turbulence * 0.18;
    return clamp((core + shimmer * core) * strength, -1.0, 1.0);
  }

  if (params.scenario < 1.5) {
    let r = length(pos);
    let speed = 4.2 + params.frequency * 8.5;
    let envelope = exp(-r * (1.25 + (1.0 - params.flow) * 0.8));
    let wave = sin(r * 42.0 - params.time * speed);
    let reflected = sin((x + 1.0) * 18.0 - params.time * speed * 0.72) * 0.22;
    let roomMode = sin(y * 14.0 + params.time * 1.4) * turbulence * 0.18;
    return clamp((wave + reflected + roomMode) * envelope * strength, -1.0, 1.0);
  }

  if (params.scenario < 2.5) {
    let streamX = saturate((x + 0.92) / 1.86);
    let active = smoothstep(-0.94, -0.78, x);
    let centerline = -0.18 + sin(streamX * 6.0 - params.time * (1.4 + params.flow * 3.4)) * (0.08 + turbulence * 0.08);
    let spread = 0.025 + streamX * (0.18 + params.flow * 0.16);
    let jet = gaussian(y - centerline, spread) * exp(-streamX * (1.05 - params.flow * 0.35)) * active;
    let pockets = (hash2(floor((x + params.time * 0.15) * 18.0), floor(y * 22.0), params.time) - 0.5) * 0.22;
    return clamp((jet + pockets * jet * turbulence) * strength, -1.0, 1.0);
  }

  if (params.scenario < 3.5) {
    // Shock: Mach cone tracking a moving tip.
    let machNumber = 1.2 + params.frequency * 2.8;
    let machAngle = asin(min(0.999, 1.0 / machNumber));
    let tipX = -0.85 + ((params.time * (0.35 + params.flow * 0.55)) - floor((params.time * (0.35 + params.flow * 0.55)) / 1.7) * 1.7);
    let dx = x - tipX;
    if (dx > 0.0) {
      let wake = gaussian(y, 0.05 + dx * 0.22) * exp(-dx * 1.7);
      let shimmer = sin(x * 28.0 + params.time * 5.2) * cos(y * 12.0 + params.time * 3.1) * turbulence * 0.4 * exp(-dx * 1.2);
      return clamp((-wake + shimmer) * strength * 0.9, -1.0, 1.0);
    }
    let radial = abs(y);
    let expectedRadial = -dx * tan(machAngle);
    let shockJump = gaussian(radial - expectedRadial, 0.025 + turbulence * 0.02);
    let muzzleFlash = gaussian(dx, 0.06) * gaussian(radial, 0.04) * 0.8;
    return clamp((shockJump * 1.3 + muzzleFlash) * strength, -1.0, 1.0);
  }

  if (params.scenario < 4.5) {
    // Breath: pulsed warm humid jet emerging from a fixed source.
    let phasePeriod = 0.4 + params.frequency * 1.4;
    let phase = (params.time * phasePeriod) - floor(params.time * phasePeriod);
    let breathStrength = max(0.0, sin(phase * 3.14159265));
    let sourceX = -0.78;
    let sourceY = 0.12;
    let advanceX = (x - sourceX) - phase * (0.45 + params.flow * 0.85);
    let rise = -(y - sourceY) - phase * 0.18;
    let jetCore = gaussian(advanceX, 0.06 + phase * 0.32) * gaussian(rise, 0.05 + phase * 0.22) * breathStrength;
    let swirl = sin((x - sourceX) * 14.0 - params.time * 3.4) * cos((y - sourceY) * 11.0 + params.time * 2.7) * turbulence * 0.35 * jetCore;
    let ambient = (audioLift * 0.15 + breathStrength * 0.05) * gaussian(x - sourceX, 0.18) * gaussian(y - sourceY, 0.14);
    return clamp((jetCore + swirl + ambient) * strength, -1.0, 1.0);
  }

  // Convection: counter-rotating Rayleigh–Bénard cells above a hot plate.
  let wavelength = 0.45 + (1.0 - params.flow) * 0.55;
  let cellsX = 6.28318530718 / max(0.1, wavelength);
  let lift = 1.0 - smoothstep(-0.95, 0.95, y);
  let rolls = sin(x * cellsX + params.time * 0.6) * cos(y * cellsX * 0.7 + params.time * 0.4) * lift;
  let wobble = sin(x * cellsX * 3.1 - params.time * 1.9) * turbulence * 0.25 * lift;
  let floorHeat = gaussian(y - 0.85, 0.12) * 0.4;
  return clamp((rolls + wobble + floorHeat) * strength, -1.0, 1.0);
}

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
  let width = u32(params.width);
  let height = u32(params.height);
  if (id.x >= width || id.y >= height) {
    return;
  }

  let uv = vec2<f32>(f32(id.x) / f32(width - 1u), f32(id.y) / f32(height - 1u));
  let pos = uv * 2.0 - vec2<f32>(1.0, 1.0);
  let index = id.y * width + id.x;
  density[index] = fieldAt(pos);
}
`;

class WebGpuDensitySolver implements DensitySolver {
  readonly kind = "webgpu";
  readonly width: number;
  readonly height: number;
  private readonly device: GPUDevice;
  private readonly pipeline: GPUComputePipeline;
  private readonly densityBuffer: GPUBuffer;
  private readonly paramsBuffer: GPUBuffer;
  private readonly readBuffer: GPUBuffer;
  private readonly bindGroup: GPUBindGroup;
  private readonly output: Float32Array;

  constructor(device: GPUDevice, width: number, height: number) {
    this.device = device;
    this.width = width;
    this.height = height;
    this.output = new Float32Array(width * height);

    const byteLength = this.output.byteLength;
    this.densityBuffer = device.createBuffer({
      size: byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
    });
    this.paramsBuffer = device.createBuffer({
      size: 12 * Float32Array.BYTES_PER_ELEMENT,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.readBuffer = device.createBuffer({
      size: byteLength,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
    });

    this.pipeline = device.createComputePipeline({
      layout: "auto",
      compute: {
        module: device.createShaderModule({ code: shader }),
        entryPoint: "main",
      },
    });

    this.bindGroup = device.createBindGroup({
      layout: this.pipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: this.densityBuffer } },
        { binding: 1, resource: { buffer: this.paramsBuffer } },
      ],
    });
  }

  async step(params: SimulationParams) {
    const packed = new Float32Array([
      params.time,
      params.dt,
      this.width,
      this.height,
      scenarioIndex[params.scenario],
      params.strength,
      params.frequency,
      params.flow,
      params.audioLevel,
      params.turbulence,
      0,
      0,
    ]);

    this.device.queue.writeBuffer(this.paramsBuffer, 0, packed);

    const encoder = this.device.createCommandEncoder();
    const pass = encoder.beginComputePass();
    pass.setPipeline(this.pipeline);
    pass.setBindGroup(0, this.bindGroup);
    pass.dispatchWorkgroups(
      Math.ceil(this.width / 8),
      Math.ceil(this.height / 8),
    );
    pass.end();
    encoder.copyBufferToBuffer(
      this.densityBuffer,
      0,
      this.readBuffer,
      0,
      this.output.byteLength,
    );
    this.device.queue.submit([encoder.finish()]);

    await this.readBuffer.mapAsync(GPUMapMode.READ);
    this.output.set(new Float32Array(this.readBuffer.getMappedRange()));
    this.readBuffer.unmap();
    return this.output;
  }

  dispose() {
    this.densityBuffer.destroy();
    this.paramsBuffer.destroy();
    this.readBuffer.destroy();
    this.device.destroy();
  }
}

export async function createDensitySolver(
  width: number,
  height: number,
): Promise<{ solver: DensitySolver; message: string }> {
  if (!navigator.gpu) {
    return {
      solver: new CpuDensitySolver(width, height),
      message: "WebGPU unavailable; CPU field solver active.",
    };
  }

  try {
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
      return {
        solver: new CpuDensitySolver(width, height),
        message: "WebGPU adapter unavailable; CPU field solver active.",
      };
    }

    const device = await adapter.requestDevice();
    return {
      solver: new WebGpuDensitySolver(device, width, height),
      message: "WebGPU compute shader active.",
    };
  } catch (error) {
    return {
      solver: new CpuDensitySolver(width, height),
      message:
        error instanceof Error
          ? `WebGPU fallback: ${error.message}`
          : "WebGPU fallback active.",
    };
  }
}
