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

      {trackCount < 6 && (
        <button
          onClick={addTrack}
          className="mt-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 border-dashed rounded-lg text-sm text-white/50 hover:text-white/80 transition-colors w-full"
        >
          + Add Track
        </button>
      )}
    </div>
  )
}
