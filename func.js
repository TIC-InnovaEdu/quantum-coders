// --- Elementos del Juego ---
const player = document.getElementById('player');
const enemy1Element = document.getElementById('enemy1'); // Elemento DOM para el enemigo 1
const trigger = document.getElementById('trigger1');
const enemy2Element = document.getElementById('enemy2'); // Elemento DOM para el enemigo 2
const stage = document.getElementById('stage');
const background = document.getElementById("background");
const floor = document.getElementById('floor'); // Nuevo: Referencia al suelo

// --- Variables de Estado del Juego ---
let playerX = 100; // Posición horizontal del jugador
let playerY = 0;   // Posición vertical del jugador (sobre el suelo)
let playerVelocityY = 0; // Velocidad vertical del jugador (para saltos/gravedad)
let isJumping = false;   // ¿Está el jugador saltando?

let playerHealth = 100;    // Salud actual del jugador
let playerLives = 3;       // Vidas restantes del jugador
let isPlayerAttacking = false;
let lastAttackTime = 0;    // Marca de tiempo del último ataque del jugador
let isPlayerDamaged = false; // ¿Está el jugador en estado de daño/invencibilidad?
let isPlayerFacingLeft = false; // ¿Está el jugador mirando a la izquierda?

let scene = 1;         // Escena/nivel actual
let transitioning = false; // ¿Está en progreso una transición de escena?
let dialogueActive = false; // ¿Hay una caja de diálogo activa?
let gameOver = false;     // ¿Ha terminado el juego?

let enemies = []; // Array para manejar todos los objetos enemigos activos

// --- Constantes ---
const GAME_WIDTH = 960; // Ancho del contenedor del juego
const GAME_HEIGHT = 540; // Alto del contenedor del juego
const FLOOR_HEIGHT = 50; // Coincide con la altura del div #floor en CSS

const PLAYER_SPEED = 5;      // Velocidad de movimiento horizontal del jugador
const JUMP_FORCE = 12;       // Fuerza del salto
const GRAVITY = 0.5;         // Fuerza de la gravedad

const PLAYER_WIDTH = 64;     // Ancho del sprite del jugador
const PLAYER_HEIGHT = 64;    // Alto del sprite del jugador

const PLAYER_ATTACK_DAMAGE = 30;    // Daño que el jugador inflige
const PLAYER_ATTACK_RANGE_X = 80;   // Rango horizontal del ataque del jugador
const PLAYER_ATTACK_RANGE_Y = 40;   // Rango vertical (Y) del ataque del jugador
const PLAYER_ATTACK_COOLDOWN = 400; // Milisegundos entre ataques del jugador
const PLAYER_INVINCIBILITY_DURATION = 1000; // Milisegundos de invencibilidad después de ser golpeado

const ENEMY_WIDTH = 64;
const ENEMY_HEIGHT = 64;
const ENEMY_HEALTH_DEFAULT = 60;
const ENEMY_DAMAGE_DEFAULT = 20;    // Daño que los enemigos infligen
const ENEMY_SPEED_DEFAULT = 1.5;    // Velocidad de movimiento de los enemigos
const ENEMY_ATTACK_COOLDOWN = 1500; // Milisegundos entre ataques de los enemigos

// Posiciones del trigger (ahora solo en X)
const triggerX = 600;

// --- Elementos de UI ---
const livesDisplay = document.createElement('div');
livesDisplay.id = 'lives-display';
document.body.appendChild(livesDisplay); // Añadir al body para que siempre esté visible

const gameOverScreen = document.createElement('div');
gameOverScreen.id = 'game-over-screen';
gameOverScreen.innerHTML = `
    <h1>GAME OVER</h1>
    <button id="restartButton">Reiniciar</button>
`;
document.body.appendChild(gameOverScreen);

// --- Manejo de Entrada ---
const keysPressed = {};
document.addEventListener('keydown', (e) => {
    keysPressed[e.key] = true;
    if (e.key === ' ' && !dialogueActive) { // Prevenir scroll con espacio
        e.preventDefault();
    }
});
document.addEventListener('keyup', (e) => {
    keysPressed[e.key] = false;
});

// --- Funciones de Utilidad ---

// Actualiza la posición visual de un elemento
function updateCharacterPosition(el, x, y, facingLeft = false) {
    el.style.left = `${x}px`;
    el.style.bottom = `${y}px`;
    // ScaleX(-1) voltea el sprite si está mirando a la izquierda
    el.style.transform = `${facingLeft ? 'scaleX(-1)' : 'scaleX(1)'}`;
    // dataset.z se usa solo para z-index, en 2D el Y es más relevante para superposición
    el.dataset.z = y; // Usamos Y como proxy para el z-index en 2D (más alto = más al frente)
}

// Actualiza el z-index de los elementos basado en su posición Y (más alto = más al frente)
function updateZIndex() {
    let elements = [player, ...enemies.map(e => e.element)];
    if (scene === 1) {
        elements.push(trigger);
    }

    // Ordenar de mayor Y a menor Y (los de arriba tienen z-index más bajo)
    elements.sort((a, b) => parseFloat(a.dataset.z) - parseFloat(b.dataset.z));
    elements.forEach((el, i) => el.style.zIndex = i + 1);
}

// Detección de Colisión AABB (Axis-Aligned Bounding Box)
function checkCollision(x1, y1, w1, h1, x2, y2, w2, h2) {
    return x1 < x2 + w2 &&
           x1 + w1 > x2 &&
           y1 < y2 + h2 &&
           y1 + h1 > y2;
}

// Muestra la caja de diálogo
function showDialogue(text) {
    let box = document.getElementById('dialogueBox');
    if (!box) {
        box = document.createElement('div');
        box.id = 'dialogueBox';
        document.body.appendChild(box);
    }
    box.innerText = text;
    dialogueActive = true;
}

// Oculta la caja de diálogo
function hideDialogue() {
    let box = document.getElementById('dialogueBox');
    if (box) box.remove();
    dialogueActive = false;
}

// Actualiza la interfaz de vidas
function updateLivesDisplay() {
    livesDisplay.innerHTML = '';
    for (let i = 0; i < playerLives; i++) {
        const icon = document.createElement('div');
        icon.classList.add('life-icon');
        livesDisplay.appendChild(icon);
    }
}

// --- Lógica del Jugador ---
function updatePlayer() {
    if (dialogueActive || transitioning || gameOver) return;

    // Movimiento Horizontal
    let isMovingHorizontally = false;
    if (keysPressed['ArrowLeft'] || keysPressed['a']) {
        playerX -= PLAYER_SPEED;
        if (!isPlayerFacingLeft) {
            isPlayerFacingLeft = true;
            player.classList.add('facing-left');
        }
        isMovingHorizontally = true;
    } else if (keysPressed['ArrowRight'] || keysPressed['d']) {
        playerX += PLAYER_SPEED;
        if (isPlayerFacingLeft) {
            isPlayerFacingLeft = false;
            player.classList.remove('facing-left');
        }
        isMovingHorizontally = true;
    }

    // Gravedad
    playerVelocityY -= GRAVITY;
    playerY += playerVelocityY;

    // Aterrizaje en el suelo
    if (playerY <= FLOOR_HEIGHT) {
        playerY = FLOOR_HEIGHT;
        playerVelocityY = 0;
        if (isJumping) {
            isJumping = false;
            player.classList.remove('jumping');
        }
    }

    // Salto
    if ((keysPressed['ArrowUp'] || keysPressed['w'] || keysPressed[' '] || keysPressed['z']) && !isJumping && playerY === FLOOR_HEIGHT) {
        playerVelocityY = JUMP_FORCE;
        isJumping = true;
        player.classList.add('jumping');
        // Quita la tecla de salto para evitar múltiples saltos si se mantiene presionada
        keysPressed['ArrowUp'] = false;
        keysPressed['w'] = false;
        keysPressed[' '] = false;
        keysPressed['z'] = false;
    }

    // Ataque del Jugador
    if ((keysPressed['x'] || keysPressed[' ']) && !isPlayerAttacking && (Date.now() - lastAttackTime > PLAYER_ATTACK_COOLDOWN)) {
        startPlayerAttack();
        keysPressed['x'] = false; // Consumir la pulsación de tecla para ataque
        keysPressed[' '] = false;
    }

    // Actualizar animación/sprite del jugador
    if (isPlayerAttacking) {
        player.style.backgroundImage = "url('Resources/Player_Attack.png')";
    } else if (isJumping) {
        player.style.backgroundImage = "url('Resources/Player_Jump.png')";
    } else if (isMovingHorizontally) {
        player.style.backgroundImage = "url('Resources/Player_Walk.gif')";
    } else if (!isPlayerDamaged) {
        player.style.backgroundImage = "url('Resources/Player.png')"; // Sprite idle
    }

    // Limitar movimiento del jugador dentro de los límites del juego
    playerX = Math.max(0, Math.min(playerX, GAME_WIDTH - PLAYER_WIDTH));
    playerY = Math.max(FLOOR_HEIGHT, playerY); // Asegura que no caiga por debajo del suelo

    updateCharacterPosition(player, playerX, playerY, isPlayerFacingLeft);
}


function startPlayerAttack() {
    if (gameOver || isPlayerAttacking || dialogueActive) return;

    isPlayerAttacking = true;
    lastAttackTime = Date.now();
    player.classList.add('attacking');

    // Detección de impacto después de un breve delay (para sincronizar con animación)
    setTimeout(() => {
        enemies.forEach(enemy => {
            if (!enemy.isDead && checkAttackHit(enemy)) {
                enemy.takeDamage(PLAYER_ATTACK_DAMAGE);
            }
        });
    }, 100); // Ajusta este delay según tu animación de ataque

    // Finalizar estado de ataque
    setTimeout(() => {
        isPlayerAttacking = false;
        player.classList.remove('attacking');
        // Restaurar sprite si no está dañado o saltando
        if (!isPlayerDamaged && !isJumping) {
            player.style.backgroundImage = "url('Resources/Player.png')";
        }
    }, 300); // Duración del estado de ataque (ajusta a la duración de tu animación)
}

// Verifica si el ataque del jugador golpea a un enemigo
function checkAttackHit(enemy) {
    const playerAttackRangeLeft = isPlayerFacingLeft ? playerX - PLAYER_ATTACK_RANGE_X : playerX;
    const playerAttackRangeRight = isPlayerFacingLeft ? playerX : playerX + PLAYER_ATTACK_RANGE_X;

    const enemyRect = enemy.element.getBoundingClientRect();
    const playerRect = player.getBoundingClientRect();

    // Comprobar colisión en el eje X (horizontal)
    const horizontalOverlap = (
        (enemyRect.left < playerRect.right && enemyRect.left > playerRect.left) || // Enemigo entra por la derecha
        (enemyRect.right > playerRect.left && enemyRect.right < playerRect.right) || // Enemigo entra por la izquierda
        (enemyRect.left <= playerRect.left && enemyRect.right >= playerRect.right) // Enemigo envuelve al jugador
    );


    // Simplificación para 2D de plataformas: Rango de ataque horizontal y vertical.
    // El ataque debe estar "frente" al jugador
    let hitX = false;
    if (isPlayerFacingLeft) { // Jugador mirando a la izquierda
        hitX = (enemy.x + ENEMY_WIDTH > playerX - PLAYER_ATTACK_RANGE_X && enemy.x < playerX);
    } else { // Jugador mirando a la derecha
        hitX = (enemy.x < playerX + PLAYER_WIDTH + PLAYER_ATTACK_RANGE_X && enemy.x + ENEMY_WIDTH > playerX + PLAYER_WIDTH);
    }

    // Comprobar colisión en el eje Y (vertical)
    const hitY = (Math.abs(playerY - enemy.y) < PLAYER_ATTACK_RANGE_Y);

    return hitX && hitY;
}


function handlePlayerDamage(damageAmount) {
    if (isPlayerDamaged || gameOver) return; // No recibir daño si es invencible o el juego ha terminado

    playerHealth -= damageAmount;
    player.classList.add('damaged'); // Efecto visual de daño
    isPlayerDamaged = true; // Invencibilidad temporal

    if (playerHealth <= 0) {
        playerLives--;
        updateLivesDisplay(); // Actualizar la UI de vidas

        if (playerLives <= 0) {
            endGame(); // Se acabaron las vidas, fin del juego
        } else {
            // Reiniciar salud y posición del jugador al perder una vida
            playerHealth = 100;
            playerX = 100;
            playerY = FLOOR_HEIGHT;
            playerVelocityY = 0;
            isJumping = false;
            showDialogue("¡Perdiste una vida! Ten cuidado.");
            setTimeout(() => { hideDialogue(); }, 1500); // Diálogo temporal
        }
    }

    // Remover estado de daño/invencibilidad después de un tiempo
    setTimeout(() => {
        player.classList.remove('damaged');
        isPlayerDamaged = false;
        // Asegurarse de restaurar el sprite si no está atacando o saltando
        if (!isPlayerAttacking && !isJumping) {
            player.style.backgroundImage = "url('Resources/Player.png')";
        }
    }, PLAYER_INVINCIBILITY_DURATION);
}

// --- Clase Enemigo ---
class Enemy {
    constructor(element, initialX, initialY, type = 'basic', patrolRange = 100) {
        this.element = element;
        this.x = initialX;
        this.y = initialY;
        this.health = ENEMY_HEALTH_DEFAULT;
        this.isDead = false;
        this.isFacingLeft = false;
        this.lastAttackTime = 0;
        this.type = type; // Para diferenciar tipos de enemigos si tienes más sprites
        this.patrolStart = initialX - patrolRange; // Rango de patrulla
        this.patrolEnd = initialX + patrolRange;
        this.patrolDirection = 1; // 1 para derecha, -1 para izquierda
        this.detectionRange = 200; // Rango en X para detectar al jugador
        this.attackRange = 50;    // Rango en X para atacar al jugador

        this.element.style.backgroundImage = `url('Resources/enemy_idle.png')`; // Sprite por defecto
        updateCharacterPosition(this.element, this.x, this.y);
        this.element.style.display = 'block'; // Asegurar visibilidad
    }

    update() {
        if (this.isDead || dialogueActive || transitioning || gameOver) {
            return;
        }

        const distanceToPlayer = Math.abs(playerX - this.x);
        const playerOnSameLevel = Math.abs(playerY - this.y) < (PLAYER_HEIGHT / 2 + ENEMY_HEIGHT / 2 - 20); // Ajuste vertical

        // IA: Patrullar, Perseguir, Atacar
        if (distanceToPlayer < this.detectionRange && playerOnSameLevel) {
            // Perseguir al jugador
            if (playerX < this.x) { // Jugador a la izquierda
                this.x -= ENEMY_SPEED_DEFAULT;
                if (!this.isFacingLeft) {
                    this.isFacingLeft = true;
                    this.element.classList.add('facing-left');
                }
            } else if (playerX > this.x) { // Jugador a la derecha
                this.x += ENEMY_SPEED_DEFAULT;
                if (this.isFacingLeft) {
                    this.isFacingLeft = false;
                    this.element.classList.remove('facing-left');
                }
            }
            this.element.classList.add('walking');

            // Atacar si está en rango
            if (distanceToPlayer < this.attackRange && (Date.now() - this.lastAttackTime > ENEMY_ATTACK_COOLDOWN)) {
                handlePlayerDamage(ENEMY_DAMAGE_DEFAULT);
                this.lastAttackTime = Date.now();
                // Podrías añadir una animación de ataque para el enemigo aquí
            }

        } else {
            // Patrullar si no detecta al jugador
            this.x += ENEMY_SPEED_DEFAULT * this.patrolDirection;
            this.element.classList.add('walking');

            if (this.x >= this.patrolEnd) {
                this.patrolDirection = -1;
                this.isFacingLeft = true;
                this.element.classList.add('facing-left');
            } else if (this.x <= this.patrolStart) {
                this.patrolDirection = 1;
                this.isFacingLeft = false;
                this.element.classList.remove('facing-left');
            }
        }
        updateCharacterPosition(this.element, this.x, this.y, this.isFacingLeft);
    }

    takeDamage(amount) {
        if (this.isDead) return;

        this.health -= amount;
        this.element.classList.add('damaged'); // Efecto visual de daño al enemigo

        if (this.health <= 0) {
            this.isDead = true;
            this.element.classList.add('dead'); // Clase para animación de muerte
            // console.log(`Enemy at (${this.x}) is dead.`);

            setTimeout(() => {
                this.element.remove(); // Remover elemento del DOM
                enemies = enemies.filter(e => e !== this); // Remover del array de enemigos activos
            }, 500); // Esperar un poco para la animación de muerte
        }

        // Remover estado de daño visual
        setTimeout(() => {
            this.element.classList.remove('damaged');
        }, 200);
    }
}

// --- Gestión de Escenas ---
function initScene1() {
    background.style.backgroundImage = "url('Resources/Background1.png')";
    playerX = 100; // Posición inicial del jugador para la escena
    playerY = FLOOR_HEIGHT; // Asegurar que el jugador esté en el suelo
    playerVelocityY = 0;
    isJumping = false;

    enemy1Element.style.display = 'block';
    trigger.style.display = 'block';
    enemy2Element.style.display = 'none';

    // Limpiar enemigos anteriores y añadir nuevos para esta escena
    enemies = [];
    enemies.push(new Enemy(enemy1Element, 300, FLOOR_HEIGHT, 'basic', 150)); // Enemigo básico con rango de patrulla
    updatePositions();
    updateLivesDisplay();
}

function startScene2() {
    hideDialogue();
    scene = 2;
    transitioning = false;
    background.style.backgroundImage = "url('Resources/BackGround.png')";

    enemy1Element.style.display = 'none';
    trigger.style.display = 'none';

    playerX = 100; // Nueva posición inicial del jugador para la escena 2
    playerY = FLOOR_HEIGHT;

    // Limpiar enemigos y añadir nuevos para la escena 2
    enemies = [];
    enemies.push(new Enemy(enemy2Element, GAME_WIDTH - 200, FLOOR_HEIGHT, 'type2', 200)); // Otro tipo de enemigo
    updatePositions();
}

function endGame() {
    gameOver = true;
    gameOverScreen.style.display = 'flex'; // Mostrar pantalla de Game Over
}

function restartGame() {
    gameOver = false;
    playerLives = 3;
    playerHealth = 100;
    isPlayerDamaged = false;
    isPlayerAttacking = false;
    lastAttackTime = 0;
    isPlayerFacingLeft = false;
    hideDialogue(); // Ocultar diálogo si estaba activo
    gameOverScreen.style.display = 'none'; // Ocultar pantalla de Game Over

    // Remover todos los enemigos existentes del DOM
    enemies.forEach(enemy => enemy.element.remove());
    enemies = []; // Vaciar el array de enemigos

    initGame(); // Re-inicializar el juego
}

// --- Bucle Principal del Juego ---
function gameLoop() {
    if (gameOver) {
        return; // Detener el bucle si el juego ha terminado
    }

    updatePlayer(); // Mueve al jugador y gestiona su estado
    enemies.forEach(enemy => enemy.update()); // Actualiza a todos los enemigos activos

    // Lógica específica de la escena
    if (scene === 1) {
        // La interacción con enemy1Element (originalmente un NPC) ahora es un enemigo real
        // La transición a la Scene 2 ocurre cuando todos los enemigos de la Scene 1 son derrotados
        // Y el jugador pasa el trigger.
        if (!transitioning && enemies.length === 0) { // Si no hay enemigos vivos
            // Actualizar la posición del trigger
            updateCharacterPosition(trigger, triggerX, FLOOR_HEIGHT); // Trigger es ahora solo una marca de paso

            // Si el jugador pasa el trigger (solo en X en 2D)
            if (playerX >= triggerX) {
                transitioning = true;
                showDialogue("¡Todos los enemigos derrotados! Pasando a la siguiente zona...");
                setTimeout(() => {
                    startScene2();
                }, 1500); // Diálogo de transición
            }
        }
    }

    updateZIndex(); // Actualizar el orden de renderizado
    requestAnimationFrame(gameLoop); // Continuar el bucle
}

// --- Inicialización del Juego ---
function initGame() {
    // Establecer el tamaño de los elementos del personaje/enemigo para el cálculo de colisiones
    player.style.width = `${PLAYER_WIDTH}px`;
    player.style.height = `${PLAYER_HEIGHT}px`;
    enemy1Element.style.width = `${ENEMY_WIDTH}px`;
    enemy1Element.style.height = `${ENEMY_HEIGHT}px`;
    enemy2Element.style.width = `${ENEMY_WIDTH}px`;
    enemy2Element.style.height = `${ENEMY_HEIGHT}px`;
    trigger.style.width = '50px'; // El trigger es solo un marcador visual, no interactúa como personaje
    trigger.style.height = '100px';

    initScene1(); // Iniciar el juego en la primera escena
}

// Event listener para el botón de reiniciar
document.getElementById('restartButton').addEventListener('click', restartGame);

// --- Iniciar el Juego ---
initGame();
gameLoop(); // Iniciar el bucle principal del juego
