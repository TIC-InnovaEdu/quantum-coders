const player = document.getElementById('player');
const ayllu = document.getElementById('ayllu');
const trigger = document.getElementById('trigger1');
const puma = document.getElementById('puma');
const stage = document.getElementById('stage');
const keysPressed = {};

const gravity = 0.5;
const groundLevel = 100;
const stageWidth = 2000; 
const playerWidth = 100;
const containerWidth = window.innerWidth;

player.style.backgroundImage = "url('Resources/Player_idle.png')";
ayllu.style.backgroundImage = "url('Resources/Totems/Ayllu_Idle.png')";
puma.style.backgroundImage = "url('Resources/panther_idle.png')";

let introText = `En tiempos ancestrales, antes de que el tiempo se midiera y los pueblos tuvieran nombre,
la tierra del actual Ecuador era habitada por culturas sabias y guerreras.
Sus conocimientos se transmitían por generaciones... hasta hoy.`;
let formattedText = introText; 

let currentChar = 0;
let writingInterval = null;
let playerX = 0;
let playerY = 100;
let velocityY = 0;
let isJumping = false;
let isAttacking = false;
let talkedToNPC = false;
let canDamagepuma = true;
let pumaDefeated = false;

let enemyX = 600;
let enemyY = 120;

let triggerX = 900;
let triggerY = 100;


//Puma IA basica
let pumaDirection = 1; // 1 = derecha, -1 = izquierda
let pumaSpeed = 2;
let isPumaAttacking = false;
let pumaAttackCooldown = 0;
let pumaX = 900;
let pumaY = groundLevel;
let pumaLives = 6;
scene = null;
let transitioning = false;
let playerLives = 4;




// Eventos de teclado
document.addEventListener('keyup', e => keysPressed[e.key] = false);

document.addEventListener('keydown', (e) => {
    keysPressed[e.key] = true;

    if (scene === 0 && e.key.toLowerCase() === 'b') {
        document.getElementById('introScene').style.display = 'none';
        scene = 1;
        talkedToNPC = false;
        for (let key in keysPressed) {
            keysPressed[key] = false;
        }
        return;
    }

    if (scene !== 0) {
        if ((e.key === 'a' || e.key === 'A')) handlePlayerAttack();
        if ((e.key === 'b' || e.key === 'B')) checkNPCInteraction();
        if (e.key === 'ArrowDown' && isOnPlatform()) {
        playerY -= 5; // Bajar un poco
        isJumping = true; // Permitir caída libre
        return; // Evitar otros movimientos
        }
    }
});



function updateCharacterPosition(el, x, y) {
    el.style.left = `${x}px`;
    el.style.bottom = `${y}px`;
}

function updatePositions() {
    updateCharacterPosition(player, playerX, playerY);
    if (scene === 1) {
        updateCharacterPosition(ayllu, enemyX, enemyY);
        updateCharacterPosition(trigger, triggerX, triggerY);
    } else if (scene === 2) {
        updateCharacterPosition(puma, pumaX, pumaY);
    }
}

function applyGravity() {
    velocityY -= gravity;
    playerY += velocityY;

    const platforms = scene === 3
    ? document.querySelectorAll('.platforms-scene-3 .platform')
    : scene === 2
    ? document.querySelectorAll('.platforms-scene-2 .platform')
    : document.querySelectorAll('.platforms-scene-1 .platform');
    
    let landedOnPlatform = false;

    for (const platform of platforms) {
        const platformY = parseInt(platform.style.bottom);
        const platformX = parseInt(platform.style.left);
        const platformWidth = platform.offsetWidth;

        const isHorizontallyAligned = playerX + playerWidth > platformX && playerX < platformX + platformWidth;
        const distanceToPlatform = (playerY + velocityY) - (platformY + 20);
        const isFallingOntoPlatform = velocityY <= 0 && isHorizontallyAligned && distanceToPlatform <= 5 && distanceToPlatform >= -10;

        if (isHorizontallyAligned && isFallingOntoPlatform) {
            playerY = platformY + 20;
            velocityY = 0;
            isJumping = false;
            landedOnPlatform = true;
            break;
        }
    }

    // Si no aterrizó en una plataforma, revisamos el suelo
    if (!landedOnPlatform) {
        if (playerY <= groundLevel) {
            playerY = groundLevel;
            velocityY = 0;
            isJumping = false;
        } else {
            isJumping = true;
        }
    }
}


function getCurrentPlatform() {
    const activePlatforms = scene === 2
    ? document.querySelectorAll('.platforms-scene-2 .platform')
    : document.querySelectorAll('.platforms-scene-1 .platform');
    const playerRect = player.getBoundingClientRect();
    
    for (const platform of platforms) {
        const platformRect = platform.getBoundingClientRect();
        
        if (playerRect.right > platformRect.left + 5 && 
            playerRect.left < platformRect.right - 5 &&
            playerRect.bottom >= platformRect.top - 10 && 
            playerRect.bottom <= platformRect.top + 5) {
            return platform;
        }
    }
    return null;
}


function checkPlatformBlockers() {
    const blockers = document.querySelectorAll('.blocker-platform');
    const playerRect = player.getBoundingClientRect();
    
    for (const blocker of blockers) {
        const blockRect = blocker.getBoundingClientRect();
        
        // Solo colisionar desde abajo (para permitir saltos)
        if (playerRect.right > blockRect.left + 5 && 
            playerRect.left < blockRect.right - 5 &&
            playerRect.bottom >= blockRect.top - 10 && 
            playerRect.bottom <= blockRect.top + 5) {
            
            // Detener la caída
            if (velocityY < 0) {
                velocityY = 0;
                playerY = blockRect.top - playerRect.height;
                isJumping = false;
            }
            return true;
        }
    }
    return false;
}

// --- BLOQUEO CON MONTAÑAS / MUROS ---
function checkWallCollision() {
    const walls = document.querySelectorAll('.blocker-wall');
    const playerRect = player.getBoundingClientRect();
    
    for (const wall of walls) {
        const wallRect = wall.getBoundingClientRect();
        
        const collisionMargin = 5;
        
        if (playerRect.right > wallRect.left + collisionMargin && 
            playerRect.left < wallRect.right - collisionMargin && 
            playerRect.bottom > wallRect.top + collisionMargin) {
            
            // Ajustar posición del jugador
            if (keysPressed['ArrowRight']) {
                playerX = wallRect.left - playerRect.width - 2;
            } else if (keysPressed['ArrowLeft']) {
                playerX = wallRect.right + 2;
            }
            return true;
        }
    }
    return false;
}

function checkNPCInteraction() {
    const playerRect = player.getBoundingClientRect();
    const npcRect = ayllu.getBoundingClientRect();

    const near = !(playerRect.right < npcRect.left - 20 ||
                   playerRect.left > npcRect.right + 20 ||
                   playerRect.bottom < npcRect.top - 20 ||
                   playerRect.top > npcRect.bottom + 20);

    if (near && keysPressed['b'] && !talkedToNPC) {
        showDialogue("¡Bienvenido, guerrero! Puedes continuar...");
        talkedToNPC = true;
        setTimeout(hideDialogue, 3000);
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

    if (playerLives <= 0) {
        showGameOver();
    }
}


function showGameOver() {
    document.getElementById('gameOverScreen').style.display = 'block';
    setTimeout(() => {
        location.reload(); 
    }, 3000);
}

function isOnPlatform() {
    const platforms = scene === 3
    ? document.querySelectorAll('.platforms-scene-3 .platform')
    : scene === 2
    ? document.querySelectorAll('.platforms-scene-2 .platform')
    : document.querySelectorAll('.platforms-scene-1 .platform');
    
    for (const platform of platforms) {
        const platformY = parseInt(platform.style.bottom);
        const platformX = parseInt(platform.style.left);
        const platformWidth = platform.offsetWidth;

        const isHorizontallyAligned = playerX + playerWidth > platformX && playerX < platformX + platformWidth;
        const isVerticallyClose = Math.abs(playerY - (platformY + 20)) < 5;

        if (isHorizontallyAligned && isVerticallyClose) {
            return true;
        }
    }
    return false;
}


function movePlayer() {
    const speed = 5;
    let moving = false;
    const prevX = playerX;
    
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

    if (checkWallCollision()) {
        playerX = prevX;
    }

    // Saltar
    if (keysPressed['ArrowUp'] && (!isJumping || isOnPlatform())) {
        velocityY = 15;
        isJumping = true;
        player.style.backgroundImage = "url('Resources/Player_Jump.png')";
    }

    applyGravity();

    playerX = Math.max(0, Math.min(playerX, stageWidth - playerWidth));

    if (!isAttacking) {
        if (isJumping) {
            player.style.backgroundImage = velocityY > 0 
                ? "url('Resources/Player_Jump.png')" 
                : "url('Resources/Player_Fall.png')";
        } else if (moving) {
            player.style.backgroundImage = "url('Resources/Player_Run.png')";
        } else {
            player.style.backgroundImage = "url('Resources/Player_Idle.png')";
        }
    }
}


function movePuma() {
    if (pumaDefeated) return;

    const pumaRect = puma.getBoundingClientRect();
    const walls = document.querySelectorAll('.blocker-wall, .blocker');
    const pumaWidth = 180;
    
    // Limitar movimiento y cambiar dirección
    if (pumaX <= 0) {
        pumaX = 0;
        pumaDirection = 1;
        puma.classList.remove('puma-facing-left');
        puma.classList.add('puma-facing-right');
        return;
    } else if (pumaX >= stageWidth - pumaWidth) {
        pumaX = stageWidth - pumaWidth;
        pumaDirection = -1;
        puma.classList.remove('puma-facing-right');
        puma.classList.add('puma-facing-left');
        return;
    }
    
    // Verificar colisión con paredes
    let willCollide = false;
    for (const wall of walls) {
        const wallRect = wall.getBoundingClientRect();
        
        const nextX = pumaX + (pumaSpeed * pumaDirection);
        const nextRect = {
            left: nextX,
            right: nextX + pumaWidth,
            top: wallRect.top,
            bottom: pumaRect.bottom
        };
        
        if (nextRect.right > wallRect.left + 5 && 
            nextRect.left < wallRect.right - 5 &&
            nextRect.bottom > wallRect.top + 5) {
            willCollide = true;
            break;
        }
    }
    
    // Cambiar dirección si hay colisión
    if (willCollide) {
        pumaDirection *= -1;
        if (pumaDirection > 0) {
            puma.classList.remove('puma-facing-left');
            puma.classList.add('puma-facing-right');
        } else {
            puma.classList.remove('puma-facing-right');
            puma.classList.add('puma-facing-left');
        }
        return;
    }
    
    // Comportamiento de ataque
    const playerRect = player.getBoundingClientRect();
    if (Math.abs(playerRect.left - pumaRect.left) < 150 && 
        Math.abs(playerRect.bottom - pumaRect.bottom) < 50) {
        isPumaAttacking = true;
        puma.style.backgroundImage = "url('Resources/panther_atk.png')";
        
        setTimeout(() => {
            isPumaAttacking = false;
            puma.style.backgroundImage = "url('Resources/panther_idle.png')";
        }, 500);
        return;
    }
    
    // Movimiento normal
    if (!isPumaAttacking) {
        pumaX += pumaSpeed * pumaDirection;
        updateCharacterPosition(puma, pumaX, pumaY);
    }
}

function handlePlayerAttack() {
    if (!isAttacking) {
        isAttacking = true;
        player.style.backgroundImage = "url('Resources/Player_atk.png')";

        setTimeout(() => {
            isAttacking = false;
        
            if (isJumping) {
                player.style.backgroundImage = velocityY > 0 
                    ? "url('Resources/Player_Jump.png')" 
                    : "url('Resources/Player_Fall.png')";
            } else if (keysPressed['ArrowLeft'] || keysPressed['ArrowRight']) {
                player.style.backgroundImage = "url('Resources/Player_Run.png')";
            } else {
                player.style.backgroundImage = "url('Resources/Player_Idle.png')";
            }
        }, 400); 
    }
}


function checkPlayerAttackHitsEnemy() {
    if (!isAttacking || scene !== 2 || !canDamagepuma || pumaDefeated) return;

    const playerRect = player.getBoundingClientRect();
    const enemyRect = puma.getBoundingClientRect();

    const attackRange = player.style.transform === "scaleX(1)"
        ? { left: playerRect.left - 30, right: playerRect.left + 50 }
        : { left: playerRect.right - 50, right: playerRect.right + 30 };

    const overlap = !(
        attackRange.right < enemyRect.left ||
        attackRange.left > enemyRect.right ||
        playerRect.bottom < enemyRect.top ||
        playerRect.top > enemyRect.bottom
    );

    if (overlap && pumaLives > 0) {
        pumaLives--;
        canDamagepuma = false;

        // Efecto visual de daño
        puma.style.opacity = '0.5';
        setTimeout(() => puma.style.opacity = '1', 100);

        if (pumaLives <= 0) {
            pumaDefeated = true;
            puma.style.display = 'none';

            showDialogue("¡Has vencido al enemigo!");

            // Transición a escena 3 después de mostrar mensaje
            setTimeout(() => {
                showDialogue("¡Prepárate para el combate final!");
                setTimeout(() => {
                    hideDialogue();
                    startScene3();
                }, 3000);
            }, 2000);
        } else {
            // Solo si no murió, permitir daño de nuevo
            setTimeout(() => {
                canDamagepuma = true;
            }, 500);
        }
    }
}


function checkTriggerCollision() {
    if (playerX > triggerX && !transitioning && talkedToNPC) {
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

    // Mostrar elementos escena 2
    document.querySelector('.platforms-scene-2').style.display = 'block';
    puma.style.display = 'block';
    
    // Ocultar elementos de otras escenas
    document.querySelector('.platforms-scene-1').style.display = 'none';
    ayllu.style.display = 'none';
    trigger.style.display = 'none';

    // Cambiar fondo
    document.getElementById("background").style.backgroundImage = "url('Resources/BackGround.png')";
    // Resetear posiciones
    playerX = 50;
    playerY = groundLevel + 5;
    pumaX = 900;
    pumaY = groundLevel;
    pumaDirection = 1;
    
    // Estado inicial mirando a la derecha
    puma.classList.remove('puma-facing-left', 'puma-facing-right');
    puma.classList.add('puma-facing-right');

    updateCharacterPosition(player, playerX, playerY);
    updateCharacterPosition(puma, pumaX, pumaY);
    
    document.getElementById("background").style.backgroundImage = "url('Resources/BackGround.png')";
    if (pumaDefeated) {
        setTimeout(() => {
            showDialogue("¡Prepárate para el combate final!");
            setTimeout(startScene3, 3000);
        }, 2000);
    }
}

function startIntroScene() {
    const introDiv = document.getElementById('introText');
    const continuePrompt = document.getElementById('continuePrompt');

    introDiv.innerHTML = ""; // limpiar texto
    continuePrompt.style.display = 'none';
    currentChar = 0;

    writingInterval = setInterval(() => {
        if (currentChar < introText.length) {
            let charToAdd = introText[currentChar];
            if (charToAdd === '\n') {
                introDiv.innerHTML += '<br>';
            } else {
                introDiv.innerHTML += charToAdd;
            }
            currentChar++;
        } else {
            clearInterval(writingInterval);
            continuePrompt.style.display = 'block';
        }
    }, 40);
}

function startScene3() {
    hideDialogue();
    scene = 3;
    transitioning = false;

    // Mostrar elementos escena 3
    document.querySelector('.platforms-scene-3').style.display = 'block';
    
    // Ocultar elementos de otras escenas
    document.querySelector('.platforms-scene-2').style.display = 'none';
    puma.style.display = 'none';

    // Cambiar fondo
    document.getElementById("background").style.backgroundImage = "url('Resources/Background2.png')";
    
    // Resetear posición del jugador
    playerX = 100;
    playerY = groundLevel + 5;
    updateCharacterPosition(player, playerX, playerY);
}


function gameLoop() {
    movePlayer();
    checkNPCInteraction();
    if (scene === 1) checkTriggerCollision();
    if (scene === 2) movePuma(); // ← Añade esta línea
    updatePositions();
    checkPlayerAttackHitsEnemy();
    requestAnimationFrame(gameLoop);
}



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
    if (scene === 2 && playerLives > 0 && !pumaDefeated) {
        const dx = Math.abs(playerX - pumaX);
        const dy = Math.abs(playerY - pumaY);

        if (dx < 100 && dy < 100) {
            playerLives--;
            updateLifeBar();

            puma.style.backgroundImage = "url('Resources/panther_atk.png')";
            setTimeout(() => {
                puma.style.backgroundImage = "url('Resources/panther_idle.png')";
            }, 500);
        }
    }
}, 1000);

document.getElementById("playButton").addEventListener("click", () => {
    document.getElementById("menu").style.display = "none";
    document.getElementById("introScene").style.display = "flex";
    scene = 0;  
    startIntroScene(); 
    gameLoop();
});


document.getElementById("exitButton").addEventListener("click", () => {
  window.close(); // puede no funcionar en todos los navegadores
  alert("Gracias por visitar RUNA PACHAWAN");
});