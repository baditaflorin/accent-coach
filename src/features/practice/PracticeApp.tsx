import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  Mic,
  RotateCcw,
  Square,
  Target,
  Volume2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { decodeAudioFile, extractMono } from "./audio/formants";
import AnalysisWorker from "./audioWorker?worker";
import { FormantChart } from "./FormantChart";
import { defaultSentence, practiceSentences } from "./referenceData";
import { scoreRecording } from "./scoring";
import { listSessions, saveSession } from "./storage";
import type {
  AnalysisResult,
  FormantFrame,
  PhonemeScore,
  ReferencePhoneme,
} from "./types";
import { useRecorder } from "./useRecorder";

export function PracticeApp() {
  const [sentenceId, setSentenceId] = useState(defaultSentence.id);
  const sentence = useMemo(
    () =>
      practiceSentences.find((item) => item.id === sentenceId) ??
      defaultSentence,
    [sentenceId],
  );
  const recorder = useRecorder();
  const queryClient = useQueryClient();
  const sessions = useQuery({ queryKey: ["sessions"], queryFn: listSessions });
  const [currentResult, setCurrentResult] = useState<AnalysisResult>();
  const feedbackItems: Array<PhonemeScore | { phoneme: ReferencePhoneme }> =
    currentResult?.phonemes ??
    sentence.phonemes.map((phoneme) => ({ phoneme }));

  const analysis = useMutation({
    mutationFn: async (blob: Blob) => {
      const audioBuffer = await decodeAudioFile(blob);
      const samples = extractMono(audioBuffer);
      const frames = await analyzeInWorker(samples, audioBuffer.sampleRate);
      return scoreRecording(sentence, frames, audioBuffer.duration);
    },
    onSuccess: async (result) => {
      setCurrentResult(result);
      await saveSession(result);
      await queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });

  async function analyze() {
    if (recorder.audioBlob) await analysis.mutateAsync(recorder.audioBlob);
  }

  return (
    <main className="shell">
      <section className="workspace" aria-labelledby="app-title">
        <div className="masthead">
          <div>
            <p className="eyebrow">Local speech lab</p>
            <h1 id="app-title">Accent Coach</h1>
            <p className="lede">
              Record a target sentence and compare your vowel formants against
              native reference targets.
            </p>
          </div>
          <div className="privacy-pill">
            No uploads. No accounts. Browser only.
          </div>
        </div>

        <div className="practice-grid">
          <section
            className="panel recording-panel"
            aria-labelledby="sentence-heading"
          >
            <div className="section-header">
              <Target aria-hidden="true" />
              <h2 id="sentence-heading">Practice sentence</h2>
            </div>
            <label className="field-label" htmlFor="sentence">
              Target
            </label>
            <select
              id="sentence"
              value={sentence.id}
              onChange={(event) => setSentenceId(event.target.value)}
            >
              {practiceSentences.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title} · {item.nativeAccent}
                </option>
              ))}
            </select>
            <blockquote>{sentence.text}</blockquote>
            <div className="focus-row">
              {sentence.focus.map((focus) => (
                <span key={focus}>/{focus}/</span>
              ))}
            </div>
            <div className="controls">
              {recorder.state !== "recording" ? (
                <button
                  type="button"
                  className="primary"
                  onClick={recorder.start}
                >
                  <Mic aria-hidden="true" />
                  Record
                </button>
              ) : (
                <button
                  type="button"
                  className="danger"
                  onClick={recorder.stop}
                >
                  <Square aria-hidden="true" />
                  Stop
                </button>
              )}
              <button
                type="button"
                onClick={analyze}
                disabled={!recorder.audioBlob || analysis.isPending}
              >
                <Activity aria-hidden="true" />
                {analysis.isPending ? "Analyzing" : "Analyze"}
              </button>
              <button type="button" onClick={recorder.reset}>
                <RotateCcw aria-hidden="true" />
                Reset
              </button>
            </div>
            {recorder.error ? <p className="error">{recorder.error}</p> : null}
            {analysis.error ? (
              <p className="error">
                Analysis failed. Try a shorter, clearer recording.
              </p>
            ) : null}
            {recorder.audioBlob ? (
              <audio controls src={URL.createObjectURL(recorder.audioBlob)} />
            ) : null}
          </section>

          <section
            className="panel score-panel"
            aria-labelledby="score-heading"
          >
            <div className="section-header">
              <Volume2 aria-hidden="true" />
              <h2 id="score-heading">Phoneme feedback</h2>
            </div>
            <div className="score">
              <span>{currentResult?.overallScore ?? "--"}</span>
              <small>overall</small>
            </div>
            <div className="phoneme-list">
              {feedbackItems.map((item) => (
                <article
                  key={item.phoneme.id}
                  className={`phoneme ${"status" in item ? item.status : ""}`}
                >
                  <div>
                    <strong>/{item.phoneme.ipa}/</strong>
                    <span>{item.phoneme.label}</span>
                  </div>
                  {"score" in item ? <b>{item.score}</b> : <b>ready</b>}
                  <p>{"feedback" in item ? item.feedback : item.phoneme.cue}</p>
                  {"userF1" in item && item.userF1 ? (
                    <small>
                      You: F1 {item.userF1} Hz · F2 {item.userF2} Hz
                    </small>
                  ) : null}
                </article>
              ))}
            </div>
          </section>
        </div>

        <section className="panel chart-panel" aria-labelledby="chart-heading">
          <div className="section-header">
            <Activity aria-hidden="true" />
            <h2 id="chart-heading">Formant map</h2>
          </div>
          <FormantChart result={currentResult} sentence={sentence} />
        </section>

        <section className="history" aria-labelledby="history-heading">
          <h2 id="history-heading">Recent local sessions</h2>
          <div className="history-list">
            {(sessions.data ?? []).map((session) => (
              <button
                key={session.createdAt}
                type="button"
                onClick={() => setCurrentResult(session)}
              >
                <span>{new Date(session.createdAt).toLocaleString()}</span>
                <b>{session.overallScore}</b>
              </button>
            ))}
            {sessions.data?.length === 0 ? <p>No saved sessions yet.</p> : null}
          </div>
        </section>
      </section>
    </main>
  );
}

async function analyzeInWorker(
  samples: Float32Array,
  sampleRate: number,
): Promise<FormantFrame[]> {
  const worker = new AnalysisWorker();
  try {
    return await new Promise((resolve, reject) => {
      worker.onmessage = (event: MessageEvent<{ frames: FormantFrame[] }>) =>
        resolve(event.data.frames);
      worker.onerror = () => reject(new Error("worker analysis failed"));
      worker.postMessage({ samples, sampleRate }, [samples.buffer]);
    });
  } finally {
    worker.terminate();
  }
}
