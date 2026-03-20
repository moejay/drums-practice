import { useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useBeatStore, PRESET_PATTERNS } from '../store'
import { DRUM_KIT } from '../types'

export function PlaylistManager() {
  const activePlaylist = useBeatStore((s) => s.activePlaylist)
  const activeVariationIndex = useBeatStore((s) => s.activeVariationIndex)
  const variationBar = useBeatStore((s) => s.variationBar)
  const playing = useBeatStore((s) => s.playing)
  const playlistMode = useBeatStore((s) => s.playlistMode)
  const savedPlaylists = useBeatStore(useShallow((s) => s.savedPlaylists))
  const savedPatterns = useBeatStore(useShallow((s) => s.savedPatterns))

  const createPlaylist = useBeatStore((s) => s.createPlaylist)
  const addVariation = useBeatStore((s) => s.addVariation)
  const addVariationFromPattern = useBeatStore((s) => s.addVariationFromPattern)
  const removeVariation = useBeatStore((s) => s.removeVariation)
  const setVariationBars = useBeatStore((s) => s.setVariationBars)
  const setVariationFocus = useBeatStore((s) => s.setVariationFocus)
  const moveVariation = useBeatStore((s) => s.moveVariation)
  const jumpToVariation = useBeatStore((s) => s.jumpToVariation)
  const togglePlaylistLoop = useBeatStore((s) => s.togglePlaylistLoop)
  const togglePlaylistShuffle = useBeatStore((s) => s.togglePlaylistShuffle)
  const savePlaylist = useBeatStore((s) => s.savePlaylist)
  const loadPlaylist = useBeatStore((s) => s.loadPlaylist)
  const deletePlaylist = useBeatStore((s) => s.deletePlaylist)
  const setPlaylistMode = useBeatStore((s) => s.setPlaylistMode)

  const [newName, setNewName] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [showAddPattern, setShowAddPattern] = useState(false)

  const allPatterns = [...PRESET_PATTERNS, ...savedPatterns]

  const handleCreate = () => {
    if (newName.trim()) {
      createPlaylist(newName.trim())
      setNewName('')
      setShowCreate(false)
    }
  }

  if (!playlistMode) {
    return (
      <div className="border border-white/5 rounded-lg p-3 bg-white/[0.02]">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] text-white/40 uppercase tracking-wider">Playlist</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {showCreate ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                placeholder="Playlist name..."
                className="px-2 py-1 text-xs bg-white/10 border border-white/20 rounded w-32"
                autoFocus
              />
              <button onClick={handleCreate} className="px-2 py-1 text-[11px] bg-emerald-600 hover:bg-emerald-500 rounded">Create</button>
              <button onClick={() => setShowCreate(false)} className="px-2 py-1 text-[11px] bg-white/10 rounded">Cancel</button>
            </div>
          ) : (
            <button
              onClick={() => setShowCreate(true)}
              className="px-2 py-1 text-[11px] bg-white/5 hover:bg-white/10 border border-dashed border-white/15 rounded text-white/50 hover:text-white/80"
            >
              + New Playlist
            </button>
          )}

          {savedPlaylists.map(pl => (
            <div key={pl.id} className="flex items-center gap-0.5">
              <button
                onClick={() => loadPlaylist(pl.id)}
                className="px-2 py-1 text-[11px] bg-violet-900/40 hover:bg-violet-800/50 border border-violet-700/30 rounded-l"
              >
                {pl.name} ({pl.variations.length})
              </button>
              <button
                onClick={() => deletePlaylist(pl.id)}
                className="px-1 py-1 text-[11px] bg-red-900/30 hover:bg-red-800/40 border border-red-700/30 rounded-r text-red-400/60 hover:text-red-400"
              >×</button>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Playlist mode — full editor
  return (
    <div className="border border-violet-500/20 rounded-lg p-3 bg-violet-950/20">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-bold text-violet-300">
          {activePlaylist?.name ?? 'Playlist'}
        </span>

        {activePlaylist && (
          <>
            <button
              onClick={togglePlaylistLoop}
              className={`px-2 py-0.5 text-[10px] rounded font-mono ${
                activePlaylist.loop ? 'bg-emerald-600/80 text-white' : 'bg-white/10 text-white/40'
              }`}
            >Loop</button>
            <button
              onClick={togglePlaylistShuffle}
              className={`px-2 py-0.5 text-[10px] rounded font-mono ${
                activePlaylist.shuffle ? 'bg-amber-600/80 text-white' : 'bg-white/10 text-white/40'
              }`}
            >Shuffle</button>
            <button onClick={savePlaylist} className="px-2 py-0.5 text-[10px] bg-violet-600 hover:bg-violet-500 rounded">
              Save
            </button>
          </>
        )}

        <button
          onClick={() => setPlaylistMode(false)}
          className="px-2 py-0.5 text-[10px] bg-white/10 hover:bg-white/20 rounded ml-auto"
        >
          Exit Playlist
        </button>
      </div>

      {/* Progress indicator */}
      {playing && activePlaylist && activePlaylist.variations.length > 0 && (
        <div className="mb-2 flex items-center gap-2 text-[11px] font-mono">
          <span className="text-violet-300">
            Var {activeVariationIndex + 1}/{activePlaylist.variations.length}
          </span>
          <span className="text-white/30">·</span>
          <span className="text-white/50">
            Bar {variationBar + 1}/{activePlaylist.variations[activeVariationIndex]?.bars ?? '?'}
          </span>
          {/* Mini progress bar */}
          <div className="flex-1 h-1 bg-white/5 rounded overflow-hidden">
            <div
              className="h-full bg-violet-500 transition-all duration-200"
              style={{
                width: activePlaylist.variations[activeVariationIndex]
                  ? `${((variationBar + 1) / activePlaylist.variations[activeVariationIndex].bars) * 100}%`
                  : '0%',
              }}
            />
          </div>
        </div>
      )}

      {/* Variation list */}
      {activePlaylist && (
        <div className="space-y-1 mb-2">
          {activePlaylist.variations.map((v, idx) => {
            const isCurrent = playing && idx === activeVariationIndex
            const kitNames = v.tracks.map(t => {
              const kit = DRUM_KIT.find(k => k.id === t.kitId)
              return kit?.shortName ?? '?'
            }).join(' + ')

            return (
              <div
                key={v.id}
                className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-all ${
                  isCurrent
                    ? 'bg-violet-600/30 border border-violet-400/40'
                    : 'bg-white/[0.03] border border-transparent hover:bg-white/[0.06]'
                }`}
                onClick={() => jumpToVariation(idx)}
              >
                <span className="text-[10px] font-mono text-white/30 w-4">{idx + 1}</span>
                <span className={`text-[11px] font-bold flex-1 ${isCurrent ? 'text-violet-200' : 'text-white/70'}`}>
                  {v.name}
                </span>
                <span className="text-[9px] text-white/30 font-mono">{kitNames}</span>

                {/* Focus instrument */}
                <select
                  value={v.focusKitId ?? ''}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => setVariationFocus(v.id, e.target.value || undefined)}
                  className="bg-white/5 rounded px-1 py-0.5 text-[9px] font-mono cursor-pointer border border-white/10 w-14"
                  title="Focus instrument"
                >
                  <option value="">--</option>
                  {v.tracks.map(t => {
                    const kit = DRUM_KIT.find(k => k.id === t.kitId)
                    return <option key={t.kitId} value={t.kitId}>{kit?.shortName ?? t.kitId}</option>
                  })}
                </select>

                {/* Bar count */}
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={(e) => { e.stopPropagation(); setVariationBars(v.id, v.bars - 1) }}
                    className="w-4 h-4 rounded bg-white/10 hover:bg-white/20 text-[9px] flex items-center justify-center"
                  >−</button>
                  <span className="text-[10px] font-mono w-5 text-center text-white/50">{v.bars}×</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); setVariationBars(v.id, v.bars + 1) }}
                    className="w-4 h-4 rounded bg-white/10 hover:bg-white/20 text-[9px] flex items-center justify-center"
                  >+</button>
                </div>

                {/* Move up/down */}
                {idx > 0 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); moveVariation(idx, idx - 1) }}
                    className="text-[10px] text-white/20 hover:text-white/60"
                  >↑</button>
                )}
                {idx < activePlaylist.variations.length - 1 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); moveVariation(idx, idx + 1) }}
                    className="text-[10px] text-white/20 hover:text-white/60"
                  >↓</button>
                )}

                <button
                  onClick={(e) => { e.stopPropagation(); removeVariation(v.id) }}
                  className="text-[10px] text-red-400/40 hover:text-red-400"
                >×</button>
              </div>
            )
          })}
        </div>
      )}

      {/* Add variation */}
      <div className="flex flex-wrap gap-1">
        <button
          onClick={() => addVariation()}
          className="px-2 py-1 text-[11px] bg-white/5 hover:bg-white/10 border border-dashed border-white/15 rounded text-white/50 hover:text-white/80"
        >
          + Add current pattern
        </button>

        {showAddPattern ? (
          <div className="flex items-center gap-1">
            <select
              onChange={(e) => { addVariationFromPattern(e.target.value); setShowAddPattern(false) }}
              className="bg-white/10 rounded px-2 py-1 text-[11px] cursor-pointer border border-white/20"
              defaultValue=""
            >
              <option value="" disabled>Pick pattern...</option>
              {allPatterns.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <button onClick={() => setShowAddPattern(false)} className="text-[10px] text-white/40">cancel</button>
          </div>
        ) : (
          <button
            onClick={() => setShowAddPattern(true)}
            className="px-2 py-1 text-[11px] bg-white/5 hover:bg-white/10 border border-dashed border-white/15 rounded text-white/50 hover:text-white/80"
          >
            + From preset/saved
          </button>
        )}
      </div>

      <div className="mt-2 text-[9px] text-white/20">
        Keys: ← → jump variations · Space play/stop
      </div>
    </div>
  )
}
