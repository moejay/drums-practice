import { useState, useCallback } from 'react'
import { useBeatStore } from '../store'
import { layoutCells, cycleCell, layoutIndexAtStep } from '../utils'
import { DRUM_KIT } from '../types'
import { BeatCell } from './BeatCell'

interface BeatTrackProps {
  trackId: string
  trackIndex: number
}

export function BeatTrack({ trackId, trackIndex }: BeatTrackProps) {
  const track = useBeatStore((s) => s.tracks.find((t) => t.id === trackId))
  const activePosition = useBeatStore((s) => s.activePosition)
  const soloTrackId = useBeatStore((s) => s.soloTrackId)
  const updateCells = useBeatStore((s) => s.updateCells)
  const removeTrack = useBeatStore((s) => s.removeTrack)
  const resetTrack = useBeatStore((s) => s.resetTrack)
  const setTrackDivisions = useBeatStore((s) => s.setTrackDivisions)
  const setTrackKit = useBeatStore((s) => s.setTrackKit)
  const setTrackVolume = useBeatStore((s) => s.setTrackVolume)
  const toggleMute = useBeatStore((s) => s.toggleMute)
  const toggleSolo = useBeatStore((s) => s.toggleSolo)
  const trackCount = useBeatStore((s) => s.tracks.length)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  if (!track) return null

  const kit = DRUM_KIT.find(k => k.id === track.kitId) ?? DRUM_KIT[0]
  const { divisions } = track
  const layout = layoutCells(track.cells, divisions)
  const isSoloed = soloTrackId === trackId
  const isBackgrounded = soloTrackId !== null && !isSoloed

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
      if (newDiv >= 1 && newDiv <= 32) setTrackDivisions(trackId, newDiv)
    },
    [trackId, setTrackDivisions]
  )

  return (
    <div className={`mb-2 transition-opacity duration-150 ${
      track.muted ? 'opacity-40' : isBackgrounded ? 'opacity-50' : ''
    }`}>
      <div className="flex items-center gap-1.5 mb-0.5">
        {/* Track number badge */}
        <span className="text-[9px] font-mono text-white/25 w-3 text-center">{trackIndex + 1}</span>

        {/* Kit color dot */}
        <div
          className={`w-2.5 h-2.5 rounded-full ${isSoloed ? kit.activeColor : kit.color}`}
          style={isSoloed ? { boxShadow: `0 0 6px ${kit.hex}` } : undefined}
        />

        {/* Instrument selector */}
        <select
          value={track.kitId}
          onChange={(e) => setTrackKit(trackId, e.target.value)}
          className="bg-white/5 rounded px-1.5 py-0.5 text-[11px] font-mono cursor-pointer border border-white/10"
        >
          {DRUM_KIT.map(k => (
            <option key={k.id} value={k.id}>{k.shortName} — {k.name}</option>
          ))}
        </select>

        {/* Solo/Focus */}
        <button
          onClick={() => toggleSolo(trackId)}
          className={`px-1.5 py-0.5 text-[10px] rounded font-mono transition-colors ${
            isSoloed
              ? 'bg-amber-500 text-black font-bold'
              : 'bg-white/5 text-white/40 hover:text-white/70'
          }`}
          title={`Focus track ${trackIndex + 1} (key: ${trackIndex + 1})`}
        >
          S
        </button>

        {/* Mute */}
        <button
          onClick={() => toggleMute(trackId)}
          className={`px-1.5 py-0.5 text-[10px] rounded font-mono transition-colors ${
            track.muted
              ? 'bg-red-600/80 text-red-100'
              : 'bg-white/5 text-white/40 hover:text-white/70'
          }`}
        >
          M
        </button>

        {/* Volume slider */}
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(track.volume * 100)}
          onChange={(e) => setTrackVolume(trackId, Number(e.target.value) / 100)}
          className="w-16 h-3 accent-white/50"
          title={`Volume: ${Math.round(track.volume * 100)}%`}
        />
        <span className="text-[9px] font-mono text-white/30 w-6">
          {Math.round(track.volume * 100)}
        </span>

        {/* Divisions */}
        <div className="flex items-center gap-0.5">
          <span className="text-[10px] text-white/30">÷</span>
          <button
            onClick={() => handleDivisionsChange(divisions - 1)}
            className="w-4 h-4 rounded bg-white/10 hover:bg-white/20 text-[10px] flex items-center justify-center"
          >−</button>
          <span className="text-[11px] font-mono w-4 text-center">{divisions}</span>
          <button
            onClick={() => handleDivisionsChange(divisions + 1)}
            className="w-4 h-4 rounded bg-white/10 hover:bg-white/20 text-[10px] flex items-center justify-center"
          >+</button>
        </div>

        <button
          onClick={() => resetTrack(trackId)}
          className="text-[10px] text-white/30 hover:text-white/60"
        >
          clear
        </button>
        {trackCount > 1 && (
          <button
            onClick={() => removeTrack(trackId)}
            className="text-[10px] text-red-400/40 hover:text-red-400 ml-auto"
          >
            ×
          </button>
        )}
      </div>

      {/* Grid */}
      <div className="flex gap-[1px]" style={{ marginLeft: '14px' }}>
        {layout.map((item, layoutIdx) => {
          // Compute fill progress for this cell
          let fillPercent = 0
          if (activePosition !== null && layoutIdx === activeLayoutIdx) {
            const cellStart = item.start / divisions
            const cellEnd = (item.start + item.cell.duration) / divisions
            const cellSpan = cellEnd - cellStart
            if (cellSpan > 0) {
              fillPercent = Math.max(0, Math.min(1, (activePosition - cellStart) / cellSpan))
            }
          } else if (activePosition !== null) {
            // Cells before the active one are fully filled
            const cellEnd = (item.start + item.cell.duration) / divisions
            if (activePosition >= cellEnd) fillPercent = 1
          }

          return (
          <BeatCell
            key={`${item.start}-${item.cell.duration}`}
            cell={item.cell}
            divisions={divisions}
            isActive={layoutIdx === activeLayoutIdx}
            fillPercent={fillPercent}
            isHovered={hoveredIndex === layoutIdx}
            trackColorClass={kit.activeColor}
            muted={track.muted}
            kitHex={kit.hex}
            onToggleType={() => handleCycle(layoutIdx, 'type')}
            onGrow={(e) => { e.preventDefault(); handleCycle(layoutIdx, 'grow') }}
            onShrink={(e) => { e.preventDefault(); handleCycle(layoutIdx, 'shrink') }}
            onContextMenu={(e) => { e.preventDefault(); handleCycle(layoutIdx, 'shrink') }}
            onMouseEnter={() => setHoveredIndex(layoutIdx)}
            onMouseLeave={() => setHoveredIndex(null)}
          />
          )
        })}
      </div>
    </div>
  )
}
