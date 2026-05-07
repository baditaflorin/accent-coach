import { useRef, useState } from "react";

type RecorderState = "idle" | "recording" | "ready" | "error";

export function useRecorder() {
  const [state, setState] = useState<RecorderState>("idle");
  const [error, setError] = useState<string>();
  const [audioBlob, setAudioBlob] = useState<Blob>();
  const recorderRef = useRef<MediaRecorder>(undefined);
  const chunksRef = useRef<Blob[]>([]);

  async function start() {
    setError(undefined);
    setAudioBlob(undefined);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        setAudioBlob(
          new Blob(chunksRef.current, {
            type: recorder.mimeType || "audio/webm",
          }),
        );
        setState("ready");
      };
      recorder.start();
      setState("recording");
    } catch {
      setError(
        "Microphone permission is needed to analyze pronunciation locally.",
      );
      setState("error");
    }
  }

  function stop() {
    recorderRef.current?.stop();
  }

  function reset() {
    setAudioBlob(undefined);
    setError(undefined);
    setState("idle");
  }

  return { state, error, audioBlob, start, stop, reset };
}
