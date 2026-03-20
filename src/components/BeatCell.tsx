import type { Cell } from '../types'

interface BeatCellProps {
  cell: Cell
  divisions: number
  isActive: boolean
  fillPercent: number // 0..1, how much of this cell has been played
  isHovered: boolean
  trackColorClass: string
  muted: boolean
  kitHex: string
  onToggleType: () => void
  onGrow: (e: React.MouseEvent) => void
  onShrink: (e: React.MouseEvent) => void
  onContextMenu: (e: React.MouseEvent) => void
  onMouseEnter: () => void
  onMouseLeave: () => void
}

export function BeatCell({
  cell,
  divisions,
  isActive,
  fillPercent,
  isHovered,
  trackColorClass,
  muted,
  kitHex,
  onToggleType,
  onGrow,
  onShrink,
  onContextMenu,
  onMouseEnter,
  onMouseLeave,
}: BeatCellProps) {
  const widthPercent = (cell.duration / divisions) * 100
  const canShrink = cell.duration > 1
  const canGrow = cell.duration * 2 <= divisions
  const isNote = cell.type === 'note'
  const showFill = isActive && fillPercent > 0

  return (
    <div
      className={`
        relative flex flex-col items-center justify-center overflow-hidden
        rounded cursor-pointer select-none
        transition-all duration-75 border
        ${isNote
          ? muted
            ? 'bg-white/5 border-white/10'
            : 'bg-white/8 border-white/20'
          : 'bg-transparent border-white/5'
        }
        ${isHovered ? 'brightness-125 bg-white/10' : ''}
        ${isActive ? 'ring-1 ring-yellow-400/80' : ''}
      `}
      style={{ width: `${widthPercent}%`, height: '44px' }}
      onClick={onToggleType}
      onContextMenu={onContextMenu}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Progress fill */}
      {showFill && (
        <div
          className="absolute inset-y-0 left-0"
          style={{
            width: `${fillPercent * 100}%`,
            background: isNote
              ? `${kitHex}22`
              : 'rgba(255,255,255,0.03)',
          }}
        />
      )}

      {/* Drum notation symbol */}
      <span className="relative z-[1]">
        {isNote ? (
          <span
            className="text-base font-bold"
            style={{ color: muted ? '#666' : kitHex }}
          >
            ×
          </span>
        ) : (
          <span className="text-white/15 text-sm">𝄾</span>
        )}
      </span>

      {isHovered && (
        <div className="absolute -bottom-1 flex gap-0.5 z-10">
          {canShrink && (
            <button
              className="w-4 h-4 rounded-full bg-black/60 hover:bg-black/80 text-[9px] flex items-center justify-center text-white/70"
              onClick={(e) => { e.stopPropagation(); onShrink(e) }}
            >−</button>
          )}
          {canGrow && (
            <button
              className="w-4 h-4 rounded-full bg-black/60 hover:bg-black/80 text-[9px] flex items-center justify-center text-white/70"
              onClick={(e) => { e.stopPropagation(); onGrow(e) }}
            >+</button>
          )}
        </div>
      )}
    </div>
  )
}
