// Counting tones using Web Audio — plays through the drum master chain
// Each number gets a distinct pitch on a pentatonic scale

import { getAudioContext, getMaster } from './audio'

const COUNT_PITCHES = [
  523.25, // C5 - one
  587.33, // D5 - two
  659.25, // E5 - three
  783.99, // G5 - four
  880.00, // A5 - five
  1046.5, // C6 - six
  1174.7, // D6 - seven
  1318.5, // E6 - eight
  1568.0, // G6 - nine
  1760.0, // A6 - ten
  2093.0, // C7 - eleven
  2349.3, // D7 - twelve
  2637.0, // E7 - thirteen
]

export function speakCount(noteNumber: number, noteDurationSec: number, volume: number = 0.5) {
  const ctx = getAudioContext()
  const master = getMaster()
  const t = ctx.currentTime
  const pitch = COUNT_PITCHES[(noteNumber - 1) % COUNT_PITCHES.length]
  const dur = Math.min(noteDurationSec * 0.7, 0.3)
  const v = volume

  // Main tone
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.value = pitch
  gain.gain.setValueAtTime(0.8 * v, t)
  gain.gain.setValueAtTime(0.8 * v, t + dur * 0.4)
  gain.gain.exponentialRampToValueAtTime(0.001, t + dur)
  osc.connect(gain)
  gain.connect(master)
  osc.start(t)
  osc.stop(t + dur + 0.01)

  // Octave harmonic for brightness
  const osc2 = ctx.createOscillator()
  const gain2 = ctx.createGain()
  osc2.type = 'triangle'
  osc2.frequency.value = pitch * 2
  gain2.gain.setValueAtTime(0.3 * v, t)
  gain2.gain.exponentialRampToValueAtTime(0.001, t + dur * 0.7)
  osc2.connect(gain2)
  gain2.connect(master)
  osc2.start(t)
  osc2.stop(t + dur + 0.01)

  // Sub octave for body
  const osc3 = ctx.createOscillator()
  const gain3 = ctx.createGain()
  osc3.type = 'sine'
  osc3.frequency.value = pitch / 2
  gain3.gain.setValueAtTime(0.25 * v, t)
  gain3.gain.exponentialRampToValueAtTime(0.001, t + dur * 0.5)
  osc3.connect(gain3)
  gain3.connect(master)
  osc3.start(t)
  osc3.stop(t + dur + 0.01)
}

export function stopCounting() {
  // No-op — tones are self-stopping via scheduled stop()
}
