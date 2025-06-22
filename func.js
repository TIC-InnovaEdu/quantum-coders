const player = document.getElementById('player');
const enemy1 = document.getElementById('enemy1');
const trigger = document.getElementById('trigger1');
const enemy2 = document.getElementById('enemy2');
const stage = document.getElementById('stage');
const keysPressed = {};
player.style.backgroundImage = "url('Resources/Player.png')";
enemy1.style.backgroundImage = "url('Resources/trigger (2).png')";
enemy2.style.backgroundImage = "url('Resources/enemy2.png')";


// Posiciones iniciales
let playerX = 0;
let playerZ = 0;
let enemyX = 300;
let enemyZ = 50;
let scene = 1;
let transitioning = false;
let triggerX = 600;
let triggerZ = 100;
let enemy2X = 300;
let enemy2Z = 100;
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

function updateTriggerPosition() {
    const screenX = getProjectedX(triggerX, triggerZ);
    const screenY = getProjectedY(triggerZ);

    trigger.style.left = `${screenX}px`;
    trigger.style.bottom = `${screenY}px`;
    trigger.style.transform = `translateX(-50%) scale(${1 - triggerZ * 0.001})`;
    trigger.dataset.z = triggerZ;
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
    let elements = [];

    if (scene === 1) {
        elements = [player, enemy1, trigger];
    } else if (scene === 2) {
        elements = [player, enemy2];
    }

    elements.sort((a, b) => parseFloat(b.dataset.z) - parseFloat(a.dataset.z));
    elements.forEach((el, i) => el.style.zIndex = i + 1);
}


function updatePositions() {
    updateCharacterPosition(player, playerX, playerZ);

    if (scene === 1) {
        updateCharacterPosition(enemy1, enemyX, enemyZ);
        updateTriggerPosition();
    }

    if (scene === 2) {
        updateCharacterPosition(enemy2, enemy2X, enemy2Z);
    }

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

function startScene2() {
    hideDialogue();
    scene = 2;
    transitioning = false;
    document.getElementById("background").style.backgroundImage = "url('Resources/BackGround.png')";

    enemy1.style.display = 'none';
    trigger.style.display = 'none';

    playerX = -400;
    playerZ = 150;

    enemy2.style.display = 'block';
    updatePositions();
}

document.getElementById("background").style.backgroundImage = "url('Resources/Background1.png')";
function gameLoop() {
    movePlayer();
    if (scene === 1) {
        checkNPCProximity();
        if (!transitioning) {
            if (playerX > triggerX) {
                transitioning = true;
                showDialogue("Pasando a la siguiente zona...");
                setTimeout(() => {
                    startScene2();
                }, 1000);
            }
        }
    }
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
