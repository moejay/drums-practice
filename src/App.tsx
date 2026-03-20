import { usePlayback } from './hooks/usePlayback'
import { Transport } from './components/Transport'
import { RollingStaff } from './components/RollingStaff'
import { TrackList } from './components/TrackList'
import { PatternManager } from './components/PatternManager'
import { PlaylistManager } from './components/PlaylistManager'
import { PlaylistGenerator } from './components/PlaylistGenerator'
import { DrumKitView } from './components/DrumKit'
import { PolyCircle } from './components/PolyCircle'

function App() {
  const { togglePlay } = usePlayback()

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Rolling notation — top */}
      <div className="shrink-0 px-4 pt-3">
        <RollingStaff />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex gap-4 px-4 py-3 overflow-hidden min-h-0">
        {/* Left: Track editors */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <Transport onTogglePlay={togglePlay} />
          </div>

          <div className="mb-3">
            <PatternManager />
          </div>

          <div className="mb-3">
            <PlaylistGenerator />
          </div>

          <div className="mb-3">
            <PlaylistManager />
          </div>

          <TrackList />
        </div>

        {/* Right: Poly circle + Drum kit */}
        <div className="w-72 shrink-0 flex flex-col gap-3">
          <div className="bg-zinc-950/50 rounded-xl border border-white/5 p-2">
            <PolyCircle />
          </div>
          <div className="flex-1 bg-zinc-950/50 rounded-xl border border-white/5 p-2">
            <DrumKitView />
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
