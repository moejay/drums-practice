import { useBeatStore } from '../store'

interface TransportProps {
  onTogglePlay: () => void
}

export function Transport({ onTogglePlay }: TransportProps) {
  const bpm = useBeatStore((s) => s.bpm)
  const playing = useBeatStore((s) => s.playing)
  const loop = useBeatStore((s) => s.loop)
  const setBpm = useBeatStore((s) => s.setBpm)
  const toggleLoop = useBeatStore((s) => s.toggleLoop)
  const resetAll = useBeatStore((s) => s.resetAll)

  return (
    <div className="flex items-center gap-4 flex-wrap">
      <button
        onClick={onTogglePlay}
        className={`
          px-5 py-2.5 rounded-lg font-bold text-sm transition-colors
          ${playing ? 'bg-red-600 hover:bg-red-500' : 'bg-emerald-600 hover:bg-emerald-500'}
        `}
      >
        {playing ? 'Stop' : 'Play'}
      </button>

      <div className="flex items-center gap-2">
        <label className="text-xs text-[var(--text-secondary)]">BPM</label>
        <input
          type="range"
          min={40}
          max={300}
          value={bpm}
          onChange={(e) => setBpm(Number(e.target.value))}
          className="w-28 accent-emerald-500"
        />
        <input
          type="number"
          min={40}
          max={300}
          value={bpm}
          onChange={(e) => setBpm(Number(e.target.value))}
          className="w-14 bg-white/10 rounded px-2 py-1 text-sm text-center font-mono"
        />
      </div>

      <button
        onClick={toggleLoop}
        className={`
          px-3 py-1.5 rounded text-xs font-mono transition-colors
          ${loop ? 'bg-emerald-600/80 hover:bg-emerald-500' : 'bg-white/10 hover:bg-white/20'}
        `}
      >
        Loop {loop ? 'ON' : 'OFF'}
      </button>

      <button
        onClick={resetAll}
        className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded text-xs transition-colors"
      >
        Reset All
      </button>
    </div>
  )
}
