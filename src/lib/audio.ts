/**
 * Web Audio API sound synthesis — no external audio files needed.
 * Generates all sound effects procedurally.
 */

let audioCtx: AudioContext | null = null
let masterGain: GainNode | null = null
let muted = false

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext()
    masterGain = audioCtx.createGain()
    masterGain.connect(audioCtx.destination)
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume()
  }
  return audioCtx
}

function getMaster(): GainNode {
  getCtx()
  return masterGain!
}

export function setMuted(m: boolean) {
  muted = m
  if (masterGain) {
    masterGain.gain.setValueAtTime(m ? 0 : 1, audioCtx!.currentTime)
  }
}

export function isMuted(): boolean {
  return muted
}

export function initAudio() {
  getCtx()
}

/**
 * Low drone / tension pad
 */
export function playDrone(duration = 4, intensity = 0.3): { stop: () => void } {
  const ctx = getCtx()
  const master = getMaster()

  const osc1 = ctx.createOscillator()
  const osc2 = ctx.createOscillator()
  const gain = ctx.createGain()
  const filter = ctx.createBiquadFilter()

  osc1.type = 'sawtooth'
  osc1.frequency.value = 55
  osc2.type = 'sine'
  osc2.frequency.value = 55.5 // slight detune for movement

  filter.type = 'lowpass'
  filter.frequency.value = 200
  filter.Q.value = 2

  gain.gain.setValueAtTime(0, ctx.currentTime)
  gain.gain.linearRampToValueAtTime(intensity * 0.25, ctx.currentTime + 1)
  gain.gain.linearRampToValueAtTime(intensity * 0.15, ctx.currentTime + duration)

  osc1.connect(filter)
  osc2.connect(filter)
  filter.connect(gain)
  gain.connect(master)

  osc1.start(ctx.currentTime)
  osc2.start(ctx.currentTime)
  osc1.stop(ctx.currentTime + duration + 0.5)
  osc2.stop(ctx.currentTime + duration + 0.5)

  return {
    stop: () => {
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3)
      setTimeout(() => {
        try { osc1.stop(); osc2.stop() } catch { /* already stopped */ }
      }, 400)
    }
  }
}

/**
 * Heartbeat thump
 */
export function playHeartbeat(rate = 1) {
  const ctx = getCtx()
  const master = getMaster()

  const playBeat = (time: number, vol: number) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(60, time)
    osc.frequency.exponentialRampToValueAtTime(30, time + 0.15)
    gain.gain.setValueAtTime(vol, time)
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2)
    osc.connect(gain)
    gain.connect(master)
    osc.start(time)
    osc.stop(time + 0.25)
  }

  const now = ctx.currentTime
  playBeat(now, 0.4 * rate)
  playBeat(now + 0.15, 0.25 * rate)
}

/**
 * Whoosh / sweep
 */
export function playWhoosh() {
  const ctx = getCtx()
  const master = getMaster()

  const noise = ctx.createBufferSource()
  const bufferSize = ctx.sampleRate * 0.4
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize)
  }
  noise.buffer = buffer

  const filter = ctx.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.setValueAtTime(500, ctx.currentTime)
  filter.frequency.exponentialRampToValueAtTime(4000, ctx.currentTime + 0.2)
  filter.Q.value = 1

  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.3, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)

  noise.connect(filter)
  filter.connect(gain)
  gain.connect(master)
  noise.start()
}

/**
 * Bass hit / boom
 */
export function playBoom(intensity = 1) {
  const ctx = getCtx()
  const master = getMaster()

  const osc = ctx.createOscillator()
  const gain = ctx.createGain()

  osc.type = 'sine'
  osc.frequency.setValueAtTime(80 * intensity, ctx.currentTime)
  osc.frequency.exponentialRampToValueAtTime(20, ctx.currentTime + 0.5)

  gain.gain.setValueAtTime(0.6 * intensity, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6)

  osc.connect(gain)
  gain.connect(master)
  osc.start()
  osc.stop(ctx.currentTime + 0.7)

  // Add a noise transient
  const noise = ctx.createBufferSource()
  const bufferSize = ctx.sampleRate * 0.1
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize)
  }
  noise.buffer = buffer

  const noiseGain = ctx.createGain()
  noiseGain.gain.setValueAtTime(0.15 * intensity, ctx.currentTime)
  noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1)

  noise.connect(noiseGain)
  noiseGain.connect(master)
  noise.start()
}

/**
 * Celebration fanfare — ascending arpeggio
 */
export function playCelebration() {
  const ctx = getCtx()
  const master = getMaster()

  const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99] // C major arpeggio up 2 octaves
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.value = freq

    const startTime = ctx.currentTime + i * 0.08
    gain.gain.setValueAtTime(0, startTime)
    gain.gain.linearRampToValueAtTime(0.2, startTime + 0.05)
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.8)

    osc.connect(gain)
    gain.connect(master)
    osc.start(startTime)
    osc.stop(startTime + 1)
  })

  // Big final chord
  const chordFreqs = [523.25, 659.25, 783.99]
  chordFreqs.forEach(freq => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq

    const startTime = ctx.currentTime + 0.5
    gain.gain.setValueAtTime(0, startTime)
    gain.gain.linearRampToValueAtTime(0.15, startTime + 0.1)
    gain.gain.linearRampToValueAtTime(0.08, startTime + 2)
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 3)

    osc.connect(gain)
    gain.connect(master)
    osc.start(startTime)
    osc.stop(startTime + 3.5)
  })
}

/**
 * Tension riser — builds before a reveal
 */
export function playTensionRiser(duration = 3, intensity = 1): { stop: () => void } {
  const ctx = getCtx()
  const master = getMaster()

  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  const filter = ctx.createBiquadFilter()

  osc.type = 'sawtooth'
  osc.frequency.setValueAtTime(80, ctx.currentTime)
  osc.frequency.exponentialRampToValueAtTime(300 * intensity, ctx.currentTime + duration)

  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(100, ctx.currentTime)
  filter.frequency.exponentialRampToValueAtTime(2000 * intensity, ctx.currentTime + duration)

  gain.gain.setValueAtTime(0.05, ctx.currentTime)
  gain.gain.linearRampToValueAtTime(0.2 * intensity, ctx.currentTime + duration)

  osc.connect(filter)
  filter.connect(gain)
  gain.connect(master)
  osc.start()
  osc.stop(ctx.currentTime + duration + 0.5)

  return {
    stop: () => {
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.1)
      setTimeout(() => { try { osc.stop() } catch { /* */ } }, 200)
    }
  }
}

/**
 * Tick sound for countdown
 */
export function playTick() {
  const ctx = getCtx()
  const master = getMaster()

  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.value = 1000

  gain.gain.setValueAtTime(0.3, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05)

  osc.connect(gain)
  gain.connect(master)
  osc.start()
  osc.stop(ctx.currentTime + 0.06)
}
