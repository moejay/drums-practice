import { create } from 'zustand'
import { DEFAULT_PITCHES } from './types'
import type { Cell, Track } from './types'
import { defaultCells } from './utils'

export interface SavedPattern {
  id: string
  name: string
  tracks: { cells: Cell[]; pitch: number; divisions: number; muted?: boolean }[]
}

// --- Helpers ---

function n(duration: number): Cell { return { type: 'note', duration } }
function r(duration: number): Cell { return { type: 'rest', duration } }

function repeat(cell: Cell, count: number): Cell[] {
  return Array.from({ length: count }, () => ({ ...cell }))
}

// --- Preset patterns ---
// All polyrhythms: "X over Y" = track1 has X divisions, track2 has Y divisions

const PRESET_PATTERNS: SavedPattern[] = [
  {
    id: 'preset-2-over-3', name: '2 over 3',
    tracks: [
      { cells: repeat(n(1), 2), pitch: 880, divisions: 2 },
      { cells: repeat(n(1), 3), pitch: 660, divisions: 3 },
    ],
  },
  {
    id: 'preset-3-over-4', name: '3 over 4',
    tracks: [
      { cells: repeat(n(1), 3), pitch: 880, divisions: 3 },
      { cells: repeat(n(1), 4), pitch: 660, divisions: 4 },
    ],
  },
  {
    id: 'preset-4-over-3', name: '4 over 3',
    tracks: [
      { cells: repeat(n(1), 4), pitch: 880, divisions: 4 },
      { cells: repeat(n(1), 3), pitch: 660, divisions: 3 },
    ],
  },
  {
    id: 'preset-5-over-4', name: '5 over 4',
    tracks: [
      { cells: repeat(n(1), 5), pitch: 880, divisions: 5 },
      { cells: repeat(n(1), 4), pitch: 660, divisions: 4 },
    ],
  },
  {
    id: 'preset-5-over-3', name: '5 over 3',
    tracks: [
      { cells: repeat(n(1), 5), pitch: 880, divisions: 5 },
      { cells: repeat(n(1), 3), pitch: 660, divisions: 3 },
    ],
  },
  {
    id: 'preset-7-over-4', name: '7 over 4',
    tracks: [
      { cells: repeat(n(1), 7), pitch: 880, divisions: 7 },
      { cells: repeat(n(1), 4), pitch: 660, divisions: 4 },
    ],
  },
  {
    id: 'preset-7-over-3', name: '7 over 3',
    tracks: [
      { cells: repeat(n(1), 7), pitch: 880, divisions: 7 },
      { cells: repeat(n(1), 3), pitch: 660, divisions: 3 },
    ],
  },
  {
    id: 'preset-5-over-7', name: '5 over 7',
    tracks: [
      { cells: repeat(n(1), 5), pitch: 880, divisions: 5 },
      { cells: repeat(n(1), 7), pitch: 660, divisions: 7 },
    ],
  },
  {
    id: 'preset-7-over-8', name: '7 over 8',
    tracks: [
      { cells: repeat(n(1), 7), pitch: 880, divisions: 7 },
      { cells: repeat(n(1), 8), pitch: 660, divisions: 8 },
    ],
  },
  {
    id: 'preset-11-over-8', name: '11 over 8',
    tracks: [
      { cells: repeat(n(1), 11), pitch: 880, divisions: 11 },
      { cells: repeat(n(1), 8), pitch: 660, divisions: 8 },
    ],
  },
  {
    id: 'preset-13-over-8', name: '13 over 8',
    tracks: [
      { cells: repeat(n(1), 13), pitch: 880, divisions: 13 },
      { cells: repeat(n(1), 8), pitch: 660, divisions: 8 },
    ],
  },
  {
    id: 'preset-son-clave', name: 'Son Clave 3-2',
    tracks: [
      {
        cells: [
          n(1), r(1), r(1), n(1), r(1), r(1), n(1), r(1),
          r(1), r(1), n(1), r(1), r(1), n(1), r(1), r(1),
        ],
        pitch: 880, divisions: 16,
      },
      { cells: repeat(n(1), 4), pitch: 660, divisions: 4 },
    ],
  },
  {
    id: 'preset-3-4-5', name: '3 vs 4 vs 5',
    tracks: [
      { cells: repeat(n(1), 3), pitch: 880, divisions: 3 },
      { cells: repeat(n(1), 4), pitch: 660, divisions: 4 },
      { cells: repeat(n(1), 5), pitch: 520, divisions: 5 },
    ],
  },
]

// --- Store ---

interface BeatStore {
  bpm: number
  playing: boolean
  loop: boolean
  activePosition: number | null // 0..1 fraction of measure

  setBpm: (bpm: number) => void
  setPlaying: (playing: boolean) => void
  toggleLoop: () => void
  setActivePosition: (pos: number | null) => void

  tracks: Track[]
  addTrack: () => void
  removeTrack: (id: string) => void
  updateCells: (id: string, cells: Cell[]) => void
  setTrackDivisions: (id: string, divisions: number) => void
  toggleMute: (id: string) => void
  resetTrack: (id: string) => void
  resetAll: () => void

  savedPatterns: SavedPattern[]
  savePattern: (name: string) => void
  loadPattern: (id: string) => void
  deletePattern: (id: string) => void
}

let nextId = 1

function makeTrack(index: number, divisions: number = 4): Track {
  return {
    id: `track-${nextId++}`,
    name: `Track ${index + 1}`,
    cells: defaultCells(divisions),
    pitch: DEFAULT_PITCHES[index % DEFAULT_PITCHES.length],
    divisions,
    muted: false,
  }
}

function loadSavedPatterns(): SavedPattern[] {
  try {
    const stored = localStorage.getItem('beatgrid-patterns')
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function persistPatterns(patterns: SavedPattern[]) {
  localStorage.setItem('beatgrid-patterns', JSON.stringify(patterns))
}

export const useBeatStore = create<BeatStore>((set, get) => ({
  bpm: 100,
  playing: false,
  loop: true,
  activePosition: null,

  setBpm: (bpm) => set({ bpm: Math.max(40, Math.min(300, bpm)) }),
  setPlaying: (playing) => set({ playing, activePosition: playing ? 0 : null }),
  toggleLoop: () => set((s) => ({ loop: !s.loop })),
  setActivePosition: (pos) => set({ activePosition: pos }),

  tracks: [makeTrack(0, 4)],

  addTrack: () =>
    set((s) => {
      if (s.tracks.length >= 6) return s
      return { tracks: [...s.tracks, makeTrack(s.tracks.length)] }
    }),

  removeTrack: (id) =>
    set((s) => {
      if (s.tracks.length <= 1) return s
      return { tracks: s.tracks.filter((t) => t.id !== id) }
    }),

  updateCells: (id, cells) =>
    set((s) => ({
      tracks: s.tracks.map((t) => (t.id === id ? { ...t, cells } : t)),
    })),

  setTrackDivisions: (id, divisions) =>
    set((s) => ({
      tracks: s.tracks.map((t) =>
        t.id === id ? { ...t, divisions, cells: defaultCells(divisions) } : t
      ),
    })),

  toggleMute: (id) =>
    set((s) => ({
      tracks: s.tracks.map((t) =>
        t.id === id ? { ...t, muted: !t.muted } : t
      ),
    })),

  resetTrack: (id) =>
    set((s) => ({
      tracks: s.tracks.map((t) =>
        t.id === id ? { ...t, cells: defaultCells(t.divisions) } : t
      ),
    })),

  resetAll: () =>
    set((s) => ({
      playing: false,
      activePosition: null,
      tracks: s.tracks.map((t) => ({ ...t, cells: defaultCells(t.divisions) })),
    })),

  savedPatterns: loadSavedPatterns(),

  savePattern: (name) => {
    const { tracks, savedPatterns } = get()
    const pattern: SavedPattern = {
      id: `pattern-${Date.now()}`,
      name,
      tracks: tracks.map((t) => ({
        cells: t.cells,
        pitch: t.pitch,
        divisions: t.divisions,
        muted: t.muted,
      })),
    }
    const updated = [...savedPatterns, pattern]
    persistPatterns(updated)
    set({ savedPatterns: updated })
  },

  loadPattern: (id) => {
    const { savedPatterns } = get()
    const allPatterns = [...PRESET_PATTERNS, ...savedPatterns]
    const pattern = allPatterns.find((p) => p.id === id)
    if (!pattern) return

    const tracks: Track[] = pattern.tracks.map((pt, i) => ({
      id: `track-${nextId++}`,
      name: `Track ${i + 1}`,
      cells: pt.cells,
      pitch: pt.pitch,
      divisions: pt.divisions,
      muted: pt.muted ?? false,
    }))

    set({ tracks, playing: false, activePosition: null })
  },

  deletePattern: (id) => {
    const { savedPatterns } = get()
    const updated = savedPatterns.filter((p) => p.id !== id)
    persistPatterns(updated)
    set({ savedPatterns: updated })
  },
}))

export { PRESET_PATTERNS }
