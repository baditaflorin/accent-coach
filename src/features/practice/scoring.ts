import type { AnalysisResult, FormantFrame, PhonemeScore, PracticeSentence, ReferencePhoneme } from './types'

export function scoreRecording(sentence: PracticeSentence, frames: FormantFrame[], duration: number): AnalysisResult {
  const phonemes = sentence.phonemes.map((phoneme) => scorePhoneme(phoneme, frames, duration))
  const scored = phonemes.filter((item) => Number.isFinite(item.score))
  const overallScore = Math.round(scored.reduce((sum, item) => sum + item.score, 0) / Math.max(scored.length, 1))

  return {
    sentenceId: sentence.id,
    createdAt: new Date().toISOString(),
    duration,
    overallScore,
    frames,
    phonemes,
  }
}

export function scorePhoneme(phoneme: ReferencePhoneme, frames: FormantFrame[], duration: number): PhonemeScore {
  if (!phoneme.target) {
    return { phoneme, score: 100, status: 'good', feedback: phoneme.cue }
  }

  const start = phoneme.start * duration
  const end = phoneme.end * duration
  const selected = frames.filter((frame) => frame.time >= start && frame.time <= end)
  const usable = selected.length > 0 ? selected : nearestFrames(frames, (start + end) / 2)
  const userF1 = average(usable.map((frame) => frame.f1))
  const userF2 = average(usable.map((frame) => frame.f2))

  if (!userF1 || !userF2) {
    return {
      phoneme,
      score: 0,
      status: 'drill',
      feedback: 'I could not isolate a voiced vowel there. Try holding that sound a little more clearly.',
    }
  }

  const deltaF1 = Math.round(userF1 - phoneme.target.f1)
  const deltaF2 = Math.round(userF2 - phoneme.target.f2)
  const distance = Math.hypot(deltaF1, deltaF2)
  const score = Math.max(0, Math.round(100 - (distance / phoneme.target.tolerance) * 55))
  const status = score >= 82 ? 'good' : score >= 62 ? 'watch' : 'drill'

  return {
    phoneme,
    userF1: Math.round(userF1),
    userF2: Math.round(userF2),
    score,
    deltaF1,
    deltaF2,
    status,
    feedback: makeFeedback(phoneme, deltaF1, deltaF2, status),
  }
}

function nearestFrames(frames: FormantFrame[], time: number): FormantFrame[] {
  return [...frames].sort((a, b) => Math.abs(a.time - time) - Math.abs(b.time - time)).slice(0, 3)
}

function average(values: number[]): number | undefined {
  if (values.length === 0) return undefined
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function makeFeedback(phoneme: ReferencePhoneme, deltaF1: number, deltaF2: number, status: PhonemeScore['status']): string {
  if (status === 'good') return `Nice: /${phoneme.ipa}/ is landing close to the reference. ${phoneme.cue}`

  const f1Cue = Math.abs(deltaF1) < 90 ? '' : deltaF1 > 0 ? 'raise the tongue or close the jaw slightly' : 'lower the tongue or open the jaw slightly'
  const f2Cue =
    Math.abs(deltaF2) < 140 ? '' : deltaF2 > 0 ? 'pull the tongue a bit back' : 'move the tongue more forward'
  const cues = [f1Cue, f2Cue].filter(Boolean).join('; ')

  return `For /${phoneme.ipa}/ in "${phoneme.label}", ${cues || 'stabilize the vowel target'}. ${phoneme.cue}`
}
