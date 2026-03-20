export type CellType = 'note' | 'rest'

export interface Cell {
  type: CellType
  duration: number // in subdivision units (1 = one division of the track)
}

export interface Track {
  id: string
  name: string
  cells: Cell[]
  pitch: number
  divisions: number // how many equal parts this track divides the measure into
  muted: boolean
}

export const TRACK_COLORS = [
  { name: 'Rose', note: 'bg-rose-600', dot: 'bg-rose-400', hex: '#e11d48' },
  { name: 'Sky', note: 'bg-sky-600', dot: 'bg-sky-400', hex: '#0284c7' },
  { name: 'Amber', note: 'bg-amber-600', dot: 'bg-amber-400', hex: '#d97706' },
  { name: 'Violet', note: 'bg-violet-600', dot: 'bg-violet-400', hex: '#7c3aed' },
  { name: 'Emerald', note: 'bg-emerald-600', dot: 'bg-emerald-400', hex: '#059669' },
  { name: 'Fuchsia', note: 'bg-fuchsia-600', dot: 'bg-fuchsia-400', hex: '#c026d3' },
]

export const DEFAULT_PITCHES = [880, 660, 520, 440, 350, 280]
