import type { FormantFrame } from '../types'

const PRE_EMPHASIS = 0.97
const LPC_ORDER = 12
const MIN_RMS = 0.012

export async function decodeAudioFile(file: Blob): Promise<AudioBuffer> {
  const context = new AudioContext()
  try {
    return await context.decodeAudioData(await file.arrayBuffer())
  } finally {
    await context.close()
  }
}

export function extractMono(buffer: AudioBuffer): Float32Array {
  const samples = new Float32Array(buffer.length)
  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    const data = buffer.getChannelData(channel)
    for (let i = 0; i < data.length; i += 1) samples[i] += data[i] / buffer.numberOfChannels
  }
  return samples
}

export function analyzeFormants(samples: Float32Array, sampleRate: number): FormantFrame[] {
  const frameSize = Math.max(512, Math.round(sampleRate * 0.032))
  const hopSize = Math.round(sampleRate * 0.016)
  const frames: FormantFrame[] = []

  for (let offset = 0; offset + frameSize <= samples.length; offset += hopSize) {
    const frame = samples.slice(offset, offset + frameSize)
    const rms = calculateRms(frame)
    if (rms < MIN_RMS) continue

    const emphasized = preEmphasize(frame)
    applyHamming(emphasized)
    const coefficients = lpc(emphasized, LPC_ORDER)
    const roots = durandKerner(coefficients)
    const candidates = roots
      .filter((root) => root.im >= 0.01)
      .map((root) => {
        const angle = Math.atan2(root.im, root.re)
        const frequency = (angle * sampleRate) / (2 * Math.PI)
        const bandwidth = (-0.5 * sampleRate * Math.log(root.re * root.re + root.im * root.im)) / Math.PI
        return { frequency, bandwidth }
      })
      .filter(({ frequency, bandwidth }) => frequency > 180 && frequency < 3600 && bandwidth < 900)
      .sort((a, b) => a.frequency - b.frequency)

    const f1 = candidates[0]?.frequency
    const f2 = candidates.find((candidate) => candidate.frequency > (f1 ?? 0) + 250)?.frequency
    if (f1 && f2) {
      frames.push({
        time: offset / sampleRate,
        f1: Math.round(f1),
        f2: Math.round(f2),
        rms: Number(rms.toFixed(4)),
      })
    }
  }

  return smoothFrames(frames)
}

export function calculateRms(frame: Float32Array): number {
  const energy = frame.reduce((sum, sample) => sum + sample * sample, 0)
  return Math.sqrt(energy / frame.length)
}

function preEmphasize(frame: Float32Array): Float32Array {
  const output = new Float32Array(frame.length)
  output[0] = frame[0]
  for (let i = 1; i < frame.length; i += 1) output[i] = frame[i] - PRE_EMPHASIS * frame[i - 1]
  return output
}

function applyHamming(frame: Float32Array): void {
  for (let i = 0; i < frame.length; i += 1) {
    frame[i] *= 0.54 - 0.46 * Math.cos((2 * Math.PI * i) / (frame.length - 1))
  }
}

function lpc(frame: Float32Array, order: number): number[] {
  const autocorrelation = Array.from({ length: order + 1 }, (_, lag) => {
    let sum = 0
    for (let i = lag; i < frame.length; i += 1) sum += frame[i] * frame[i - lag]
    return sum
  })

  const coefficients = new Array<number>(order + 1).fill(0)
  const error = new Array<number>(order + 1).fill(0)
  coefficients[0] = 1
  error[0] = autocorrelation[0] || 1e-9

  for (let i = 1; i <= order; i += 1) {
    let accumulator = autocorrelation[i]
    for (let j = 1; j < i; j += 1) accumulator += coefficients[j] * autocorrelation[i - j]
    const reflection = -accumulator / error[i - 1]
    const next = coefficients.slice()
    next[i] = reflection
    for (let j = 1; j < i; j += 1) next[j] = coefficients[j] + reflection * coefficients[i - j]
    for (let j = 1; j <= i; j += 1) coefficients[j] = next[j]
    error[i] = Math.max(error[i - 1] * (1 - reflection * reflection), 1e-9)
  }

  return coefficients
}

type Complex = { re: number; im: number }

function durandKerner(coefficients: number[]): Complex[] {
  const degree = coefficients.length - 1
  let roots = Array.from({ length: degree }, (_, i) => ({
    re: 0.4 * Math.cos((2 * Math.PI * i) / degree),
    im: 0.4 * Math.sin((2 * Math.PI * i) / degree),
  }))

  for (let iteration = 0; iteration < 60; iteration += 1) {
    roots = roots.map((root, index) => {
      const numerator = evaluatePolynomial(coefficients, root)
      const denominator = roots
        .filter((_, rootIndex) => rootIndex !== index)
        .reduce<Complex>((product, other) => multiply(product, subtract(root, other)), { re: 1, im: 0 })
      const correction = divide(numerator, denominator)
      return subtract(root, correction)
    })
  }

  return roots
}

function evaluatePolynomial(coefficients: number[], z: Complex): Complex {
  return coefficients.reduce<Complex>((value, coefficient) => add(multiply(value, z), { re: coefficient, im: 0 }), {
    re: 0,
    im: 0,
  })
}

function add(a: Complex, b: Complex): Complex {
  return { re: a.re + b.re, im: a.im + b.im }
}

function subtract(a: Complex, b: Complex): Complex {
  return { re: a.re - b.re, im: a.im - b.im }
}

function multiply(a: Complex, b: Complex): Complex {
  return { re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re }
}

function divide(a: Complex, b: Complex): Complex {
  const denominator = b.re * b.re + b.im * b.im || 1e-9
  return { re: (a.re * b.re + a.im * b.im) / denominator, im: (a.im * b.re - a.re * b.im) / denominator }
}

function smoothFrames(frames: FormantFrame[]): FormantFrame[] {
  return frames.map((frame, index) => {
    const window = frames.slice(Math.max(0, index - 1), index + 2)
    const average = (key: 'f1' | 'f2') => Math.round(window.reduce((sum, item) => sum + item[key], 0) / window.length)
    return { ...frame, f1: average('f1'), f2: average('f2') }
  })
}
