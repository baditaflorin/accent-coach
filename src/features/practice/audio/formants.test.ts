import { describe, expect, it } from "vitest";
import { analyzeFormants, calculateRms } from "./formants";

describe("calculateRms", () => {
  it("returns root mean square energy", () => {
    expect(calculateRms(new Float32Array([1, -1, 1, -1]))).toBe(1);
  });
});

describe("analyzeFormants", () => {
  it("returns no frames for silence without hanging", () => {
    const samples = new Float32Array(44100 * 2);
    expect(analyzeFormants(samples, 44100)).toEqual([]);
  });

  it("returns no frames for an empty buffer", () => {
    expect(analyzeFormants(new Float32Array(0), 44100)).toEqual([]);
  });

  it("returns immediately instead of looping forever for a zero sample rate", () => {
    const samples = new Float32Array(1000).fill(0.2);
    expect(analyzeFormants(samples, 0)).toEqual([]);
  });

  it("returns immediately instead of looping forever for a negative sample rate", () => {
    const samples = new Float32Array(1000).fill(0.2);
    expect(analyzeFormants(samples, -44100)).toEqual([]);
  });

  it("does not hang for a non-finite sample rate", () => {
    const samples = new Float32Array(1000).fill(0.2);
    expect(analyzeFormants(samples, NaN)).toEqual([]);
    expect(analyzeFormants(samples, Infinity)).toEqual([]);
  });

  it("terminates for a very low but valid sample rate instead of looping forever", () => {
    const samples = new Float32Array(2000).fill(0.2);
    // Below this rate, sampleRate * 0.016 would round to 0 and the analysis
    // loop's offset would never advance without the hopSize clamp.
    expect(() => analyzeFormants(samples, 10)).not.toThrow();
  });
});
