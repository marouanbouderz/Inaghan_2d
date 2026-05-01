const SoundManager = (() => {
  let ctx = null
  let playing = false

  function getCtx() {
    if (!ctx || ctx.state === 'closed') {
      ctx = new (window.AudioContext || window.webkitAudioContext)()
    }
    if (ctx.state === 'suspended') ctx.resume()
    return ctx
  }

  // ── Hit sound: square-wave pitch-drop + noise crunch ──────────────
  function playHit() {
    const c = getCtx()
    const t = c.currentTime

    const osc = c.createOscillator()
    const g   = c.createGain()
    osc.type = 'square'
    osc.frequency.setValueAtTime(300, t)
    osc.frequency.exponentialRampToValueAtTime(55, t + 0.12)
    g.gain.setValueAtTime(0.3, t)
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.14)
    osc.connect(g)
    g.connect(c.destination)
    osc.start(t)
    osc.stop(t + 0.14)

    const buf  = c.createBuffer(1, Math.floor(c.sampleRate * 0.06), c.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
    const src = c.createBufferSource()
    const ng  = c.createGain()
    src.buffer = buf
    ng.gain.setValueAtTime(0.15, t)
    ng.gain.exponentialRampToValueAtTime(0.001, t + 0.06)
    src.connect(ng)
    ng.connect(c.destination)
    src.start(t)
  }

  // ── Fight music (MP3) ────────────────────────────────────────────
  let music   = null
  let victory = null

  function startMusic() {
    if (playing) return
    playing = true
    if (!music) {
      music = new Audio('assets/audio/fight-theme.mp3')
      music.loop   = true
      music.volume = 0.7
    }
    music.currentTime = 0
    music.play().catch(() => {})
  }

  function stopMusic() {
    playing = false
    if (music) {
      music.pause()
      music.currentTime = 0
    }
    if (victory) {
      victory.pause()
      victory.currentTime = 0
    }
  }

  // ── Game-over jingle: dramatic descending A-minor phrase ─────────
  function playGameOver() {
    const c = getCtx()
    const t = c.currentTime + 0.2

    const BEAT = 60 / 70

    const notes = [
      [440.0, 0.4],
      [440.0, 0.4],
      [440.0, 0.4],
      [349.2, 0.8],
      [329.6, 0.6],
      [293.7, 0.6],
      [261.6, 0.6],
      [220.0, 3.0],
    ]

    const bassNotes = [
      [110.0, 3.8],
      [110.0, 3.8],
    ]

    let mt = t
    for (const [freq, beats] of notes) {
      const dur = beats * BEAT
      const osc  = c.createOscillator()
      const gain = c.createGain()
      osc.type = 'square'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.07, mt)
      gain.gain.setValueAtTime(0.001, mt + dur * 0.88)
      osc.connect(gain)
      gain.connect(c.destination)
      osc.start(mt)
      osc.stop(mt + dur + 0.02)
      mt += dur
    }

    let bt = t
    for (const [freq, beats] of bassNotes) {
      const dur = beats * BEAT
      const osc  = c.createOscillator()
      const gain = c.createGain()
      osc.type = 'triangle'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.11, bt)
      gain.gain.linearRampToValueAtTime(0.001, bt + dur)
      osc.connect(gain)
      gain.connect(c.destination)
      osc.start(bt)
      osc.stop(bt + dur + 0.02)
      bt += dur
    }
  }

  // ── Victory music (MP3) ──────────────────────────────────────────
  function playVictory() {
    if (!victory) {
      victory = new Audio('assets/audio/victory.mp3')
      victory.loop   = false
      victory.volume = 0.8
    }
    victory.currentTime = 0
    victory.play().catch(() => {})
  }

  return { playHit, startMusic, stopMusic, playGameOver, playVictory }
})()
