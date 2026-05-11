import type { ScenarioId, SimulationSettings } from "./types";

export interface ScenarioPreset {
  id: ScenarioId;
  label: string;
  sourceLabel: string;
  reading: string;
}

export const scenarioPresets: ScenarioPreset[] = [
  {
    id: "heat",
    label: "Heat plume",
    sourceLabel: "Candle heat",
    reading: "Buoyant plume",
  },
  {
    id: "sound",
    label: "Sound wave",
    sourceLabel: "Speaker pulse",
    reading: "Pressure fronts",
  },
  {
    id: "gas",
    label: "Gas leak",
    sourceLabel: "Nozzle leak",
    reading: "Jet diffusion",
  },
  {
    id: "shock",
    label: "Mach shockwave",
    sourceLabel: "Supersonic projectile",
    reading: "Conical shock + wake",
  },
  {
    id: "breath",
    label: "Exhaled breath",
    sourceLabel: "Mouth puff",
    reading: "Warm humid jet",
  },
  {
    id: "convection",
    label: "Rayleigh–Bénard cells",
    sourceLabel: "Heated plate",
    reading: "Stacked convection rolls",
  },
];

export const defaultSettings: SimulationSettings = {
  scenario: "heat",
  running: true,
  strength: 0.76,
  frequency: 0.48,
  flow: 0.56,
  turbulence: 0.34,
  knifeEdge: 0.58,
  contrast: 0.72,
};
