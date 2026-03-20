import { create } from 'zustand'
import { DRUM_KIT } from './types'
import type { Cell, Track, Variation, Playlist, TrackSnapshot } from './types'
import { defaultCells } from './utils'
import { generatePlaylist } from './generator'
import type { GenerateOptions } from './generator'

// --- Saved types ---

export interface SavedPattern {
  id: string
  name: string
  tracks: { cells: Cell[]; pitch: number; divisions: number; muted?: boolean; kitId: string }[]
}

// --- Helpers ---

function n(duration: number): Cell { return { type: 'note', duration } }
function r(duration: number): Cell { return { type: 'rest', duration } }

function repeat(cell: Cell, count: number): Cell[] {
  return Array.from({ length: count }, () => ({ ...cell }))
}

let nextId = 1
let nextVarId = 1

function makeTrack(index: number, divisions: number = 4, kitId?: string): Track {
  const kit = kitId
    ? DRUM_KIT.find(k => k.id === kitId) ?? DRUM_KIT[index % DRUM_KIT.length]
    : DRUM_KIT[index % DRUM_KIT.length]
  return {
    id: `track-${nextId++}`,
    name: kit.name,
    cells: defaultCells(divisions),
    pitch: kit.pitch,
    divisions,
    muted: false,
    volume: 1,
    kitId: kit.id,
  }
}

function snapshotTracks(tracks: Track[]): TrackSnapshot[] {
  return tracks.map(t => ({
    cells: t.cells.map(c => ({ ...c })),
    pitch: t.pitch,
    divisions: t.divisions,
    volume: t.volume,
    kitId: t.kitId,
  }))
}

function tracksFromSnapshot(snapshots: TrackSnapshot[], currentTracks?: Track[]): Track[] {
  // Build a map of current volumes/mute by kitId to preserve user adjustments
  const currentByKit = new Map<string, { volume: number; muted: boolean }>()
  if (currentTracks) {
    for (const t of currentTracks) {
      currentByKit.set(t.kitId, { volume: t.volume, muted: t.muted })
    }
  }

  return snapshots.map((s, i) => {
    const kit = DRUM_KIT.find(k => k.id === s.kitId) ?? DRUM_KIT[i % DRUM_KIT.length]
    const existing = currentByKit.get(s.kitId)
    return {
      id: `track-${nextId++}`,
      name: kit.name,
      cells: s.cells.map(c => ({ ...c })),
      pitch: s.pitch,
      divisions: s.divisions,
      muted: existing?.muted ?? false,
      volume: existing?.volume ?? s.volume,
      kitId: s.kitId,
    }
  })
}

function makeVariation(name: string, tracks: Track[], bars: number = 2): Variation {
  return {
    id: `var-${nextVarId++}`,
    name,
    bars,
    tracks: snapshotTracks(tracks),
  }
}

// --- Preset patterns ---

const PRESET_PATTERNS: SavedPattern[] = [
  {
    id: 'preset-basic-rock', name: 'Basic Rock',
    tracks: [
      { cells: [n(1), r(1), n(1), r(1), n(1), r(1), n(1), r(1)], pitch: 800, divisions: 8, kitId: 'hihat' },
      { cells: [r(1), n(1), r(1), n(1)], pitch: 200, divisions: 4, kitId: 'snare' },
      { cells: [n(1), r(1), r(1), n(1)], pitch: 80, divisions: 4, kitId: 'kick' },
    ],
  },
  {
    id: 'preset-3-over-4', name: '3 over 4',
    tracks: [
      { cells: repeat(n(1), 4), pitch: 800, divisions: 4, kitId: 'hihat' },
      { cells: repeat(n(1), 3), pitch: 200, divisions: 3, kitId: 'snare' },
    ],
  },
  {
    id: 'preset-4-over-3', name: '4 over 3',
    tracks: [
      { cells: repeat(n(1), 3), pitch: 200, divisions: 3, kitId: 'snare' },
      { cells: repeat(n(1), 4), pitch: 80, divisions: 4, kitId: 'kick' },
    ],
  },
  {
    id: 'preset-5-over-4', name: '5 over 4',
    tracks: [
      { cells: repeat(n(1), 5), pitch: 800, divisions: 5, kitId: 'hihat' },
      { cells: repeat(n(1), 4), pitch: 80, divisions: 4, kitId: 'kick' },
    ],
  },
  {
    id: 'preset-7-over-4', name: '7 over 4',
    tracks: [
      { cells: repeat(n(1), 7), pitch: 800, divisions: 7, kitId: 'ride' },
      { cells: repeat(n(1), 4), pitch: 80, divisions: 4, kitId: 'kick' },
    ],
  },
  {
    id: 'preset-5-over-3', name: '5 over 3',
    tracks: [
      { cells: repeat(n(1), 5), pitch: 800, divisions: 5, kitId: 'hihat' },
      { cells: repeat(n(1), 3), pitch: 200, divisions: 3, kitId: 'snare' },
    ],
  },
  {
    id: 'preset-13-over-8', name: '13 over 8',
    tracks: [
      { cells: repeat(n(1), 13), pitch: 800, divisions: 13, kitId: 'hihat' },
      { cells: repeat(n(1), 8), pitch: 80, divisions: 8, kitId: 'kick' },
    ],
  },
  {
    id: 'preset-3-4-5', name: '3 vs 4 vs 5',
    tracks: [
      { cells: repeat(n(1), 3), pitch: 800, divisions: 3, kitId: 'ride' },
      { cells: repeat(n(1), 4), pitch: 200, divisions: 4, kitId: 'snare' },
      { cells: repeat(n(1), 5), pitch: 80, divisions: 5, kitId: 'kick' },
    ],
  },
  {
    id: 'preset-son-clave', name: 'Son Clave',
    tracks: [
      {
        cells: [
          n(1), r(1), r(1), n(1), r(1), r(1), n(1), r(1),
          r(1), r(1), n(1), r(1), r(1), n(1), r(1), r(1),
        ],
        pitch: 600, divisions: 16, kitId: 'ride',
      },
      { cells: repeat(n(1), 4), pitch: 80, divisions: 4, kitId: 'kick' },
    ],
  },
  {
    id: 'preset-bossa', name: 'Bossa Nova',
    tracks: [
      { cells: repeat(n(1), 8), pitch: 800, divisions: 8, kitId: 'hihat' },
      { cells: [r(1), r(1), n(1), r(1), r(1), n(1), r(1), r(1)], pitch: 200, divisions: 8, kitId: 'snare' },
      { cells: [n(1), r(1), r(1), n(1), r(1), n(1), r(1), r(1)], pitch: 80, divisions: 8, kitId: 'kick' },
    ],
  },
]

// --- Persistence ---

function loadSavedPatterns(): SavedPattern[] {
  try {
    const stored = localStorage.getItem('beatgrid-patterns')
    return stored ? JSON.parse(stored) : []
  } catch { return [] }
}

function persistPatterns(patterns: SavedPattern[]) {
  localStorage.setItem('beatgrid-patterns', JSON.stringify(patterns))
}

function loadSavedPlaylists(): Playlist[] {
  try {
    const stored = localStorage.getItem('beatgrid-playlists')
    return stored ? JSON.parse(stored) : []
  } catch { return [] }
}

function persistPlaylists(playlists: Playlist[]) {
  localStorage.setItem('beatgrid-playlists', JSON.stringify(playlists))
}

// --- Store interface ---

interface BeatStore {
  // Transport
  bpm: number
  playing: boolean
  loop: boolean
  activePosition: number | null
  activeHits: Set<string>
  soloTrackId: string | null

  setBpm: (bpm: number) => void
  setPlaying: (playing: boolean) => void
  toggleLoop: () => void
  setActivePosition: (pos: number | null) => void
  setActiveHits: (hits: Set<string>) => void
  toggleSolo: (id: string) => void
  clearSolo: () => void

  // Tracks (current editor state)
  tracks: Track[]
  addTrack: (kitId?: string) => void
  removeTrack: (id: string) => void
  updateCells: (id: string, cells: Cell[]) => void
  setTrackDivisions: (id: string, divisions: number) => void
  setTrackKit: (id: string, kitId: string) => void
  setTrackVolume: (id: string, volume: number) => void
  toggleMute: (id: string) => void
  resetTrack: (id: string) => void
  resetAll: () => void

  // Patterns
  savedPatterns: SavedPattern[]
  savePattern: (name: string) => void
  loadPattern: (id: string) => void
  deletePattern: (id: string) => void

  // Playlist
  activePlaylist: Playlist | null
  activeVariationIndex: number
  variationBar: number // current bar within variation (0-based)
  upcomingKitIds: string[] // kit IDs in the next variation (for preview)
  savedPlaylists: Playlist[]
  playlistMode: boolean

  setPlaylistMode: (on: boolean) => void
  createPlaylist: (name: string) => void
  addVariation: (name?: string, bars?: number) => void
  addVariationFromPattern: (patternId: string, bars?: number) => void
  removeVariation: (varId: string) => void
  setVariationBars: (varId: string, bars: number) => void
  moveVariation: (fromIdx: number, toIdx: number) => void
  jumpToVariation: (index: number) => void
  advanceVariation: () => boolean // returns false if playlist ended
  incrementBar: () => boolean // returns false if variation ended
  togglePlaylistLoop: () => void
  togglePlaylistShuffle: () => void
  savePlaylist: () => void
  loadPlaylist: (id: string) => void
  deletePlaylist: (id: string) => void
  generateAndLoadPlaylist: (options: GenerateOptions) => void
  updateUpcomingPreview: () => void
}

export const useBeatStore = create<BeatStore>((set, get) => ({
  bpm: 100,
  playing: false,
  loop: true,
  activePosition: null,
  activeHits: new Set<string>(),
  soloTrackId: null,

  setBpm: (bpm) => set({ bpm: Math.max(40, Math.min(300, bpm)) }),
  setPlaying: (playing) => set({ playing, activePosition: playing ? 0 : null, activeHits: new Set() }),
  toggleLoop: () => set((s) => ({ loop: !s.loop })),
  setActivePosition: (pos) => set({ activePosition: pos }),
  setActiveHits: (hits) => set({ activeHits: hits }),
  toggleSolo: (id) => set((s) => ({ soloTrackId: s.soloTrackId === id ? null : id })),
  clearSolo: () => set({ soloTrackId: null }),

  tracks: [
    makeTrack(0, 8, 'hihat'),
    makeTrack(1, 4, 'snare'),
    makeTrack(2, 4, 'kick'),
  ],

  addTrack: (kitId) =>
    set((s) => {
      if (s.tracks.length >= 8) return s
      const usedIds = new Set(s.tracks.map(t => t.kitId))
      const available = kitId ?? DRUM_KIT.find(k => !usedIds.has(k.id))?.id ?? DRUM_KIT[0].id
      return { tracks: [...s.tracks, makeTrack(s.tracks.length, 4, available)] }
    }),

  removeTrack: (id) =>
    set((s) => {
      if (s.tracks.length <= 1) return s
      return { tracks: s.tracks.filter((t) => t.id !== id) }
    }),

  updateCells: (id, cells) =>
    set((s) => ({ tracks: s.tracks.map((t) => (t.id === id ? { ...t, cells } : t)) })),

  setTrackDivisions: (id, divisions) =>
    set((s) => ({
      tracks: s.tracks.map((t) =>
        t.id === id ? { ...t, divisions, cells: defaultCells(divisions) } : t
      ),
    })),

  setTrackVolume: (id, volume) =>
    set((s) => ({
      tracks: s.tracks.map((t) =>
        t.id === id ? { ...t, volume: Math.max(0, Math.min(1, volume)) } : t
      ),
    })),

  setTrackKit: (id, kitId) => {
    const kit = DRUM_KIT.find(k => k.id === kitId)
    if (!kit) return
    set((s) => ({
      tracks: s.tracks.map((t) =>
        t.id === id ? { ...t, kitId, name: kit.name, pitch: kit.pitch } : t
      ),
    }))
  },

  toggleMute: (id) =>
    set((s) => ({ tracks: s.tracks.map((t) => t.id === id ? { ...t, muted: !t.muted } : t) })),

  resetTrack: (id) =>
    set((s) => ({
      tracks: s.tracks.map((t) => t.id === id ? { ...t, cells: defaultCells(t.divisions) } : t),
    })),

  resetAll: () =>
    set((s) => ({
      playing: false, activePosition: null, activeHits: new Set(),
      tracks: s.tracks.map((t) => ({ ...t, cells: defaultCells(t.divisions) })),
    })),

  // --- Patterns ---
  savedPatterns: loadSavedPatterns(),

  savePattern: (name) => {
    const { tracks, savedPatterns } = get()
    const pattern: SavedPattern = {
      id: `pattern-${Date.now()}`,
      name,
      tracks: tracks.map((t) => ({
        cells: t.cells, pitch: t.pitch, divisions: t.divisions, muted: t.muted, kitId: t.kitId,
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

    const snapshots: TrackSnapshot[] = pattern.tracks.map(pt => ({
      cells: pt.cells, pitch: pt.pitch, divisions: pt.divisions, volume: 1, kitId: pt.kitId,
    }))
    const tracks = tracksFromSnapshot(snapshots)
    set({ tracks, playing: false, activePosition: null, activeHits: new Set() })
  },

  deletePattern: (id) => {
    const { savedPatterns } = get()
    const updated = savedPatterns.filter((p) => p.id !== id)
    persistPatterns(updated)
    set({ savedPatterns: updated })
  },

  // --- Playlist ---
  activePlaylist: null,
  activeVariationIndex: 0,
  variationBar: 0,
  upcomingKitIds: [],
  savedPlaylists: loadSavedPlaylists(),
  playlistMode: false,

  setPlaylistMode: (on) => set({ playlistMode: on }),

  createPlaylist: (name) => {
    const playlist: Playlist = {
      id: `playlist-${Date.now()}`,
      name,
      variations: [],
      loop: true,
      shuffle: false,
    }
    set({ activePlaylist: playlist, playlistMode: true, activeVariationIndex: 0, variationBar: 0 })
  },

  addVariation: (name, bars = 2) => {
    const { activePlaylist, tracks } = get()
    if (!activePlaylist) return
    const varName = name ?? `Var ${activePlaylist.variations.length + 1}`
    const variation = makeVariation(varName, tracks, bars)
    set({
      activePlaylist: {
        ...activePlaylist,
        variations: [...activePlaylist.variations, variation],
      },
    })
  },

  addVariationFromPattern: (patternId, bars = 2) => {
    const { activePlaylist, savedPatterns } = get()
    if (!activePlaylist) return
    const allPatterns = [...PRESET_PATTERNS, ...savedPatterns]
    const pattern = allPatterns.find(p => p.id === patternId)
    if (!pattern) return

    const fakeTracks = tracksFromSnapshot(
      pattern.tracks.map(pt => ({
        cells: pt.cells, pitch: pt.pitch, divisions: pt.divisions, volume: 1, kitId: pt.kitId,
      }))
    )
    const variation = makeVariation(pattern.name, fakeTracks, bars)
    set({
      activePlaylist: {
        ...activePlaylist,
        variations: [...activePlaylist.variations, variation],
      },
    })
  },

  removeVariation: (varId) => {
    const { activePlaylist } = get()
    if (!activePlaylist) return
    set({
      activePlaylist: {
        ...activePlaylist,
        variations: activePlaylist.variations.filter(v => v.id !== varId),
      },
    })
  },

  setVariationBars: (varId, bars) => {
    const { activePlaylist } = get()
    if (!activePlaylist) return
    set({
      activePlaylist: {
        ...activePlaylist,
        variations: activePlaylist.variations.map(v =>
          v.id === varId ? { ...v, bars: Math.max(1, Math.min(32, bars)) } : v
        ),
      },
    })
  },

  moveVariation: (fromIdx, toIdx) => {
    const { activePlaylist } = get()
    if (!activePlaylist) return
    const vars = [...activePlaylist.variations]
    const [moved] = vars.splice(fromIdx, 1)
    vars.splice(toIdx, 0, moved)
    set({ activePlaylist: { ...activePlaylist, variations: vars } })
  },

  jumpToVariation: (index) => {
    const { activePlaylist, tracks: currentTracks } = get()
    if (!activePlaylist || index < 0 || index >= activePlaylist.variations.length) return
    const variation = activePlaylist.variations[index]
    const newTracks = tracksFromSnapshot(variation.tracks, currentTracks)
    set({ activeVariationIndex: index, variationBar: 0, tracks: newTracks })
    get().updateUpcomingPreview()
  },

  advanceVariation: () => {
    const { activePlaylist, activeVariationIndex } = get()
    if (!activePlaylist || activePlaylist.variations.length === 0) return false

    let nextIdx: number
    if (activePlaylist.shuffle) {
      // Pick a random different variation (or same if only 1)
      if (activePlaylist.variations.length === 1) {
        nextIdx = 0
      } else {
        do { nextIdx = Math.floor(Math.random() * activePlaylist.variations.length) }
        while (nextIdx === activeVariationIndex)
      }
    } else {
      nextIdx = activeVariationIndex + 1
    }

    if (nextIdx >= activePlaylist.variations.length) {
      if (activePlaylist.loop) {
        nextIdx = 0
      } else {
        return false // playlist ended
      }
    }

    const variation = activePlaylist.variations[nextIdx]
    const newTracks = tracksFromSnapshot(variation.tracks, get().tracks)
    set({ activeVariationIndex: nextIdx, variationBar: 0, tracks: newTracks })
    get().updateUpcomingPreview()
    return true
  },

  incrementBar: () => {
    const { activePlaylist, activeVariationIndex, variationBar } = get()
    if (!activePlaylist) return true // not in playlist mode, keep looping
    const variation = activePlaylist.variations[activeVariationIndex]
    if (!variation) return false

    const nextBar = variationBar + 1
    if (nextBar >= variation.bars) {
      return false // variation ended, caller should advanceVariation
    }
    set({ variationBar: nextBar })
    return true
  },

  togglePlaylistLoop: () => {
    const { activePlaylist } = get()
    if (!activePlaylist) return
    set({ activePlaylist: { ...activePlaylist, loop: !activePlaylist.loop } })
  },

  togglePlaylistShuffle: () => {
    const { activePlaylist } = get()
    if (!activePlaylist) return
    set({ activePlaylist: { ...activePlaylist, shuffle: !activePlaylist.shuffle } })
  },

  updateUpcomingPreview: () => {
    const { activePlaylist, activeVariationIndex } = get()
    if (!activePlaylist || activePlaylist.variations.length <= 1) {
      set({ upcomingKitIds: [] })
      return
    }
    let nextIdx = activeVariationIndex + 1
    if (nextIdx >= activePlaylist.variations.length) nextIdx = 0
    const next = activePlaylist.variations[nextIdx]
    if (next) {
      set({ upcomingKitIds: next.tracks.map(t => t.kitId) })
    }
  },

  savePlaylist: () => {
    const { activePlaylist, savedPlaylists } = get()
    if (!activePlaylist) return
    const existing = savedPlaylists.findIndex(p => p.id === activePlaylist.id)
    let updated: Playlist[]
    if (existing >= 0) {
      updated = savedPlaylists.map((p, i) => i === existing ? activePlaylist : p)
    } else {
      updated = [...savedPlaylists, activePlaylist]
    }
    persistPlaylists(updated)
    set({ savedPlaylists: updated })
  },

  loadPlaylist: (id) => {
    const { savedPlaylists } = get()
    const playlist = savedPlaylists.find(p => p.id === id)
    if (!playlist || playlist.variations.length === 0) return
    const firstVar = playlist.variations[0]
    const newTracks = tracksFromSnapshot(firstVar.tracks)
    set({
      activePlaylist: { ...playlist },
      playlistMode: true,
      activeVariationIndex: 0,
      variationBar: 0,
      tracks: newTracks,
      playing: false,
      activePosition: null,
    })
    get().updateUpcomingPreview()
  },

  deletePlaylist: (id) => {
    const { savedPlaylists } = get()
    const updated = savedPlaylists.filter(p => p.id !== id)
    persistPlaylists(updated)
    set({ savedPlaylists: updated })
  },

  generateAndLoadPlaylist: (options) => {
    const playlist = generatePlaylist(options)
    if (playlist.variations.length === 0) return
    const firstVar = playlist.variations[0]
    const newTracks = tracksFromSnapshot(firstVar.tracks)
    set({
      activePlaylist: playlist,
      playlistMode: true,
      activeVariationIndex: 0,
      variationBar: 0,
      tracks: newTracks,
      playing: false,
      activePosition: null,
    })
    get().updateUpcomingPreview()
  },
}))

export { PRESET_PATTERNS }
