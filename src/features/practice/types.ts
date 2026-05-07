export type LanguageCode = 'en' | 'es' | 'it'

export type ReferencePhoneme = {
  id: string
  label: string
  ipa: string
  kind: 'vowel' | 'consonant'
  start: number
  end: number
  target?: {
    f1: number
    f2: number
    tolerance: number
  }
  cue: string
}

export type PracticeSentence = {
  id: string
  language: LanguageCode
  title: string
  text: string
  nativeAccent: string
  focus: string[]
  phonemes: ReferencePhoneme[]
}

export type FormantFrame = {
  time: number
  f1: number
  f2: number
  rms: number
}

export type PhonemeScore = {
  phoneme: ReferencePhoneme
  userF1?: number
  userF2?: number
  score: number
  deltaF1?: number
  deltaF2?: number
  status: 'good' | 'watch' | 'drill'
  feedback: string
}

export type AnalysisResult = {
  sentenceId: string
  createdAt: string
  duration: number
  overallScore: number
  frames: FormantFrame[]
  phonemes: PhonemeScore[]
}
