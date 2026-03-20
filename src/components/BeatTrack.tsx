import { useState, useCallback } from 'react'
import { useBeatStore } from '../store'
import { layoutCells, cycleCell, layoutIndexAtStep } from '../utils'
import { TRACK_COLORS } from '../types'
import { BeatCell } from './BeatCell'

interface BeatTrackProps {
  trackId: string
  trackIndex: number
}

export function BeatTrack({ trackId, trackIndex }: BeatTrackProps) {
  const track = useBeatStore((s) => s.tracks.find((t) => t.id === trackId))
  const activePosition = useBeatStore((s) => s.activePosition)
  const updateCells = useBeatStore((s) => s.updateCells)
  const removeTrack = useBeatStore((s) => s.removeTrack)
  const resetTrack = useBeatStore((s) => s.resetTrack)
  const setTrackDivisions = useBeatStore((s) => s.setTrackDivisions)
  const toggleMute = useBeatStore((s) => s.toggleMute)
  const trackCount = useBeatStore((s) => s.tracks.length)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  if (!track) return null

  const { divisions } = track
  const layout = layoutCells(track.cells, divisions)
  const color = TRACK_COLORS[trackIndex % TRACK_COLORS.length]

  // Map activePosition (0..1) to this track's division
  const activeDiv = activePosition !== null
    ? Math.floor(activePosition * divisions) % divisions
    : null
  const activeLayoutIdx = activeDiv !== null
    ? layoutIndexAtStep(layout, activeDiv)
    : -1

  const handleCycle = useCallback(
    (layoutIdx: number, dir: 'type' | 'grow' | 'shrink') => {
      const current = useBeatStore.getState().tracks.find((t) => t.id === trackId)
      if (!current) return
      updateCells(trackId, cycleCell(current.cells, layoutIdx, dir, current.divisions))
    },
    [trackId, updateCells]
  )

  const handleDivisionsChange = useCallback(
    (newDiv: number) => {
      if (newDiv >= 1 && newDiv <= 32) {
        setTrackDivisions(trackId, newDiv)
      }
    },
    [trackId, setTrackDivisions]
  )

  return (
    <div className={`mb-3 ${track.muted ? 'opacity-60' : ''}`}>
      {/* Track header */}
      <div className="flex items-center gap-2 mb-1">
        <div className={`w-3 h-3 rounded-full ${color.note}`} />
        <span className="text-xs font-bold">{track.name}</span>

        {/* Mute */}
        <button
          onClick={() => toggleMute(trackId)}
          className={`px-2 py-0.5 text-[10px] rounded transition-colors font-mono ${
            track.muted
              ? 'bg-yellow-600/80 text-yellow-100'
              : 'bg-white/5 text-white/40 hover:text-white/70'
          }`}
        >
          {track.muted ? 'MUTED' : 'M'}
        </button>

        {/* Divisions */}
        <div className="flex items-center gap-1 ml-1">
          <button
            onClick={() => handleDivisionsChange(divisions - 1)}
            className="w-5 h-5 rounded bg-white/10 hover:bg-white/20 text-xs flex items-center justify-center"
          >
            −
          </button>
          <span className="text-xs font-mono w-5 text-center">{divisions}</span>
          <button
            onClick={() => handleDivisionsChange(divisions + 1)}
            className="w-5 h-5 rounded bg-white/10 hover:bg-white/20 text-xs flex items-center justify-center"
          >
            +
          </button>
        </div>

        <button
          onClick={() => resetTrack(trackId)}
          className="text-[10px] text-white/40 hover:text-white/70 ml-1"
        >
          clear
        </button>
        {trackCount > 1 && (
          <button
            onClick={() => removeTrack(trackId)}
            className="text-[10px] text-red-400/60 hover:text-red-400 ml-auto"
          >
            remove
          </button>
        )}
      </div>

      {/* Division ticks */}
      <div className="flex mb-0.5 gap-[1px]">
        {Array.from({ length: divisions }, (_, i) => {
          const pos = i / divisions
          const isActive = activePosition !== null &&
            activePosition >= pos &&
            activePosition < (i + 1) / divisions
          return (
            <div
              key={i}
              className={`flex-1 h-0.5 ${isActive ? 'bg-yellow-400' : 'bg-white/15'}`}
            />
          )
        })}
      </div>

      {/* Grid */}
      <div className="flex gap-[2px]">
        {layout.map((item, layoutIdx) => (
          <BeatCell
            key={`${item.start}-${item.cell.duration}`}
            cell={item.cell}
            divisions={divisions}
            isActive={layoutIdx === activeLayoutIdx}
            isHovered={hoveredIndex === layoutIdx}
            trackColorClass={color.note}
            muted={track.muted}
            onToggleType={() => handleCycle(layoutIdx, 'type')}
            onGrow={(e) => { e.preventDefault(); handleCycle(layoutIdx, 'grow') }}
            onShrink={(e) => { e.preventDefault(); handleCycle(layoutIdx, 'shrink') }}
            onContextMenu={(e) => { e.preventDefault(); handleCycle(layoutIdx, 'shrink') }}
            onMouseEnter={() => setHoveredIndex(layoutIdx)}
            onMouseLeave={() => setHoveredIndex(null)}
          />
        ))}
      </div>
    </div>
  )
}
