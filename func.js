const player = document.getElementById('player');
const ayllu = document.getElementById('ayllu');
const trigger = document.getElementById('trigger1');
const puma = document.getElementById('puma');
const stage = document.getElementById('stage');
const keysPressed = {};
const feathers = [];
let currentPhase = 1;
let attacksInCurrentPhase = 0;


// Constantes del juego
const gravity = 0.5;
const groundLevel = 100;
const stageWidth = 2000; 
const playerWidth = 100;
const containerWidth = window.innerWidth;

// Inicialización de sprites
player.style.backgroundImage = "url('Resources/Player_idle.png')";
ayllu.style.backgroundImage = "url('Resources/Totems/Ayllu_Idle.png')";
puma.style.backgroundImage = "url('Resources/panther_idle.png')";

// Variables del juego
let introText = `En tiempos ancestrales, antes de que el tiempo se midiera y los pueblos tuvieran nombre,
la tierra del actual Ecuador era habitada por culturas sabias y guerreras.
Sus conocimientos se transmitían por generaciones... hasta hoy.`;
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
let aylluX = 600;
let aylluY = 120;
let triggerX = 900;
let triggerY = 100;

// Variables del puma
let pumaDirection = 1;
let pumaSpeed = 2;
let isPumaAttacking = false;
let pumaAttackCooldown = 0;
let pumaX = 900;
let pumaY = groundLevel;
let pumaLives = 6;

// Variables generales
let scene = null;
let transitioning = false;
let playerLives = 4;
let playerRecentlyDamaged = false;

// Variables del águila
let eagleX = 1200;
let eagleY = 200;
let eagleState = "idle";
let eagleHitsLanded = 0;
let isEagleDown = false;
let eagleAttackCooldown = 0;
let appleSpawnTimer = 0;
let lastAttackType = "feather"; 
const apples = [];
let eagleVulnerable = false;
let attackTurn = 0;
let eagleDiveTargetX = 0;
let eagleDiveTargetY = 0;
let eagleDiveSpeed = 4; 
let eagleLives = 7;
let eagleCanBeDamaged = false;
let eagleLastDiveTargetY = 200;
let eagleCooldown = false;
let lastAttackTime = Date.now();
let attackType = "dive"; 
let playerRecentlyHit = false;


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
            playerY -= 5;
            isJumping = true;
            return;
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
        updateCharacterPosition(ayllu,aylluX,aylluY);
        updateCharacterPosition(trigger, triggerX, triggerY);
    } else if (scene === 2) {
        updateCharacterPosition(puma, pumaX, pumaY);
    } else if (scene === 3) {
        updateCharacterPosition(document.getElementById('eagle'), eagleX, eagleY);
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

function checkFeatherCollision() {
    const playerRect = player.getBoundingClientRect();
    
    for (let i = feathers.length - 1; i >= 0; i--) {
        const feather = feathers[i];
        const featherRect = feather.element.getBoundingClientRect();
        
        if (playerRect.right > featherRect.left && 
            playerRect.left < featherRect.right &&
            playerRect.bottom > featherRect.top &&
            playerRect.top < featherRect.bottom) {
            
            playerLives--;
            updateLifeBar();
            feather.element.remove();
            feathers.splice(i, 1);
            
            // Efecto de daño
            player.style.filter = "brightness(1.5)";
            setTimeout(() => player.style.filter = "none", 200);
        }
    }
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
    const lifeContainer = document.getElementById('life-bar');
    
    // Crear contenedor si no existe
    if (!lifeContainer) {
        const newLifeContainer = document.createElement('div');
        newLifeContainer.id = 'life-bar';
        newLifeContainer.style.position = 'absolute';
        newLifeContainer.style.top = '10px';
        newLifeContainer.style.left = '10px';
        newLifeContainer.style.zIndex = '100';
        document.body.appendChild(newLifeContainer);
        
        const img = document.createElement('img');
        img.id = 'lifeImage';
        newLifeContainer.appendChild(img);
    }
    
    // Actualizar imagen según vidas
    if (playerLives >= 4) {
        lifeImage.src = 'Resources/vida4.png';
    } else if (playerLives === 3) {
        lifeImage.src = 'Resources/vida3.png';
    } else if (playerLives === 2) {
        lifeImage.src = 'Resources/vida2.png';
    } else if (playerLives === 1) {
        lifeImage.src = 'Resources/vida1.png';
    } else {
        showGameOver();
    }
}

function updateEagleLifeBar() {
    const eagleLifeImage = document.getElementById('eagleLifeImage');
    const eagleLifeBar = document.getElementById('eagle-life-bar');

    if (scene === 3) {
        eagleLifeBar.style.display = "block";
    }

    if (eagleLives >= 7) {
        eagleLifeImage.src = 'Resources/First_Boss/vida_full_eagle.png';
    } else if (eagleLives === 6) {
        eagleLifeImage.src = 'Resources/First_Boss/vida_6_eagle.png';
    } else if (eagleLives === 5) {
        eagleLifeImage.src = 'Resources/First_Boss/vida_5_eagle.png';
    } else if (eagleLives === 4) {
        eagleLifeImage.src = 'Resources/First_Boss/vida_4_eagle.png';
    } else if (eagleLives === 3) {
        eagleLifeImage.src = 'Resources/First_Boss/vida_3_eagle.png';
    } else if (eagleLives === 2) {
        eagleLifeImage.src = 'Resources/First_Boss/vida_2_eagle.png';
    } else if (eagleLives === 1) {
        eagleLifeImage.src = 'Resources/First_Boss/vida_1_eagle.png';
    }

    if (eagleLives <= 0) {
        document.getElementById('eagle').style.display = 'none';
        showDialogue("¡Has derrotado al jefe!");
        setTimeout(hideDialogue, 3000);
    }
}


function checkCollision(el1, el2) {
    const rect1 = el1.getBoundingClientRect();
    const rect2 = el2.getBoundingClientRect();

    return !(
        rect1.right < rect2.left ||
        rect1.left > rect2.right ||
        rect1.bottom < rect2.top ||
        rect1.top > rect2.bottom
    );
}

function applyDamageToPlayer() {
    if (!playerRecentlyDamaged) {
        playerLives--;
        updateLifeBar(); 
        playerRecentlyDamaged = true;
        setTimeout(() => playerRecentlyDamaged = false, 1000);
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
    
    if (!isPumaAttacking) {
        pumaX += pumaSpeed * pumaDirection;
        updateCharacterPosition(puma, pumaX, pumaY);
    }
}

function startAttackSequence() {
    eagleState = "charging";
    eagle.style.backgroundImage = "url('Resources/First_Boss/eagle_charge.png')";
    attacksInCurrentPhase++;
}

function launchFeatherAttack() {
    const count = 4;
    const spacing = 40;

    for (let i = 0; i < count; i++) {
        createFeather(eagleX, eagleY + i * spacing, -1); // Izquierda
        createFeather(eagleX + 120, eagleY + i * spacing, 1); // Derecha
    }
}

function createFeather(x, y, direction) {
    const feather = document.createElement('div');
    feather.className = 'feather-projectile';
    feather.style.left = `${x}px`;
    feather.style.top = `${y}px`;
    document.getElementById('stage').appendChild(feather);

    const speed = 6 * direction;

    const interval = setInterval(() => {
        const currentX = parseInt(feather.style.left);
        feather.style.left = `${currentX + speed}px`;

        // Colisión con jugador
        const playerRect = player.getBoundingClientRect();
        const featherRect = feather.getBoundingClientRect();

        const hit = !(
            featherRect.right < playerRect.left ||
            featherRect.left > playerRect.right ||
            featherRect.bottom < playerRect.top ||
            featherRect.top > playerRect.bottom
        );

        if (hit && playerLives > 0) {
            feather.remove();
            clearInterval(interval);
            playerLives--;
            updateLifeBar();
        }

        // Eliminar si ya salió de pantalla
        if (currentX < -100 || currentX > 2000) {
            feather.remove();
            clearInterval(interval);
        }

    }, 30);
}


function moveEagleBoss() {
    const eagle = document.getElementById('eagle');
    if (!eagle || eagleLives <= 0) return;

    // Actualizar proyectiles de plumas
    for (let i = feathers.length - 1; i >= 0; i--) {
        if (feathers[i].update()) {
            feathers.splice(i, 1);
        }
    }

    switch (eagleState) {
        case "idle":
            eagle.style.backgroundImage = "url('Resources/First_Boss/eagle_idle.png')";
            eagleX += Math.sin(Date.now() / 500) * 2;

            if (Date.now() - lastAttackTime > 2000) {
                eagleState = attackType === "dive" ? "charging" : "feather_charge";
                lastAttackTime = Date.now();
                eagle.style.backgroundImage = "url('Resources/First_Boss/eagle_charge.png')";
            }
            break;

        case "charging":
            // Prepara embestida
            if (Date.now() - lastAttackTime > 800) {
                eagleState = "dive";
                eagleLastDiveTargetY = playerY;
                lastAttackTime = Date.now();
                eagle.style.backgroundImage = "url('Resources/First_Boss/eagle_atk.png')";
            }
            break;

        case "dive":
            // Movimiento hacia el jugador con eje X e Y
            const dx = playerX - eagleX;
            const dy = eagleLastDiveTargetY - eagleY;

            eagleX += dx * 0.1;
            eagleY += dy * 0.1;

            if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
                eagleState = "idle";
                eagleY = eagleLastDiveTargetY;
                attackType = "feather"; // alternar
                lastAttackTime = Date.now();
            }
            // Verificamos colisión con el jugador DURANTE la embestida
            const eagleRect = eagle.getBoundingClientRect();
            const playerRect = player.getBoundingClientRect();

            const eagleHitsPlayer = !(
                eagleRect.right < playerRect.left ||
                eagleRect.left > playerRect.right ||
                eagleRect.bottom < playerRect.top ||
                eagleRect.top > playerRect.bottom
            );

            if (eagleHitsPlayer && !playerRecentlyHit) {
                playerLives--;
                updateLifeBar();
                playerRecentlyHit = true;
                setTimeout(() => playerRecentlyHit = false, 1000); // cooldown de daño
            }
            break;

        case "feather_charge":
            if (Date.now() - lastAttackTime > 800) {
                eagleState = "feather_attack";
                eagle.style.backgroundImage = "url('Resources/First_Boss/eagle_charge.png')";
                launchFeatherAttack();
                lastAttackTime = Date.now();
            }
            break;

        case "feather_attack":
            if (Date.now() - lastAttackTime > 1000) {
                eagleState = "vulnerable";
                eagleVulnerable = true;
                eagleCanBeDamaged = true;
                eagle.style.backgroundImage = "url('Resources/First_Boss/eagle_burnout.png')";

                setTimeout(() => {
                    eagleVulnerable = false;
                    eagleCanBeDamaged = false;
                    eagleState = "idle";
                    lastAttackTime = Date.now();
                    attackType = "dive"; // alternar
                }, 2000);
            }
            break;
    }

    updateCharacterPosition(eagle, eagleX, eagleY);
}



function getAttacksForPhase() {
    return currentPhase === 1 ? 2 : currentPhase === 2 ? 4 : 6;
}

function resetEagle() {
    const eagle = document.getElementById('eagle');
    eagleState = "idle";
    isEagleDown = false;
    eagleY = 200;
    eagle.style.backgroundImage = "url('Resources/First_Boss/eagle_idle.png')";
    
    // Cambiar fase si se completaron los golpes
    if (eagleHitsLanded >= 3) {
        currentPhase = Math.min(3, currentPhase + 1);
        eagleHitsLanded = 0;
        attacksInCurrentPhase = 0;
    }
}

function checkEagleHit() {
    if (!isAttacking || !eagleCanBeDamaged || eagleCooldown || eagleLives <= 0) return;

    const playerRect = player.getBoundingClientRect();
    const eagleRect = eagle.getBoundingClientRect();

    const overlap = !(playerRect.right < eagleRect.left ||
                      playerRect.left > eagleRect.right ||
                      playerRect.bottom < eagleRect.top ||
                      playerRect.top > eagleRect.bottom);

    if (overlap) {
        eagleCooldown = true;
        eagleLives--;
        updateEagleLifeBar();
        eagle.classList.add("eagle-damage");

        setTimeout(() => {
            eagle.classList.remove("eagle-damage");
            eagleCooldown = false;
        }, 500); 

        if (eagleLives <= 0) {
            eagle.style.display = "none";
            showDialogue("¡Has derrotado al Águila!");
        }
    }
}





// Sistema de manzanas (corregido)
function spawnApple() {
    // Verificar que la ruta sea correcta
    const appleImagePath = 'Resources/Items/apple.png';
    console.log("Intentando cargar manzana desde:", appleImagePath);
    
    const apple = document.createElement('div');
    apple.className = 'health-item';
    apple.style.backgroundImage = `url('${appleImagePath}')`;
    
    // Posición más accesible
    const x = 200 + Math.random() * (stageWidth - 400);
    const y = groundLevel + 50; // Más arriba para mejor visibilidad
    
    apple.style.left = `${x}px`;
    apple.style.bottom = `${y}px`;
    apple.style.width = '40px';
    apple.style.height = '40px';
    apple.style.position = 'absolute';
    apple.style.backgroundSize = 'contain';
    apple.style.backgroundRepeat = 'no-repeat';
    
    document.getElementById('stage').appendChild(apple);
    
    apples.push({
        element: apple,
        x: x,
        y: y,
        collected: false
    });
}


function checkAppleCollection() {
    const playerRect = player.getBoundingClientRect();
    
    for (let i = apples.length - 1; i >= 0; i--) {
        if (apples[i].collected) continue;
        
        const appleRect = apples[i].element.getBoundingClientRect();
        
        if (playerRect.right > appleRect.left + 20 && 
            playerRect.left < appleRect.right - 20 &&
            playerRect.bottom > appleRect.top + 20 &&
            playerRect.top < appleRect.bottom - 20) {
            
            playerLives = Math.min(4, playerLives + 2);
            updateLifeBar();
            console.log(`Manzana recolectada! Vidas: ${playerLives}`);
            
            apples[i].element.style.transform = "scale(1.5)";
            apples[i].element.style.opacity = "0";
            setTimeout(() => {
                apples[i].element.remove();
            }, 300);
            
            apples[i].collected = true;
            apples.splice(i, 1);
        }
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
    const pumaRect = puma.getBoundingClientRect();

    // Definir el rango de ataque basado en la dirección del jugador
    const attackRange = {
        left: player.style.transform === "scaleX(1)" 
            ? playerRect.left - 30 
            : playerRect.right - 80,
        right: player.style.transform === "scaleX(1)" 
            ? playerRect.left + 50 
            : playerRect.right + 30
    };

    // Verificar superposición
    const overlap = !(
        attackRange.right < pumaRect.left ||
        attackRange.left > pumaRect.right ||
        playerRect.bottom < pumaRect.top ||
        playerRect.top > pumaRect.bottom
    );

    if (overlap && pumaLives > 0) {
        pumaLives--;
        canDamagepuma = false;

        // Efecto visual de daño
        puma.style.filter = "brightness(2)";
        setTimeout(() => puma.style.filter = "brightness(1)", 200);

        // Mostrar vidas restantes en consola (para debug)
        console.log(`Puma golpeado! Vidas restantes: ${pumaLives}`);

        if (pumaLives <= 0) {
            pumaDefeated = true;
            puma.style.display = 'none';

            showDialogue("¡Has vencido al enemigo!");

            setTimeout(() => {
                showDialogue("¡Prepárate para el combate final!");
                setTimeout(() => {
                    hideDialogue();
                    startScene3();
                }, 3000);
            }, 2000);
        } else {
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

    introDiv.innerHTML = ""; 
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

    // Mostrar elementos
    document.getElementById('eagleBoss').style.display = 'block';
    document.querySelector('.platforms-scene-3').style.display = 'block';
    document.getElementById('eagle-life-bar').style.display = 'flex';
    updateEagleLifeBar();
    
    // Ocultar elementos
    document.querySelector('.platforms-scene-2').style.display = 'none';
    puma.style.display = 'none';

    // Resetear estado del águila
    eagleHitsLanded = 0;
    isEagleDown = false;
    eagleState = "idle";
    eagleX = 700;
    eagleY = 200;
    eagleAttackCooldown = 120;
    
    // Posición jugador
    playerX = 100;
    playerY = groundLevel + 5;
    
    updateCharacterPosition(player, playerX, playerY);
    updateCharacterPosition(document.getElementById('eagle'), eagleX, eagleY);
    
    // Fondo
    document.getElementById("background").style.backgroundImage = "url('Resources/Background3.png')";
    
    // Inicializar águila
    const eagle = document.getElementById('eagle');
    eagle.style.backgroundImage = "url('Resources/First_Boss/eagle_idle.png')";
    eagle.style.display = 'block';

}

class Feather {
    constructor(x, y, angle) {
        this.element = document.createElement('div');
        this.element.className = 'feather-projectile';
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.speed = 5;
        this.gravity = 0.2;
        this.lifetime = 0;
        this.element.style.backgroundImage = "url('Resources/First_Boss/feather.png')";
        this.element.style.width = '32px';
        this.element.style.height = '32px';
        this.element.style.position = 'absolute';
        this.element.style.transform = `rotate(${angle}rad)`;
        stage.appendChild(this.element);
    }

    update() {
        this.lifetime++;
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed + this.gravity * this.lifetime;
        
        this.element.style.left = `${this.x}px`;
        this.element.style.bottom = `${this.y}px`;
        
        // Eliminar si sale de pantalla
        if (this.y > stage.offsetHeight || this.x < 0 || this.x > stageWidth) {
            this.element.remove();
            return true;
        }
        return false;
    }
}

function gameLoop() {
    movePlayer();
    checkNPCInteraction();
    
    if (scene === 1) {
        checkTriggerCollision();
    } else if (scene === 2) {
        movePuma();
        checkPlayerAttackHitsEnemy();
    } else if (scene === 3) {
        moveEagleBoss();
        checkEagleHit();
        checkAppleCollection();
        checkFeatherCollision(); 
        
        if (appleSpawnTimer <= 0 && apples.length < 2) {
            if (Math.random() < 0.1) spawnApple();
            appleSpawnTimer = 180;
        } else {
            appleSpawnTimer--;
        }
    }
    
    updatePositions();
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
    updateLifeBar(); // Asegurar que la barra de vida se muestra
    gameLoop();
});


document.getElementById("exitButton").addEventListener("click", () => {
  window.close(); // puede no funcionar en todos los navegadores
  alert("Gracias por visitar RUNA PACHAWAN");
});

