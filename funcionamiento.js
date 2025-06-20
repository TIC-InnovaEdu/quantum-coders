const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Jugador y enemigo (Pizarro)
let player = { x: 50, y: 300, width: 40, height: 60, color: 'green', health: 100 };
let enemy = { x: 600, y: 300, width: 40, height: 60, color: 'red', health: 100 };

// Movimiento
let keys = {};
document.addEventListener('keydown', e => keys[e.key] = true);
document.addEventListener('keyup', e => keys[e.key] = false);

function update() {
  if (keys['ArrowRight']) player.x += 4;
  if (keys['ArrowLeft']) player.x -= 4;

  // Colisión simple
  if (player.x + player.width > enemy.x && player.x < enemy.x + enemy.width) {
    enemy.health -= 1;
    document.getElementById('playerHealth').textContent = player.health;
    if (enemy.health <= 0) {
      alert('¡Has vencido a Pizarro y liberado el camino de Atahualpa!');
      resetGame();
    }
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Dibujar jugador
  ctx.fillStyle = player.color;
  ctx.fillRect(player.x, player.y, player.width, player.height);

  // Dibujar enemigo
  ctx.fillStyle = enemy.color;
  ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

function resetGame() {
  player.x = 50;
  enemy.x = 600;
  enemy.health = 100;
}

gameLoop();
