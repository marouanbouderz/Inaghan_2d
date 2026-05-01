// ─────────────────────────────────────────────────────────────────────────────
//  MAIN MENU
//  Usage (in main.js):
//    const menu = new Menu()
//    menu.show()
//
//  PLAY calls startGame() — defined in main.js.
// ─────────────────────────────────────────────────────────────────────────────

const MENU_CONFIG = {
  title:    'INAGHAN',
  subtitle: 'Choose your fate',

  musicSrc: 'assets/audio/menu-music.ogg',

  buttons: [
    { id: 'play',     label: 'PLAY'     },
    { id: 'controls', label: 'CONTROLS' },
    { id: 'options',  label: 'OPTIONS'  },
    { id: 'quit',     label: 'QUIT'     },
  ],

  difficulty: ['EASY', 'NORMAL', 'HARD'],
  defaultDifficulty: 1,

  defaultVolume: 0.6,
}

// ─────────────────────────────────────────────────────────────────────────────

class Menu {
  constructor() {
    this._muted      = false
    this._volume     = MENU_CONFIG.defaultVolume
    this._difficulty = MENU_CONFIG.defaultDifficulty

    this._audio        = new Audio(MENU_CONFIG.musicSrc)
    this._audio.loop   = true
    this._audio.volume = this._volume

    this._el               = null
    this._confirmDialog    = null
    this._btnEls           = {}
    this._diffBtns         = []
    this._volumeSlider     = null
    this._mainView         = null
    this._controlsView     = null
    this._optionsView      = null
    this._controlsReturnBtn = null
    this._optionsReturnBtn  = null
    this._contentEl        = null
    this._plBg             = null
    this._plFog            = null

    this._px = {
      tx: 0, ty: 0,
      cx: 0, cy: 0,
      rafId: null,
    }

    this._build()
    this._attachEvents()
    this._initParallax()
    this._tryAutoplay()
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  show() {
    const wrapper = document.querySelector('.game-wrapper')
    if (wrapper) wrapper.style.visibility = 'hidden'

    this._px.tx = this._px.ty = this._px.cx = this._px.cy = 0
    this._applyParallaxTransforms()

    this._showView('main')
    this._el.style.display = 'flex'
    void this._el.offsetWidth
    this._el.classList.add('visible')
    if (!this._muted) this._playMusic()
  }

  hide(onDone) {
    if (this._px.rafId) {
      cancelAnimationFrame(this._px.rafId)
      this._px.rafId = null
    }
    this._el.classList.remove('visible')
    this._stopMusic()
    this._el.addEventListener('transitionend', () => {
      this._el.style.display = 'none'
      const wrapper = document.querySelector('.game-wrapper')
      if (wrapper) wrapper.style.visibility = 'visible'
      if (typeof onDone === 'function') onDone()
    }, { once: true })
  }

  // ── DOM construction ───────────────────────────────────────────────────────

  _build() {
    this._confirmDialog = this._buildConfirmDialog()

    const titleRow = this._make('div', { className: 'menu-title-row' }, [
      this._make('span', { className: 'menu-flourish' }, '❧'),
      this._make('h1',   { className: 'menu-title'   }, MENU_CONFIG.title),
      this._make('span', { className: 'menu-flourish' }, '❦'),
    ])

    const subtitleEl = this._make('p', { className: 'menu-subtitle' }, MENU_CONFIG.subtitle)
    if (!MENU_CONFIG.subtitle) subtitleEl.style.display = 'none'

    const btnEls = MENU_CONFIG.buttons.map(({ id, label }) => {
      const btn = this._make('button', { className: 'menu-btn' }, label)
      this._btnEls[id] = btn
      return btn
    })

    this._mainView     = this._make('div', { className: 'menu-view active' }, [
      this._make('div', { className: 'menu-buttons' }, btnEls),
    ])
    this._controlsView = this._buildControlsView()
    this._optionsView  = this._buildOptionsView()

    const content = this._make('div', { className: 'menu-content' }, [
      titleRow,
      subtitleEl,
      this._make('div', { className: 'menu-divider' }),
      this._mainView,
      this._controlsView,
      this._optionsView,
    ])
    this._contentEl = content

    this._plBg  = this._make('div', { className: 'pl pl--bg'  })
    this._plFog = this._make('div', { className: 'pl pl--fog' })
    const parallaxScene = this._make('div', { className: 'parallax-scene' }, [
      this._plBg,
      this._plFog,
    ])

    this._el = this._make('div', { id: 'main-menu' }, [
      parallaxScene,
      this._make('div', { className: 'menu-vignette' }),
      content,
      this._confirmDialog,
    ])

    this._el.style.display = 'none'
    document.body.appendChild(this._el)
  }

  // ── Parallax ───────────────────────────────────────────────────────────────

  _parallaxLayers() {
    return [
      { el: this._plBg,     depth: 12 },
      { el: this._plFog,    depth: 22 },
      { el: this._contentEl, depth:  6 },
    ]
  }

  _applyParallaxTransforms() {
    const { cx, cy } = this._px
    for (const { el, depth } of this._parallaxLayers()) {
      el.style.transform = `translate(${-cx * depth}px, ${-cy * depth}px)`
    }
  }

  _initParallax() {
    const LERP = 0.10

    const loop = () => {
      const p = this._px
      p.cx += (p.tx - p.cx) * LERP
      p.cy += (p.ty - p.cy) * LERP
      this._applyParallaxTransforms()

      if (Math.abs(p.cx - p.tx) > 0.0015 || Math.abs(p.cy - p.ty) > 0.0015) {
        p.rafId = requestAnimationFrame(loop)
      } else {
        p.cx = p.tx
        p.cy = p.ty
        this._applyParallaxTransforms()
        p.rafId = null
      }
    }

    const startLoop = () => {
      if (!this._px.rafId) {
        this._px.rafId = requestAnimationFrame(loop)
      }
    }

    this._el.addEventListener('mousemove', (e) => {
      const r = this._el.getBoundingClientRect()
      this._px.tx = ((e.clientX - r.left)  / r.width  - 0.5) * 2
      this._px.ty = ((e.clientY - r.top)   / r.height - 0.5) * 2
      startLoop()
    })

    this._el.addEventListener('mouseleave', () => {
      this._px.tx = 0
      this._px.ty = 0
      startLoop()
    })
  }

  _buildControlsView() {
    const p1 = [
      ['Q',     'Move Left' ],
      ['D',     'Move Right'],
      ['Z',     'Jump'      ],
      ['SPACE', 'Attack 1'  ],
      ['E',     'Attack 2'  ],
    ]
    const p2 = [
      ['←', 'Move Left' ],
      ['→', 'Move Right'],
      ['↑', 'Jump'      ],
      ['↓', 'Attack 1'  ],
      ['L', 'Attack 2'  ],
    ]

    const makeColumn = (playerLabel, rows, baseDelay = 0) => {
      const rowEls = rows.map(([key, action], i) => {
        const kbd = this._make('kbd', { className: 'ctrl-key' }, key)
        kbd.style.setProperty('--kd', `${(baseDelay + i * 0.15).toFixed(2)}s`)
        return this._make('div', { className: 'ctrl-row' }, [
          kbd,
          this._make('span', { className: 'ctrl-action' }, action),
        ])
      })
      return this._make('div', { className: 'ctrl-column' }, [
        this._make('div', { className: 'ctrl-player-label' }, playerLabel),
        ...rowEls,
      ])
    }

    this._controlsReturnBtn = this._make('button', { className: 'menu-btn menu-btn--return' }, '← RETURN')

    return this._make('div', { className: 'menu-view' }, [
      this._make('div', { className: 'menu-sub-title' }, 'CONTROLS'),
      this._make('div', { className: 'menu-controls__columns' }, [
        makeColumn('PLAYER  1', p1, 0.00),
        this._make('div', { className: 'ctrl-separator' }),
        makeColumn('PLAYER  2', p2, 0.075),
      ]),
      this._controlsReturnBtn,
    ])
  }

  _buildOptionsView() {
    this._volumeSlider       = document.createElement('input')
    this._volumeSlider.type  = 'range'
    this._volumeSlider.min   = '0'
    this._volumeSlider.max   = '1'
    this._volumeSlider.step  = '0.05'
    this._volumeSlider.value = String(this._volume)

    const volumeLabel = this._make('label', { className: 'options-label' }, [
      document.createTextNode('MUSIC VOLUME'),
      this._volumeSlider,
    ])

    this._diffBtns = MENU_CONFIG.difficulty.map((name, i) => {
      const active = i === this._difficulty ? ' active' : ''
      return this._make('button', { className: 'difficulty-btn' + active }, name)
    })

    const diffLabel = this._make('label', { className: 'options-label' }, [
      document.createTextNode('DIFFICULTY'),
      this._make('div', { className: 'menu-difficulty-toggle' }, this._diffBtns),
    ])

    this._optionsReturnBtn = this._make('button', { className: 'menu-btn menu-btn--return' }, '← RETURN')

    return this._make('div', { className: 'menu-view' }, [
      this._make('div', { className: 'menu-sub-title' }, 'OPTIONS'),
      this._make('div', { className: 'menu-options-panel' }, [volumeLabel, diffLabel]),
      this._optionsReturnBtn,
    ])
  }

  _buildConfirmDialog() {
    this._confirmYes = this._make('button', { className: 'confirm-yes' }, 'YES')
    this._confirmNo  = this._make('button', { className: 'confirm-no'  }, 'NO')

    const box = this._make('div', { className: 'menu-confirm__box' }, [
      this._make('p',   { className: 'menu-confirm__text'    }, 'QUIT THE GAME?'),
      this._make('div', { className: 'menu-confirm__actions' }, [
        this._confirmYes,
        this._confirmNo,
      ]),
    ])

    return this._make('div', { className: 'menu-confirm' }, [box])
  }

  // ── Event wiring ───────────────────────────────────────────────────────────

  _attachEvents() {
    this._btnEls.play    .addEventListener('click', () => this._onPlay())
    this._btnEls.controls.addEventListener('click', () => this._showView('controls'))
    this._btnEls.options .addEventListener('click', () => this._showView('options'))
    this._btnEls.quit    .addEventListener('click', () => this._onQuit())

    this._controlsReturnBtn.addEventListener('click', () => this._showView('main'))
    this._optionsReturnBtn .addEventListener('click', () => this._showView('main'))

    this._volumeSlider.addEventListener('input', () => {
      this._volume       = parseFloat(this._volumeSlider.value)
      this._audio.volume = this._volume
    })

    this._diffBtns.forEach((btn, i) => {
      btn.addEventListener('click', () => {
        this._difficulty = i
        this._diffBtns.forEach((b, j) => {
          if (j === i) b.classList.add('active')
          else b.classList.remove('active')
        })
      })
    })

    this._confirmYes.addEventListener('click', () => {
      window.close()
      setTimeout(() => {
        document.body.innerHTML = '<p style="color:#c2185b;font-family:sans-serif;text-align:center;margin-top:40vh;font-size:1.2rem;">You can close this tab.</p>'
      }, 300)
    })
    this._confirmNo.addEventListener('click', () => this._confirmDialog.classList.remove('open'))

    const unlock = () => {
      if (!this._muted) this._playMusic()
      window.removeEventListener('click',   unlock)
      window.removeEventListener('keydown', unlock)
    }
    window.addEventListener('click',   unlock, { once: true })
    window.addEventListener('keydown', unlock, { once: true })
  }

  // ── View switching ─────────────────────────────────────────────────────────

  _showView(name) {
    const map = {
      main:     this._mainView,
      controls: this._controlsView,
      options:  this._optionsView,
    }
    Object.values(map).forEach(v => v.classList.remove('active'))
    map[name].classList.add('active')
  }

  // ── Button handlers ────────────────────────────────────────────────────────

  _onPlay() {
    if (this._px.rafId) {
      cancelAnimationFrame(this._px.rafId)
      this._px.rafId = null
    }
    this._stopMusic()

    this._el.style.transition = 'none'

    const flash = document.createElement('div')
    flash.style.cssText = 'position:fixed;inset:0;background:#fff;opacity:0;z-index:1200;pointer-events:none'
    document.body.appendChild(flash)

    gsap.timeline({
      onComplete: () => {
        flash.remove()
        this._el.style.display = 'none'
        const wrapper = document.querySelector('.game-wrapper')
        if (wrapper) wrapper.style.visibility = 'visible'
        if (typeof showCountdown === 'function') showCountdown()
        else if (typeof startGame === 'function') startGame()
      }
    })
    .to(this._contentEl, {
      scale: 1.1, y: -60, opacity: 0,
      duration: 0.52, ease: 'power3.in'
    }, 0)
    .to(this._el, {
      scale: 1.2,
      duration: 0.75, ease: 'power3.in'
    }, 0)
    .to(flash, { opacity: 1, duration: 0.14, ease: 'power4.in' }, 0.54)
    .to(this._el, { opacity: 0, duration: 0.18, ease: 'none' }, 0.55)
    .to(flash, { opacity: 0, duration: 0.55, ease: 'power2.out' }, 0.68)
  }

  _onQuit() {
    this._confirmDialog.classList.add('open')
  }

  // ── Audio helpers ──────────────────────────────────────────────────────────

  _tryAutoplay() {
    this._audio.play().catch(() => {})
  }

  _playMusic() {
    if (!this._audio.paused) return
    this._audio.play().catch(() => {})
  }

  _stopMusic() {
    this._audio.pause()
    this._audio.currentTime = 0
  }

  // ── DOM helper ─────────────────────────────────────────────────────────────

  _make(tag, props = {}, children) {
    const el = document.createElement(tag)

    for (const [key, value] of Object.entries(props)) {
      if (key === 'className') {
        el.className = value
      } else {
        el.setAttribute(key, value)
      }
    }

    if (children !== undefined) {
      const nodes = Array.isArray(children) ? children : [children]
      for (const node of nodes) {
        el.appendChild(node instanceof Node ? node : document.createTextNode(String(node)))
      }
    }

    return el
  }
}
