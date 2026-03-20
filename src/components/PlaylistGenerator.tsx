import { useState } from 'react'
import { useBeatStore } from '../store'
import { DURATION_PRESETS, BARS_PER_VAR_OPTIONS } from '../generator'
import type { GenerateMode } from '../generator'

export function PlaylistGenerator() {
  const bpm = useBeatStore((s) => s.bpm)
  const generateAndLoad = useBeatStore((s) => s.generateAndLoadPlaylist)

  const [duration, setDuration] = useState(120) // seconds
  const [mode, setMode] = useState<GenerateMode>('both')
  const [barsPerVar, setBarsPerVar] = useState(2)
  const [expanded, setExpanded] = useState(false)

  const measureDur = (60 / bpm) * 4
  const totalBars = Math.ceil(duration / measureDur)
  const variationCount = Math.ceil(totalBars / barsPerVar)

  const handleGenerate = () => {
    generateAndLoad({ durationSeconds: duration, bpm, mode, barsPerVariation: barsPerVar })
  }

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="w-full px-3 py-2 text-[11px] bg-gradient-to-r from-violet-900/30 to-fuchsia-900/30 hover:from-violet-800/40 hover:to-fuchsia-800/40 border border-violet-500/20 rounded-lg text-violet-300 hover:text-violet-200 transition-colors"
      >
        Generate Practice Playlist
      </button>
    )
  }

  return (
    <div className="border border-violet-500/20 rounded-lg p-3 bg-gradient-to-b from-violet-950/30 to-fuchsia-950/20">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-violet-300">Generate Playlist</span>
        <button
          onClick={() => setExpanded(false)}
          className="text-[10px] text-white/30 hover:text-white/60"
        >close</button>
      </div>

      {/* Duration */}
      <div className="mb-3">
        <div className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Duration</div>
        <div className="flex flex-wrap gap-1">
          {DURATION_PRESETS.map(d => (
            <button
              key={d.seconds}
              onClick={() => setDuration(d.seconds)}
              className={`px-2 py-1 text-[11px] rounded transition-colors ${
                duration === d.seconds
                  ? 'bg-violet-600 text-white'
                  : 'bg-white/5 text-white/50 hover:bg-white/10'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mode */}
      <div className="mb-3">
        <div className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Vary</div>
        <div className="flex gap-1">
          {([
            ['polyrhythms', 'Polyrhythms', 'Change the rhythm ratio each variation'],
            ['instruments', 'Instruments', 'Same polyrhythm, different drums each time'],
            ['both', 'Both', 'Change both rhythm and instruments'],
          ] as [GenerateMode, string, string][]).map(([m, label, title]) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              title={title}
              className={`px-3 py-1.5 text-[11px] rounded transition-colors flex-1 ${
                mode === m
                  ? 'bg-violet-600 text-white'
                  : 'bg-white/5 text-white/50 hover:bg-white/10'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Bars per variation */}
      <div className="mb-3">
        <div className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Bars per variation</div>
        <div className="flex gap-1">
          {BARS_PER_VAR_OPTIONS.map(b => (
            <button
              key={b}
              onClick={() => setBarsPerVar(b)}
              className={`px-3 py-1 text-[11px] rounded transition-colors ${
                barsPerVar === b
                  ? 'bg-violet-600 text-white'
                  : 'bg-white/5 text-white/50 hover:bg-white/10'
              }`}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      {/* Summary + generate button */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleGenerate}
          className="px-4 py-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 rounded-lg text-sm font-bold transition-colors"
        >
          Generate
        </button>
        <span className="text-[10px] text-white/30 font-mono">
          ~{variationCount} variations · {totalBars} bars · {Math.round(duration / 60 * 10) / 10} min @ {bpm} BPM
        </span>
      </div>
    </div>
  )
}
