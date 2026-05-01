function rectangularCollision({rectangle1 , rectangle2})
{
  return (rectangle1.attackBox.position.x + rectangle1.attackBox.width 
    >= rectangle2.position.x && rectangle1.attackBox.position.x <= 
    rectangle2.position.x + rectangle2.width &&
    rectangle1.attackBox.position.y + rectangle1.attackBox.height >= rectangle2.position.y
    && rectangle1.attackBox.position.y <= rectangle2.position.y + rectangle2.height
    && rectangle1.isAttacking )
}

function determineWinner({player,enemy}) {
  clearTimeout(timerID)

  const displayText = document.querySelector('#displayText')
  displayText.style.display = 'flex'

  if(player.health === enemy.health){
    displayText.innerHTML = 'Tie'
  } else if(player.health > enemy.health){
    displayText.innerHTML = 'Player 1 Wins'
  } else {
    displayText.innerHTML = 'Player 2 Wins'
  }

  gsap.fromTo('#displayText',
    { scale: 0, opacity: 0 },
    { scale: 1, opacity: 1, duration: 0.6, ease: 'elastic.out(1, 0.3)' }
  )

  const playAgain = document.querySelector('#playAgain')
  playAgain.style.display = 'flex'
  gsap.fromTo('#playAgain',
    { opacity: 0, scaleX: 0 },
    { opacity: 1, scaleX: 1, duration: 0.4, delay: 1.2, ease: 'steps(5)' }
  )
}

let timer = 60
let timerID
function decreaseTimer() {
  if (timer > 0) {
    timerID = setTimeout(decreaseTimer, 1000)
    timer--

    const timerEl  = document.querySelector('#timer')
    const timerNum = document.querySelector('#timer-num')

    timerNum.innerHTML = String(timer).padStart(2, '0')

    // State classes
    timerEl.classList.remove('timer-warning', 'timer-critical')
    if      (timer <= 10) timerEl.classList.add('timer-critical')
    else if (timer <= 20) timerEl.classList.add('timer-warning')

    // Tick pulse — restart animation each second
    timerNum.classList.remove('tick')
    void timerNum.offsetWidth          // force reflow so animation restarts
    timerNum.classList.add('tick')
    setTimeout(() => timerNum.classList.remove('tick'), 200)
  }

  if (timer === 0) {
    determineWinner({ player, enemy, timerID })
  }
}
