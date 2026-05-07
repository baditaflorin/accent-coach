import type { AnalysisResult, PracticeSentence } from './types'

type Props = {
  result?: AnalysisResult
  sentence: PracticeSentence
}

const WIDTH = 680
const HEIGHT = 360
const PADDING = 42

export function FormantChart({ result, sentence }: Props) {
  const frames = result?.frames ?? []
  const vowels = sentence.phonemes.filter((phoneme) => phoneme.target)
  const x = (f2: number) => WIDTH - PADDING - ((f2 - 500) / 2500) * (WIDTH - PADDING * 2)
  const y = (f1: number) => PADDING + ((f1 - 200) / 800) * (HEIGHT - PADDING * 2)

  return (
    <svg className="formant-chart" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="F1 F2 formant chart">
      <rect x="0" y="0" width={WIDTH} height={HEIGHT} rx="8" />
      {[500, 1000, 1500, 2000, 2500, 3000].map((tick) => (
        <g key={tick}>
          <line x1={x(tick)} y1={PADDING} x2={x(tick)} y2={HEIGHT - PADDING} />
          <text x={x(tick)} y={HEIGHT - 12}>
            {tick}
          </text>
        </g>
      ))}
      {[300, 500, 700, 900].map((tick) => (
        <g key={tick}>
          <line x1={PADDING} y1={y(tick)} x2={WIDTH - PADDING} y2={y(tick)} />
          <text x="8" y={y(tick) + 4}>
            {tick}
          </text>
        </g>
      ))}
      <text x={WIDTH / 2 - 26} y={HEIGHT - 14}>
        F2 Hz
      </text>
      <text x="10" y="24">
        F1 Hz
      </text>
      {frames.map((frame, index) => (
        <circle key={`${frame.time}-${index}`} cx={x(frame.f2)} cy={y(frame.f1)} r="2.5" className="user-dot" />
      ))}
      {vowels.map((phoneme) => (
        <g key={phoneme.id}>
          <circle cx={x(phoneme.target!.f2)} cy={y(phoneme.target!.f1)} r="9" className="target-dot" />
          <text x={x(phoneme.target!.f2) + 12} y={y(phoneme.target!.f1) + 5} className="target-label">
            /{phoneme.ipa}/
          </text>
        </g>
      ))}
    </svg>
  )
}
