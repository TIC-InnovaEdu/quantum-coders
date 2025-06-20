const player = document.getElementById('player');
const enemy1 = document.getElementById('enemy1');
const stage = document.getElementById('stage');
const keysPressed = {};

// Posiciones iniciales
let playerX = 0;
let playerZ = 0;
let enemyX = 300;
let enemyZ = 50;
let dialogueActive = false;


// Tamaño del escenario
const stageWidth = window.innerWidth;
const stageDepth = 280; 

document.addEventListener('keydown', (e) => {
    keysPressed[e.key] = true;
});

document.addEventListener('keyup', (e) => {
    keysPressed[e.key] = false;
});

function getProjectedX(x, z) {
    return stageWidth / 2 + x - z * 0.5;
}

function getProjectedY(z) {
    return 100 + z * 0.3;
}

function getDistance2D(aX, aZ, bX, bZ) {
    let projA = getProjectedX(aX, aZ);
    let projB = getProjectedX(bX, bZ);
    return Math.abs(projA - projB);
}

function checkNPCProximity() {
    let dist = getDistance2D(playerX, playerZ, enemyX, enemyZ);
    let zDiff = Math.abs(playerZ - enemyZ);

    // Cuando el jugador se acerca, mostrar diálogo y detenerlo
    if (dist < 60 && zDiff < 40) {
        if (!dialogueActive) {
            showDialogue("¡Bienvenido! TU historia termina aquí...");
            dialogueActive = true;
        }

        // Evitar que lo atraviese
        if (playerX < enemyX) {
            playerX = enemyX - 60;
        } else {
            playerX = enemyX + 60;
        }
    } else {
        dialogueActive = false;
        hideDialogue();
    }
}


function updateCharacterPosition(el, x, z) {
    const screenX = stageWidth / 2 + x - z * 0.5;
    const screenY = z * 0.3;

    el.style.left = `${screenX}px`;
    el.style.bottom = `${100 + screenY}px`;
    el.style.transform = `translateX(-50%) scale(${1 - z * 0.001})`;
    el.dataset.z = z; 
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

function movePlayer() {
    const speed = 10;
    const depthSpeed = 5;

    // Movimiento horizontal
    if (keysPressed['ArrowLeft']) playerX -= speed;
    if (keysPressed['ArrowRight']) playerX += speed;

    // Movimiento en profundidad (Z)
    if (keysPressed['ArrowDown'] && !keysPressed['ArrowLeft'] && !keysPressed['ArrowRight']) {
        playerZ = Math.max(0, playerZ - depthSpeed);
    } else if (keysPressed['ArrowUp'] && !keysPressed['ArrowLeft'] && !keysPressed['ArrowRight']) {
        playerZ = Math.min(stageDepth, playerZ + depthSpeed);
    }

    // Movimiento diagonal (opcional)
    if (keysPressed['ArrowDown'] && (keysPressed['ArrowLeft'] || keysPressed['ArrowRight'])) {
        playerZ = Math.max(0, playerZ - depthSpeed);
    }
    if (keysPressed['ArrowUp'] && (keysPressed['ArrowLeft'] || keysPressed['ArrowRight'])) {
        playerZ = Math.min(stageDepth, playerZ + depthSpeed);
    }
}


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

function gameLoop() {
    movePlayer();
    checkNPCProximity();
    updatePositions();
    requestAnimationFrame(gameLoop);
}


gameLoop();

function showDialogue(text) {
    if (!document.getElementById('dialogueBox')) {
        let box = document.createElement('div');
        box.id = 'dialogueBox';
        box.style.position = 'absolute';
        box.style.bottom = '150px';
        box.style.left = '50%';
        box.style.transform = 'translateX(-50%)';
        box.style.background = '#111';
        box.style.color = 'white';
        box.style.padding = '10px 20px';
        box.style.border = '2px solid white';
        box.style.borderRadius = '10px';
        box.style.fontSize = '18px';
        box.style.zIndex = '99';
        document.body.appendChild(box);
    }
    document.getElementById('dialogueBox').innerText = text;
}

function hideDialogue() {
    let box = document.getElementById('dialogueBox');
    if (box) box.remove();
}
