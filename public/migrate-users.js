// Script de migración para actualizar estructura de usuarios existentes
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

const db = window.firebaseDB;

// Función para migrar usuarios existentes a la nueva estructura
async function migrateUsers() {
    try {
        console.log('🔄 Iniciando migración de usuarios...');
        
        // Obtener todos los usuarios existentes
        const usersRef = collection(db, 'users');
        const snapshot = await getDocs(usersRef);
        const users = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        console.log(`📊 Encontrados ${users.length} usuarios para migrar`);

        let migratedCount = 0;
        let skippedCount = 0;

        // Procesar cada usuario
        for (const user of users) {
            try {
                // Verificar si ya tiene la nueva estructura
                if (user.courses && user.enrolledCourses) {
                    console.log(`⏭️ Usuario ${user.email} ya tiene estructura nueva, omitiendo...`);
                    skippedCount++;
                    continue;
                }

                // Preparar datos de migración
                const updateData = {
                    courses: user.role === 'teacher' ? [] : null, // Los docentes tendrán que crear sus cursos
                    enrolledCourses: user.role === 'student' ? [] : null, // Los estudiantes tendrán que inscribirse manualmente
                    migratedAt: serverTimestamp(),
                    migrationVersion: '1.0'
                };

                // Actualizar usuario
                const userRef = doc(db, 'users', user.id);
                await updateDoc(userRef, updateData);

                console.log(`✅ Usuario migrado: ${user.email} (${user.role})`);
                migratedCount++;

            } catch (error) {
                console.error(`❌ Error migrando usuario ${user.email}:`, error);
            }
        }

        console.log(`🎉 Migración completada:`);
        console.log(`   ✅ Usuarios migrados: ${migratedCount}`);
        console.log(`   ⏭️ Usuarios omitidos (ya migrados): ${skippedCount}`);
        console.log(`   📊 Total procesados: ${migratedCount + skippedCount}`);

        // Mostrar resumen en la interfaz
        showMigrationResults(migratedCount, skippedCount, users.length);

    } catch (error) {
        console.error('❌ Error en migración:', error);
        alert('Error en la migración: ' + error.message);
    }
}

// Función para mostrar resultados de la migración
function showMigrationResults(migrated, skipped, total) {
    const resultsDiv = document.createElement('div');
    resultsDiv.id = 'migration-results';
    resultsDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #2c3e50;
        color: white;
        padding: 30px;
        border-radius: 15px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        z-index: 10000;
        max-width: 500px;
        text-align: center;
        font-family: 'Segoe UI', sans-serif;
    `;

    resultsDiv.innerHTML = `
        <h2 style="margin: 0 0 20px 0; color: #3498db;">🎉 Migración Completada</h2>
        <div style="margin-bottom: 20px;">
            <p><strong>📊 Total de usuarios:</strong> ${total}</p>
            <p><strong>✅ Migrados exitosamente:</strong> ${migrated}</p>
            <p><strong>⏭️ Omitidos (ya migrados):</strong> ${skipped}</p>
        </div>
        <div style="margin-top: 20px;">
            <p style="color: #bdc3c7; font-size: 0.9em;">
                La estructura de usuarios ha sido actualizada para soportar el nuevo sistema de cursos.
                Los docentes ahora pueden crear cursos y los estudiantes pueden inscribirse con códigos.
            </p>
        </div>
        <button onclick="this.parentElement.remove()" style="
            background: #3498db;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            margin-top: 20px;
        ">Cerrar</button>
    `;

    document.body.appendChild(resultsDiv);

    // Auto-eliminar después de 10 segundos
    setTimeout(() => {
        const results = document.getElementById('migration-results');
        if (results) {
            results.remove();
        }
    }, 10000);
}

// Función para crear cursos de ejemplo para docentes existentes
async function createSampleCourses() {
    try {
        console.log('🎓 Creando cursos de ejemplo para docentes existentes...');
        
        // Obtener todos los usuarios con rol de docente
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('role', '==', 'teacher'));
        const snapshot = await getDocs(q);
        const teachers = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        console.log(`👨‍🏫 Encontrados ${teachers.length} docentes`);

        let coursesCreated = 0;

        for (const teacher of teachers) {
            try {
                // Verificar si ya tiene cursos
                if (teacher.courses && teacher.courses.length > 0) {
                    console.log(`⏭️ Docente ${teacher.email} ya tiene cursos, omitiendo...`);
                    continue;
                }

                // Crear un curso de ejemplo
                const sampleCourse = {
                    name: 'Curso de Ejemplo',
                    description: 'Curso creado automáticamente durante la migración. Puedes editarlo o eliminarlo.',
                    category: 'general',
                    difficulty: 'medio',
                    maxStudents: 30,
                    allowStudentRegistration: true
                };

                const courseRef = await window.createCourse(sampleCourse);
                console.log(`✅ Curso creado para ${teacher.email}: ${courseRef.code}`);

                // Agregar el curso a la lista del docente
                const userRef = doc(db, 'users', teacher.id);
                await updateDoc(userRef, {
                    courses: [courseRef.id]
                });

                coursesCreated++;

            } catch (error) {
                console.error(`❌ Error creando curso para ${teacher.email}:`, error);
            }
        }

        console.log(`🎉 Cursos de ejemplo creados: ${coursesCreated}`);

    } catch (error) {
        console.error('❌ Error creando cursos de ejemplo:', error);
    }
}

// Función principal de migración
async function runMigration() {
    console.log('🚀 Iniciando sistema de migración...');
    
    // Mostrar interfaz de progreso
    const progressDiv = document.createElement('div');
    progressDiv.id = 'migration-progress';
    progressDiv.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        font-family: 'Segoe UI', sans-serif;
    `;

    progressDiv.innerHTML = `
        <div style="
            background: white;
            padding: 40px;
            border-radius: 15px;
            text-align: center;
            max-width: 400px;
        ">
            <h2 style="margin: 0 0 20px 0; color: #2c3e50;">🔄 Migrando Sistema</h2>
            <p style="color: #666; margin-bottom: 20px;">Actualizando la estructura de usuarios para soportar cursos...</p>
            <div style="
                width: 100%;
                height: 20px;
                background: #f0f0f0;
                border-radius: 10px;
                overflow: hidden;
                margin-bottom: 20px;
            ">
                <div style="
                    width: 0%;
                    height: 100%;
                    background: linear-gradient(90deg, #3498db, #2c3e50);
                    border-radius: 10px;
                    animation: progress 2s ease-in-out infinite;
                "></div>
            </div>
            <p style="color: #999; font-size: 0.9em;">Por favor, espera un momento...</p>
        </div>
    `;

    document.body.appendChild(progressDiv);

    // Agregar animación CSS
    const style = document.createElement('style');
    style.textContent = `
        @keyframes progress {
            0% { width: 0%; }
            50% { width: 70%; }
            100% { width: 100%; }
        }
    `;
    document.head.appendChild(style);

    try {
        // Ejecutar migración
        await migrateUsers();
        
        // Crear cursos de ejemplo
        await createSampleCourses();
        
        // Eliminar pantalla de progreso
        setTimeout(() => {
            const progress = document.getElementById('migration-progress');
            if (progress) {
                progress.remove();
            }
        }, 2000);

    } catch (error) {
        console.error('❌ Error en migración:', error);
        
        // Eliminar pantalla de progreso y mostrar error
        const progress = document.getElementById('migration-progress');
        if (progress) {
            progress.remove();
        }
        
        alert('Error en la migración: ' + error.message);
    }
}

// Exponer función globalmente
window.runMigration = runMigration;

console.log('✅ Script de migración cargado');
console.log('ℹ️ Para ejecutar la migración, llama a: runMigration()');
