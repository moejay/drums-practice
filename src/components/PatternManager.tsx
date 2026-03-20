import { useState } from 'react'
import { useBeatStore, PRESET_PATTERNS } from '../store'

export function PatternManager() {
  const savedPatterns = useBeatStore((s) => s.savedPatterns)
  const savePattern = useBeatStore((s) => s.savePattern)
  const loadPattern = useBeatStore((s) => s.loadPattern)
  const deletePattern = useBeatStore((s) => s.deletePattern)
  const [showSave, setShowSave] = useState(false)
  const [name, setName] = useState('')

  const handleSave = () => {
    if (name.trim()) {
      savePattern(name.trim())
      setName('')
      setShowSave(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] text-white/40 uppercase tracking-wider">Presets</span>
        {PRESET_PATTERNS.map((p) => (
          <button
            key={p.id}
            onClick={() => loadPattern(p.id)}
            className="px-2 py-1 text-[11px] bg-white/5 hover:bg-white/15 border border-white/10 rounded transition-colors"
          >
            {p.name}
          </button>
        ))}
      </div>

      {savedPatterns.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] text-white/40 uppercase tracking-wider">Saved</span>
          {savedPatterns.map((p) => (
            <div key={p.id} className="flex items-center gap-0.5">
              <button
                onClick={() => loadPattern(p.id)}
                className="px-2 py-1 text-[11px] bg-emerald-900/40 hover:bg-emerald-800/50 border border-emerald-700/30 rounded-l transition-colors"
              >
                {p.name}
              </button>
              <button
                onClick={() => deletePattern(p.id)}
                className="px-1 py-1 text-[11px] bg-red-900/30 hover:bg-red-800/40 border border-red-700/30 rounded-r transition-colors text-red-400/60 hover:text-red-400"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        {showSave ? (
          <>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              placeholder="Pattern name..."
              className="px-2 py-1 text-xs bg-white/10 border border-white/20 rounded w-40"
              autoFocus
            />
            <button
              onClick={handleSave}
              className="px-2 py-1 text-[11px] bg-emerald-600 hover:bg-emerald-500 rounded transition-colors"
            >
              Save
            </button>
            <button
              onClick={() => { setShowSave(false); setName('') }}
              className="px-2 py-1 text-[11px] bg-white/10 hover:bg-white/20 rounded transition-colors"
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            onClick={() => setShowSave(true)}
            className="px-2 py-1 text-[11px] bg-white/5 hover:bg-white/10 border border-dashed border-white/15 rounded transition-colors text-white/50 hover:text-white/80"
          >
            Save current pattern
          </button>
        )}
      </div>
    </div>
  )
}
