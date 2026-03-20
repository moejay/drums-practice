import { useShallow } from 'zustand/react/shallow'
import { useBeatStore } from '../store'
import { BeatTrack } from './BeatTrack'

export function TrackList() {
  const trackIds = useBeatStore(useShallow((s) => s.tracks.map((t) => t.id)))
  const addTrack = useBeatStore((s) => s.addTrack)
  const trackCount = useBeatStore((s) => s.tracks.length)

  return (
    <div>
      {trackIds.map((id, i) => (
        <BeatTrack key={id} trackId={id} trackIndex={i} />
      ))}

      {trackCount < 8 && (
        <button
          onClick={() => addTrack()}
          className="mt-1 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 border-dashed rounded text-[11px] text-white/40 hover:text-white/70 transition-colors w-full"
        >
          + Add Instrument
        </button>
      )}
    </div>
  )
}
