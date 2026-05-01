class Sprite {
  constructor({
    position,
    imageSrc ,
    scale = 1 ,
    framesMax = 1 ,
    offset = {x: 0 , y:0},
    flipped = false

  }){
    this.position = position
    this.width = 50
    this.height= 150
    this.image = new Image()
    this.image.src = imageSrc
    this.scale = scale
    this.framesMax = framesMax
    this.framesCurrent = 0
    this.framesElapsed = 0
    this.framesHold = 8
    this.offset = offset
    this.flipped = flipped

  }

  draw(){
    const spriteW = (this.image.width / this.framesMax) * this.scale
    const drawX   = this.position.x - this.offset.x
    const drawY   = this.position.y - this.offset.y
    const srcX    = this.framesCurrent * (this.image.width / this.framesMax)
    const srcW    = this.image.width / this.framesMax

    if (this.flipped) {
      c.save()
      c.scale(-1, 1)
      c.drawImage(this.image, srcX, 0, srcW, this.image.height,
        -drawX - spriteW, drawY, spriteW, this.image.height * this.scale)
      c.restore()
    } else {
      c.drawImage(this.image, srcX, 0, srcW, this.image.height,
        drawX, drawY, spriteW, this.image.height * this.scale)
    }
  }

  animateFrames() {
     this.framesElapsed++

    if(this.framesElapsed % this.framesHold === 0){
         if(this.framesCurrent < this.framesMax - 1){
        this.framesCurrent++
         }else if(!this.dead) {
      this.framesCurrent = 0
         }
     }
  }

  update(){
    this.draw()
    this.animateFrames()
  }


}

class Fighter extends Sprite {
  constructor({position,
    velocity,
    color='red',
    imageSrc ,
    scale = 1 ,
    framesMax = 1,
    offset = {x: 0 , y:0},
    flipped = false,
    sprites,
    attackBoxOffset = {x: 0, y: 0},
    attackBoxWidth = 100,
    attackBoxHeight = 50,
    attackBoxColor = 'red'
  }){

    super({
      position,
      imageSrc,
      scale,
      framesMax,
      offset,
      flipped

    })

    this.velocity = velocity
    this.width = 50
    this.height= 150
    this.lastkey
    this.attackBox= {
      position: {
        x: this.position.x,
        y: this.position.y
      },
      offset: attackBoxOffset,
      width: attackBoxWidth,
      height: attackBoxHeight,
      color: attackBoxColor
    }
    this.color = color
    this.isAttacking
    this.attackAction = 'attack1'
    this.health = 100
    this.dead = false
    this.framesCurrent = 0
    this.framesElapsed = 0
    this.framesHold = 8
    this.sprites = sprites

    for(const sprite in this.sprites){
       sprites[sprite].image = new Image()
       sprites[sprite].image.src = sprites[sprite].imageSrc
    }

  }

  draw(){
    super.draw()
  }

  update(){
    this.draw()
    this.animateFrames()

    if(this.dead) return

    this.attackBox.position.x = this.position.x + this.attackBox.offset.x
    this.attackBox.position.y = this.position.y

    this.position.x += this.velocity.x
    this.position.y += this.velocity.y

    // horizontal boundary
    if (this.position.x <= 0) this.position.x = 0
    if (this.position.x + this.width >= canvas.width) this.position.x = canvas.width - this.width

    // top boundary
    if (this.position.y <= 0) {
      this.position.y = 0
      this.velocity.y = 0
    }

    // gravity + floor + platforms
    let landed = false

    // main floor
    if (this.position.y + this.height + this.velocity.y >= canvas.height - 96) {
      this.velocity.y = 0
      this.position.y = canvas.height - 96 - this.height
      landed = true
    }

    // platforms — only collide when falling (jump-through from below)
    if (!landed && this.velocity.y > 0 && typeof platforms !== 'undefined') {
      for (const platform of platforms) {
        const bottom     = this.position.y + this.height
        const nextBottom = bottom + this.velocity.y
        const overlapX   = this.position.x + this.width > platform.position.x &&
                           this.position.x < platform.position.x + platform.width

        if (overlapX && bottom <= platform.position.y && nextBottom >= platform.position.y) {
          this.velocity.y = 0
          this.position.y = platform.position.y - this.height
          landed = true
          break
        }
      }
    }

    if (!landed) this.velocity.y += gravity
  }

  attack(attackType = 'attack1'){
    this.isAttacking = true
    this.attackAction = attackType
    setTimeout(()=> {
      this.isAttacking = false
    }, 100)
  }


}

class Platform {
  constructor({ position, width, height }) {
    this.position = position
    this.width    = width
    this.height   = height
  }

  draw() {
    c.fillStyle = 'red'
    c.fillRect(this.position.x, this.position.y, this.width, this.height)
  }
}
