import { DRUM_KIT } from './types'
import type { Cell, Variation, Playlist, TrackSnapshot } from './types'

// --- Polyrhythm pool ---

interface PolyDef {
  name: string
  divisions: [number, number] // [track1 divisions, track2 divisions]
}

const POLY_POOL: PolyDef[] = [
  { name: '2 over 3', divisions: [2, 3] },
  { name: '3 over 4', divisions: [3, 4] },
  { name: '4 over 3', divisions: [4, 3] },
  { name: '3 over 2', divisions: [3, 2] },
  { name: '5 over 4', divisions: [5, 4] },
  { name: '4 over 5', divisions: [4, 5] },
  { name: '5 over 3', divisions: [5, 3] },
  { name: '3 over 5', divisions: [3, 5] },
  { name: '7 over 4', divisions: [7, 4] },
  { name: '7 over 3', divisions: [7, 3] },
  { name: '5 over 7', divisions: [5, 7] },
  { name: '7 over 8', divisions: [7, 8] },
  { name: '11 over 8', divisions: [11, 8] },
  { name: '13 over 8', divisions: [13, 8] },
]

// Instrument pairings that make musical sense
const INSTRUMENT_PAIRS: [string, string][] = [
  ['hihat', 'kick'],
  ['hihat', 'snare'],
  ['ride', 'kick'],
  ['ride', 'snare'],
  ['hihat', 'tom-floor'],
  ['ride', 'tom-hi'],
  ['crash', 'kick'],
  ['snare', 'kick'],
  ['tom-hi', 'tom-floor'],
  ['hihat', 'tom-mid'],
  ['ride', 'tom-floor'],
  ['snare', 'tom-hi'],
]

export type GenerateMode = 'polyrhythms' | 'instruments' | 'both'

export interface GenerateOptions {
  durationSeconds: number
  bpm: number
  mode: GenerateMode
  barsPerVariation: number // how many bars each variation lasts
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, n)
}

function fillCells(divisions: number): Cell[] {
  return Array.from({ length: divisions }, () => ({ type: 'note' as const, duration: 1 }))
}

function makeSnapshot(divisions: number, kitId: string): TrackSnapshot {
  const kit = DRUM_KIT.find(k => k.id === kitId)
  return {
    cells: fillCells(divisions),
    pitch: kit?.pitch ?? 440,
    divisions,
    volume: 1,
    kitId,
  }
}

let genVarId = 1

export function generatePlaylist(options: GenerateOptions): Playlist {
  const { durationSeconds, bpm, mode, barsPerVariation } = options
  const measureDur = (60 / bpm) * 4 // seconds per measure
  const totalBars = Math.max(1, Math.ceil(durationSeconds / measureDur))
  const variationCount = Math.max(1, Math.ceil(totalBars / barsPerVariation))

  // Pick a pool of polyrhythms and instruments to draw from
  const usedPolys = new Set<string>()
  const usedPairs = new Set<string>()

  const variations: Variation[] = []

  for (let i = 0; i < variationCount; i++) {
    let poly: PolyDef
    let pair: [string, string]

    if (mode === 'polyrhythms') {
      // Vary polyrhythm, keep instruments changing slowly
      poly = pickUnused(POLY_POOL, usedPolys, p => p.name)
      pair = i === 0 ? pick(INSTRUMENT_PAIRS) : variations[i - 1]
        ? [variations[i - 1].tracks[0].kitId, variations[i - 1].tracks[1].kitId] as [string, string]
        : pick(INSTRUMENT_PAIRS)
      // Every 3rd variation, swap instruments too for variety
      if (i > 0 && i % 3 === 0) {
        pair = pick(INSTRUMENT_PAIRS)
      }
    } else if (mode === 'instruments') {
      // Keep polyrhythm, vary instruments
      poly = i === 0 ? pick(POLY_POOL) : { name: variations[0].name.split(' on ')[0], divisions: [variations[0].tracks[0].divisions, variations[0].tracks[1].divisions] }
      pair = pickUnusedPair(INSTRUMENT_PAIRS, usedPairs)
    } else {
      // Both
      poly = pickUnused(POLY_POOL, usedPolys, p => p.name)
      pair = pickUnusedPair(INSTRUMENT_PAIRS, usedPairs)
    }

    const name = `${poly.name} on ${shortName(pair[0])}+${shortName(pair[1])}`
    const tracks: TrackSnapshot[] = [
      makeSnapshot(poly.divisions[0], pair[0]),
      makeSnapshot(poly.divisions[1], pair[1]),
    ]

    variations.push({
      id: `gen-var-${genVarId++}`,
      name,
      bars: barsPerVariation,
      tracks,
    })
  }

  return {
    id: `playlist-gen-${Date.now()}`,
    name: `Generated ${formatDuration(durationSeconds)} (${mode})`,
    variations,
    loop: true,
    shuffle: false,
  }
}

function pickUnused<T>(pool: T[], used: Set<string>, key: (item: T) => string): T {
  // Try to pick something not used yet
  const available = pool.filter(p => !used.has(key(p)))
  const item = available.length > 0 ? pick(available) : pick(pool)
  used.add(key(item))
  return item
}

function pickUnusedPair(pool: [string, string][], used: Set<string>): [string, string] {
  const key = (p: [string, string]) => p.join('+')
  const available = pool.filter(p => !used.has(key(p)))
  const item = available.length > 0 ? pick(available) : pick(pool)
  used.add(key(item))
  return item
}

function shortName(kitId: string): string {
  return DRUM_KIT.find(k => k.id === kitId)?.shortName ?? kitId
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return secs > 0 ? `${mins}m${secs}s` : `${mins}m`
}

// Preset duration options
export const DURATION_PRESETS = [
  { label: '30s', seconds: 30 },
  { label: '1 min', seconds: 60 },
  { label: '2 min', seconds: 120 },
  { label: '5 min', seconds: 300 },
  { label: '10 min', seconds: 600 },
  { label: '15 min', seconds: 900 },
  { label: '30 min', seconds: 1800 },
]

export const BARS_PER_VAR_OPTIONS = [1, 2, 4, 8]
