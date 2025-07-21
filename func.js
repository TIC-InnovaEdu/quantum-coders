// Archivo .js adaptado para juego 2D tipo plataformas
const player = document.getElementById('player');
const enemy1 = document.getElementById('enemy1');
const trigger = document.getElementById('trigger1');
const enemy2 = document.getElementById('enemy2');
const stage = document.getElementById('stage');
const keysPressed = {};

player.style.backgroundImage = "url('Resources/Player.png')";
enemy1.style.backgroundImage = "url('Resources/trigger (2).png')";
enemy2.style.backgroundImage = "url('Resources/enemy2.png')";

let playerX = 0;
let playerY = 0;
let velocityY = 0;
let isJumping = false;

let enemyX = 600;
let enemyY = 0;

let triggerX = 900;
let triggerY = 0;

let enemy2X = 400;
let enemy2Y = 0;

let scene = 1;
let transitioning = false;

const gravity = 1;
const groundLevel = 80;

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

function movePlayer() {
    const speed = 5;

    if (keysPressed['ArrowLeft']) playerX -= speed;
    if (keysPressed['ArrowRight']) playerX += speed;

    if (keysPressed[' '] && !isJumping) {
        velocityY = 15;
        isJumping = true;
    }

    applyGravity();
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
