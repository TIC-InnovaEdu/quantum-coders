const player = document.getElementById('player');
const enemy1 = document.getElementById('enemy1');
const trigger = document.getElementById('trigger1');
const enemy2 = document.getElementById('enemy2');
const stage = document.getElementById('stage');
const keysPressed = {};

player.style.backgroundImage = "url('Resources/Player.png')";
enemy1.style.backgroundImage = "url('Resources/trigger (2).png')";
enemy2.style.backgroundImage = "url('Resources/enemy1_idle.png')";

let playerX = 0;
let playerY = 100;
let velocityY = 0;
let isJumping = false;

let enemyX = 600;
let enemyY = 120;

let triggerX = 900;
let triggerY = 100;

let enemy2X = 900;
let enemy2Y = 100;

let scene = 1;
let transitioning = false;

let playerLives = 4;

const gravity = 0.6;
const groundLevel = 100;


// Eventos de teclado
document.addEventListener('keydown', e => keysPressed[e.key] = true);
document.addEventListener('keyup', e => keysPressed[e.key] = false);

function updateCharacterPosition(el, x, y) {
    el.style.left = `${x}px`;
    el.style.bottom = `${y}px`;
}

function updatePositions() {
    updateCharacterPosition(player, playerX, playerY);
    if (scene === 1) {
        updateCharacterPosition(enemy1, enemyX, enemyY);
        updateCharacterPosition(trigger, triggerX, triggerY);
    } else if (scene === 2) {
        updateCharacterPosition(enemy2, enemy2X, enemy2Y);
    }
}

function applyGravity() {
    if (playerY > groundLevel || isJumping) {
        velocityY -= gravity;
        playerY += velocityY;

        if (playerY <= groundLevel) {
            playerY = groundLevel;
            isJumping = false;
            velocityY = 0;
        }
    }
}

function updateLifeBar() {
    const lifeImage = document.getElementById('lifeImage');
    if (playerLives >= 4) {
        lifeImage.src = 'Resources/vida4.png';
    } else if (playerLives === 3) {
        lifeImage.src = 'Resources/vida3.png';
    } else if (playerLives === 2) {
        lifeImage.src = 'Resources/vida2.png';
    } else if (playerLives === 1) {
        lifeImage.src = 'Resources/vida1.png';
    }
    if (playerLives === 1) {
    showDialogue("¡Has perdido todas tus vidas!");
    
    }
}

function movePlayer() {
    const speed = 5;
    let moving = false;

    // Movimiento horizontal
    if (keysPressed['ArrowLeft']) {
        playerX -= speed;
        player.style.transform = "scaleX(1)";
        moving = true;
    }

    if (keysPressed['ArrowRight']) {
        playerX += speed;
        player.style.transform = "scaleX(-1)";
        moving = true;
    }

    // Saltar
    if (keysPressed[' '] && !isJumping) {
        velocityY = 15;
        isJumping = true;
    }

    applyGravity();

    // Cambiar sprite según estado
    if (isJumping) {
        if (velocityY > 0) {
            player.style.backgroundImage = "url('Resources/Player_Jump.png')";
        } else {
            player.style.backgroundImage = "url('Resources/Player_Fall.png')";
        }
    } else if (moving) {
        player.style.backgroundImage = "url('Resources/Player_Run.png')";
    } else {
        player.style.backgroundImage = "url('Resources/Player_Idle.png')";
    }
}


function checkTriggerCollision() {
    if (playerX > triggerX && !transitioning) {
        transitioning = true;
        showDialogue("Pasando a la siguiente zona...");
        setTimeout(() => {
            startScene2();
        }, 1000);
    }
}

function startScene2() {
    hideDialogue();
    scene = 2;
    transitioning = false;

    enemy1.style.display = 'none';
    trigger.style.display = 'none';
    enemy2.style.display = 'block';

    playerX = 0;
    playerY = groundLevel;

    document.getElementById("background").style.backgroundImage = "url('Resources/BackGround.png')";
}

function gameLoop() {
    movePlayer();
    if (scene === 1) checkTriggerCollision();
    updatePositions();
    requestAnimationFrame(gameLoop);
}

document.getElementById("background").style.backgroundImage = "url('Resources/Background1.png')";
gameLoop();

function showDialogue(text) {
    if (!document.getElementById('dialogueBox')) {
        const box = document.createElement('div');
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
    const box = document.getElementById('dialogueBox');
    if (box) box.remove();
}

setInterval(() => {
    if (scene === 2 && playerLives > 0) {
        const dx = Math.abs(playerX - enemy2X);
        const dy = Math.abs(playerY - enemy2Y);

        // Distancia suficiente para hacer daño 
        if (dx < 100 && dy < 100) {
            playerLives--;
            updateLifeBar();

            enemy2.style.backgroundImage = "url('Resources/enemy1_atk.png')";

            setTimeout(() => {
                enemy2.style.backgroundImage = "url('Resources/enemy1_idle.png')";
            }, 500); // medio segundo después vuelve a idle
        }
    }
}, 1000);

