// Implementación de Firebase y Autenticación
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-analytics.js";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  connectFirestoreEmulator
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  connectAuthEmulator
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB2LACkwgSgpO3ee-4BO-UYuKHLdNmt-Xk",
  authDomain: "practicas-comunitarias-a63ba.firebaseapp.com",
  projectId: "practicas-comunitarias-a63ba",
  storageBucket: "practicas-comunitarias-a63ba.firebasestorage.app",
  messagingSenderId: "788502250286",
  appId: "1:788502250286:web:eba1b87f6cea11647330bf",
  measurementId: "G-D0QN0BW178"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
let auth = null;
try {
  auth = getAuth(app);
} catch (e) {
  console.warn("Auth no disponible; se usará almacenamiento local.");
}

window.firebaseApp = app;
window.firebaseDB = db;
window.firebaseAuth = auth;

// Escuchar cambios de autenticación para sincronizar UI
if (auth) {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log("Usuario autenticado en Firebase:", user.email);
      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email.split('@')[0],
        photoURL: user.photoURL
      };
      lsSetUser(userData);
      syncUserToFirestore(user);
      showMenu();
      if (typeof window.updateGameHUD === 'function') {
        window.updateGameHUD();
      }
    } else {
      console.log("Sin sesión de Firebase. Limpiando...");
      lsClearUser();
      showAuth();
      if (typeof window.updateGameHUD === 'function') {
        window.updateGameHUD();
      }
    }
  });
} else {
  showAuth();
}

try {
  const useEmu = new URLSearchParams(location.search).get("emu") === "1";
  if (useEmu) {
    connectFirestoreEmulator(db, "localhost", 8080);
    if (auth) connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
    console.info("Usando emuladores de Firebase (emu=1).");
  }
} catch (e) {
  console.warn("No se pudo conectar a los emuladores:", e);
}

// Funciones de utilidad expuestas globalmente
window.testWrite = async function () {
  try {
    const ref = await addDoc(collection(db, "testCollection"), {
      createdAt: new Date().toISOString(),
      origin: location.href,
      note: "Prueba a producción"
    });
    console.log("Documento creado en producción con ID:", ref.id);
    return ref.id;
  } catch (err) {
    console.error("Error escribiendo a Firestore (producción):", err);
    throw err;
  }
};

window.testRead = async function () {
  try {
    const snap = await getDocs(collection(db, "testCollection"));
    const arr = [];
    snap.forEach(d => arr.push({ id: d.id, data: d.data() }));
    console.log("Docs en testCollection (producción):", arr);
    return arr;
  } catch (err) {
    console.error("Error leyendo de Firestore (producción):", err);
    throw err;
  }
};

window.showGameSummary = async function (data) {
  const menu = document.getElementById('menu');
  const stats = document.getElementById('menuStats');
  const mainTitle = document.getElementById('gameTitle');
  const title = document.getElementById('menuStatusTitle');
  const scoreVal = document.getElementById('menuScore');
  const wisdomVal = document.getElementById('menuWisdom');
  const msg = document.getElementById('menuMessage');
  const playBtn = document.getElementById('playButton');
  const restartBtn = document.getElementById('restartButton');

  mainTitle.textContent = data.playerWon ? "¡VICTORIA!" : "¡FIN DEL JUEGO!";
  title.textContent = data.playerWon ? "Has completado el viaje" : "Has perdido tus vidas";
  scoreVal.textContent = data.score || 0;
  wisdomVal.textContent = data.wisdomPoints || 0;

  stats.style.display = 'block';
  restartBtn.style.display = 'block';
  playBtn.textContent = "Volver a Intentar";
  msg.textContent = "Guardando partida automáticamente...";
  msg.style.color = "#ffd700";

  const aylluWarning = document.getElementById('ayllu-warning');
  if (aylluWarning) aylluWarning.style.display = 'none';
  const quizContainer = document.getElementById('runa-quiz-container');
  if (quizContainer) quizContainer.style.display = 'none';

  menu.style.display = 'flex';

  try {
    const current = window.getCurrentUser ? window.getCurrentUser() : null;
    const userEmail = current && current.email ? current.email : "Invitado";
    const userName = current && current.displayName ? current.displayName : "Jugador";
    const userId = current && current.uid ? current.uid : "local_user";

    await addDoc(collection(db, "scores"), {
      username: userName,
      email: userEmail,
      userId: userId,
      score: data.score,
      wisdom: data.wisdomPoints,
      level: data.levelReached,
      runas: data.runasCollected,
      enemiesDefeated: data.enemiesDefeated || 0,
      date: new Date().toISOString(),
      completed: !!data.playerWon
    });

    msg.textContent = "¡Partida guardada con éxito!";
    msg.style.color = "#4CAF50";
  } catch (err) {
    console.error("Error auto-guardando:", err);
    msg.textContent = "Error al guardar en la nube (se guardó localmente).";
    msg.style.color = "#ff4444";
  }
};

window.showLeaderboard = async function () {
  const modal = document.getElementById('leaderboardModal');
  const list = document.getElementById('leaderboardList');

  modal.style.display = 'flex';
  list.innerHTML = "<p>Cargando mejores puntajes...</p>";

  try {
    const _db = window.firebaseDB;
    const scoresRef = collection(_db, "scores");
    const q = query(scoresRef, orderBy("score", "desc"), limit(10));
    const snap = await getDocs(q);

    if (snap.empty) {
      list.innerHTML = "<p>Aún no hay puntajes registrados.</p>";
      return;
    }

    let docs = [];
    snap.forEach(doc => {
      const data = doc.data();
      docs.push({
        username: data.username || 'Anónimo',
        score: data.score || 0,
        level: data.level || 1
      });
    });

    let html = `<table class="leaderboard-table"><thead><tr><th>#</th><th>Jugador</th><th>Puntos</th><th>Nivel</th></tr></thead><tbody>`;
    docs.forEach((d, i) => {
      html += `<tr><td>${i + 1}</td><td style="text-align: left;">${d.username}</td><td>${d.score}</td><td>${d.level}</td></tr>`;
    });
    html += `</tbody></table>`;
    list.innerHTML = html;
  } catch (err) {
    console.error("Error leaderboard:", err);
    list.innerHTML = "<p>Error al cargar puntajes.</p>";
  }
};

document.getElementById('closeLeaderboardBtn').onclick = () => {
  document.getElementById('leaderboardModal').style.display = 'none';
};

window.updateGameHUD = function () {
  const hudName = document.getElementById('hud-player-name');
  const hudPhoto = document.getElementById('hud-player-photo');
  const hudContainer = document.getElementById('player-nick-hud');

  const current = window.getCurrentUser ? window.getCurrentUser() : null;
  const user = (window.firebaseAuth && window.firebaseAuth.currentUser) ? window.firebaseAuth.currentUser : null;

  if (current || user) {
    const fullName = user?.displayName || current?.displayName || user?.email?.split('@')[0] || "Jugador";
    const firstName = fullName.trim().split(' ')[0];
    const photo = user?.photoURL || "https://cdn-icons-png.flaticon.com/512/1144/1144760.png";

    if (hudName) hudName.textContent = firstName;
    if (hudPhoto) hudPhoto.src = photo;

    const authVisible = document.getElementById('authScreen').style.display !== 'none';
    if (hudContainer) hudContainer.style.display = authVisible ? 'none' : 'flex';
  } else {
    if (hudContainer) hudContainer.style.display = 'none';
  }
};

const LS_KEY = "qc_user";
const LS_USERS = "qc_users";
function lsGetUser() {
  try { const raw = localStorage.getItem(LS_KEY); return raw ? JSON.parse(raw) : null; } catch { return null; }
}
function lsSetUser(user) { try { localStorage.setItem(LS_KEY, JSON.stringify(user)); } catch { } }
function lsClearUser() { try { localStorage.removeItem(LS_KEY); } catch { } }

window.getCurrentUser = function () {
  return lsGetUser();
};

window.authSignOut = async function () {
  if (auth) { try { await signOut(auth); } catch (e) { console.warn(e); } }
  lsClearUser();
  showAuth();
};

window.authSignIn = async function (username, password) {
  const virtualEmail = username.includes("@") ? username : `${username.toLowerCase().trim()}@runapachawan.com`;
  if (!auth) throw new Error("Servicio de autenticación no disponible.");
  try {
    const cred = await signInWithEmailAndPassword(auth, virtualEmail, password);
    const u = cred.user;
    const user = { uid: u.uid, email: virtualEmail, displayName: username };
    lsSetUser(user);
    return user;
  } catch (err) {
    console.error("Error en authSignIn:", err.code, err.message);
    throw err;
  }
};

window.authRegister = async function (name, username, password) {
  const virtualEmail = username.includes("@") ? username : `${username.toLowerCase().trim()}@runapachawan.com`;
  if (!auth) throw new Error("Servicio de autenticación no disponible.");
  try {
    const cred = await createUserWithEmailAndPassword(auth, virtualEmail, password);
    const u = cred.user;
    const user = { uid: u.uid, email: virtualEmail, displayName: name || username };
    lsSetUser(user);
    return user;
  } catch (err) {
    console.error("Error en authRegister:", err.code, err.message);
    throw err;
  }
};

function showAuth() {
  const authScreen = document.getElementById("authScreen");
  const menu = document.getElementById("menu");
  if (!authScreen || !menu) return;
  authScreen.style.display = "flex";
  menu.style.display = "none";
  if (window.playSceneMusic) window.playSceneMusic('menu');
}

function showMenu() {
  const authScreen = document.getElementById("authScreen");
  const menu = document.getElementById("menu");
  const label = document.getElementById("currentUserDisplay");

  if (window.playSceneMusic) window.playSceneMusic('menu');

  document.getElementById('menuStats').style.display = 'none';
  document.getElementById('restartButton').style.display = 'none';
  document.getElementById('gameTitle').textContent = "RUNA PACHAWAN";
  document.getElementById('playButton').textContent = "Iniciar Aventura";

  const current = window.getCurrentUser ? window.getCurrentUser() : null;
  if (current) {
    const name = current.displayName || current.name || current.email?.split('@')[0] || "Jugador";
    if (label) label.textContent = "Jugador: " + name;
  }

  if (!authScreen || !menu) return;
  authScreen.style.display = "none";
  menu.style.display = "flex";

  const aylluWarning = document.getElementById('ayllu-warning');
  if (aylluWarning) aylluWarning.style.display = 'none';
  const quizContainer = document.getElementById('runa-quiz-container');
  if (quizContainer) quizContainer.style.display = 'none';

  if (typeof window.updateGameHUD === 'function') {
    window.updateGameHUD();
  }
}

window.showAuth = showAuth;
window.showMenu = showMenu;

async function syncUserToFirestore(user) {
  if (!user || !user.uid) return;
  try {
    const userDocRef = doc(db, "users", user.uid);
    await setDoc(userDocRef, {
      uid: user.uid,
      username: user.displayName || user.email.split('@')[0],
      email: user.email,
      photoURL: user.photoURL || null,
      lastLogin: new Date().toISOString()
    }, { merge: true });
  } catch (e) {
    console.warn("Error sincronizando usuario a Firestore:", e);
  }
}

function getFriendlyError(err) {
  const code = err?.code || "";
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password': return "Usuario o contraseña incorrectos.";
    case 'auth/invalid-email': return "El nombre de usuario no es válido.";
    case 'auth/email-already-in-use': return "Este nombre de usuario ya está registrado.";
    case 'auth/weak-password': return "La contraseña es muy débil (mínimo 6 caracteres).";
    case 'auth/network-request-failed': return "Error de red. Revisa tu conexión a internet.";
    default: return "Error: " + code;
  }
}

window.__authHandlersInit = function () {
  const tabLogin = document.getElementById("tabLogin");
  const tabRegister = document.getElementById("tabRegister");
  const loginForm = document.getElementById("authLoginForm");
  const registerForm = document.getElementById("authRegisterForm");
  const logoutButton = document.getElementById("logoutButton");

  if (logoutButton) logoutButton.onclick = () => window.authSignOut();

  if (tabLogin && tabRegister && loginForm && registerForm) {
    tabLogin.onclick = () => {
      tabLogin.classList.add("active"); tabRegister.classList.remove("active");
      loginForm.style.display = "block"; registerForm.style.display = "none";
    };
    tabRegister.onclick = () => {
      tabRegister.classList.add("active"); tabLogin.classList.remove("active");
      registerForm.style.display = "block"; loginForm.style.display = "none";
    };
  }

  const googleBtn = document.getElementById("btnGoogleLogin");
  if (googleBtn) {
    googleBtn.onclick = async () => {
      const msg = document.getElementById("authLoginMessage");
      if (msg) { msg.textContent = "Conectando con Google..."; msg.style.color = "#ffd700"; }
      googleBtn.disabled = true;
      try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        const userData = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email.split('@')[0],
          photoURL: user.photoURL
        };
        lsSetUser(userData);
        await syncUserToFirestore(user);
        if (msg) { msg.textContent = "¡Bienvenido!"; msg.style.color = "#4CAF50"; }
        setTimeout(() => {
          showMenu();
          googleBtn.disabled = false;
          if (typeof window.updateGameHUD === 'function') window.updateGameHUD();
        }, 500);
      } catch (err) {
        if (msg) { msg.textContent = getFriendlyError(err); msg.style.color = "#ff4444"; }
        googleBtn.disabled = false;
      }
    };
  }

  if (loginForm) {
    loginForm.onsubmit = async (e) => {
      e.preventDefault();
      const username = document.getElementById("loginEmail").value.trim();
      const pass = document.getElementById("loginPassword").value;
      const msg = document.getElementById("authLoginMessage");
      const btn = loginForm.querySelector("button[type='submit']");
      if (msg) { msg.textContent = "Iniciando sesión..."; msg.style.color = "#ffd700"; }
      if (btn) btn.disabled = true;
      try {
        await window.authSignIn(username, pass);
        if (msg) { msg.textContent = "¡Éxito!"; msg.style.color = "#4CAF50"; }
        setTimeout(() => { showMenu(); if (btn) btn.disabled = false; }, 500);
      } catch (err) {
        if (msg) { msg.textContent = getFriendlyError(err); msg.style.color = "#ff4444"; }
        if (btn) btn.disabled = false;
      }
    };
  }

  if (registerForm) {
    registerForm.onsubmit = async (e) => {
      e.preventDefault();
      const name = document.getElementById("regName").value.trim();
      const username = document.getElementById("regEmail").value.trim();
      const pass = document.getElementById("regPassword").value;
      const msg = document.getElementById("authRegisterMessage");
      const btn = registerForm.querySelector("button[type='submit']");
      if (msg) { msg.textContent = "Creando cuenta..."; msg.style.color = "#ffd700"; }
      if (btn) btn.disabled = true;
      try {
        await window.authRegister(name, username, pass);
        if (msg) { msg.textContent = "Cuenta creada con éxito."; msg.style.color = "#4CAF50"; }
        setTimeout(() => { showMenu(); if (btn) btn.disabled = false; }, 500);
      } catch (err) {
        if (msg) { msg.textContent = getFriendlyError(err); msg.style.color = "#ff4444"; }
        if (btn) btn.disabled = false;
      }
    };
  }
};

// Iniciar handlers
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => window.__authHandlersInit());
} else {
  window.__authHandlersInit();
}
