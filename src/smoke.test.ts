import { describe, expect, it } from "vitest";

describe("project scaffold", () => {
  it("runs the baseline test suite", () => {
    expect("schlieren-imaging-simulator").toContain("schlieren");
  });
});
