import { analyzeFormants } from "./audio/formants";

type AnalyzeMessage = {
  samples: Float32Array;
  sampleRate: number;
};

self.onmessage = (event: MessageEvent<AnalyzeMessage>) => {
  const frames = analyzeFormants(event.data.samples, event.data.sampleRate);
  self.postMessage({ frames });
};
