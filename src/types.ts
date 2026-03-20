export type CellType = 'note' | 'rest'

export interface Cell {
  type: CellType
  duration: number
}

export interface DrumKit {
  id: string
  name: string
  shortName: string
  pitch: number
  color: string      // tailwind bg class
  activeColor: string // when hit
  hex: string         // for rolling staff
  position: { x: number; y: number } // % position in kit view
  size: number        // relative size 1-3
}

export interface Track {
  id: string
  name: string
  cells: Cell[]
  pitch: number
  divisions: number
  muted: boolean
  volume: number // 0..1
  kitId: string // which drum instrument
}

// Drum kit layout — top-down view like sitting at a kit
export const DRUM_KIT: DrumKit[] = [
  {
    id: 'kick',
    name: 'Kick',
    shortName: 'K',
    pitch: 80,
    color: 'bg-red-900',
    activeColor: 'bg-red-500',
    hex: '#ef4444',
    position: { x: 50, y: 85 },
    size: 3,
  },
  {
    id: 'snare',
    name: 'Snare',
    shortName: 'S',
    pitch: 200,
    color: 'bg-amber-900',
    activeColor: 'bg-amber-400',
    hex: '#fbbf24',
    position: { x: 40, y: 58 },
    size: 2.2,
  },
  {
    id: 'hihat',
    name: 'Hi-Hat',
    shortName: 'HH',
    pitch: 800,
    color: 'bg-yellow-900',
    activeColor: 'bg-yellow-300',
    hex: '#facc15',
    position: { x: 15, y: 38 },
    size: 1.8,
  },
  {
    id: 'ride',
    name: 'Ride',
    shortName: 'R',
    pitch: 600,
    color: 'bg-cyan-900',
    activeColor: 'bg-cyan-400',
    hex: '#22d3ee',
    position: { x: 82, y: 35 },
    size: 2.4,
  },
  {
    id: 'crash',
    name: 'Crash',
    shortName: 'CR',
    pitch: 700,
    color: 'bg-emerald-900',
    activeColor: 'bg-emerald-400',
    hex: '#34d399',
    position: { x: 20, y: 15 },
    size: 2,
  },
  {
    id: 'tom-hi',
    name: 'Hi Tom',
    shortName: 'T1',
    pitch: 300,
    color: 'bg-blue-900',
    activeColor: 'bg-blue-400',
    hex: '#60a5fa',
    position: { x: 38, y: 30 },
    size: 1.6,
  },
  {
    id: 'tom-mid',
    name: 'Mid Tom',
    shortName: 'T2',
    pitch: 220,
    color: 'bg-indigo-900',
    activeColor: 'bg-indigo-400',
    hex: '#818cf8',
    position: { x: 58, y: 28 },
    size: 1.8,
  },
  {
    id: 'tom-floor',
    name: 'Floor Tom',
    shortName: 'FT',
    pitch: 140,
    color: 'bg-violet-900',
    activeColor: 'bg-violet-400',
    hex: '#a78bfa',
    position: { x: 75, y: 58 },
    size: 2.2,
  },
]

// --- Playlist / Variation types ---

export interface TrackSnapshot {
  cells: Cell[]
  pitch: number
  divisions: number
  volume: number
  kitId: string
}

export interface Variation {
  id: string
  name: string
  bars: number // how many times to repeat this pattern
  tracks: TrackSnapshot[]
}

export interface Playlist {
  id: string
  name: string
  variations: Variation[]
  loop: boolean
  shuffle: boolean
}

export const DEFAULT_PITCHES = DRUM_KIT.map(k => k.pitch)

export const TRACK_COLORS = DRUM_KIT.map(k => ({
  name: k.name,
  note: k.color,
  dot: k.activeColor,
  hex: k.hex,
}))
