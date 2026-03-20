import { usePlayback } from './hooks/usePlayback'
import { Transport } from './components/Transport'
import { RollingStaff } from './components/RollingStaff'
import { TrackList } from './components/TrackList'
import { PatternManager } from './components/PatternManager'

function App() {
  const { togglePlay } = usePlayback()

  return (
    <div className="p-6 max-w-4xl mx-auto w-full">
      <h1 className="text-3xl font-bold mb-1">Beat Grid</h1>
      <p className="text-[var(--text-secondary)] mb-4 text-sm">
        Build rhythms across multiple tracks. Space to play/stop.
      </p>

      <RollingStaff />

      <div className="mb-4">
        <Transport onTogglePlay={togglePlay} />
      </div>

      <div className="mb-5">
        <PatternManager />
      </div>

      <TrackList />
    </div>
  )
}

export default App
