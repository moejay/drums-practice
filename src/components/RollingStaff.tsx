import { useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useBeatStore } from '../store'
import { layoutCells } from '../utils'
import { DRUM_KIT } from '../types'
import type { Cell, TrackSnapshot } from '../types'

const SLOT_WIDTH = 36
const HALF = 16
const VISIBLE_SLOTS = HALF * 2 + 1
const STAFF_HEIGHT = 140
const LABEL_WIDTH = 36
const LINE_COUNT = 5

const STAFF_POSITIONS: Record<string, { y: number; noteType: 'x' | 'filled'; label: string }> = {
  'crash':     { y: -0.5, noteType: 'x', label: 'Cr' },
  'ride':      { y: 0.5,  noteType: 'x', label: 'Ri' },
  'hihat':     { y: 1,    noteType: 'x', label: 'HH' },
  'tom-hi':    { y: 1.5,  noteType: 'filled', label: 'T1' },
  'tom-mid':   { y: 2,    noteType: 'filled', label: 'T2' },
  'snare':     { y: 3,    noteType: 'filled', label: 'Sn' },
  'tom-floor': { y: 3.5,  noteType: 'filled', label: 'FT' },
  'kick':      { y: 4,    noteType: 'filled', label: 'K' },
}

function staffY(position: number): number {
  const topPad = 18
  const bottomPad = 14
  const usable = STAFF_HEIGHT - topPad - bottomPad
  return topPad + ((position + 0.5) / 5) * usable
}

interface SlotEvent {
  kitId: string
  cell: Cell
  isStart: boolean
  isUpcoming?: boolean
}

interface SlotInfo {
  position: number // 0..1 within its bar
  events: SlotEvent[]
  isSeparator?: boolean
}

function buildSlots(
  tracks: { cells: Cell[]; divisions: number; kitId: string }[]
): SlotInfo[] {
  const posSet = new Set<number>()
  for (const track of tracks) {
    for (let i = 0; i < track.divisions; i++) {
      posSet.add(i / track.divisions)
    }
  }
  const positions = Array.from(posSet).sort((a, b) => a - b)

  return positions.map((pos) => {
    const events: SlotEvent[] = []
    for (const track of tracks) {
      const subdivPos = Math.round(pos * track.divisions)
      if (subdivPos >= track.divisions) continue
      const layout = layoutCells(track.cells, track.divisions)
      for (const item of layout) {
        if (subdivPos >= item.start && subdivPos < item.start + item.cell.duration) {
          events.push({ kitId: track.kitId, cell: item.cell, isStart: subdivPos === item.start })
          break
        }
      }
    }
    return { position: pos, events }
  })
}

export function RollingStaff() {
  const tracks = useBeatStore(useShallow((s) => s.tracks))
  const activePosition = useBeatStore((s) => s.activePosition)
  const playing = useBeatStore((s) => s.playing)
  const playlistMode = useBeatStore((s) => s.playlistMode)
  const activePlaylist = useBeatStore((s) => s.activePlaylist)
  const activeVariationIndex = useBeatStore((s) => s.activeVariationIndex)

  // Current pattern's slots (positions 0..1)
  const currentSlots = useMemo(() => {
    return buildSlots(tracks.map(t => ({ cells: t.cells, divisions: t.divisions, kitId: t.kitId })))
  }, [tracks])

  // Upcoming variation's slots (for look-ahead preview)
  const upcomingSlots = useMemo((): SlotInfo[] => {
    if (!playlistMode || !activePlaylist || activePlaylist.variations.length <= 1) return []
    let nextIdx = activeVariationIndex + 1
    if (nextIdx >= activePlaylist.variations.length) {
      if (activePlaylist.loop) nextIdx = 0
      else return []
    }
    const nextVar = activePlaylist.variations[nextIdx]
    if (!nextVar) return []
    const tracks = nextVar.tracks.map((t: TrackSnapshot) => ({ cells: t.cells, divisions: t.divisions, kitId: t.kitId }))
    return buildSlots(tracks).map(s => ({
      ...s,
      events: s.events.map(e => ({ ...e, isUpcoming: true })),
    }))
  }, [playlistMode, activePlaylist, activeVariationIndex])

  const currentPos = playing && activePosition !== null ? activePosition : 0

  // Find current slot index in current pattern
  let currentSlotIdx = 0
  for (let i = 0; i < currentSlots.length; i++) {
    if (currentSlots[i].position <= currentPos) currentSlotIdx = i
  }

  // Build visible window: past wraps into current pattern, future extends into upcoming
  const visibleSlots: { slot: SlotInfo; offset: number }[] = []
  for (let d = -HALF; d <= HALF; d++) {
    const idx = currentSlotIdx + d

    if (idx >= 0 && idx < currentSlots.length) {
      // Within current bar
      visibleSlots.push({ slot: currentSlots[idx], offset: d })
    } else if (idx < 0) {
      // Wrap backwards into the pattern
      const wrapped = ((idx % currentSlots.length) + currentSlots.length) % currentSlots.length
      visibleSlots.push({ slot: currentSlots[wrapped], offset: d })
    } else {
      // Beyond current bar — show upcoming or wrap
      const beyondIdx = idx - currentSlots.length

      if (upcomingSlots.length > 0) {
        // First slot beyond = separator
        if (beyondIdx === 0) {
          visibleSlots.push({ slot: { position: 1, events: [], isSeparator: true }, offset: d })
        } else {
          const upIdx = (beyondIdx - 1) % Math.max(1, upcomingSlots.length)
          if (upIdx < upcomingSlots.length) {
            visibleSlots.push({ slot: upcomingSlots[upIdx], offset: d })
          }
        }
      } else {
        // No upcoming — wrap current pattern
        const wrapped = beyondIdx % Math.max(1, currentSlots.length)
        if (wrapped < currentSlots.length) {
          visibleSlots.push({ slot: currentSlots[wrapped], offset: d })
        }
      }
    }
  }

  const totalWidth = VISIBLE_SLOTS * SLOT_WIDTH
  const playheadX = LABEL_WIDTH + HALF * SLOT_WIDTH + SLOT_WIDTH / 2
  const lineYs = Array.from({ length: LINE_COUNT }, (_, i) => staffY(i))

  // All kit IDs for labels
  const allKitIds = useMemo(() => {
    const ids = new Set(tracks.map(t => t.kitId))
    upcomingSlots.forEach(s => s.events.forEach(e => ids.add(e.kitId)))
    return Array.from(ids).sort((a, b) => (STAFF_POSITIONS[a]?.y ?? 5) - (STAFF_POSITIONS[b]?.y ?? 5))
  }, [tracks, upcomingSlots])

  return (
    <div className="relative overflow-hidden rounded-lg border border-white/8" style={{ background: '#0d0d14' }}>
      <svg width={LABEL_WIDTH + totalWidth} height={STAFF_HEIGHT} className="block">
        <rect width="100%" height="100%" fill="#0d0d14" />

        {lineYs.map((y, i) => (
          <line key={i} x1={LABEL_WIDTH} y1={y} x2={LABEL_WIDTH + totalWidth} y2={y}
            stroke="rgba(255,255,255,0.12)" strokeWidth={1} />
        ))}

        <rect x={0} y={0} width={LABEL_WIDTH} height={STAFF_HEIGHT} fill="#0a0a10" />
        <line x1={LABEL_WIDTH} y1={0} x2={LABEL_WIDTH} y2={STAFF_HEIGHT} stroke="rgba(255,255,255,0.15)" strokeWidth={1} />

        {allKitIds.map((kitId) => {
          const sp = STAFF_POSITIONS[kitId]
          if (!sp) return null
          const kit = DRUM_KIT.find(k => k.id === kitId)
          return (
            <text key={kitId} x={LABEL_WIDTH - 4} y={staffY(sp.y) + 3} textAnchor="end"
              fill={kit?.hex ?? '#666'} fontSize={9} fontFamily="monospace" opacity={0.7}>
              {sp.label}
            </text>
          )
        })}

        <text x={LABEL_WIDTH + 6} y={staffY(2) + 5} fill="rgba(255,255,255,0.25)"
          fontSize={22} fontWeight="bold" fontFamily="serif">𝄥</text>

        <line x1={playheadX} y1={0} x2={playheadX} y2={STAFF_HEIGHT}
          stroke="rgba(250,204,21,0.7)" strokeWidth={2} />
        <line x1={playheadX} y1={0} x2={playheadX} y2={STAFF_HEIGHT}
          stroke="rgba(250,204,21,0.15)" strokeWidth={8} />

        {visibleSlots.map(({ slot, offset }) => {
          const isCurrent = offset === 0
          const isPast = offset < 0
          const baseOpacity = isCurrent ? 1 : isPast ? 0.25 : 0.55
          const cx = LABEL_WIDTH + (offset + HALF) * SLOT_WIDTH + SLOT_WIDTH / 2

          if (slot.isSeparator) {
            return (
              <g key={`sep-${offset}`}>
                <line x1={cx} y1={4} x2={cx} y2={STAFF_HEIGHT - 4}
                  stroke="rgba(167,139,250,0.4)" strokeWidth={2} strokeDasharray="4,3" />
                <text x={cx + 4} y={14} fill="rgba(167,139,250,0.5)" fontSize={8} fontFamily="monospace">
                  next
                </text>
              </g>
            )
          }

          return (
            <g key={`${offset}-${slot.position.toFixed(6)}`} opacity={baseOpacity}>
              {isCurrent && (
                <rect x={cx - SLOT_WIDTH / 2} y={0} width={SLOT_WIDTH} height={STAFF_HEIGHT}
                  fill="rgba(250,204,21,0.04)" />
              )}

              {slot.events.map((event) => {
                const sp = STAFF_POSITIONS[event.kitId]
                if (!sp) return null
                const kit = DRUM_KIT.find(k => k.id === event.kitId)
                const y = staffY(sp.y)
                const color = kit?.hex ?? '#fff'
                const fade = event.isUpcoming ? 0.4 : 1

                if (!event.isStart) {
                  if (event.cell.type === 'note') {
                    return <line key={event.kitId} x1={cx - 6} y1={y} x2={cx + 6} y2={y}
                      stroke={color} strokeWidth={1.5} opacity={0.2 * fade} />
                  }
                  return null
                }

                if (event.cell.type === 'rest') {
                  return <circle key={event.kitId} cx={cx} cy={y} r={1.5} fill="rgba(255,255,255,0.1)" opacity={fade} />
                }

                if (sp.noteType === 'x') {
                  return (
                    <g key={event.kitId} opacity={fade}>
                      <line x1={cx - 5} y1={y - 5} x2={cx + 5} y2={y + 5} stroke={color} strokeWidth={2} strokeLinecap="round" />
                      <line x1={cx + 5} y1={y - 5} x2={cx - 5} y2={y + 5} stroke={color} strokeWidth={2} strokeLinecap="round" />
                      <line x1={cx + 5} y1={y - 5} x2={cx + 5} y2={y - 20} stroke={color} strokeWidth={1.5} />
                    </g>
                  )
                }

                return (
                  <g key={event.kitId} opacity={fade}>
                    <ellipse cx={cx} cy={y} rx={5} ry={3.5} fill={color}
                      transform={`rotate(-15 ${cx} ${y})`} />
                    {sp.y >= 2.5 ? (
                      <line x1={cx + 4.5} y1={y - 2} x2={cx + 4.5} y2={y - 22} stroke={color} strokeWidth={1.5} />
                    ) : (
                      <line x1={cx - 4.5} y1={y + 2} x2={cx - 4.5} y2={y + 22} stroke={color} strokeWidth={1.5} />
                    )}
                    {(sp.y < 0 || sp.y > 4) && (
                      <line x1={cx - 8} y1={y} x2={cx + 8} y2={y} stroke="rgba(255,255,255,0.2)" strokeWidth={1} />
                    )}
                  </g>
                )
              })}
            </g>
          )
        })}
      </svg>

      <div className="absolute inset-y-0 w-20 pointer-events-none z-10"
        style={{ left: `${LABEL_WIDTH}px`, background: 'linear-gradient(to right, #0d0d14, transparent)' }} />
      <div className="absolute inset-y-0 right-0 w-20 pointer-events-none z-10"
        style={{ background: 'linear-gradient(to left, #0d0d14, transparent)' }} />
    </div>
  )
}
