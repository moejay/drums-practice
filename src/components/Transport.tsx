import { useBeatStore } from '../store'

interface TransportProps {
  onTogglePlay: () => void
}

export function Transport({ onTogglePlay }: TransportProps) {
  const bpm = useBeatStore((s) => s.bpm)
  const playing = useBeatStore((s) => s.playing)
  const loop = useBeatStore((s) => s.loop)
  const countingEnabled = useBeatStore((s) => s.countingEnabled)
  const countingVolume = useBeatStore((s) => s.countingVolume)
  const setBpm = useBeatStore((s) => s.setBpm)
  const toggleLoop = useBeatStore((s) => s.toggleLoop)
  const toggleCounting = useBeatStore((s) => s.toggleCounting)
  const setCountingVolume = useBeatStore((s) => s.setCountingVolume)
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
        onClick={toggleCounting}
        title="Toggle counting tones (key: C)"
        className={`
          px-3 py-1.5 rounded text-xs font-mono transition-colors
          ${countingEnabled
            ? 'bg-sky-600/80 hover:bg-sky-500 text-white'
            : 'bg-white/10 hover:bg-white/20 text-white/60'}
        `}
      >
        Count {countingEnabled ? 'ON' : 'OFF'}
      </button>

      {countingEnabled && (
        <div className="flex items-center gap-1">
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(countingVolume * 100)}
            onChange={(e) => setCountingVolume(Number(e.target.value) / 100)}
            className="w-16 h-3 accent-sky-400"
            title={`Count volume: ${Math.round(countingVolume * 100)}%`}
          />
          <span className="text-[9px] font-mono text-white/30 w-5">{Math.round(countingVolume * 100)}</span>
        </div>
      )}

      <button
        onClick={resetAll}
        className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded text-xs transition-colors"
      >
        Reset All
      </button>
    </div>
  )
}
