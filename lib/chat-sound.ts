/**
 * Web Audio API synthesizer for chat sound effects.
 * Synthesizes crisp, zero-latency, studio-quality UI sounds without external audio assets or network latency.
 */

let audioCtx: AudioContext | null = null
let hasAutoUnlocked = false

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

// Automatically unlock audio context on the first user interaction anywhere on the page
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    if (hasAutoUnlocked) return
    const ctx = getAudioContext()
    if (ctx) {
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {})
      }
      hasAutoUnlocked = true
    }
    window.removeEventListener('pointerdown', unlockAudio)
    window.removeEventListener('keydown', unlockAudio)
    window.removeEventListener('touchstart', unlockAudio)
  }

  window.addEventListener('pointerdown', unlockAudio, { passive: true })
  window.addEventListener('keydown', unlockAudio, { passive: true })
  window.addEventListener('touchstart', unlockAudio, { passive: true })
}

let lastSendTime = 0
let lastReceiveTime = 0

/**
 * Play a sleek, modern bubble-pop send sound with an ascending sweep and subtle crispness.
 */
export async function playSendMessageSound() {
  const nowMs = Date.now()
  if (nowMs - lastSendTime < 150) return // Debounce
  lastSendTime = nowMs

  const ctx = getAudioContext()
  if (!ctx) return

  try {
    if (ctx.state === 'suspended') {
      await ctx.resume().catch(() => {})
    }

    const t = ctx.currentTime

    // 1. Primary sweet pop: Sine 440Hz -> 880Hz
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(440, t)
    osc1.frequency.exponentialRampToValueAtTime(880, t + 0.07)

    gain1.gain.setValueAtTime(0.001, t)
    gain1.gain.linearRampToValueAtTime(0.2, t + 0.012)
    gain1.gain.exponentialRampToValueAtTime(0.0001, t + 0.11)

    osc1.connect(gain1)
    gain1.connect(ctx.destination)

    // 2. Harmonic sparkle overtone (adds crispness to the pop)
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.type = 'triangle'
    osc2.frequency.setValueAtTime(880, t)
    osc2.frequency.exponentialRampToValueAtTime(1320, t + 0.06)

    gain2.gain.setValueAtTime(0.001, t)
    gain2.gain.linearRampToValueAtTime(0.06, t + 0.01)
    gain2.gain.exponentialRampToValueAtTime(0.0001, t + 0.08)

    osc2.connect(gain2)
    gain2.connect(ctx.destination)

    osc1.start(t)
    osc1.stop(t + 0.12)
    osc2.start(t)
    osc2.stop(t + 0.09)
  } catch {
    // Silently ignore if blocked
  }
}

/**
 * Play a luxurious, warm ascending harmonic chime when receiving a message.
 * Ascending notes (E5 659.3Hz -> B5 987.8Hz -> E6 1318.5Hz) with gentle bell decay.
 */
export async function playReceiveMessageSound() {
  const nowMs = Date.now()
  if (nowMs - lastReceiveTime < 200) return // Debounce duplicate events
  lastReceiveTime = nowMs

  const ctx = getAudioContext()
  if (!ctx) return

  try {
    if (ctx.state === 'suspended') {
      await ctx.resume().catch(() => {})
    }

    const t = ctx.currentTime

    // Note 1: E5 (659.25 Hz)
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(659.25, t)
    gain1.gain.setValueAtTime(0.001, t)
    gain1.gain.linearRampToValueAtTime(0.16, t + 0.015)
    gain1.gain.exponentialRampToValueAtTime(0.0001, t + 0.22)
    osc1.connect(gain1)
    gain1.connect(ctx.destination)
    osc1.start(t)
    osc1.stop(t + 0.23)

    // Note 2: B5 (987.77 Hz) - starts at +65ms
    const t2 = t + 0.065
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(987.77, t2)
    gain2.gain.setValueAtTime(0.001, t2)
    gain2.gain.linearRampToValueAtTime(0.18, t2 + 0.015)
    gain2.gain.exponentialRampToValueAtTime(0.0001, t2 + 0.26)
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.start(t2)
    osc2.stop(t2 + 0.27)

    // Note 3: E6 (1318.5 Hz) - starts at +130ms, soft bell chime finish
    const t3 = t + 0.13
    const osc3 = ctx.createOscillator()
    const gain3 = ctx.createGain()
    osc3.type = 'sine'
    osc3.frequency.setValueAtTime(1318.51, t3)
    gain3.gain.setValueAtTime(0.001, t3)
    gain3.gain.linearRampToValueAtTime(0.14, t3 + 0.015)
    gain3.gain.exponentialRampToValueAtTime(0.0001, t3 + 0.32)
    osc3.connect(gain3)
    gain3.connect(ctx.destination)
    osc3.start(t3)
    osc3.stop(t3 + 0.33)
  } catch {
    // Silently ignore if blocked
  }
}
