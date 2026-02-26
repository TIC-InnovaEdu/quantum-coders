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
  connectFirestoreEmulator,
  getDoc,
  updateDoc,
  where
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
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      console.log("Usuario autenticado en Firebase:", user.email);
      // Obtener rol real desde Firestore (no hardcodear 'student')
      let realRole = 'student';
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          realRole = userDoc.data().role || 'student';
        }
      } catch (e) {
        console.warn("No se pudo obtener rol de Firestore, usando 'student':", e);
      }
      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email.split('@')[0],
        photoURL: user.photoURL,
        role: realRole
      };
      lsSetUser(userData);
      await syncUserToFirestore(user, realRole);
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

// Función para manejar la selección de rol
window.selectRole = function (role) {
  // Actualizar botones visuales
  document.querySelectorAll('.role-btn').forEach(btn => {
    btn.classList.remove('selected');
  });

  // Marcar botón seleccionado
  const selectedBtn = document.querySelector(`.role-btn.${role}`);
  if (selectedBtn) {
    selectedBtn.classList.add('selected');
  }

  // Actualizar campo oculto del formulario
  const roleInput = document.getElementById('regRole');
  if (roleInput) {
    roleInput.value = role;
  }

  // Mostrar mensaje de confirmación
  const display = document.getElementById('selectedRoleDisplay');
  if (display) {
    const roleText = role === 'student' ? 'Estudiante' : 'Docente';
    const roleDesc = role === 'student' ? 'Podrás jugar y aprender' : 'Podrás gestionar preguntas y ver estadísticas';
    display.innerHTML = `✅ Rol seleccionado: <strong>${roleText}</strong> - ${roleDesc}`;
  }

  // Para login, guardar el rol seleccionado
  window.selectedLoginRole = role;
};

// Función para verificar si el usuario actual es docente
window.isTeacher = function () {
  const user = lsGetUser();
  return user && user.role === 'teacher';
};

// Función para verificar si el usuario actual es estudiante
window.isStudent = function () {
  const user = lsGetUser();
  return user && user.role === 'student';
};

// Función para obtener rol del usuario actual
window.getUserRole = function () {
  const user = lsGetUser();
  return user ? user.role : null;
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
    console.log('🔐 Intentando login con:', virtualEmail);
    const cred = await signInWithEmailAndPassword(auth, virtualEmail, password);
    const u = cred.user;
    console.log('✅ Usuario autenticado en Firebase Auth:', u.uid, u.email);

    // Obtener rol del usuario desde Firestore
    console.log('🔍 Buscando documento del usuario en Firestore...');
    const userDoc = await getDoc(doc(db, "users", u.uid));
    
    if (!userDoc.exists()) {
      console.error('❌ ERROR CRÍTICO: Usuario no existe en Firestore - UID:', u.uid);
      console.error('📊 Posibles causas:');
      console.error('  1. El usuario fue creado en Auth pero no en Firestore');
      console.error('  2. Las reglas de seguridad bloquean el acceso');
      console.error('  3. Problema de sincronización entre Auth y Firestore');
      throw new Error('❌ Usuario no encontrado en la base de datos. Contacta al administrador.');
    }
    
    const userData = userDoc.data();
    console.log('📋 Datos del usuario desde Firestore:', userData);

    const user = {
      uid: u.uid,
      email: virtualEmail,
      displayName: username,
      role: userData.role || 'student'
    };
    lsSetUser(user);

    // Mostrar mensaje de bienvenida según rol
    const roleText = userData.role === 'teacher' ? 'Docente' : 'Estudiante';
    console.log(`🎉 Bienvenido/a ${roleText}: ${username}`);

    return user;
  } catch (err) {
    console.error('🔥 ERROR DETALLADO EN authSignIn:');
    console.error('  Código:', err.code);
    console.error('  Mensaje:', err.message);
    console.error('  Usuario:', virtualEmail);
    
    // Diagnóstico específico por código de error
    switch(err.code) {
      case 'auth/user-not-found':
        console.error('❌ El usuario no existe en Firebase Auth');
        break;
      case 'auth/wrong-password':
        console.error('❌ Contraseña incorrecta');
        break;
      case 'auth/invalid-credential':
        console.error('❌ Credenciales inválidas');
        break;
      case 'auth/network-request-failed':
        console.error('❌ Error de red - verifica conexión');
        break;
      default:
        console.error('❌ Error no categorizado:', err.code);
    }
    
    throw err;
  }
};

window.authRegister = async function (name, username, password, role = 'student') {
  const virtualEmail = username.includes("@") ? username : `${username.toLowerCase().trim()}@runapachawan.com`;
  if (!auth) throw new Error("Servicio de autenticación no disponible.");
  try {
    console.log('📝 Registrando usuario con rol:', role);
    console.log('📧 Email virtual:', virtualEmail);
    console.log('👤 Nombre:', name);
    
    const cred = await createUserWithEmailAndPassword(auth, virtualEmail, password);
    const u = cred.user;
    console.log('✅ Usuario creado en Firebase Auth:', u.uid);
    
    const user = {
      uid: u.uid,
      email: virtualEmail,
      displayName: name || username,
      role: role
    };
    console.log('👤 Datos del usuario a guardar:', user);
    lsSetUser(user);
    
    // Sincronizar con Firestore y verificar
    console.log('🔄 Sincronizando con Firestore...');
    await syncUserToFirestore(u, role);
    
    // Verificación post-sincronización
    console.log('🔍 Verificando que el usuario existe en Firestore...');
    const verificationDoc = await getDoc(doc(db, "users", u.uid));
    if (verificationDoc.exists()) {
      console.log('✅ Verificación exitosa - Usuario existe en Firestore');
    } else {
      console.error('❌ ERROR: Usuario no se guardó en Firestore después del registro');
    }
    
    return user;
  } catch (err) {
    console.error('🔥 ERROR DETALLADO EN authRegister:');
    console.error('  Código:', err.code);
    console.error('  Mensaje:', err.message);
    console.error('  Email:', virtualEmail);
    console.error('  Rol:', role);
    
    // Diagnóstico específico
    switch(err.code) {
      case 'auth/email-already-in-use':
        console.error('❌ El email ya está registrado');
        break;
      case 'auth/weak-password':
        console.error('❌ La contraseña es muy débil');
        break;
      case 'auth/invalid-email':
        console.error('❌ Email inválido');
        break;
      case 'permission-denied':
        console.error('❌ Error de permisos en Firestore - revisa las reglas de seguridad');
        break;
      default:
        console.error('❌ Error no categorizado:', err.code);
    }
    
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
  const teacherPanelBtn = document.getElementById("teacherPanelButton");

  if (window.playSceneMusic) window.playSceneMusic('menu');

  // Verificar que los elementos existan antes de acceder a sus propiedades
  const menuStats = document.getElementById('menuStats');
  if (menuStats) menuStats.style.display = 'none';

  const restartButton = document.getElementById('restartButton');
  if (restartButton) restartButton.style.display = 'none';

  const gameTitle = document.getElementById('gameTitle');
  if (gameTitle) gameTitle.textContent = "RUNA PACHAWAN";

  const playButton = document.getElementById('playButton');
  if (playButton) playButton.textContent = "Iniciar Aventura";

  const current = window.getCurrentUser ? window.getCurrentUser() : null;
  if (current) {
    const name = current.displayName || current.name || current.email?.split('@')[0] || "Jugador";
    const roleText = current.role === 'teacher' ? 'Docente' : 'Estudiante';
    const roleIcon = current.role === 'teacher' ? '👨‍🏫' : '🎓';

    if (label) {
      label.innerHTML = `${roleIcon} <strong>${name}</strong> (${roleText})`;
    }

    // Si es docente, redirigir automáticamente al panel docente
    // Solo redirigir si estamos en index.html o la raíz (no en páginas docentes)
    // EXCEPCIÓN: Si la URL tiene ?play=true o si venimos con el flag en sessionStorage, permitir jugar
    if (current.role === 'teacher') {
      const path = window.location.pathname;
      const search = window.location.search;
      const isMainPage = path.endsWith('/') || path.endsWith('/index.html') || path.endsWith('index.html') || path === '';

      // Permitir jugar si hay parámetro o flag de sesión
      if (search.includes('play=true')) {
        sessionStorage.setItem('teacher_mode', 'play');
      }

      const isPlayMode = sessionStorage.getItem('teacher_mode') === 'play';

      if (isMainPage && !isPlayMode) {
        console.log('👨‍🏫 Docente en página principal sin modo juego, redirigiendo...');
        window.location.href = 'teacher-panel.html';
        return;
      }
    }

    console.log('🎓 Usuario estudiante detectado:', current);
    console.log('📱 Mostrando menú del juego...');

    // Mostrar botón de panel docente solo si el usuario es docente
    if (teacherPanelBtn) {
      teacherPanelBtn.style.display = current.role === 'teacher' ? 'inline-block' : 'none';
      teacherPanelBtn.onclick = () => {
        sessionStorage.removeItem('teacher_mode'); // Salir del modo juego
        window.location.href = 'teacher-panel.html';
      };
    }
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

async function syncUserToFirestore(user, role = 'student') {
  if (!user || !user.uid) {
    console.error('❌ syncUserToFirestore: Usuario o UID inválido');
    return;
  }
  try {
    console.log('🔄 syncUserToFirestore - UID:', user.uid, 'Role:', role);
    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      console.log('📝 Creando nuevo documento en Firestore...');
      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email.split('@')[0],
        photoURL: user.photoURL || null,
        role: role,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };
      
      console.log('📋 Datos a crear en Firestore:', userData);
      await setDoc(userDocRef, userData);
      console.log('✅ Usuario creado exitosamente en Firestore');
      
      // Verificación inmediata
      const verifyDoc = await getDoc(userDocRef);
      if (verifyDoc.exists()) {
        console.log('✅ Verificación: Usuario existe en Firestore después de crear');
      } else {
        console.error('❌ ERROR: Usuario no existe después de crear - posible problema de reglas');
      }
    } else {
      console.log('🔄 Actualizando usuario existente en Firestore...');
      await updateDoc(userDocRef, {
        lastLogin: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      console.log('✅ Usuario actualizado en Firestore');
    }
  } catch (e) {
    console.error('🔥 ERROR CRÍTICO en syncUserToFirestore:');
    console.error('  Error:', e.code, e.message);
    console.error('  UID:', user.uid);
    console.error('  Posibles causas:');
    console.error('    1. Reglas de seguridad de Firestore bloquean la escritura');
    console.error('    2. El usuario no tiene permisos para este documento');
    console.error('    3. Problema de conectividad con Firestore');
    
    // Intentar diagnóstico adicional
    try {
      console.log('🔍 Intentando leer el documento para diagnóstico...');
      const testDoc = await getDoc(doc(db, "users", user.uid));
      console.log('📖 Resultado de lectura de prueba:', testDoc.exists() ? 'EXISTS' : 'NOT EXISTS');
    } catch (readErr) {
      console.error('❌ Error al intentar leer para diagnóstico:', readErr.code, readErr.message);
    }
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

      console.log('🔍 Rol seleccionado para login con Google:', window.selectedLoginRole);

      try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        const userData = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email.split('@')[0],
          photoURL: user.photoURL,
          role: window.selectedLoginRole || 'student' // Usar rol seleccionado o estudiante por defecto
        };
        lsSetUser(userData);
        await syncUserToFirestore(user, window.selectedLoginRole || 'student');
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
      const role = document.getElementById("regRole").value;
      const msg = document.getElementById("authRegisterMessage");
      const btn = registerForm.querySelector("button[type='submit']");
      if (msg) { msg.textContent = "Creando cuenta..."; msg.style.color = "#ffd700"; }
      if (btn) btn.disabled = true;
      try {
        await window.authRegister(name, username, pass, role);
        if (msg) { msg.textContent = "Cuenta creada con éxito."; msg.style.color = "#4CAF50"; }
        setTimeout(() => { showMenu(); if (btn) btn.disabled = false; }, 500);
      } catch (err) {
        if (msg) { msg.textContent = getFriendlyError(err); msg.style.color = "#ff4444"; }
        if (btn) btn.disabled = false;
      }
    };
  }

  // Event listeners para botones del menú
  const leaderboardBtn = document.getElementById("leaderboardButton");
  if (leaderboardBtn) {
    leaderboardBtn.addEventListener("click", () => {
      if (typeof window.showLeaderboard === "function") {
        window.showLeaderboard();
      }
    });
  }

  const teacherPanelBtn = document.getElementById("teacherPanelButton");
  if (teacherPanelBtn) {
    teacherPanelBtn.addEventListener("click", () => {
      if (window.isTeacher && window.isTeacher()) {
        // Ocultar el juego y mostrar el panel docente
        const gameContainer = document.getElementById("game-container");
        const menu = document.getElementById("menu");

        if (gameContainer) gameContainer.style.display = "none";
        if (menu) menu.style.display = "none";

        // Redirigir al panel docente en la misma ventana y limpiar modo juego
        sessionStorage.removeItem('teacher_mode');
        window.location.href = 'teacher-panel.html';
      } else {
        alert('No tienes permisos para acceder al panel docente.');
      }
    });
  }
};

// Iniciar handlers
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => window.__authHandlersInit());
} else {
  window.__authHandlersInit();
}
