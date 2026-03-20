import { useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useBeatStore } from '../store'
import { layoutCells } from '../utils'
import { TRACK_COLORS } from '../types'
import type { Cell } from '../types'

const SLOT_WIDTH = 44
const HALF = 12
const VISIBLE_SLOTS = HALF * 2 + 1

interface SlotInfo {
  position: number // 0..1
  tracks: { trackIndex: number; cell: Cell; isStart: boolean }[]
}

function buildSlots(
  tracks: { cells: Cell[]; divisions: number }[]
): SlotInfo[] {
  // Collect all unique positions from all tracks
  const posSet = new Set<number>()
  for (const track of tracks) {
    const layout = layoutCells(track.cells, track.divisions)
    for (const item of layout) {
      posSet.add(item.start / track.divisions)
    }
  }

  const positions = Array.from(posSet).sort((a, b) => a - b)

  return positions.map((pos) => {
    const trackInfos: SlotInfo['tracks'] = []
    for (let ti = 0; ti < tracks.length; ti++) {
      const track = tracks[ti]
      const subdivPos = Math.round(pos * track.divisions)
      const layout = layoutCells(track.cells, track.divisions)

      for (const item of layout) {
        if (subdivPos >= item.start && subdivPos < item.start + item.cell.duration) {
          trackInfos.push({
            trackIndex: ti,
            cell: item.cell,
            isStart: subdivPos === item.start,
          })
          break
        }
      }
    }
    return { position: pos, tracks: trackInfos }
  })
}

export function RollingStaff() {
  const tracks = useBeatStore(useShallow((s) => s.tracks))
  const activePosition = useBeatStore((s) => s.activePosition)
  const playing = useBeatStore((s) => s.playing)

  const slots = useMemo(() => {
    return buildSlots(tracks.map((t) => ({ cells: t.cells, divisions: t.divisions })))
  }, [tracks])

  const currentPos = playing && activePosition !== null ? activePosition : 0

  // Find nearest slot
  let currentSlotIdx = 0
  for (let i = 0; i < slots.length; i++) {
    if (slots[i].position <= currentPos) currentSlotIdx = i
  }

  const visibleSlots: { slot: SlotInfo; offset: number }[] = []
  for (let d = -HALF; d <= HALF; d++) {
    const idx = ((currentSlotIdx + d) % slots.length + slots.length) % slots.length
    visibleSlots.push({ slot: slots[idx], offset: d })
  }

  return (
    <div className="relative overflow-hidden rounded-xl bg-[var(--bg-secondary)] border border-white/5 mb-6">
      {/* Staff lines */}
      <div className="absolute inset-0 flex flex-col justify-around pointer-events-none py-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-[1px] bg-white/8" />
        ))}
      </div>

      {/* Center line */}
      <div
        className="absolute top-0 bottom-0 w-[2px] bg-yellow-400/70 z-10"
        style={{ left: `${HALF * SLOT_WIDTH + SLOT_WIDTH / 2 - 1}px` }}
      />

      {/* Slots */}
      <div
        className="flex transition-transform duration-75 ease-linear relative z-5"
        style={{ width: `${VISIBLE_SLOTS * SLOT_WIDTH}px` }}
      >
        {visibleSlots.map(({ slot, offset }) => {
          const isCurrent = offset === 0
          const isPast = offset < 0
          const opacity = isCurrent ? 'opacity-100' : isPast ? 'opacity-40' : 'opacity-70'

          return (
            <div
              key={`${offset}-${slot.position.toFixed(6)}`}
              className={`flex flex-col items-center justify-center gap-1 shrink-0 py-3
                ${opacity} ${isCurrent ? 'bg-white/5' : ''}`}
              style={{ width: `${SLOT_WIDTH}px`, minHeight: '80px' }}
            >
              {slot.tracks.length === 0 ? (
                <div className="w-2 h-2 rounded-full bg-white/5" />
              ) : (
                slot.tracks.map((t, i) => {
                  const color = TRACK_COLORS[t.trackIndex % TRACK_COLORS.length]
                  if (!t.isStart) {
                    return (
                      <div
                        key={i}
                        className={`w-6 h-[3px] rounded-full ${
                          t.cell.type === 'note' ? color.dot : 'bg-white/10'
                        }`}
                        style={{ opacity: 0.5 }}
                      />
                    )
                  }
                  return (
                    <div
                      key={i}
                      className={`w-4 h-4 rounded-full ${
                        t.cell.type === 'note' ? color.dot : 'bg-white/10'
                      }`}
                      style={{ opacity: t.cell.type === 'note' ? 1 : 0.3 }}
                    />
                  )
                })
              )}
            </div>
          )
        })}
      </div>

      {/* Fade edges */}
      <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[var(--bg-secondary)] to-transparent pointer-events-none z-20" />
      <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[var(--bg-secondary)] to-transparent pointer-events-none z-20" />
    </div>
  )
}
