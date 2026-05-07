import { describe, expect, it } from "vitest";
import {
  CpuDensitySolver,
  computeDensityAt,
  densityToByte,
} from "./densityField";
import type { SimulationParams } from "./types";

const baseParams: SimulationParams = {
  time: 1.2,
  dt: 1 / 60,
  scenario: "heat",
  strength: 0.8,
  frequency: 0.5,
  flow: 0.5,
  turbulence: 0.25,
  audioLevel: 0.2,
};

describe("density field", () => {
  it("keeps generated density values inside the normalized range", () => {
    for (const scenario of ["heat", "sound", "gas"] as const) {
      const value = computeDensityAt(0.12, -0.2, { ...baseParams, scenario });
      expect(value).toBeGreaterThanOrEqual(-1);
      expect(value).toBeLessThanOrEqual(1);
    }
  });

  it("maps normalized density into texture bytes", () => {
    expect(densityToByte(-1)).toBe(0);
    expect(densityToByte(0)).toBe(128);
    expect(densityToByte(1)).toBe(255);
  });

  it("fills a CPU fallback grid", async () => {
    const solver = new CpuDensitySolver(12, 8);
    const field = await solver.step(baseParams);
    expect(field).toHaveLength(96);
    expect(Math.max(...field)).toBeGreaterThan(0.01);
    solver.dispose();
  });
});
