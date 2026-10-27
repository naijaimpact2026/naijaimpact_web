/**
 * Web Audio synthesizer tailored for the animated Novo Mascot companion.
 * Provides zero-latency, studio-quality melodic chimes, bounce hops, and message cues
 * without any external audio asset dependencies.
 */

let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  try {
    if (!audioCtx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioCtx) {
        audioCtx = new AudioCtx()
      }
    }
    return audioCtx
  } catch {
    return null
  }
}

async function ensureAudioUnlocked(ctx: AudioContext): Promise<boolean> {
  if (ctx.state === 'suspended') {
    try {
      await ctx.resume()
    } catch {
      return false
    }
  }
  return true
}

let lastMascotSound = 0

/**
 * Play a gentle, cheerful ascending pentatonic chime when Novo opens or waves.
 */
export async function playMascotChime(muted = false) {
  if (muted || typeof window === 'undefined') return
  const now = Date.now()
  if (now - lastMascotSound < 200) return
  lastMascotSound = now

  const ctx = getAudioContext()
  if (!ctx) return
  if (!(await ensureAudioUnlocked(ctx))) return

  try {
    const t = ctx.currentTime
    // F#5 (739.99 Hz) -> B5 (987.77 Hz) -> D#6 (1244.51 Hz)
    const notes = [739.99, 987.77, 1244.51]

    notes.forEach((freq, idx) => {
      const startTime = t + idx * 0.055
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, startTime)

      gain.gain.setValueAtTime(0.001, startTime)
      gain.gain.linearRampToValueAtTime(0.12, startTime + 0.015)
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.28)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(startTime)
      osc.stop(startTime + 0.3)
    })
  } catch {
    // Ignore audio restrictions
  }
}

/**
 * Play a cute, springy hop sound when Novo jumps or wanders across the screen.
 */
export async function playMascotHop(muted = false) {
  if (muted || typeof window === 'undefined') return
  const now = Date.now()
  if (now - lastMascotSound < 150) return
  lastMascotSound = now

  const ctx = getAudioContext()
  if (!ctx) return
  if (!(await ensureAudioUnlocked(ctx))) return

  try {
    const t = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    // Spring glide from 260Hz up to 520Hz then down to 380Hz
    osc.frequency.setValueAtTime(260, t)
    osc.frequency.exponentialRampToValueAtTime(520, t + 0.06)
    osc.frequency.exponentialRampToValueAtTime(380, t + 0.12)

    gain.gain.setValueAtTime(0.001, t)
    gain.gain.linearRampToValueAtTime(0.14, t + 0.015)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.15)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(t)
    osc.stop(t + 0.16)
  } catch {
    // Ignore
  }
}

/**
 * Play a cute giggle / double-tap sound when Novo is tickled or clicked.
 */
export async function playMascotGiggle(muted = false) {
  if (muted || typeof window === 'undefined') return
  const now = Date.now()
  if (now - lastMascotSound < 200) return
  lastMascotSound = now

  const ctx = getAudioContext()
  if (!ctx) return
  if (!(await ensureAudioUnlocked(ctx))) return

  try {
    const t = ctx.currentTime
    const frequencies = [880, 1174.66, 1318.51]

    frequencies.forEach((freq, idx) => {
      const startTime = t + idx * 0.04
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'triangle'
      osc.frequency.setValueAtTime(freq, startTime)

      gain.gain.setValueAtTime(0.001, startTime)
      gain.gain.linearRampToValueAtTime(0.08, startTime + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.12)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(startTime)
      osc.stop(startTime + 0.14)
    })
  } catch {
    // Ignore
  }
}

/**
 * Play a soft pop when a thought bubble appears.
 */
export async function playPopSound(muted = false) {
  if (muted || typeof window === 'undefined') return
  const ctx = getAudioContext()
  if (!ctx) return
  if (!(await ensureAudioUnlocked(ctx))) return

  try {
    const t = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(400, t)
    osc.frequency.exponentialRampToValueAtTime(800, t + 0.05)

    gain.gain.setValueAtTime(0.001, t)
    gain.gain.linearRampToValueAtTime(0.09, t + 0.008)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.08)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(t)
    osc.stop(t + 0.09)
  } catch {
    // Ignore
  }
}

/**
 * Play a sound when a message is sent in chat.
 */
export async function playSendSound(muted = false) {
  if (muted || typeof window === 'undefined') return
  const ctx = getAudioContext()
  if (!ctx) return
  if (!(await ensureAudioUnlocked(ctx))) return

  try {
    const t = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(480, t)
    osc.frequency.exponentialRampToValueAtTime(960, t + 0.06)

    gain.gain.setValueAtTime(0.001, t)
    gain.gain.linearRampToValueAtTime(0.15, t + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.1)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(t)
    osc.stop(t + 0.11)
  } catch {
    // Ignore
  }
}

/**
 * Play a sweet response sound when Novo finishes typing an answer.
 */
export async function playReceiveSound(muted = false) {
  if (muted || typeof window === 'undefined') return
  const ctx = getAudioContext()
  if (!ctx) return
  if (!(await ensureAudioUnlocked(ctx))) return

  try {
    const t = ctx.currentTime
    const notes = [659.25, 880, 1046.5] // E5 -> A5 -> C6

    notes.forEach((freq, idx) => {
      const startTime = t + idx * 0.05
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, startTime)

      gain.gain.setValueAtTime(0.001, startTime)
      gain.gain.linearRampToValueAtTime(0.11, startTime + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.2)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(startTime)
      osc.stop(startTime + 0.22)
    })
  } catch {
    // Ignore
  }
}
