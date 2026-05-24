// Counting voice using pre-generated WAV samples
// Plays "one", "two", ... "thirteen" through the master audio chain
// Playback rate is adjusted to fit the note duration

import { getAudioContext, getMaster } from './audio'

const COUNT_FILES = 13
const sampleBuffers: (AudioBuffer | null)[] = new Array(COUNT_FILES).fill(null)
let loadingStarted = false

/** Pre-load all counting samples */
export async function loadCountingSamples() {
  if (loadingStarted) return
  loadingStarted = true

  const ctx = getAudioContext()

  const promises = Array.from({ length: COUNT_FILES }, async (_, i) => {
    const num = i + 1
    try {
      const resp = await fetch(`/counts/${num}.wav`)
      if (!resp.ok) return
      const buf = await resp.arrayBuffer()
      sampleBuffers[i] = await ctx.decodeAudioData(buf)
    } catch {
      // Silently fail — counting just won't work for this number
    }
  })

  await Promise.all(promises)
}

/**
 * Play a counting sample for the given note number.
 * Adjusts playback rate so the word fits within the note duration.
 */
export function speakCount(noteNumber: number, noteDurationSec: number, volume: number = 0.5) {
  const idx = ((noteNumber - 1) % COUNT_FILES)
  const buffer = sampleBuffers[idx]
  if (!buffer) return

  const ctx = getAudioContext()
  const master = getMaster()

  const source = ctx.createBufferSource()
  source.buffer = buffer

  // Adjust playback rate so the sample fits in the note duration
  const sampleDuration = buffer.duration
  const targetDuration = Math.max(noteDurationSec * 0.8, 0.1)
  const rate = sampleDuration / targetDuration
  const clampedRate = Math.max(0.5, Math.min(3.0, rate))
  source.playbackRate.value = clampedRate

  // Compensate pitch shift: playbackRate changes both speed AND pitch,
  // so detune back down to keep the voice sounding natural.
  // detune in cents = -1200 * log2(rate)
  source.detune.value = -1200 * Math.log2(clampedRate)

  const gain = ctx.createGain()
  gain.gain.value = volume

  source.connect(gain)
  gain.connect(master)
  source.start()
}

export function stopCounting() {
  // Samples are short and self-stopping, nothing to cancel
}
