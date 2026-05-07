import { describe, expect, it } from "vitest";
import { defaultSentence } from "./referenceData";
import { scoreRecording } from "./scoring";

describe("scoreRecording", () => {
  it("scores a matching vowel target highly", () => {
    const frames = [
      { time: 0.25, f1: 305, f2: 2290, rms: 0.1 },
      { time: 1.15, f1: 425, f2: 1910, rms: 0.1 },
    ];

    const result = scoreRecording(defaultSentence, frames, 1.4);

    expect(result.overallScore).toBeGreaterThan(95);
    expect(result.phonemes[0].status).toBe("good");
  });

  it("flags distant formants for drilling", () => {
    const frames = [
      { time: 0.25, f1: 820, f2: 1050, rms: 0.1 },
      { time: 1.15, f1: 850, f2: 900, rms: 0.1 },
    ];

    const result = scoreRecording(defaultSentence, frames, 1.4);

    expect(result.overallScore).toBeLessThan(50);
    expect(result.phonemes.some((phoneme) => phoneme.status === "drill")).toBe(
      true,
    );
  });
});
