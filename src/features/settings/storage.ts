import { z } from "zod";
import { defaultSettings } from "../simulation/presets";
import type { SimulationSettings } from "../simulation/types";

const key = "schlieren-settings-v1";

const settingsSchema = z.object({
  scenario: z.enum(["heat", "sound", "gas"]),
  running: z.boolean(),
  strength: z.number().min(0).max(1),
  frequency: z.number().min(0).max(1),
  flow: z.number().min(0).max(1),
  turbulence: z.number().min(0).max(1),
  knifeEdge: z.number().min(0).max(1),
  contrast: z.number().min(0).max(1),
});

export function loadSettings(): SimulationSettings {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return defaultSettings;
    }
    return settingsSchema.parse(JSON.parse(raw));
  } catch {
    return defaultSettings;
  }
}

export function saveSettings(settings: SimulationSettings) {
  try {
    localStorage.setItem(key, JSON.stringify(settings));
  } catch {
    // Storage may be unavailable in private contexts; the simulator still runs.
  }
}
