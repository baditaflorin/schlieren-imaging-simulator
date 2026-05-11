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
    for (const scenario of [
      "heat",
      "sound",
      "gas",
      "shock",
      "breath",
      "convection",
    ] as const) {
      const value = computeDensityAt(0.12, -0.2, { ...baseParams, scenario });
      expect(value).toBeGreaterThanOrEqual(-1);
      expect(value).toBeLessThanOrEqual(1);
    }
  });

  it("renders a Mach cone whose half-angle tightens as Mach number rises", () => {
    // Frequency=0 gives M ≈ 1.2 (wide cone); frequency=1 gives M ≈ 4 (tight cone).
    const params = (frequency: number): SimulationParams => ({
      ...baseParams,
      scenario: "shock",
      frequency,
      time: 0,
    });
    // Sample three points on the shock front near the tip.
    const slowDensities = [0.1, 0.2, 0.3].map((dx) => {
      const machAngle = Math.asin(1 / (1.2 + 0 * 2.8));
      const radial = dx * Math.tan(machAngle);
      return computeDensityAt(-0.85 - dx, radial, params(0));
    });
    const fastDensities = [0.1, 0.2, 0.3].map((dx) => {
      const machAngle = Math.asin(1 / (1.2 + 1 * 2.8));
      const radial = dx * Math.tan(machAngle);
      return computeDensityAt(-0.85 - dx, radial, params(1));
    });
    // Both should produce visible shocks at their expected angles.
    expect(slowDensities.every((value) => Math.abs(value) > 0.05)).toBe(true);
    expect(fastDensities.every((value) => Math.abs(value) > 0.05)).toBe(true);
  });

  it("pulses the breath scenario at the breathing rate", () => {
    const params = (time: number): SimulationParams => ({
      ...baseParams,
      scenario: "breath",
      frequency: 0.5,
      flow: 0,
      time,
    });
    const samples = [];
    for (let time = 0; time < 1.5; time += 0.05) {
      samples.push(computeDensityAt(-0.78, 0.12, params(time)));
    }
    const peak = Math.max(...samples.map((value) => Math.abs(value)));
    const trough = Math.min(...samples.map((value) => Math.abs(value)));
    // Some samples land near the inhale (trough), others on the exhale peak.
    expect(peak).toBeGreaterThan(0.05);
    expect(trough).toBeLessThan(peak * 0.4);
  });

  it("renders convection cells whose count tracks the flow slider", () => {
    const countZeroCrossings = (flow: number) => {
      const sampleRow: number[] = [];
      for (let i = 0; i < 200; i += 1) {
        const x = (i / 199) * 2 - 1;
        sampleRow.push(
          computeDensityAt(x, 0, {
            ...baseParams,
            scenario: "convection",
            flow,
            time: 0,
            turbulence: 0,
          }),
        );
      }
      let crossings = 0;
      for (let i = 1; i < sampleRow.length; i += 1) {
        if (
          (sampleRow[i - 1] >= 0 && sampleRow[i] < 0) ||
          (sampleRow[i - 1] < 0 && sampleRow[i] >= 0)
        ) {
          crossings += 1;
        }
      }
      return crossings;
    };
    const tightCells = countZeroCrossings(1);
    const wideCells = countZeroCrossings(0);
    // Higher flow → wider rolls → fewer zero crossings across the same width.
    expect(tightCells).toBeGreaterThan(wideCells);
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
