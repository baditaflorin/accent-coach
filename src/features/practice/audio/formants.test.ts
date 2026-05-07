import { describe, expect, it } from "vitest";
import { calculateRms } from "./formants";

describe("calculateRms", () => {
  it("returns root mean square energy", () => {
    expect(calculateRms(new Float32Array([1, -1, 1, -1]))).toBe(1);
  });
});
