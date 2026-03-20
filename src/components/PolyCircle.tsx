import { useShallow } from 'zustand/react/shallow'
import { useBeatStore } from '../store'
import { DRUM_KIT } from '../types'

const SIZE = 220
const CX = SIZE / 2
const CY = SIZE / 2
const RADIUS = SIZE / 2 - 20

// Generate polygon points inscribed in a circle
function polygonPoints(n: number, radius: number, rotationRad: number): [number, number][] {
  const pts: [number, number][] = []
  for (let i = 0; i < n; i++) {
    const angle = rotationRad + (i / n) * Math.PI * 2 - Math.PI / 2
    pts.push([
      CX + Math.cos(angle) * radius,
      CY + Math.sin(angle) * radius,
    ])
  }
  return pts
}

function pointsToPath(pts: [number, number][]): string {
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(' ') + ' Z'
}

// Dot position on the circle at a given fraction (0..1)
function dotPosition(fraction: number, radius: number): [number, number] {
  const angle = fraction * Math.PI * 2 - Math.PI / 2
  return [
    CX + Math.cos(angle) * radius,
    CY + Math.sin(angle) * radius,
  ]
}

export function PolyCircle() {
  const tracks = useBeatStore(useShallow((s) => s.tracks))
  const activePosition = useBeatStore((s) => s.activePosition)
  const playing = useBeatStore((s) => s.playing)
  const activeHits = useBeatStore((s) => s.activeHits)

  const pos = playing && activePosition !== null ? activePosition : 0
  // Rotation: the whole circle spins so the current position is at the top
  const rotation = pos * Math.PI * 2

  return (
    <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="block mx-auto">
      {/* Background circle */}
      <circle cx={CX} cy={CY} r={RADIUS} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={1} />

      {/* Tick marks around the circle for reference */}
      {[0, 0.25, 0.5, 0.75].map((f) => {
        const [x, y] = dotPosition(f, RADIUS + 8)
        return (
          <circle key={f} cx={x} cy={y} r={1.5} fill="rgba(255,255,255,0.15)" />
        )
      })}

      {/* Polygons — one per track, each with N sides = divisions */}
      {tracks.map((track, trackIdx) => {
        const kit = DRUM_KIT.find(k => k.id === track.kitId)
        const color = kit?.hex ?? '#fff'
        const n = track.divisions
        if (n < 2) return null

        // Each polygon is inscribed in a slightly different radius for visual separation
        const r = RADIUS - trackIdx * 6
        const pts = polygonPoints(n, r, -rotation)
        const path = pointsToPath(pts)

        return (
          <g key={track.id}>
            {/* Polygon */}
            <path
              d={path}
              fill={color}
              fillOpacity={track.muted ? 0.02 : 0.08}
              stroke={color}
              strokeWidth={track.muted ? 0.5 : 1.5}
              opacity={track.muted ? 0.15 : 0.5}
            />

            {/* Vertex dots */}
            {pts.map((pt, i) => {
              // Check if this vertex is the "current" one being hit
              const vertexFraction = i / n
              const distToPos = Math.abs(vertexFraction - (pos % 1))
              const isNearCurrent = distToPos < 0.02 || distToPos > 0.98
              const isHit = isNearCurrent && activeHits.has(track.kitId)

              return (
                <circle
                  key={i}
                  cx={pt[0]}
                  cy={pt[1]}
                  r={isHit ? 5 : 3}
                  fill={isHit ? color : 'transparent'}
                  stroke={color}
                  strokeWidth={1.5}
                  opacity={track.muted ? 0.2 : isHit ? 1 : 0.6}
                />
              )
            })}
          </g>
        )
      })}

      {/* Playhead — fixed line from center to top */}
      <line
        x1={CX}
        y1={CY}
        x2={CX}
        y2={CY - RADIUS - 12}
        stroke="rgba(250,204,21,0.6)"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      {/* Playhead dot at top */}
      <circle cx={CX} cy={CY - RADIUS - 12} r={3} fill="rgba(250,204,21,0.8)" />

      {/* Center dot */}
      <circle cx={CX} cy={CY} r={2} fill="rgba(255,255,255,0.3)" />
    </svg>
  )
}
