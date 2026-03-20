import type { Cell } from '../types'

interface BeatCellProps {
  cell: Cell
  divisions: number
  isActive: boolean
  isHovered: boolean
  trackColorClass: string
  muted: boolean
  onToggleType: () => void
  onGrow: (e: React.MouseEvent) => void
  onShrink: (e: React.MouseEvent) => void
  onContextMenu: (e: React.MouseEvent) => void
  onMouseEnter: () => void
  onMouseLeave: () => void
}

function cellColor(cell: Cell, trackColorClass: string, muted: boolean): string {
  if (cell.type === 'rest') return 'bg-zinc-700/50'
  if (muted) return 'bg-zinc-600/60'
  return trackColorClass
}

function cellLabel(cell: Cell, duration: number): string {
  if (cell.type === 'rest') return duration === 1 ? '·' : `·${duration}`
  return duration === 1 ? '●' : `●${duration}`
}

export function BeatCell({
  cell,
  divisions,
  isActive,
  isHovered,
  trackColorClass,
  muted,
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

  return (
    <div
      className={`
        relative flex flex-col items-center justify-center
        rounded-md border-2 cursor-pointer select-none
        transition-all duration-75
        ${cellColor(cell, trackColorClass, muted)}
        ${cell.type === 'note' ? (muted ? 'border-white/15' : 'border-white/30') : 'border-white/10'}
        ${isHovered ? 'brightness-125 scale-[1.02]' : ''}
        ${isActive ? 'ring-2 ring-yellow-400 brightness-150' : ''}
        ${muted && cell.type === 'note' ? 'opacity-50' : ''}
      `}
      style={{ width: `${widthPercent}%`, height: '64px' }}
      onClick={onToggleType}
      onContextMenu={onContextMenu}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <span className="text-lg leading-none">
        {cellLabel(cell, cell.duration)}
      </span>

      {isHovered && (
        <div className="absolute bottom-0.5 flex gap-1">
          {canShrink && (
            <button
              className="w-5 h-5 rounded bg-black/40 hover:bg-black/60 text-xs flex items-center justify-center"
              onClick={(e) => { e.stopPropagation(); onShrink(e) }}
            >
              −
            </button>
          )}
          {canGrow && (
            <button
              className="w-5 h-5 rounded bg-black/40 hover:bg-black/60 text-xs flex items-center justify-center"
              onClick={(e) => { e.stopPropagation(); onGrow(e) }}
            >
              +
            </button>
          )}
        </div>
      )}
    </div>
  )
}
