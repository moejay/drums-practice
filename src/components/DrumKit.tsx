import { useBeatStore } from '../store'
import { DRUM_KIT } from '../types'
import { useShallow } from 'zustand/react/shallow'

export function DrumKitView() {
  const tracks = useBeatStore(useShallow((s) => s.tracks))
  const activeHits = useBeatStore((s) => s.activeHits)
  const upcomingKitIds = useBeatStore(useShallow((s) => s.upcomingKitIds))
  const addTrack = useBeatStore((s) => s.addTrack)
  const playlistMode = useBeatStore((s) => s.playlistMode)

  const usedKitIds = new Set(tracks.map(t => t.kitId))
  const upcomingSet = new Set(upcomingKitIds)

  return (
    <div className="relative w-full" style={{ paddingBottom: '60%', minHeight: '280px' }}>
      {DRUM_KIT.map((kit) => {
        const isActive = activeHits.has(kit.id)
        const isEnabled = usedKitIds.has(kit.id)
        const track = tracks.find(t => t.kitId === kit.id)
        const isMuted = track?.muted ?? false
        const isUpcoming = playlistMode && upcomingSet.has(kit.id) && !isEnabled
        const size = kit.size * 28

        return (
          <button
            key={kit.id}
            onClick={() => {
              if (!isEnabled) addTrack(kit.id)
            }}
            className={`
              absolute rounded-full flex flex-col items-center justify-center
              transition-all duration-75 border-2
              ${isActive && !isMuted
                ? `${kit.activeColor} border-white/60 shadow-lg shadow-white/20 scale-105`
                : isEnabled
                  ? `${kit.color} border-white/20 ${isMuted ? 'opacity-30' : ''}`
                  : isUpcoming
                    ? `${kit.color} border-dashed opacity-30`
                    : 'bg-white/5 border-white/10 border-dashed opacity-40 hover:opacity-70'
              }
              ${isUpcoming ? 'animate-pulse' : ''}
            `}
            style={{
              width: `${size}px`,
              height: `${size}px`,
              left: `${kit.position.x}%`,
              top: `${kit.position.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <span className={`font-bold text-xs ${isActive && !isMuted ? 'text-black' : 'text-white/80'}`}>
              {kit.shortName}
            </span>
            {isEnabled && (
              <span className="text-[8px] text-white/40 mt-0.5">
                ÷{track?.divisions}
              </span>
            )}
            {isUpcoming && !isEnabled && (
              <span className="text-[7px] text-white/30 mt-0.5">next</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
