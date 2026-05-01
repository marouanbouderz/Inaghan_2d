const canvas=document.getElementById('canvas')
const c = canvas.getContext('2d')

canvas.width=1024
canvas.height =576


c.fillRect(0,0,canvas.width , canvas.height)

const gravity = 0.7
let gameOver = false
let musicStarted = false
let gameStarted = false   // true once the player clicks PLAY
let countdownActive = false

function setHealthColor(id, health) {
  const fill   = document.querySelector(id)
  const avatar = document.querySelector(
    id === '#playerHealth' ? '.avatar--player' : '.avatar--enemy'
  )

  let color, cls
  if      (health > 60) { color = '#22c55e'; cls = 'health-high'   }
  else if (health > 30) { color = '#eab308'; cls = 'health-medium' }
  else                  { color = '#ef4444'; cls = 'health-low'    }

  fill.style.background = color
  avatar.classList.remove('health-high', 'health-medium', 'health-low')
  avatar.classList.add(cls)
}

const background = new Sprite({
   position:{
   x: 0,
   y:0
  },
  imageSrc:'assets/images/backgrounds/background.png',
  scale: 576 / 1088   // fit the 1984×1088 image to the 1024×576 canvas
})


const platforms = [
  new Platform({ position: { x: 1130, y: 430 }, width: 130, height: 20 })
]

const GROUND_Y = canvas.height - 96 - 150  // floor level (330)

const player = new Fighter({
  position:{
    x:45,
    y:GROUND_Y
  },
  velocity:{
    x:0,
    y:0
  },
  imageSrc:'assets/images/characters/Shadow/Idle.png',
  framesMax: 8,
  scale:2.5,
  offset: {
     x: 215,
     y: 267
  },
  attackBoxOffset: {
    x: 100,
    y: 50
  },
  attackBoxWidth: 195,
  attackBoxHeight: 50,
  sprites: {
    idle: {
      imageSrc:'assets/images/characters/Shadow/Idle.png',
      framesMax: 8
    },
    run: {
      imageSrc:'assets/images/characters/Shadow/Run.png',
      framesMax: 8,
    },
    jump: {
      imageSrc:'assets/images/characters/Shadow/Jump.png',
      framesMax: 2,
    },
    fall: {
      imageSrc:'assets/images/characters/Shadow/Fall.png',
      framesMax: 2
    },
    attack1: {
      imageSrc:'assets/images/characters/Shadow/Attack1.png',
      framesMax: 8
    },
    attack2: {
      imageSrc:'assets/images/characters/Shadow/Attack2.png',
      framesMax: 8
    },
    takeHit: {
      imageSrc:'assets/images/characters/Shadow/Take hit.png',
      framesMax: 3
    },
    death: {
      imageSrc:'assets/images/characters/Shadow/Death.png',
      framesMax: 7
    }
  }
})

const enemy = new Fighter({
  position:{
    x:canvas.width - 100,
    y:GROUND_Y
  },
  velocity:{
    x:0,
    y:0
  },
  color: 'blue',
  imageSrc:'assets/images/characters/Wizard/Idle.png',
  framesMax: 6,
  scale: 1.7,
  flipped: true,
  offset: {
    x: 215,
    y: 90
  },
  attackBoxOffset: {
    x: -210,
    y: 50
  },
  attackBoxWidth: 190,
  attackBoxHeight: 50,

  sprites: {
    idle: {
      imageSrc:'assets/images/characters/Wizard/Idle.png',
      framesMax: 6
    },
    run: {
      imageSrc:'assets/images/characters/Wizard/Run.png',
      framesMax: 8
    },
    jump: {
      imageSrc:'assets/images/characters/Wizard/Jump.png',
      framesMax: 2
    },
    fall: {
      imageSrc:'assets/images/characters/Wizard/Fall.png',
      framesMax: 2
    },
    attack1: {
      imageSrc:'assets/images/characters/Wizard/Attack1.png',
      framesMax: 8
    },
    attack2: {
      imageSrc:'assets/images/characters/Wizard/Attack2.png',
      framesMax: 8
    },
    takeHit: {
      imageSrc:'assets/images/characters/Wizard/Hit.png',
      framesMax: 4
    },
    death: {
      imageSrc:'assets/images/characters/Wizard/Death.png',
      framesMax: 7
    }
  }
})

enemy.draw()

const keys = {
  q:          { pressed: false },
  d:          { pressed: false },
  ArrowRight: { pressed: false },
  ArrowLeft:  { pressed: false }
}

function switchSprite(fighter, spriteName) {
  if (fighter.image === fighter.sprites.death?.image) return

  if (
    fighter.image === fighter.sprites.takeHit?.image &&
    fighter.framesCurrent < fighter.framesMax - 1
  ) return

  if (
    (fighter.image === fighter.sprites.attack1?.image ||
     fighter.image === fighter.sprites.attack2?.image) &&
    fighter.framesCurrent < fighter.framesMax - 1
  ) return

  if (fighter.image !== fighter.sprites[spriteName].image) {
    fighter.image = fighter.sprites[spriteName].image
    fighter.framesMax = fighter.sprites[spriteName].framesMax
    fighter.framesCurrent = 0
  }
}

function flashAvatar(selector, health) {
  const el = document.querySelector(selector)
  if (!el) return
  el.classList.add('avatar--damage')
  setTimeout(() => el.classList.remove('avatar--damage'), 340)
}

function showCountdown() {
  // Clear any held keys so fighters stay idle during countdown
  Object.values(keys).forEach(k => k.pressed = false)

  countdownActive = true
  gameStarted = true                       // arena renders immediately
  gsap.set('.hud', { opacity: 0, y: -22 }) // keep HUD hidden until startGame
  canvas.classList.add('countdown-blur')

  // Voice: "three · two · one · fight!" — 5 s file, each word at ~0,1,2,3 s
  const voice = new Audio('assets/audio/countdown.mp3')
  voice.volume = 0.9
  voice.play().catch(() => {})

  const el = document.querySelector('#countdown')
  el.style.display = 'flex'

  const tl = gsap.timeline()

  // Numbers: 3 · 2 · 1
  ;['3', '2', '1'].forEach((n, i) => {
    tl.call(() => {
      el.textContent         = n
      el.style.fontSize      = '120px'
      el.style.color         = '#ffffff'
      el.style.letterSpacing = '-2px'
      el.style.textShadow    = '0 0 40px rgba(255,255,255,0.85), 5px 5px 0 #000, -3px -3px 0 #000'
    }, null, i * 1.0)
    .fromTo(el,
      { scale: 1.9, opacity: 0 },
      { scale: 1,   opacity: 1, duration: 0.25, ease: 'back.out(2)' },
      i * 1.0
    )
    .to(el,
      { scale: 0.3, opacity: 0, duration: 0.2, ease: 'power2.in' },
      i * 1.0 + 0.78
    )
  })

  // FIGHT!
  tl.call(() => {
    el.textContent         = 'FIGHT!'
    el.style.fontSize      = '78px'
    el.style.color         = '#ffd700'
    el.style.letterSpacing = '6px'
    el.style.textShadow    = '0 0 50px rgba(255,215,0,0.9), 0 0 100px rgba(255,140,0,0.5), 4px 4px 0 #7b4f00, -2px -2px 0 #7b4f00'
  }, null, 3.0)
  .fromTo(el,
    { scale: 2.2, opacity: 0 },
    { scale: 1,   opacity: 1, duration: 0.32, ease: 'elastic.out(1, 0.5)' },
    3.0
  )
  // Blur fades away while FIGHT! is still on screen — arena is clear before fight starts
  .call(() => canvas.classList.remove('countdown-blur'), null, 3.9)
  .to(el,
    { scale: 1.08, opacity: 0, duration: 0.45, ease: 'power1.out' },
    4.05
  )
  .call(() => {
    el.style.display = 'none'
    countdownActive = false
    startGame()
  }, null, 4.5)
}

function animate(){
   window.requestAnimationFrame(animate)
   if (!gameStarted) return   // keep the canvas blank while the menu is showing
   c.fillStyle='black'
   c.fillRect(0,0,canvas.width,canvas.height)
   background.update()
   for (const platform of platforms) platform.draw()
   c.fillStyle ='rgba(255 , 255 , 255 , 0.1)'
   c.fillRect(0,0,canvas.width , canvas.height)
   player.update()
   enemy.update()

   player.velocity.x=0
   enemy.velocity.x =0

   if(keys.q.pressed && player.lastkey==='q') {
    player.velocity.x=-5
   } else if (keys.d.pressed && player.lastkey==='d') {
    player.velocity.x=5
   }

   if(player.health <= 0) {
    switchSprite(player, 'death')
   } else if(player.isAttacking) {
    switchSprite(player, player.attackAction)
   } else if(player.velocity.y < 0) {
    switchSprite(player, 'jump')
   } else if(player.velocity.y > 0) {
    switchSprite(player, 'fall')
   } else if(keys.q.pressed && player.lastkey==='q') {
    switchSprite(player, 'run')
   } else if (keys.d.pressed && player.lastkey==='d') {
    switchSprite(player, 'run')
   } else {
    switchSprite(player, 'idle')
   }

   if(keys.ArrowLeft.pressed && enemy.lastkey==='ArrowLeft') {
    enemy.velocity.x=-5
   } else if (keys.ArrowRight.pressed && enemy.lastkey==='ArrowRight') {
    enemy.velocity.x=5
   }

   if(enemy.health <= 0) {
    switchSprite(enemy, 'death')
   } else if(enemy.isAttacking) {
    switchSprite(enemy, enemy.attackAction)
   } else if(enemy.velocity.y < 0) {
    switchSprite(enemy, 'jump')
   } else if(enemy.velocity.y > 0) {
    switchSprite(enemy, 'fall')
   } else if(keys.ArrowLeft.pressed && enemy.lastkey==='ArrowLeft') {
    switchSprite(enemy, 'run')
   } else if(keys.ArrowRight.pressed && enemy.lastkey==='ArrowRight') {
    switchSprite(enemy, 'run')
   } else {
    switchSprite(enemy, 'idle')
   }

   if(rectangularCollision({
      rectangle1: player ,
      rectangle2: enemy
   }) && player.isAttacking ){
       player.isAttacking = false
       enemy.health -=6
       gsap.to('#enemyHealth', { width: enemy.health + '%', duration: 1.5 })
       setHealthColor('#enemyHealth', enemy.health)
       SoundManager.playHit()
       switchSprite(enemy, 'takeHit')
       flashAvatar('.avatar--enemy', enemy.health)
   }

   if(rectangularCollision({
      rectangle1: enemy ,
      rectangle2: player
   }) && enemy.isAttacking ){
       enemy.isAttacking = false
       player.health -=6
       gsap.to('#playerHealth', { width: player.health + '%', duration: 1.5 })
       setHealthColor('#playerHealth', player.health)
       SoundManager.playHit()
       switchSprite(player, 'takeHit')
       flashAvatar('.avatar--player', player.health)
   }

   if((enemy.health <= 0 || player.health <= 0) && !gameOver){
     gameOver = true
     SoundManager.stopMusic()
     SoundManager.playVictory()
     clearTimeout(timerID)
     if(enemy.health <= 0) {
       enemy.dead = true
       switchSprite(enemy, 'death')
     }
     if(player.health <= 0) {
       player.dead = true
       switchSprite(player, 'death')
     }
     setTimeout(() => determineWinner({player, enemy, timerID}), 1500)
   }
}

animate()

function startGame() {
  gameStarted = true
  SoundManager.startMusic()
  decreaseTimer()
  setHealthColor('#playerHealth', player.health)
  setHealthColor('#enemyHealth',  enemy.health)

  gsap.fromTo('.hud',
    { opacity: 0, y: -22 },
    { opacity: 1, y: 0, duration: 0.55, ease: 'power2.out' }
  )
  gsap.fromTo('.avatar--player',
    { x: -50, opacity: 0, scale: 0.5 },
    { x: 0, opacity: 1, scale: 1, duration: 0.6, delay: 0.15, ease: 'back.out(2.2)' }
  )
  gsap.fromTo('.avatar--enemy',
    { x: 50, opacity: 0, scale: 0.5 },
    { x: 0, opacity: 1, scale: 1, duration: 0.6, delay: 0.15, ease: 'back.out(2.2)' }
  )
  gsap.fromTo('#timer',
    { y: -40, opacity: 0, scale: 0.4 },
    { y: 0, opacity: 1, scale: 1, duration: 0.75, delay: 0.25, ease: 'elastic.out(1.1, 0.5)' }
  )
}

function restartGame() {
  gameOver = false
  SoundManager.stopMusic()
  SoundManager.startMusic()

  timer = 60
  document.querySelector('#timer-num').innerHTML = '60'

  player.health = 100
  player.dead = false
  player.position.x = 45
  player.position.y = GROUND_Y
  player.velocity.x = 0
  player.velocity.y = 0
  player.image = player.sprites.idle.image
  player.framesMax = player.sprites.idle.framesMax
  player.framesCurrent = 0
  gsap.to('#playerHealth', { width: '100%', duration: 0.8 })
  setHealthColor('#playerHealth', 100)

  enemy.health = 100
  enemy.dead = false
  enemy.position.x = canvas.width - 100
  enemy.position.y = GROUND_Y
  enemy.velocity.x = 0
  enemy.velocity.y = 0
  enemy.image = enemy.sprites.idle.image
  enemy.framesMax = enemy.sprites.idle.framesMax
  enemy.framesCurrent = 0
  gsap.to('#enemyHealth', { width: '100%', duration: 0.8 })
  setHealthColor('#enemyHealth', 100)

  document.querySelector('#timer').classList.remove('timer-warning', 'timer-critical')
  document.querySelector('#displayText').style.display = 'none'
  document.querySelector('#playAgain').style.display = 'none'

  decreaseTimer()
}

window.addEventListener('keydown',(e)=> {
    if (countdownActive) return
    switch(e.key) {
      case 'd':
         keys.d.pressed=true
         player.lastkey='d'
        break
      case 'q':
        keys.q.pressed=true
        player.lastkey='q'
        break
      case 'z':
        if (!player.dead) player.velocity.y=-20
        break
      case ' ':
        if (!player.dead) player.attack('attack1')
        break
      case 'e':
        if (!player.dead) player.attack('attack2')
        break
      case 'ArrowRight':
         keys.ArrowRight.pressed = true
         enemy.lastkey = 'ArrowRight'
        break
      case 'ArrowLeft':
        keys.ArrowLeft.pressed=true
        enemy.lastkey='ArrowLeft'
        break
      case 'ArrowUp':
        if (!enemy.dead) enemy.velocity.y=-20
        break
      case 'ArrowDown':
        if (!enemy.dead) enemy.attack('attack1')
        break
      case 'l':
        if (!enemy.dead) enemy.attack('attack2')
        break
    }
})

window.addEventListener('keyup',(e)=> {
    switch(e.key) {
      case 'd':
        keys.d.pressed = false
        break
      case 'q':
        keys.q.pressed = false
        break
      case 'ArrowRight':
        keys.ArrowRight.pressed = false
        break
      case 'ArrowLeft':
        keys.ArrowLeft.pressed = false
        break
    }
})

// ── Fullscreen scaling ────────────────────────────────────────────
function resizeGame() {
  const scaleX = window.innerWidth  / 1024
  const scaleY = window.innerHeight / 576
  const scale  = Math.max(scaleX, scaleY)   // fill — no black bars
  const wrapper = document.querySelector('.game-wrapper')
  wrapper.style.transform = `scale(${scale})`
  wrapper.style.left = ((window.innerWidth  - 1024 * scale) / 2) + 'px'
  wrapper.style.top  = ((window.innerHeight - 576  * scale) / 2) + 'px'
}
resizeGame()
window.addEventListener('resize', resizeGame)

// ── Boot the main menu ──────────────────────────────────────────
const mainMenu = new Menu()
mainMenu.show()
