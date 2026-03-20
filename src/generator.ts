import { DRUM_KIT } from './types'
import type { Cell, Variation, Playlist, TrackSnapshot } from './types'

interface PolyDef {
  name: string
  divisions: [number, number]
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

export interface GenerateOptions {
  durationSeconds: number
  bpm: number
  barsPerVariation: number
  varyPolyrhythms: boolean
  varyInstruments: boolean
  varyFocus: boolean
  // Base pattern to use (current tracks)
  baseTracks: TrackSnapshot[]
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
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

function pickUnused<T>(pool: T[], used: Set<string>, key: (item: T) => string): T {
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

let genVarId = 1

export function generatePlaylist(options: GenerateOptions): Playlist {
  const { durationSeconds, bpm, barsPerVariation, varyPolyrhythms, varyInstruments, varyFocus, baseTracks } = options
  const measureDur = (60 / bpm) * 4
  const totalBars = Math.max(1, Math.ceil(durationSeconds / measureDur))
  const variationCount = Math.max(1, Math.ceil(totalBars / barsPerVariation))

  const usedPolys = new Set<string>()
  const usedPairs = new Set<string>()

  // Extract base poly and instruments from current pattern
  const basePoly: PolyDef = baseTracks.length >= 2
    ? { name: `${baseTracks[0].divisions} over ${baseTracks[1].divisions}`, divisions: [baseTracks[0].divisions, baseTracks[1].divisions] }
    : baseTracks.length === 1
      ? { name: `${baseTracks[0].divisions}`, divisions: [baseTracks[0].divisions, 4] }
      : pick(POLY_POOL)

  const basePair: [string, string] = baseTracks.length >= 2
    ? [baseTracks[0].kitId, baseTracks[1].kitId]
    : baseTracks.length === 1
      ? [baseTracks[0].kitId, 'kick']
      : pick(INSTRUMENT_PAIRS)

  const variations: Variation[] = []

  // Build mode label
  const flags: string[] = []
  if (varyPolyrhythms) flags.push('poly')
  if (varyInstruments) flags.push('inst')
  if (varyFocus) flags.push('focus')
  const modeLabel = flags.length > 0 ? flags.join('+') : 'fixed'

  for (let i = 0; i < variationCount; i++) {
    let poly: PolyDef
    let pair: [string, string]
    let focusKitId: string | undefined

    // Polyrhythm: use base or vary
    if (varyPolyrhythms && i > 0) {
      poly = pickUnused(POLY_POOL, usedPolys, p => p.name)
    } else if (i === 0 || !varyPolyrhythms) {
      poly = basePoly
    } else {
      poly = basePoly
    }

    // Instruments: use base or vary
    if (varyInstruments && i > 0) {
      pair = pickUnusedPair(INSTRUMENT_PAIRS, usedPairs)
    } else {
      pair = basePair
    }

    // Focus: alternate between the two instruments
    if (varyFocus) {
      focusKitId = i % 2 === 0 ? pair[0] : pair[1]
    } else {
      focusKitId = undefined
    }

    const focusLabel = focusKitId ? ` [${shortName(focusKitId)}]` : ''
    const name = `${poly.name} on ${shortName(pair[0])}+${shortName(pair[1])}${focusLabel}`

    // Use base track cells for the first variation (preserves user's rhythm),
    // generate fresh cells for new polys/instruments
    let tracks: TrackSnapshot[]
    if (i === 0 && !varyPolyrhythms && !varyInstruments) {
      // Use the actual base pattern
      tracks = baseTracks.map(t => ({ ...t, cells: t.cells.map(c => ({ ...c })) }))
    } else if (!varyPolyrhythms && !varyInstruments) {
      // Same poly+instruments, reuse base cells
      tracks = baseTracks.map(t => ({ ...t, cells: t.cells.map(c => ({ ...c })) }))
    } else {
      tracks = [
        makeSnapshot(poly.divisions[0], pair[0]),
        makeSnapshot(poly.divisions[1], pair[1]),
      ]
    }

    variations.push({
      id: `gen-var-${genVarId++}`,
      name,
      bars: barsPerVariation,
      tracks,
      focusKitId,
    })
  }

  return {
    id: `playlist-gen-${Date.now()}`,
    name: `Generated ${formatDuration(durationSeconds)} (${modeLabel})`,
    variations,
    loop: true,
    shuffle: false,
  }
}

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
