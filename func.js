const player = document.getElementById('player');
const enemy1 = document.getElementById('enemy1');
const stage = document.getElementById('stage');

// Posiciones iniciales
let playerX = 0;
let playerZ = 0;
let enemyX = 300;
let enemyZ = 50;

// Tamaño del escenario
const stageWidth = window.innerWidth;
const stageDepth = 300; // corregido: menor profundidad máxima

function updateCharacterPosition(el, x, z) {
    const screenX = stageWidth / 2 + x - z * 0.5;
    const screenY = z * 0.3;

    el.style.left = `${screenX}px`;
    el.style.bottom = `${100 + screenY}px`;
    el.style.transform = `translateX(-50%) scale(${1 - z * 0.001})`;
    el.dataset.z = z; // Usamos esto para orden de capas
}

function updateZIndex() {
    const zPlayer = parseFloat(player.dataset.z);
    const zEnemy = parseFloat(enemy1.dataset.z);

    if (zPlayer > zEnemy) {
        player.style.zIndex = 1;
        enemy1.style.zIndex = 2;
    } else {
        player.style.zIndex = 2;
        enemy1.style.zIndex = 1;
    }
}

function updatePositions() {
    updateCharacterPosition(player, playerX, playerZ);
    updateCharacterPosition(enemy1, enemyX, enemyZ);
    updateZIndex();
}

// Controles
document.addEventListener('keydown', (e) => {
    const speed = 10;
    const depthSpeed = 5;

    switch (e.key) {
        case 'ArrowLeft':
            playerX -= speed;
            break;
        case 'ArrowRight':
            playerX += speed;
            break;
        case 'ArrowUp':
            playerZ = Math.max(0, playerZ - depthSpeed);
            break;
        case 'ArrowDown':
            playerZ = Math.min(stageDepth, playerZ + depthSpeed);
            break;
    }

    updatePositions();
});

// Inicializar
updatePositions();

// Movimiento simple del enemigo
setInterval(() => {
    enemyX += (Math.random() - 0.5) * 10;
    enemyZ += (Math.random() - 0.5) * 5;

    // Limitar movimiento del enemigo
    enemyX = Math.max(-200, Math.min(200, enemyX));
    enemyZ = Math.max(0, Math.min(stageDepth, enemyZ));

    updatePositions();
}, 200);

