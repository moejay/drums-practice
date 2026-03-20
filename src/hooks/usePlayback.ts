import { useEffect, useRef, useCallback } from 'react'
import { useBeatStore } from '../store'
import { layoutCells } from '../utils'
import { playClick } from '../audio'

export function usePlayback() {
  const timerRef = useRef<number | null>(null)
  const playingRef = useRef(false)

  const stop = useCallback(() => {
    playingRef.current = false
    useBeatStore.getState().setPlaying(false)
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const play = useCallback(() => {
    playingRef.current = true
    useBeatStore.getState().setPlaying(true)

    function scheduleMeasure() {
      if (!playingRef.current) return

      const { bpm, loop, tracks } = useBeatStore.getState()
      // One measure = 4 quarter-note beats at the given BPM
      const measureDur = (60 / bpm) * 4

      // Collect all events with their time offsets
      interface Event {
        timeOffset: number
        position: number   // 0..1
        pitch: number
        muted: boolean
      }

      const events: Event[] = []

      for (const track of tracks) {
        const layout = layoutCells(track.cells, track.divisions)
        const divDur = measureDur / track.divisions

        for (const item of layout) {
          if (item.cell.type === 'note') {
            const timeOffset = item.start * divDur
            events.push({
              timeOffset,
              position: timeOffset / measureDur,
              pitch: track.pitch,
              muted: track.muted,
            })
          }
        }
      }

      // Add visual position markers for smooth playhead
      const markerCount = 32
      for (let i = 0; i < markerCount; i++) {
        const pos = i / markerCount
        if (!events.some(e => Math.abs(e.position - pos) < 0.01)) {
          events.push({
            timeOffset: pos * measureDur,
            position: pos,
            pitch: 0,
            muted: true,
          })
        }
      }

      events.sort((a, b) => a.timeOffset - b.timeOffset)

      let eventIdx = 0
      const measureStart = performance.now()

      function tick() {
        if (!playingRef.current) return

        if (eventIdx >= events.length) {
          const elapsed = (performance.now() - measureStart) / 1000
          const remaining = Math.max(0, (measureDur - elapsed) * 1000)
          timerRef.current = window.setTimeout(() => {
            if (loop) scheduleMeasure()
            else stop()
          }, remaining)
          return
        }

        const event = events[eventIdx]
        useBeatStore.getState().setActivePosition(event.position)

        if (!event.muted && event.pitch > 0) {
          playClick(event.pitch)
        }

        eventIdx++

        if (eventIdx < events.length) {
          const nextTime = events[eventIdx].timeOffset
          const elapsed = (performance.now() - measureStart) / 1000
          const delay = Math.max(0, (nextTime - elapsed) * 1000)
          timerRef.current = window.setTimeout(tick, delay)
        } else {
          const elapsed = (performance.now() - measureStart) / 1000
          const remaining = Math.max(0, (measureDur - elapsed) * 1000)
          timerRef.current = window.setTimeout(() => {
            if (loop) scheduleMeasure()
            else stop()
          }, remaining)
        }
      }

      tick()
    }

    scheduleMeasure()
  }, [stop])

  const togglePlay = useCallback(() => {
    if (playingRef.current) stop()
    else play()
  }, [play, stop])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault()
        togglePlay()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [togglePlay])

  useEffect(() => () => stop(), [stop])

  return { togglePlay, stop }
}
