import { useEffect, useRef, useCallback } from 'react'
import { useBeatStore } from '../store'
import { layoutCells } from '../utils'
import { playDrumHit } from '../audio'
import { speakCount, stopCounting } from '../counting'

const SOLO_BG_VOLUME = 0.35

export function usePlayback() {
  const timerRef = useRef<number | null>(null)
  const playingRef = useRef(false)

  const clearTimer = () => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  const stop = useCallback(() => {
    playingRef.current = false
    clearTimer()
    stopCounting()
    useBeatStore.getState().setPlaying(false)
  }, [])

  const play = useCallback(() => {
    // Guard against double-play
    if (playingRef.current) return
    playingRef.current = true

    const store = useBeatStore.getState()
    // Set playing state — keep tracks intact, just reset position
    useBeatStore.setState({ playing: true, activePosition: 0, activeHits: new Set() })

    // If playlist mode with variations, ensure we're on the right variation's tracks
    if (store.playlistMode && store.activePlaylist && store.activePlaylist.variations.length > 0) {
      store.jumpToVariation(store.activeVariationIndex)
    }

    scheduleMeasure()

    function scheduleMeasure() {
      if (!playingRef.current) return

      // Always read fresh state
      const state = useBeatStore.getState()
      const { bpm, tracks } = state
      const measureDur = (60 / bpm) * 4

      if (tracks.length === 0) {
        stop()
        return
      }

      interface Event {
        timeOffset: number
        position: number
        pitch: number
        muted: boolean
        kitId: string
        trackId: string
        volume: number
        noteNumber: number       // 1-based index of this note within its track
        noteDurationSec: number  // how long until the next note on this track
      }

      const events: Event[] = []

      for (const track of tracks) {
        const layout = layoutCells(track.cells, track.divisions)
        const divDur = measureDur / track.divisions
        let noteCount = 0

        for (const item of layout) {
          if (item.cell.type === 'note') {
            noteCount++
            const timeOffset = item.start * divDur
            events.push({
              timeOffset,
              position: timeOffset / measureDur,
              pitch: track.pitch,
              muted: track.muted,
              kitId: track.kitId,
              trackId: track.id,
              volume: track.volume,
              noteNumber: noteCount,
              noteDurationSec: item.cell.duration * divDur,
            })
          }
        }
      }

      // Visual position markers for smooth playhead
      const markerCount = 32
      for (let i = 0; i < markerCount; i++) {
        const pos = i / markerCount
        if (!events.some(e => Math.abs(e.position - pos) < 0.01)) {
          events.push({
            timeOffset: pos * measureDur,
            position: pos, pitch: 0, muted: true, kitId: '', trackId: '', volume: 0,
            noteNumber: 0, noteDurationSec: 0,
          })
        }
      }

      events.sort((a, b) => a.timeOffset - b.timeOffset)

      let eventIdx = 0
      const measureStart = performance.now()

      function tick() {
        if (!playingRef.current) return

        if (eventIdx >= events.length) {
          endMeasure()
          return
        }

        const event = events[eventIdx]
        useBeatStore.getState().setActivePosition(event.position)

        const { soloTrackId } = useBeatStore.getState()
        const hits = new Set<string>()
        let i = eventIdx
        while (i < events.length && Math.abs(events[i].position - event.position) < 0.001) {
          const e = events[i]
          if (!e.muted && e.pitch > 0) {
            let vol = e.volume
            if (soloTrackId !== null) {
              vol = e.trackId === soloTrackId ? e.volume : e.volume * SOLO_BG_VOLUME
            }
            playDrumHit(e.kitId, e.pitch, vol)
            hits.add(e.kitId)
          }
          i++
        }
        eventIdx = i

        if (hits.size > 0) {
          useBeatStore.getState().setActiveHits(hits)
          setTimeout(() => {
            if (playingRef.current) {
              useBeatStore.getState().setActiveHits(new Set())
            }
          }, 80)
        }

        // Counting voice: play tone for focused track (or first track)
        const { countingEnabled, countingVolume, soloTrackId: soloId, tracks: currentTracks } = useBeatStore.getState()
        if (countingEnabled) {
          // Find the kitId to count: solo track's kit, or first track's kit
          const soloTrack = soloId ? currentTracks.find(t => t.id === soloId) : null
          const countKitId = soloTrack?.kitId ?? currentTracks[0]?.kitId
          if (countKitId) {
            const countEvent = events.find(e =>
              e.kitId === countKitId &&
              e.noteNumber > 0 &&
              Math.abs(e.position - event.position) < 0.001
            )
            if (countEvent) {
              speakCount(countEvent.noteNumber, countEvent.noteDurationSec, countingVolume)
            }
          }
        }

        if (eventIdx < events.length) {
          const nextTime = events[eventIdx].timeOffset
          const elapsed = (performance.now() - measureStart) / 1000
          const delay = Math.max(0, (nextTime - elapsed) * 1000)
          timerRef.current = window.setTimeout(tick, delay)
        } else {
          endMeasure()
        }
      }

      function endMeasure() {
        if (!playingRef.current) return
        const elapsed = (performance.now() - measureStart) / 1000
        const remaining = Math.max(0, (measureDur - elapsed) * 1000)

        timerRef.current = window.setTimeout(() => {
          if (!playingRef.current) return

          // Re-read state fresh — never use closured values for these
          const freshState = useBeatStore.getState()

          if (freshState.playlistMode) {
            const barContinues = freshState.incrementBar()
            if (!barContinues) {
              const playlistContinues = freshState.advanceVariation()
              if (!playlistContinues) {
                stop()
                return
              }
            }
            scheduleMeasure()
          } else {
            if (freshState.loop) {
              scheduleMeasure()
            } else {
              stop()
            }
          }
        }, remaining)
      }

      tick()
    }
  }, [stop])

  const togglePlay = useCallback(() => {
    if (playingRef.current) stop()
    else play()
  }, [play, stop])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target !== document.body) return

      if (e.code === 'Space') {
        e.preventDefault()
        togglePlay()
        return
      }

      if (e.code === 'Escape') {
        useBeatStore.getState().clearSolo()
        return
      }

      if (e.code === 'KeyC' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
        useBeatStore.getState().toggleCounting()
        return
      }

      const num = parseInt(e.key)
      if (num >= 1 && num <= 8) {
        const { tracks } = useBeatStore.getState()
        if (num <= tracks.length) {
          useBeatStore.getState().toggleSolo(tracks[num - 1].id)
        }
        return
      }

      const store = useBeatStore.getState()
      if (store.playlistMode && store.activePlaylist) {
        if (e.code === 'ArrowRight') {
          e.preventDefault()
          const next = store.activeVariationIndex + 1
          if (next < store.activePlaylist.variations.length) store.jumpToVariation(next)
          else if (store.activePlaylist.loop) store.jumpToVariation(0)
        } else if (e.code === 'ArrowLeft') {
          e.preventDefault()
          const prev = store.activeVariationIndex - 1
          if (prev >= 0) store.jumpToVariation(prev)
          else if (store.activePlaylist.loop) store.jumpToVariation(store.activePlaylist.variations.length - 1)
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [togglePlay])

  useEffect(() => () => stop(), [stop])

  return { togglePlay, stop }
}
