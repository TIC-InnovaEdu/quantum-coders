const player = document.getElementById('player');
const ayllu = document.getElementById('ayllu');
const trigger = document.getElementById('trigger1');
const puma = document.getElementById('puma');
const stage = document.getElementById('stage');
const keysPressed = {};
const feathers = [];
let currentPhase = 1;
let attacksInCurrentPhase = 0;
let eagleDiveHasHit = false;
let hasShield = false;
let eagleDefeated = false;
let gameOverActive = false; // Bloqueo de juego tras Game Over
let isGamePaused = false; // Control de pausa


// Constantes del juego
const gravity = 0.45;
const groundLevel = 100;
const stageWidth = 2000; 
const playerWidth = 100;
const containerWidth = window.innerWidth;


// Inicialización de sprites
player.style.backgroundImage = "url('Resources/Player/Player_idle.png')";
ayllu.style.backgroundImage = "url('Resources/Totems/Ayllu_Idle.png')";
puma.style.backgroundImage = "url('Resources/Mobs/panther_idle.png')";

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
let quizActive = false;
let selectedOptionIndex = 0;
let wisdomPoints = 0;
let spanishEnemies = [];
let projectiles = [];
// --- Seguimiento de puntuación / métricas para envío ---
let runasCollected = 0;
let enemiesDefeated = 0;   // suma puma + jefes
// (wisdomPoints ya existe; lo usamos como 'score')
const quizQuestionText = "¿En qué año comenzó la invasión española al Tahuantinsuyo?";
const quizOptions = [
    "1492",
    "1532", //correcta
    "1822"
];
const runaQuizzes = {
  4: { 
    question: "¿Quién fue el primer Inca del Tahuantinsuyo?",
    options: ["Manco Cápac", "Atahualpa", "Rumiñahui"],
    correct: 0,
    narration: "Manco Cápac, según la leyenda, fue el primer Inca y fundador del Tahuantinsuyo, la gran civilización andina."
  },
  5: {
    question: "¿Cuál fue la capital del Imperio Inca?",
    options: ["Quito", "Cusco", "Cajamarca"],
    correct: 1,
    narration: "Cusco fue la capital del Imperio Inca, un centro político, militar y cultural de gran importancia."
  },
  6: {
  question: "¿Qué líder indígena ecuatoriano resistió contra los españoles tras la muerte de Atahualpa?",
  options: ["Huayna Cápac", "Rumiñahui", "Túpac Yupanqui"],
  correct: 1,
  narration: "Rumiñahui fue un líder indígena que resistió valientemente contra los conquistadores españoles tras la captura y ejecución de Atahualpa."
  },

  7: {
  question: "¿Qué estrategia militar clave utilizó Francisco Pizarro en la captura de Atahualpa en Cajamarca?",
  options: [
    "Emboscada con caballería y armas de fuego",
    "Asedio prolongado a la ciudad",
    "Negociación diplomática con traductores"
  ],
  correct: 0,
  narration:"El 16 de noviembre de 1532, Pizarro ejecutó una audaz emboscada en Cajamarca. Ocultó sus jinetes y soldados en los edificios alrededor de la plaza, "
  + "mientras Atahualpa ingresaba con miles de seguidores desarmados. Tras el fallido intento de negociación del fraile Vicente de Valverde, "
  + "los españoles cargaron con caballería y dispararon arcabuces causando pánico masivo. La superioridad tecnológica como las armas de acero y caballos junto con "
  + "el factor sorpresa permitieron capturar al Inca en minutos, un evento que marcó el colapso del Tahuantinsuyo."
  },
  
  8: {
  question: "Además del botín de oro y plata, ¿qué objetivo estratégico perseguían los españoles al conquistar el Imperio Inca?",
  options: [
    "Controlar las rutas de la llama",
    "Desarticular el sistema de creencias inca",
    "Establecer una ruta hacia el Amazonas"
  ],
  correct: 2,
  narration: "Los españoles buscaban establecer rutas comerciales y de exploración hacia la región amazónica, además de obtener riquezas."
  }
};
const correctAnswerIndex = 1; 
const audioTracks = {
    menu: new Audio('Resources/Music/Menu_m.mp3'),
    scene1: new Audio('Resources/Music/first.mp3'),
    scene2: new Audio('Resources/Music/first.mp3'),
    scene3: new Audio('Resources/Music/scene3_eagle.mp3'),
    scene4: new Audio('Resources/Music/jungle_m.mp3'),
    scene5: new Audio('Resources/Music/jungle_m.mp3'),
    scene6: new Audio('Resources/Music/beach_m.mp3'),
    scene7: new Audio('Resources/Music/beach_m.mp3'),
    scene8: new Audio('Resources/Music/Menu_m.mp3')
};

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
let playerLastAttackTime = 0;    
let playerAttackCooldown = 1000;  
let currentAudio = null;

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

function showRunaForScene() {
    // Oculta todas las runas
    for (let i = 4; i <= 8; i++) {
        const runa = document.getElementById(`runa${i}`);
        if (runa) runa.style.display = 'none';
    }
    // Muestra solo la runa del nivel actual
    const runaActual = document.getElementById(`runa${scene}`);
    if (runaActual) runaActual.style.display = 'block';
}


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

    const platforms =
        scene === 3 ? document.querySelectorAll('.platforms-scene-3 .platform') :
        scene === 2 ? document.querySelectorAll('.platforms-scene-2 .platform') :
        scene === 4 ? document.querySelectorAll('.platforms-scene-4 .platform') :
        scene === 5 ? document.querySelectorAll('.platforms-scene-5 .platform') :
        scene === 6 ? document.querySelectorAll('.platforms-scene-6 .platform') :
        scene === 7 ? document.querySelectorAll('.platforms-scene-7 .platform') :
        scene === 8 ? document.querySelectorAll('.platforms-scene-8 .platform') :
        document.querySelectorAll('.platforms-scene-1 .platform');
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

window.playSceneMusic = function(sceneKey) {
    // Detener música actual si hay una reproduciéndose
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
    }
    
    // Reproducir nueva música si existe para esta escena
    if (audioTracks[sceneKey]) {
        currentAudio = audioTracks[sceneKey];
        currentAudio.loop = true;
        currentAudio.volume = 0.9; 
        
        const startPlayback = () => {
            currentAudio.play().catch(error => {
                if (error.name === 'NotAllowedError') {
                    console.warn("Reproducción automática bloqueada. Esperando interacción del usuario...");
                    // Reintentar en el primer clic o tecla si fue bloqueado
                    const retry = () => {
                        currentAudio.play().catch(() => {});
                        document.removeEventListener('click', retry);
                        document.removeEventListener('keydown', retry);
                    };
                    document.addEventListener('click', retry);
                    document.addEventListener('keydown', retry);
                } else {
                    console.error("Error reproduciendo música:", error);
                }
            });
        };

        startPlayback();
    }
}

function getCurrentPlatform() {
  const activePlatforms = scene === 2
    ? document.querySelectorAll('.platforms-scene-2 .platform')
    : document.querySelectorAll('.platforms-scene-1 .platform');
  const playerRect = player.getBoundingClientRect();

  for (const platform of activePlatforms) {  
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

function showRunaNarration(text, onFinish) {
  const introScene = document.getElementById("introScene");
  const introText = document.getElementById("introText");
  const continuePrompt = document.getElementById("continuePrompt");

  introText.textContent = text;
  introScene.style.display = "flex";
  continuePrompt.style.display = "block";

  function handleKey(e) {
    if (e.key.toLowerCase() === "b") {
      introScene.style.display = "none";
      document.removeEventListener("keydown", handleKey);
      if (typeof onFinish === "function") onFinish();
    }
  }

  document.addEventListener("keydown", handleKey);
}


function showRunaQuiz(runaId) {
  const quiz = runaQuizzes[runaId];
  if (!quiz) return; 

  const container = document.getElementById("runa-quiz-container");
  const questionElem = document.getElementById("runa-quiz-question");
  const optionsElem = document.getElementById("runa-quiz-options");

  optionsElem.innerHTML = "";
  questionElem.textContent = quiz.question;

  quiz.options.forEach((opt, idx) => {
    const li = document.createElement("li");
    li.textContent = opt;
    li.classList.add("runa-option");
    li.onclick = () => {
      container.style.display = "none";
      let message = "";

      if (idx === quiz.correct) {
        wisdomPoints += 10;
        updateWisdomBar();
        message = "¡Correcto! +10 Sabiduría";
      } else {
        message = "Respuesta incorrecta...";
      }

      showCenterMessage(message, 2000);

      // mostrar narración obligatoria antes de cambiar escena
        setTimeout(() => {
            showRunaNarration(
                quiz.narration || "Un fragmento de sabiduría ancestral se revela...",
                () => {
                    if (scene === 8) {
                        showFinalThanksAndReturnToMenu();
                    } else {
                        const nextSceneFn = window[`startScene${scene + 1}`];
                        if (typeof nextSceneFn === "function") nextSceneFn();
                    }
                }
            );
        }, 2200);
    };
    optionsElem.appendChild(li);
  });

  container.style.display = "flex";
}


function checkRunaCollection() {
    if (scene >= 4) {
        const runaId = `runa${scene}`;
        const runa = document.getElementById(runaId);
        if (runa && runa.style.display !== 'none') {
            const playerRect = player.getBoundingClientRect();
            const runaRect = runa.getBoundingClientRect();
            const overlap = !(
                playerRect.right < runaRect.left ||
                playerRect.left > runaRect.right ||
                playerRect.bottom < runaRect.top ||
                playerRect.top > runaRect.bottom
            );
            if (overlap) {
                runa.style.display = 'none';
                runasCollected += 1;
                // CORREGIDO: usar scene como runaId
                showRunaQuiz(scene);
            }
        }
    }
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

function checkFeatherCollision() {
    const playerRect = player.getBoundingClientRect();
    for (let i = feathers.length - 1; i >= 0; i--) {
        const feather = feathers[i];
        const featherRect = feather.element.getBoundingClientRect();
        if (playerRect.right > featherRect.left && 
            playerRect.left < featherRect.right &&
            playerRect.bottom > featherRect.top &&
            playerRect.top < featherRect.bottom) {
            applyDamageToPlayer();
            feather.element.remove();
            feathers.splice(i, 1);
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
        showQuiz();
        talkedToNPC = true;
        setTimeout(hideDialogue, 3000);
    }
}

function showCenterMessage(text, duration = 2000) {
    const messageBox = document.getElementById("centerMessage");
    const messageText = document.getElementById("centerMessageText");

    messageText.textContent = text;
    messageBox.style.display = "block";

    setTimeout(() => {
        messageBox.style.display = "none";
    }, duration);
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
    } else {
        lifeContainer.style.display = 'block';
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

function updateWisdomBar() {
    const wisdomBar = document.getElementById('wisdom-bar');
    if (wisdomBar) wisdomBar.style.display = 'block';
    document.getElementById('wisdom-points').textContent = wisdomPoints;
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
        eagle.style.display = "none";
        document.getElementById('eagle-life-bar').style.display = "none"; 
        showDialogue("¡Has derrotado al Águila!");
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
    if (!playerRecentlyHit && playerLives > 0) {
        if (hasShield) {
            hasShield = false;
            player.style.backgroundImage = "url('Resources/Player/Player_Idle.png')";
            showCenterMessage("¡El escudo te protegió!", 1500);
            playerRecentlyHit = true;
            setTimeout(() => { playerRecentlyHit = false; }, 1000);
            return;
        }
        playerLives--;
        updateLifeBar();
        playerRecentlyHit = true;

        // Efecto de parpadeo retro
        let blinkCount = 0;
        const blinkInterval = setInterval(() => {
            player.style.opacity = (player.style.opacity === "1" || player.style.opacity === "") ? "0.3" : "1";
            blinkCount++;
            if (blinkCount > 7) {
                clearInterval(blinkInterval);
                player.style.opacity = "1";
            }
        }, 250);

        setTimeout(() => {
            playerRecentlyHit = false;
            player.style.opacity = "1";
        }, 2000);
    }
}

function showGameOver() {
    const gameOverScreen = document.getElementById('gameOverScreen');
    const overlay = document.getElementById('overlay');
    gameOverActive = true; // Bloquear el juego

    // Mostrar mensaje de Game Over
    gameOverScreen.style.display = 'block';
    gameOverScreen.innerHTML = "¡Game Over! Has perdido todas tus vidas.";

    // Oscurecer pantalla
    overlay.style.background = "rgba(0, 0, 0, 0.85)";

    // --- Preparar datos para el Resumen y Auto-guardado ---
    const finalScore = (typeof wisdomPoints !== 'undefined') ? wisdomPoints : 0;
    const finalGameData = {
      score: finalScore,
      wisdomPoints: (typeof wisdomPoints !== 'undefined') ? wisdomPoints : 0,
      levelReached: (typeof scene !== 'undefined') ? scene : null,
      runasCollected: typeof runasCollected !== 'undefined' ? runasCollected : 0,
      enemiesDefeated: typeof enemiesDefeated !== 'undefined' ? enemiesDefeated : 0,
      playerWon: false
    };

    // Mostrar resumen y guardar automáticamente
    if (typeof window.showGameSummary === 'function') {
      setTimeout(() => {
        window.showGameSummary(finalGameData);
      }, 1500); // Dar un poco de tiempo para ver el mensaje de Game Over
    } else {
      setTimeout(() => {
        window.showMenu();
      }, 1500);
    }
}

let gameLoopRunning = false;

function resetGameState() {
    // Reiniciar estados lógicos
    gameOverActive = false;
    isGamePaused = false;
    scene = 0;
    playerLives = 4;
    wisdomPoints = 0;
    runasCollected = 0;
    enemiesDefeated = 0;
    playerX = 0;
    playerY = 100;
    velocityY = 0;
    isJumping = false;
    isAttacking = false;
    talkedToNPC = false;
    pumaDefeated = false;
    pumaLives = 6;
    eagleDefeated = false;
    eagleLives = 7;
    eagleState = "idle";
    currentPhase = 1;
    
    // Limpiar UI
    document.getElementById('gameOverScreen').style.display = 'none';
    document.getElementById('overlay').style.background = "transparent";
    document.getElementById('menuStats').style.display = 'none';
    document.getElementById('restartButton').style.display = 'none';
    document.getElementById('gameTitle').textContent = "RUNA PACHAWAN";
    document.getElementById('playButton').textContent = "Iniciar Aventura";
    
    // Limpiar proyectiles y enemigos
    feathers.forEach(f => f.element.remove());
    feathers.length = 0;
    apples.forEach(a => a.element.remove());
    apples.length = 0;
    projectiles.forEach(p => p.element.remove());
    projectiles.length = 0;
    
    // Resetear HUD
    updateLifeBar();
    updateWisdomBar();
    
    // Resetear fondo a la escena inicial
    const bg = document.getElementById('background');
    if (bg) bg.style.backgroundImage = "url('Resources/Backgrounds/BackGround1.png')";
    
    // Ocultar todas las escenas y mostrar solo la 1
    document.querySelectorAll('[class^="platforms-scene-"]').forEach(el => el.style.display = 'none');
    const scene1El = document.querySelector('.platforms-scene-1');
    if (scene1El) scene1El.style.display = 'block';
    
    // Mostrar NPC y trigger de la escena 1
    if (ayllu) ayllu.style.display = 'block';
    if (trigger) trigger.style.display = 'block';
    
    // Mostrar todas las runas
    document.querySelectorAll('.collectible').forEach(el => el.style.display = 'block');
    
    // Ocultar enemigos de escenas
    if (document.getElementById('puma')) document.getElementById('puma').style.display = 'none';
    if (document.getElementById('eagleBoss')) document.getElementById('eagleBoss').style.display = 'none';
    
    // Ocultar jugador y HUD inicialmente (se mostrarán al pulsar "Play")
    const playerEl = document.getElementById('player');
    if (playerEl) playerEl.style.display = 'none';
    
    const hudElements = ['life-bar', 'wisdom-bar', 'player-nick-hud', 'overlay'];
    hudElements.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            if (id === 'overlay') el.style.background = "transparent";
            else el.style.display = 'none';
        }
    });
}

// Agregar listener para el botón de reiniciar
document.addEventListener('DOMContentLoaded', () => {
    const restartBtn = document.getElementById('restartButton');
    if (restartBtn) {
        restartBtn.addEventListener('click', () => {
            // Si el juego no ha terminado (es decir, estamos en pausa), pedir confirmación
            if (!gameOverActive) {
                const confirmRestart = confirm("¿Estás seguro de que quieres reiniciar la partida? Perderás todo tu progreso actual.");
                if (!confirmRestart) return;
            }
            
            resetGameState();
            // Iniciar el flujo de juego normal
            document.getElementById('playButton').click();
        });
    }
});

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
        velocityY = 12;
        isJumping = true;
        player.style.backgroundImage = "url('Resources/Player/Player_Jump.png')";
    }

    applyGravity();

    playerX = Math.max(0, Math.min(playerX, stageWidth - playerWidth));
    playerY = Math.max(groundLevel, Math.min(playerY, 600));

    if (!isAttacking) {
        if (isJumping) {
            player.style.backgroundImage = velocityY > 0 
                ? "url('Resources/Player/Player_Jump.png')" 
                : "url('Resources/Player/Player_Fall.png')";
        } else if (moving) {
            player.style.backgroundImage = "url('Resources/Player/Player_Run.png')";
        } else {
            player.style.backgroundImage = "url('Resources/Player/Player_Idle.png')";
        }
    }
}


function movePuma() {
    if (pumaDefeated) return;

    const pumaRect = puma.getBoundingClientRect();
    const walls = document.querySelectorAll('.blocker-wall, .blocker');
    const pumaWidth = 180;

    // --- Nuevo comportamiento: seguir al jugador ---
    const dx = playerX - pumaX;
    if (Math.abs(dx) > 10) {
        pumaDirection = dx > 0 ? 1 : -1;
        pumaX += pumaSpeed * pumaDirection;
        // Animación de dirección
        if (pumaDirection > 0) {
            puma.classList.remove('puma-facing-left');
            puma.classList.add('puma-facing-right');
        } else {
            puma.classList.remove('puma-facing-right');
            puma.classList.add('puma-facing-left');
        }
    }

    // Limitar dentro del escenario
    if (pumaX <= 0) {
        pumaX = 0;
    } else if (pumaX >= stageWidth - pumaWidth) {
        pumaX = stageWidth - pumaWidth;
    }

    // Colisión con paredes
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

    // Ataque si está cerca
    const playerRect = player.getBoundingClientRect();
    if (Math.abs(playerRect.left - pumaRect.left) < 150 && 
        Math.abs(playerRect.bottom - pumaRect.bottom) < 50) {
        isPumaAttacking = true;
        puma.style.backgroundImage = "url('Resources/Mobs/panther_atk.png')";
        setTimeout(() => {
            isPumaAttacking = false;
            puma.style.backgroundImage = "url('Resources/Mobs/panther_idle.png')";
        }, 500);
        return;
    }

    if (!isPumaAttacking) {
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
        // Usar eagleX y eagleY como posición de origen
        createFeather(eagleX, eagleY + i * spacing, -1);
        createFeather(eagleX + 120, eagleY + i * spacing, 1);
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

        if (hit && playerLives > 0 && !playerRecentlyHit) {
            feather.remove();
            clearInterval(interval);
            playerLives--;
            updateLifeBar();
            playerRecentlyHit = true;
            setTimeout(() => { playerRecentlyHit = false; }, 1000);
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
    // Verificar si el águila ha sido derrotada
    if (eagleLives <= 0 && scene === 3) {
        if (!eagleDefeated) { // solo ocurre una vez
        eagleDefeated = true;
        eagle.style.display = 'none';
        document.getElementById('eagle-life-bar').style.display = 'none';
        showDialogue("¡Has derrotado al Águila!");
        setTimeout(() => {
            hideDialogue();
            startScene4();
        }, 3500);
    }
    return;
    }

    if (!eagle || eagleLives <= 0) return;

    // Ajustar tamaño del águila SOLO en landing/vulnerable
    if (eagleState === "landing" || eagleState === "vulnerable") {
        eagle.style.width = "120px";
        eagle.style.height = "70px";
    } else {
        eagle.style.width = "200px";
        eagle.style.height = "120px";
    }

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

            eagleX += dx * 0.05;
            eagleY += dy * 0.05;

            // Verificar colisión con el jugador DURANTE la embestida
            const eagleRect = eagle.getBoundingClientRect();
            const playerRect = player.getBoundingClientRect();
            const eagleHitsPlayer = !(
                eagleRect.right < playerRect.left ||
                eagleRect.left > playerRect.right ||
                eagleRect.bottom < playerRect.top ||
                eagleRect.top > playerRect.bottom
            );
            if (eagleHitsPlayer && !playerRecentlyHit && !eagleDiveHasHit) {
                playerLives--;
                updateLifeBar();
                playerRecentlyHit = true;
                eagleDiveHasHit = true;
                setTimeout(() => { playerRecentlyHit = false; }, 1000);
            }
            // Cuando termina la embestida
            if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
                eagleState = "idle";
                eagleY = eagleLastDiveTargetY;
                attackType = "feather";
                lastAttackTime = Date.now();
                eagleDiveHasHit = false;
            }
            break;

        case "landing":
            eagle.style.backgroundImage = "url('Resources/First_Boss/eagle_burnout.png')";
            eagleVulnerable = true;
            eagleCanBeDamaged = true;
            setTimeout(() => {
                eagleVulnerable = false;
                eagleCanBeDamaged = false;
                eagleState = "idle";
                lastAttackTime = Date.now();
                attackType = "dive";
                eagleY = 200;
            }, 3500);
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
                //El águila baja al suelo y entra en estado vulnerable
                eagleY = groundLevel + 20;
                eagleState = "landing";
                eagle.style.backgroundImage = "url('Resources/First_Boss/eagle_idle.png')";
                lastAttackTime = Date.now();
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
            // dentro del bloque donde confirmas derrota del águila:
            enemiesDefeated += 1;
            showDialogue("¡Has derrotado al Águila!");
        }
    }
}


// Sistema de manzanas (Mazorca de maiz)
function spawnApple() {
    const appleImagePath = 'Resources/Items/apple.png';
    console.log("Intentando cargar manzana desde:", appleImagePath);
    
    const apple = document.createElement('div');
    apple.className = 'health-item';
    apple.style.backgroundImage = `url('${appleImagePath}')`;
    
    // Posición más accesible
    const x = 200 + Math.random() * (stageWidth - 400);
    const y = groundLevel + 50;
    
    apple.style.left = `${x}px`;
    apple.style.bottom = `${y}px`;
    apple.style.width = '60px';
    apple.style.height = '60px';
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
    const now = performance.now(); 
    //respeta cooldown
    if (now - playerLastAttackTime < playerAttackCooldown) return;
    isAttacking = true;
    playerLastAttackTime = now;
    player.style.backgroundImage = "url('Resources/Player/Player_atk.png')";
    const attackWindow = 200;

    // Desactiva "isAttacking"
    setTimeout(() => {
        isAttacking = false;

        if (isJumping) {
            player.style.backgroundImage = velocityY > 0 
                ? "url('Resources/Player/Player_Jump.png')" 
                : "url('Resources/Player/Player_Fall.png')";
        } else if (keysPressed['ArrowLeft'] || keysPressed['ArrowRight']) {
            player.style.backgroundImage = "url('Resources/Player/Player_Run.png')";
        } else {
            player.style.backgroundImage = "url('Resources/Player/Player_Idle.png')";
        }
    }, attackWindow);
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

        // Mostrar vidas restantes en consola
        console.log(`Puma golpeado! Vidas restantes: ${pumaLives}`);

        if (pumaLives <= 0) {
            pumaDefeated = true;
            puma.style.display = 'none';
            // dentro del bloque de derrota del puma:
            enemiesDefeated += 1;

            showDialogue("¡Has vencido al enemigo!");

            // Transición directa a escena 3
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

function checkQuicksandCollision() {
    const quicksand = document.getElementById(`quicksand${scene}`);
    if (!quicksand) return;

    const playerRect = player.getBoundingClientRect();
    const quicksandRect = quicksand.getBoundingClientRect();

    const overlap = !(
        playerRect.right < quicksandRect.left ||
        playerRect.left > quicksandRect.right ||
        playerRect.bottom < quicksandRect.top ||
        playerRect.top > quicksandRect.bottom
    );

    // Solo aplicar daño si el jugador tiene vidas
    if (overlap && playerLives > 0) {
        playerLives = 0; 
        updateLifeBar();
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

function spawnProjectile(enemy) {
  const stageEl = document.getElementById("stage");        
  if (!stageEl) return;                                  

  const enemyRect = enemy.getBoundingClientRect();
  const stageRect = stageEl.getBoundingClientRect();

  // Coordenadas relativas al stage
  const projectileX = enemyRect.left - stageRect.left + enemyRect.width / 2;
  const projectileY = enemyRect.bottom - stageRect.top; // <-- usar bottom en vez de top

  const proj = document.createElement("div");
  proj.classList.add("projectile");
  proj.style.position = "absolute";                         
  proj.style.left = projectileX + "px";
  proj.style.bottom  = projectileY + "px"; // <-- bottom, no top
  stageEl.appendChild(proj);

  // Disparar hacia el jugador
  const playerCenterX = playerX + playerWidth / 2;
  const dir = playerCenterX < projectileX ? -6 : 6;

  projectiles.push({ element: proj, x: projectileX, y: projectileY, speed: dir });
}


function updateProjectiles() {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        let proj = projectiles[i];
        proj.x += proj.speed; 
        proj.element.style.left = proj.x + "px";

        // Colisión con jugador
        const projRect = proj.element.getBoundingClientRect();
        const playerRect = player.getBoundingClientRect();
        const overlap = !(
            projRect.right < playerRect.left ||
            projRect.left > playerRect.right ||
            projRect.bottom < playerRect.top ||
            projRect.top > playerRect.bottom
        );

        if (overlap) {
            applyDamageToPlayer();
            proj.element.remove();
            projectiles.splice(i, 1);
            continue;
        }

        // Si se va fuera de pantalla
        if (proj.x < 0 || proj.x > stageWidth) {
            proj.element.remove();
            projectiles.splice(i, 1);
        }
    }
}

function updateSpanishEnemies() {
    spanishEnemies.forEach(enemy => {
        const enemyRect = enemy.getBoundingClientRect();
        const enemyCenterX = enemyRect.left + enemyRect.width / 2;
        const playerCenterX = playerX + playerWidth / 2;

        if (playerCenterX > enemyCenterX) {
            enemy.classList.add("flipped");   
        } else {
            enemy.classList.remove("flipped"); 
        }

        let state = enemy.dataset.state;
        let timer = parseInt(enemy.dataset.timer);

        timer--;
        if (timer <= 0) {
            if (state === "recharge") {
                state = "aim";
                timer = 60;
                enemy.style.backgroundImage = "url('Resources/Mobs/conquest_aiming_lft.png')";
            } else if (state === "aim") {
                state = "shoot";
                timer = 60;
                enemy.style.backgroundImage = "url('Resources/Mobs/conquest_shooting.png')";
                spawnProjectile(enemy);
            } else if (state === "shoot") {
                state = "idle";
                timer = 60;
                enemy.style.backgroundImage = "url('Resources/Mobs/conquest_idle.png')";
            } else if (state === "idle") {
                state = "recharge";
                timer = 120;
                enemy.style.backgroundImage = "url('Resources/Mobs/conquest_recharge.png')";
            }
        }

        enemy.dataset.state = state;
        enemy.dataset.timer = timer;
    });
}

function checkSpanishCollision() {
    spanishEnemies.forEach(enemy => {
        const enemyRect = enemy.getBoundingClientRect();
        const playerRect = player.getBoundingClientRect();

        const overlap = !(
            playerRect.right < enemyRect.left ||
            playerRect.left > enemyRect.right ||
            playerRect.bottom < enemyRect.top ||
            playerRect.top > enemyRect.bottom
        );

        if (overlap) {
            // Colisión lateral 
            if (playerRect.right > enemyRect.left && playerRect.left < enemyRect.left) {
                playerX = enemy.offsetLeft - player.offsetWidth; // bloquear a la izquierda
            }
            if (playerRect.left < enemyRect.right && playerRect.right > enemyRect.right) {
                playerX = enemy.offsetLeft + enemy.offsetWidth; // bloquear a la derecha
            }

            // Colisión superior 
            if (playerRect.bottom > enemyRect.top && velocityY <= 0) {
                // Ajuste: solo poner al jugador justo encima del enemigo, no mandarlo al cielo
                playerY = parseInt(enemy.style.bottom) + enemy.offsetHeight;
                velocityY = 0; 
                isJumping = false;
            }

            updateCharacterPosition(player, playerX, playerY);
        }
    });
}


function startIntroScene() {
    const introDiv = document.getElementById('introText');
    const continuePrompt = document.getElementById('continuePrompt');

    if (writingInterval) clearInterval(writingInterval);
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

function startScene2() {
    playSceneMusic('scene2');
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

    document.getElementById('floor').style.backgroundImage = "url('Resources/Backgrounds/fa_floor.png')";
    document.getElementById("background").style.backgroundImage = "url('Resources/Backgrounds/BackGround.png')";
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
}

function startScene3() {
    playSceneMusic('scene3');
    hideDialogue();
    scene = 3;
    transitioning = false;

    // Resetear estado completo del águila
    eagleLives = 7; 
    eagleDefeated = false;
    eagleHitsLanded = 0;
    isEagleDown = false;
    eagleState = "idle";
    eagleX = 700;
    eagleY = 200;
    eagleAttackCooldown = 120;

    document.getElementById('eagleBoss').style.display = 'block';
    document.querySelector('.platforms-scene-3').style.display = 'block';
    document.getElementById('eagle-life-bar').style.display = 'flex';
    updateEagleLifeBar();

    const eagle = document.getElementById('eagle');
    eagle.style.display = 'block';
    eagle.style.backgroundImage = "url('Resources/First_Boss/eagle_idle.png')";
    updateCharacterPosition(eagle, eagleX, eagleY);

   
    document.querySelector('.platforms-scene-2').style.display = 'none';
    puma.style.display = 'none';

    playerX = 100;
    playerY = groundLevel + 5;
    updateCharacterPosition(player, playerX, playerY);

    document.getElementById('floor').style.backgroundImage = "url('Resources/Backgrounds/castle_floor.png')";
    document.getElementById("background").style.backgroundImage = "url('Resources/Backgrounds/BackGround2.png')";

    playerRecentlyHit = true;
    setTimeout(() => { playerRecentlyHit = false; }, 1200);

    // Reiniciar temporizador de ataques
    lastAttackTime = Date.now();

}

function startScene4() {
    playSceneMusic('scene4');
    hideDialogue();
    scene = 4;
    transitioning = false;

    // Mostrar plataformas del nivel 4
    document.querySelector('.platforms-scene-4').style.display = 'block';
    // Ocultar otras escenas
    document.querySelector('.platforms-scene-3').style.display = 'none';
    document.querySelector('.platforms-scene-2').style.display = 'none';
    document.querySelector('.platforms-scene-1').style.display = 'none';
    document.getElementById('eagleBoss').style.display = 'none';

    // Fondo opcional
    document.getElementById("background").style.backgroundImage = "url('Resources/Backgrounds/Background3_5.png')";
    document.getElementById('floor').style.backgroundImage = "url('Resources/Backgrounds/forest_floor.png')";

    // Posición inicial del jugador
    playerX = 120;
    playerY = groundLevel + 5;
    updateCharacterPosition(player, playerX, playerY);

    document.getElementById("ayllu-warning").style.display = "flex";
    showRunaForScene();

}

function startScene5() {
    playSceneMusic('scene5');
    hideDialogue();
    scene = 5;
    transitioning = false;

    // Mostrar plataformas del nivel 5
    document.querySelector('.platforms-scene-5').style.display = 'block';

    document.querySelector('.platforms-scene-4').style.display = 'none';
    document.querySelector('.platforms-scene-3').style.display = 'none';
    document.querySelector('.platforms-scene-2').style.display = 'none';
    document.querySelector('.platforms-scene-1').style.display = 'none';
    document.getElementById('eagleBoss').style.display = 'none';

    document.getElementById("background").style.backgroundImage = "url('Resources/Backgrounds/Background3_5.png')";
    document.getElementById('floor').style.backgroundImage = "url('Resources/Backgrounds/forest_floor.png')";

    playerX = 100;
    playerY = groundLevel + 5;
    updateCharacterPosition(player, playerX, playerY);

    showRunaForScene();
    document.getElementById("ayllu-warning").style.display = "none";
}

function startScene6() {
    playSceneMusic('scene6');
    hideDialogue();
    scene = 6;
    transitioning = false;

    // Mostrar plataformas del nivel 6
    document.querySelector('.platforms-scene-6').style.display = 'block';

    document.querySelector('.platforms-scene-5').style.display = 'none';
    document.querySelector('.platforms-scene-4').style.display = 'none';
    document.querySelector('.platforms-scene-3').style.display = 'none';
    document.querySelector('.platforms-scene-2').style.display = 'none';
    document.querySelector('.platforms-scene-1').style.display = 'none';
    document.getElementById('eagleBoss').style.display = 'none';

    document.getElementById("background").style.backgroundImage = "url('Resources/Backgrounds/Background4.png')";
    document.getElementById('floor').style.backgroundImage = "url('Resources/Backgrounds/sand_floor.png')";

    // AJUSTE: Coloca al jugador lejos de la quicksand
    playerX = 120; // Asegúrate que esté fuera de la quicksand
    playerY = groundLevel + 130; // Más alto que la quicksand
    updateCharacterPosition(player, playerX, playerY);

    spanishEnemies = Array.from(document.querySelectorAll(`.platforms-scene-${scene} .spanish-enemy`));
    spanishEnemies.forEach(enemy => {
        enemy.dataset.state = "recharge";
        enemy.dataset.timer = 120; 
        enemy.style.backgroundImage = "url('Resources/Mobs/conquest_recharge.png')";
    });
    projectiles = [];

    showRunaForScene();
    document.getElementById("ayllu-warning").style.display = "none";
}

function startScene7() {
    playSceneMusic('scene7');
    hideDialogue();
    scene = 7;
    transitioning = false;

    document.querySelector('.platforms-scene-7').style.display = 'block';
    document.querySelector('.platforms-scene-6').style.display = 'none';
    document.querySelector('.platforms-scene-5').style.display = 'none';
    document.querySelector('.platforms-scene-4').style.display = 'none';
    document.querySelector('.platforms-scene-3').style.display = 'none';
    document.querySelector('.platforms-scene-2').style.display = 'none';
    document.querySelector('.platforms-scene-1').style.display = 'none';

    document.getElementById("background").style.backgroundImage = "url('Resources/Backgrounds/Background4.png')";
    document.getElementById('floor').style.backgroundImage = "url('Resources/Backgrounds/sand_floor.png')";

    playerX = 120;
    playerY = groundLevel + 5;
    updateCharacterPosition(player, playerX, playerY);

    // Inicializar enemigos españoles de la escena actual
    spanishEnemies = Array.from(document.querySelectorAll(`.platforms-scene-${scene} .spanish-enemy`));
    spanishEnemies.forEach(enemy => {
        enemy.dataset.state = "recharge";
        enemy.dataset.timer = 120;
        enemy.style.backgroundImage = "url('Resources/Mobs/conquest_recharge.png')";
    });
    projectiles = [];

    showRunaForScene();
    document.getElementById("ayllu-warning").style.display = "none";
}

function startScene8() {
    playSceneMusic('scene8');
    hideDialogue();
    scene = 8;
    transitioning = false;

    document.querySelector('.platforms-scene-8').style.display = 'block';
    document.querySelector('.platforms-scene-7').style.display = 'none';
    document.querySelector('.platforms-scene-6').style.display = 'none';
    document.querySelector('.platforms-scene-5').style.display = 'none';
    document.querySelector('.platforms-scene-4').style.display = 'none';
    document.querySelector('.platforms-scene-3').style.display = 'none';
    document.querySelector('.platforms-scene-2').style.display = 'none';
    document.querySelector('.platforms-scene-1').style.display = 'none';

    document.getElementById("background").style.backgroundImage = "url('Resources/Backgrounds/Background_8.png')";
    document.getElementById('floor').style.backgroundImage = "url('Resources/Backgrounds/castle_floor.png')";

    playerX = 120;
    playerY = groundLevel + 5;
    updateCharacterPosition(player, playerX, playerY);

    showRunaForScene();
    document.getElementById("ayllu-warning").style.display = "none";
}


function gameLoop() {
    gameLoopRunning = true;
    if (gameOverActive || isGamePaused) {
        requestAnimationFrame(gameLoop);
        return;
    }
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
            appleSpawnTimer = 100;
        } else {
            appleSpawnTimer--;
        }
    } else if (scene >= 4) {  
        checkQuicksandCollision();
        checkRunaCollection();
        if (scene === 6 || scene === 7) {
            updateSpanishEnemies(); 
            updateProjectiles();    
            checkSpanishCollision();  
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

function showFinalThanksAndReturnToMenu() {
    const finalText = "¡Muchas gracias por jugar! Esperamos que haya servido para aprender parte de la historia del Ecuador.";
    
    showRunaNarration(finalText, () => {
        setTimeout(() => {
            if (currentAudio) {
                currentAudio.pause();
                currentAudio.currentTime = 0;
            }
            
            document.querySelectorAll('.platforms-scene-8, #player, #background, #floor, #life-bar, #wisdom-bar, #player-nick-hud').forEach(el => {
                el.style.display = 'none';
            });
            
            // --- Preparar datos para el Resumen de Victoria ---
            const finalScore = (typeof wisdomPoints !== 'undefined') ? wisdomPoints : 0;
            const finalGameData = {
              score: finalScore,
              wisdomPoints: (typeof wisdomPoints !== 'undefined') ? wisdomPoints : 0,
              levelReached: 8,
              runasCollected: typeof runasCollected !== 'undefined' ? runasCollected : 0,
              enemiesDefeated: typeof enemiesDefeated !== 'undefined' ? enemiesDefeated : 0,
              playerWon: true
            };

            if (typeof window.showGameSummary === 'function') {
                window.showGameSummary(finalGameData);
            } else {
                window.showMenu();
            }
        }, 2000); 
    });
}

setInterval(() => {
    if (scene === 2 && playerLives > 0 && !pumaDefeated) {
        const dx = Math.abs(playerX - pumaX);
        const dy = Math.abs(playerY - pumaY);
        if (dx < 100 && dy < 100) {
            applyDamageToPlayer();
            puma.style.backgroundImage = "url('Resources/Mobs/panther_atk.png')";
            setTimeout(() => {
                puma.style.backgroundImage = "url('Resources/Mobs/panther_idle.png')";
            }, 500);
        }
    }
}, 1000);

function showQuiz() {
    quizActive = true;
    selectedOptionIndex = 0;

    document.getElementById("quiz-question").textContent = quizQuestionText;

    const optionsContainer = document.getElementById("quiz-options");
    optionsContainer.innerHTML = "";

    quizOptions.forEach((option, index) => {
        const li = document.createElement("li");
        li.textContent = option;
        li.classList.add("quiz-option");
        if (index === selectedOptionIndex) li.classList.add("selected");
        optionsContainer.appendChild(li);
    });

    document.getElementById("quiz-container").style.display = "flex";
}

// Mover selección con flechas SOLO cuando el quiz está activo
document.addEventListener("keydown", (e) => {
    if (!quizActive) return;

    if (e.key === "ArrowUp") {
        selectedOptionIndex = (selectedOptionIndex - 1 + quizOptions.length) % quizOptions.length;
        updateQuizSelection();
        e.preventDefault();
    }
    if (e.key === "ArrowDown") {
        selectedOptionIndex = (selectedOptionIndex + 1) % quizOptions.length;
        updateQuizSelection();
        e.preventDefault();
    }
    if (e.key.toLowerCase() === "a") {
        checkQuizAnswer();
        e.preventDefault();
    }
});

function updateQuizSelection() {
    const optionElements = document.querySelectorAll(".quiz-option");
    optionElements.forEach((el, index) => {
        el.classList.toggle("selected", index === selectedOptionIndex);
    });
}

function checkQuizAnswer() {
    if (selectedOptionIndex === correctAnswerIndex) {
        if (scene === 1 && !talkedToNPC) {
            wisdomPoints += 10;
            updateWisdomBar();
            showCenterMessage("¡Correcto! +10 Sabiduría", 2500);
            document.getElementById("quiz-container").style.display = "none";
            quizActive = false;
            startScene2();
        } 
        else {
            wisdomPoints += 10;
            updateWisdomBar();
            showCenterMessage("¡Correcto! +10 Sabiduría", 2500);
            document.getElementById("quiz-container").style.display = "none";
            quizActive = false;
        }
    } else {
        if (scene === 1 && !talkedToNPC) {
            showCenterMessage("Respuesta incorrecta...", 2500);
            window.close(); 
        } 
        else {
            showCenterMessage("Respuesta incorrecta...", 2500);
            document.getElementById("quiz-container").style.display = "none";
            quizActive = false;
        }
    }
}


document.getElementById("playButton").addEventListener("click", () => {
    if (!window.getCurrentUser || !window.getCurrentUser()) {
        if (typeof window.__authHandlersInit === "function") window.__authHandlersInit();
        if (typeof window.showAuth === "function") window.showAuth();
        return;
    }
    
    // Si el juego está pausado, simplemente despausamos
    if (isGamePaused) {
        window.togglePause();
        return;
    }

    // Si el juego terminó, reiniciamos (aunque ahora tenemos un botón específico para esto, 
    // mantenemos compatibilidad si el texto cambia a "Volver a Intentar")
    if (gameOverActive) {
        resetGameState();
    }

    // Actualizar HUD con información del jugador
    if (typeof window.updateGameHUD === 'function') {
        window.updateGameHUD();
    }

    document.getElementById("menu").style.display = "none";
    
    // Asegurar que el contenedor del juego y el jugador sean visibles
    const gameContainer = document.getElementById("game-container");
    if (gameContainer) gameContainer.style.display = "block";
    
    const player = document.getElementById("player");
    if (player) player.style.display = "block";

    playSceneMusic('scene1');
    document.getElementById("introScene").style.display = "flex";
    document.getElementById('floor').style.backgroundImage = "url('Resources/Backgrounds/fa_floor.png')";
    scene = 0;  
    startIntroScene(); 
    updateLifeBar();
    updateWisdomBar();
    
    // Solo iniciar el loop si no está ya corriendo
    if (!gameLoopRunning) {
        gameLoop();
    }
});

window.addEventListener('load', () => {
    // Advertencia para ejecución local
    if (location.protocol === 'file:') {
        console.warn("Estás ejecutando el juego en modo local (file://). Algunos recursos o scripts pueden no funcionar correctamente. Usa Live Server o sube a GitHub Pages para la experiencia completa.");
    }
    if (typeof window.__authHandlersInit === "function") window.__authHandlersInit();
    if (!window.getCurrentUser || !window.getCurrentUser()) {
        if (typeof window.showAuth === "function") window.showAuth();
    } else {
        if (typeof window.showMenu === "function") window.showMenu();
    }
});

const exitBtn = document.getElementById("exitButton");
if (exitBtn) {
    exitBtn.addEventListener("click", () => {
        window.close();
    });
}

const logoutBtn = document.getElementById("logoutButton");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    // Detener música y limpiar estado
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }
    
    // Ocultar elementos del juego si estaban visibles
    document.getElementById('game-container').style.display = 'none';
    document.getElementById('introScene').style.display = 'none';
    
    // Reiniciar estado
    if (typeof resetGameState === 'function') {
      resetGameState();
    }

    if (typeof window.authSignOut === "function") {
      window.authSignOut();
    } else {
      location.reload();
    }
  });
}

const leaderboardBtn = document.getElementById("leaderboardButton");
if (leaderboardBtn) {
    leaderboardBtn.addEventListener("click", () => {
        if (typeof window.showLeaderboard === "function") {
            window.showLeaderboard();
        }
    });
}

// window.togglePause function definition
window.togglePause = function() {
    const menu = document.getElementById('menu');
    const menuVisible = menu.style.display !== 'none';
    const authVisible = document.getElementById('authScreen').style.display !== 'none';
    const introVisible = document.getElementById('introScene').style.display !== 'none';
    
    // Solo pausar si estamos en gameplay real (no en menús iniciales)
    if (authVisible || introVisible || gameOverActive) return;

    isGamePaused = !isGamePaused;
    
    if (isGamePaused) {
        if (menu) {
            menu.style.display = 'flex';
            document.getElementById('playButton').textContent = "Continuar Aventura";
            document.getElementById('restartButton').style.display = 'block';
            document.getElementById('menuStats').style.display = 'none';
            document.getElementById('gameTitle').textContent = "PAUSA";
            
            // Ocultar avisos de Ayllu y Quizzes
            const aylluWarning = document.getElementById('ayllu-warning');
            if (aylluWarning) aylluWarning.style.display = 'none';
            const quizContainer = document.getElementById('runa-quiz-container');
            if (quizContainer) quizContainer.style.display = 'none';
        }
    } else {
        if (menu) menu.style.display = 'none';
        // Cerrar también el leaderboard si estaba abierto sobre la pausa
        const leaderboard = document.getElementById('leaderboardModal');
        if (leaderboard) leaderboard.style.display = 'none';
    }
};

// Bloquear controles si es Game Over o Pausa
document.addEventListener('keydown', (e) => {
    if (gameOverActive) return;

    // Tecla ESC para pausa
    if (e.key === 'Escape') {
        window.togglePause();
        return;
    }

    if (isGamePaused) return; // No permitir otros movimientos en pausa

    keysPressed[e.key] = true;

    if (scene === 0 && e.key.toLowerCase() === 'b') {
        document.getElementById('introScene').style.display = 'none';
        
        // Asegurar visibilidad de los elementos del juego
        const gameContainer = document.getElementById('game-container');
        if (gameContainer) gameContainer.style.display = 'block';
        
        const playerEl = document.getElementById('player');
        if (playerEl) playerEl.style.display = 'block';

        // Ocultar todas las escenas y mostrar solo la 1
        document.querySelectorAll('[class^="platforms-scene-"]').forEach(el => el.style.display = 'none');
        const scene1El = document.querySelector('.platforms-scene-1');
        if (scene1El) scene1El.style.display = 'block';

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
