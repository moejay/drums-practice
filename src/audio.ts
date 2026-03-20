let audioCtx: AudioContext | null = null
let masterGain: GainNode | null = null
let compressor: DynamicsCompressorNode | null = null

export function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext()
    compressor = audioCtx.createDynamicsCompressor()
    compressor.threshold.value = -12
    compressor.knee.value = 6
    compressor.ratio.value = 4
    compressor.attack.value = 0.003
    compressor.release.value = 0.1
    compressor.connect(audioCtx.destination)

    masterGain = audioCtx.createGain()
    masterGain.gain.value = 0.8
    masterGain.connect(compressor)
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume()
  }
  return audioCtx
}

export function getMaster(): GainNode {
  getAudioContext()
  return masterGain!
}

function makeNoise(ctx: AudioContext, duration: number): AudioBufferSourceNode {
  const bufferSize = Math.ceil(ctx.sampleRate * duration)
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1
  }
  const source = ctx.createBufferSource()
  source.buffer = buffer
  return source
}

function playKick(t: number, out: AudioNode) {
  const ctx = getAudioContext()

  // Sub body
  const osc = ctx.createOscillator()
  const oscGain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(150, t)
  osc.frequency.exponentialRampToValueAtTime(35, t + 0.12)
  oscGain.gain.setValueAtTime(0.9, t)
  oscGain.gain.setValueAtTime(0.9, t + 0.02)
  oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.35)
  osc.connect(oscGain)
  oscGain.connect(out)
  osc.start(t)
  osc.stop(t + 0.35)

  // Click transient
  const click = ctx.createOscillator()
  const clickGain = ctx.createGain()
  click.type = 'triangle'
  click.frequency.setValueAtTime(1200, t)
  click.frequency.exponentialRampToValueAtTime(80, t + 0.02)
  clickGain.gain.setValueAtTime(0.4, t)
  clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.025)
  click.connect(clickGain)
  clickGain.connect(out)
  click.start(t)
  click.stop(t + 0.03)
}

function playSnare(t: number, out: AudioNode) {
  const ctx = getAudioContext()

  // Body
  const osc = ctx.createOscillator()
  const oscGain = ctx.createGain()
  osc.type = 'triangle'
  osc.frequency.setValueAtTime(220, t)
  osc.frequency.exponentialRampToValueAtTime(120, t + 0.05)
  oscGain.gain.setValueAtTime(0.5, t)
  oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12)
  osc.connect(oscGain)
  oscGain.connect(out)
  osc.start(t)
  osc.stop(t + 0.12)

  // Snare wires (filtered noise)
  const noise = makeNoise(ctx, 0.2)
  const noiseGain = ctx.createGain()
  const hp = ctx.createBiquadFilter()
  hp.type = 'highpass'
  hp.frequency.value = 2000
  const bp = ctx.createBiquadFilter()
  bp.type = 'bandpass'
  bp.frequency.value = 4000
  bp.Q.value = 0.8
  noise.connect(hp)
  hp.connect(bp)
  bp.connect(noiseGain)
  noiseGain.gain.setValueAtTime(0.35, t)
  noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.18)
  noiseGain.connect(out)
  noise.start(t)
  noise.stop(t + 0.2)
}

function playHiHat(t: number, out: AudioNode) {
  const ctx = getAudioContext()

  // Filtered noise — tight
  const noise = makeNoise(ctx, 0.08)
  const noiseGain = ctx.createGain()
  const hp = ctx.createBiquadFilter()
  hp.type = 'highpass'
  hp.frequency.value = 7000
  const bp = ctx.createBiquadFilter()
  bp.type = 'bandpass'
  bp.frequency.value = 10000
  bp.Q.value = 1.2
  noise.connect(hp)
  hp.connect(bp)
  bp.connect(noiseGain)
  noiseGain.gain.setValueAtTime(0.28, t)
  noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.06)
  noiseGain.connect(out)
  noise.start(t)
  noise.stop(t + 0.08)

  // Metallic component
  const osc = ctx.createOscillator()
  const osc2 = ctx.createOscillator()
  const metalGain = ctx.createGain()
  osc.type = 'square'
  osc2.type = 'square'
  osc.frequency.value = 320
  osc2.frequency.value = 520
  metalGain.gain.setValueAtTime(0.06, t)
  metalGain.gain.exponentialRampToValueAtTime(0.001, t + 0.04)
  osc.connect(metalGain)
  osc2.connect(metalGain)
  metalGain.connect(out)
  osc.start(t)
  osc2.start(t)
  osc.stop(t + 0.05)
  osc2.stop(t + 0.05)
}

function playRide(t: number, out: AudioNode) {
  const ctx = getAudioContext()

  // Bell
  const osc = ctx.createOscillator()
  const osc2 = ctx.createOscillator()
  const bellGain = ctx.createGain()
  osc.type = 'sine'
  osc2.type = 'sine'
  osc.frequency.value = 880
  osc2.frequency.value = 1250
  bellGain.gain.setValueAtTime(0.12, t)
  bellGain.gain.exponentialRampToValueAtTime(0.001, t + 0.6)
  osc.connect(bellGain)
  osc2.connect(bellGain)
  bellGain.connect(out)
  osc.start(t)
  osc2.start(t)
  osc.stop(t + 0.6)
  osc2.stop(t + 0.6)

  // Wash
  const noise = makeNoise(ctx, 0.3)
  const noiseGain = ctx.createGain()
  const bp = ctx.createBiquadFilter()
  bp.type = 'bandpass'
  bp.frequency.value = 6000
  bp.Q.value = 0.5
  noise.connect(bp)
  bp.connect(noiseGain)
  noiseGain.gain.setValueAtTime(0.08, t)
  noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.25)
  noiseGain.connect(out)
  noise.start(t)
  noise.stop(t + 0.3)
}

function playCrash(t: number, out: AudioNode) {
  const ctx = getAudioContext()

  // Noise wash
  const noise = makeNoise(ctx, 1.2)
  const noiseGain = ctx.createGain()
  const bp = ctx.createBiquadFilter()
  bp.type = 'bandpass'
  bp.frequency.value = 5000
  bp.Q.value = 0.3
  noise.connect(bp)
  bp.connect(noiseGain)
  noiseGain.gain.setValueAtTime(0.3, t)
  noiseGain.gain.setValueAtTime(0.3, t + 0.01)
  noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 1.0)
  noiseGain.connect(out)
  noise.start(t)
  noise.stop(t + 1.2)

  // Metallic harmonics
  const freqs = [340, 520, 780, 1120]
  for (const f of freqs) {
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = f
    g.gain.setValueAtTime(0.04, t)
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.8)
    osc.connect(g)
    g.connect(out)
    osc.start(t)
    osc.stop(t + 0.8)
  }
}

function playTom(t: number, pitch: number, out: AudioNode) {
  const ctx = getAudioContext()

  // Body — sine sweep
  const osc = ctx.createOscillator()
  const oscGain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(pitch * 1.5, t)
  osc.frequency.exponentialRampToValueAtTime(pitch * 0.7, t + 0.08)
  oscGain.gain.setValueAtTime(0.6, t)
  oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.25)
  osc.connect(oscGain)
  oscGain.connect(out)
  osc.start(t)
  osc.stop(t + 0.25)

  // Attack transient
  const click = ctx.createOscillator()
  const clickGain = ctx.createGain()
  click.type = 'triangle'
  click.frequency.setValueAtTime(pitch * 3, t)
  click.frequency.exponentialRampToValueAtTime(pitch, t + 0.015)
  clickGain.gain.setValueAtTime(0.2, t)
  clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.02)
  click.connect(clickGain)
  clickGain.connect(out)
  click.start(t)
  click.stop(t + 0.02)
}

// Per-hit volume control via a gain node wrapper
function withVolume(volume: number): GainNode {
  const ctx = getAudioContext()
  const vol = ctx.createGain()
  vol.gain.value = volume
  vol.connect(getMaster())
  return vol
}

// Dispatch by kitId for best quality per instrument
export function playDrumHit(kitId: string, pitch: number, volume: number = 1, time?: number) {
  const ctx = getAudioContext()
  const t = time ?? ctx.currentTime
  const out = withVolume(volume)

  switch (kitId) {
    case 'kick': playKick(t, out); break
    case 'snare': playSnare(t, out); break
    case 'hihat': playHiHat(t, out); break
    case 'ride': playRide(t, out); break
    case 'crash': playCrash(t, out); break
    case 'tom-hi':
    case 'tom-mid':
    case 'tom-floor':
      playTom(t, pitch, out); break
    default:
      playTom(t, pitch, out); break
  }
}
