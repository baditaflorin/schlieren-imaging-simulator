export type ScenarioId =
  | "heat"
  | "sound"
  | "gas"
  | "shock"
  | "breath"
  | "convection";

export type SolverKind = "webgpu" | "cpu";

export interface SimulationSettings {
  scenario: ScenarioId;
  running: boolean;
  strength: number;
  frequency: number;
  flow: number;
  turbulence: number;
  knifeEdge: number;
  contrast: number;
}

export interface SimulationParams {
  time: number;
  dt: number;
  scenario: ScenarioId;
  strength: number;
  frequency: number;
  flow: number;
  turbulence: number;
  audioLevel: number;
}

export interface DensitySolver {
  kind: SolverKind;
  width: number;
  height: number;
  step(params: SimulationParams): Promise<Float32Array>;
  dispose(): void;
}

export interface SolverTelemetry {
  solverKind: SolverKind;
  fps: number;
  grid: string;
  webgpuMessage: string;
}
