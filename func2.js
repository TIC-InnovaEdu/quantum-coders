const player = document.getElementById('player');
const enemy1 = document.getElementById('enemy1');
const trigger = document.getElementById('trigger1');
const background = document.getElementById('background');
let enemy2 = document.getElementById('enemy2');

let playerX = 0, playerZ = 0;
let enemyX = 300, enemyZ = 50;
let playerHealth = 100;
let enemyHealth = 100;
let comboSequence = [];
let lastKeyPressTime = 0;

const keysPressed = {};
let scene = 1;
let transitioning = false;
let dialogueActive = false;

const stageWidth = window.innerWidth;
const stageDepth = 280;

function getProjectedX(x, z) {
    return stageWidth / 2 + x - z * 0.5;
}

function getProjectedY(z) {
    return 100 + z * 0.3;
}

function getDistance2D(aX, aZ, bX, bZ) {
    return Math.abs(getProjectedX(aX, aZ) - getProjectedX(bX, bZ));
}

function updateCharacterPosition(el, x, z) {
    if (!el) return;
    el.style.left = `${getProjectedX(x, z)}px`;
    el.style.bottom = `${getProjectedY(z)}px`;
    el.style.transform = `translateX(-50%) scale(${1 - z * 0.001})`;
    el.dataset.z = z;
}

function updateZIndex() {
    const elements = [player];
    if (scene === 1) elements.push(enemy1, trigger);
    if (scene === 2 && enemy2) elements.push(enemy2);

    elements.sort((a, b) => parseFloat(b.dataset.z) - parseFloat(a.dataset.z));
    elements.forEach((el, i) => el.style.zIndex = i + 1);
}


document.addEventListener('keydown', (e) => {
    keysPressed[e.key] = true;

    // Combo
    if (['ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        comboSequence.push(e.key);
        checkCombo();
    }

    // Ataque
    if (e.key === ' ') {
        playerAttack();
    }

    // Dash
    const now = Date.now();
    if (['ArrowLeft', 'ArrowRight'].includes(e.key)) {
        if (now - lastKeyPressTime < 300) {
            playerX += (e.key === 'ArrowRight' ? 50 : -50);
        }
        lastKeyPressTime = now;
    }
});

document.addEventListener('keyup', (e) => {
    keysPressed[e.key] = false;
});

function movePlayer() {
    const speed = 10, depthSpeed = 5;

    if (keysPressed['ArrowLeft']) playerX -= speed;
    if (keysPressed['ArrowRight']) playerX += speed;
    if (keysPressed['ArrowUp']) playerZ = Math.min(stageDepth, playerZ + depthSpeed);
    if (keysPressed['ArrowDown']) playerZ = Math.max(0, playerZ - depthSpeed);
}

let lastEnemyAttack = 0;

function updateEnemyAI() {
    if (scene !== 1 || enemyHealth <= 0) return;

    if (enemyX < playerX) enemyX += 2;
    else if (enemyX > playerX) enemyX -= 2;

    if (enemyZ < playerZ) enemyZ += 1;
    else if (enemyZ > playerZ) enemyZ -= 1;

    const dist = getDistance2D(playerX, playerZ, enemyX, enemyZ);
    const now = Date.now();

    if (dist < 60 && now - lastEnemyAttack > 1000) {
        takeDamage(5);
        lastEnemyAttack = now;
    }
}


function playerAttack() {
    const dist = getDistance2D(playerX, playerZ, enemyX, enemyZ);
    if (dist < 60 && scene === 1 && enemyHealth > 0) {
        enemyHealth -= 10;
        enemy1.classList.add("hit");

        setTimeout(() => {
            enemy1.classList.remove("hit");
        }, 300);

        if (enemyHealth <= 0) {
            enemy1.style.display = 'none';
            showDialogue("¡Enemigo derrotado!");
            dropItem(enemyX, enemyZ);
        }4
    }
}

function takeDamage(amount) {
    playerHealth -= amount;
    const bar = document.getElementById("health");
    if (bar) bar.style.width = playerHealth + "%";
    if (playerHealth <= 0) {
        showDialogue("¡Has perdido!");
    }
}

let comboTimer;

function checkCombo() {
    const combo = comboSequence.slice(-3).join(',');
    if (combo === 'ArrowLeft,ArrowRight,Space') {
        showDialogue("¡Combo especial!");
        comboSequence = [];
    }

    clearTimeout(comboTimer);
    comboTimer = setTimeout(() => comboSequence = [], 1500);
}


function showDialogue(text) {
    let box = document.getElementById('dialogueBox');
    if (!box) {
        box = document.createElement('div');
        box.id = 'dialogueBox';
        Object.assign(box.style, {
            position: 'absolute', bottom: '150px', left: '50%', transform: 'translateX(-50%)',
            background: '#111', color: 'white', padding: '10px 20px',
            border: '2px solid white', borderRadius: '10px', fontSize: '18px', zIndex: '99'
        });
        document.body.appendChild(box);
    }
    box.innerText = text;
}

function hideDialogue() {
    const box = document.getElementById('dialogueBox');
    if (box) box.remove();
}

function dropItem(x, z) {
    const item = document.createElement('div');
    item.className = 'item';
    item.style.left = `${getProjectedX(x, z)}px`;
    item.style.bottom = `${getProjectedY(z)}px`;
    item.style.transform = `translateX(-50%) scale(${1 - z * 0.001})`;
    item.style.backgroundImage = "url('Resources/item.png')";
    document.getElementById('stage').appendChild(item);
}

function updatePositions() {
    updateCharacterPosition(player, playerX, playerZ);
    if (scene === 1) updateCharacterPosition(enemy1, enemyX, enemyZ);
    if (scene === 2 && enemy2) updateCharacterPosition(enemy2, enemy2X, enemy2Z);
    updateZIndex();
}

function gameLoop() {
    movePlayer();
    updateEnemyAI();
    updatePositions();
    requestAnimationFrame(gameLoop);
}

background.style.backgroundImage = "url('Resources/Background1.png')";
gameLoop();
