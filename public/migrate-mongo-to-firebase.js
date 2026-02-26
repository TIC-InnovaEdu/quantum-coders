// Script para migrar preguntas de MongoDB a Firebase
// Este script intentará extraer preguntas de la versión alternativa y migrarlas

async function migrateMongoToFirebase() {
    console.log('🔄 Iniciando migración de MongoDB a Firebase...');
    
    try {
        // Intentar conectar con el backend de la versión alternativa
        const mongoQuestions = await fetchMongoQuestions();
        
        if (mongoQuestions && mongoQuestions.length > 0) {
            console.log(`📊 Encontradas ${mongoQuestions.length} preguntas en MongoDB`);
            await migrateQuestions(mongoQuestions);
        } else {
            console.log('⚠️ No se encontraron preguntas en MongoDB, cargando preguntas por defecto...');
            await loadDefaultQuestions();
        }
        
    } catch (error) {
        console.error('❌ Error en migración:', error);
        console.log('🔄 Cargando preguntas por defecto...');
        await loadDefaultQuestions();
    }
}

async function fetchMongoQuestions() {
    try {
        // Intentar obtener preguntas del backend MongoDB
        const response = await fetch('/api/pregunta', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            return data.data || data || [];
        }
        
        return null;
    } catch (error) {
        console.log('📡 No se pudo conectar con backend MongoDB:', error.message);
        return null;
    }
}

async function migrateQuestions(questions) {
    console.log(`📦 Migrando ${questions.length} preguntas a Firebase...`);
    
    let migrated = 0;
    let errors = 0;
    
    for (let i = 0; i < questions.length; i++) {
        const mongoQuestion = questions[i];
        
        try {
            // Convertir formato MongoDB a formato Firebase
            const firebaseQuestion = convertMongoToFirebase(mongoQuestion);
            
            // Validar y crear pregunta
            await window.createQuestion(firebaseQuestion);
            migrated++;
            
            console.log(`✅ Pregunta ${i + 1}/${questions.length} migrada: ${firebaseQuestion.categoria}`);
            
        } catch (error) {
            errors++;
            console.error(`❌ Error migrando pregunta ${i + 1}:`, error);
        }
    }
    
    console.log(`🎉 Migración completada: ${migrated} exitosas, ${errors} errores`);
    
    // Verificar resultado
    const result = await window.verifyQuestionsLoaded();
    console.log('📊 Estado final:', result);
    
    return { migrated, errors, total: questions.length };
}

function convertMongoToFirebase(mongoQuestion) {
    // Convertir del formato MongoDB al formato Firebase
    return {
        enunciado: mongoQuestion.enunciado || mongoQuestion.texto || mongoQuestion.pregunta || 'Pregunta sin enunciado',
        opciones: Array.isArray(mongoQuestion.opciones) ? mongoQuestion.opciones : [
            'Opción 1', 'Opción 2', 'Opción 3', 'Opción 4'
        ],
        correcta: typeof mongoQuestion.correcta === 'number' ? mongoQuestion.correcta : 0,
        categoria: mongoQuestion.categoria || 'historia',
        dificultad: mongoQuestion.dificultad || 'medium',
        puntos: typeof mongoQuestion.puntos === 'number' ? mongoQuestion.puntos : 10,
        explicacion: mongoQuestion.explicacion || mongoQuestion.explicacion || 'Explicación no disponible',
        activa: mongoQuestion.activa !== false, // Por defecto activa
        createdBy: window.getCurrentUser()?.uid || 'system_migration',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
}

async function loadDefaultQuestions() {
    console.log('📚 Cargando preguntas por defecto validadas...');
    
    // Preguntas mejoradas basadas en el contexto del juego
    const defaultQuestions = [
        // HISTORIA - Tahuantinsuyo (preguntas mejoradas)
        {
            enunciado: "¿En qué año comenzó la invasión española al Tahuantinsuyo?",
            opciones: ["1492", "1532", "1822", "1555"],
            correcta: 1,
            categoria: "historia",
            dificultad: "medium",
            puntos: 10,
            explicacion: "La invasión española comenzó en 1532 con la llegada de Francisco Pizarro a Cajamarca."
        },
        {
            enunciado: "¿Cuál era la capital del Tahuantinsuyo?",
            opciones: ["Cuzco", "Lima", "Quito", "Bogotá"],
            correcta: 0,
            categoria: "historia",
            dificultad: "easy",
            puntos: 5,
            explicacion: "Cuzco era la capital del Imperio Inca y el centro político del Tahuantinsuyo."
        },
        {
            enunciado: "¿Qué significa la palabra 'Tahuantinsuyo' en quechua?",
            opciones: ["Cuatro partes juntas", "Tierra del sol", "Imperio dorado", "Montaña sagrada"],
            correcta: 0,
            categoria: "historia",
            dificultad: "medium",
            puntos: 15,
            explicacion: "Tahuantinsuyo significa 'las cuatro regiones' o 'las cuatro partes unidas', representando los cuatro suyus."
        },
        {
            enunciado: "¿Quién era el emperador inca cuando llegaron los españoles?",
            opciones: ["Atahualpa", "Huayna Cápac", "Pachacútec", "Manco Cápac"],
            correcta: 0,
            categoria: "historia",
            dificultad: "medium",
            puntos: 10,
            explicacion: "Atahualpa era el Sapa Inca gobernante cuando Francisco Pizarro llegó al imperio en 1532."
        },
        {
            enunciado: "¿Qué cultura habitaba el territorio del actual Ecuador antes de la invasión española?",
            opciones: ["Culturas preincaicas e incaicas", "Cultura azteca", "Cultura maya", "Cultura chimú"],
            correcta: 0,
            categoria: "historia",
            dificultad: "easy",
            puntos: 5,
            explicacion: "El territorio ecuatoriano estaba habitado por diversas culturas preincaicas que luego fueron integradas al Tahuantinsuyo."
        },
        
        // CIENCIAS - Conocimientos andinos
        {
            enunciado: "¿Qué sistema de agricultura en terrazas utilizaban los incas?",
            opciones: ["Andenes", "Chacras", "Milpas", "Rice paddies"],
            correcta: 0,
            categoria: "ciencias",
            dificultad: "easy",
            puntos: 5,
            explicacion: "Los andenes eran terrazas agrícolas construidas en las laderas de montañas para maximizar el cultivo."
        },
        {
            enunciado: "¿Qué animal era fundamental para el transporte en el Tahuantinsuyo?",
            opciones: ["Llama", "Caballo", "Perro", "Águila"],
            correcta: 0,
            categoria: "ciencias",
            dificultad: "easy",
            puntos: 5,
            explicacion: "La llama era el principal animal de carga, usado para transportar bienes y comunicarse a través del Qhapaq Ñan."
        },
        {
            enunciado: "¿Qué técnica usaban los incas para conservar alimentos a largo plazo?",
            opciones: ["Deshidratación", "Congelación", "Salazón", "Ahumado"],
            correcta: 0,
            categoria: "ciencias",
            dificultad: "medium",
            puntos: 10,
            explicacion: "La deshidratación era usada para crear chuño (papa) y other alimentos conservados que podían durar años."
        },
        {
            enunciado: "¿Qué sistema de caminos construyeron los incas?",
            opciones: ["Qhapaq Ñan", "Camino Real", "Ruta de la Seda", "Camino Inca"],
            correcta: 0,
            categoria: "ciencias",
            dificultad: "medium",
            puntos: 10,
            explicacion: "El Qhapaq Ñan era el extenso sistema de caminos que unía todo el imperio, con más de 30,000 kilómetros."
        },
        
        // MATEMÁTICAS - Sistema numérico inca
        {
            enunciado: "¿Qué sistema numérico utilizaban los incas?",
            opciones: ["Decimal", "Vigesimal", "Duodecimal", "Cuaternario"],
            correcta: 0,
            categoria: "matematicas",
            dificultad: "medium",
            puntos: 15,
            explicacion: "Los incas usaban un sistema decimal basado en grupos de diez, similar al que usamos actualmente."
        },
        {
            enunciado: "¿Qué instrumento usaban los incas para registrar datos numéricos?",
            opciones: ["Quipu", "Ábaco", "Papel", "Tablas de madera"],
            correcta: 0,
            categoria: "matematicas",
            dificultad: "medium",
            puntos: 10,
            explicacion: "El quipu era un sistema de cuerdas con nudos de diferentes colores y posiciones para registrar información."
        },
        {
            enunciado: "Si un quipu tiene 3 grupos de 10 nudos cada uno, ¿qué número representa?",
            opciones: ["30", "13", "100", "3"],
            correcta: 0,
            categoria: "matematicas",
            dificultad: "easy",
            puntos: 5,
            explicacion: "En el sistema decimal, 3 grupos de 10 nudos representan 30 (3 × 10 = 30)."
        },
        {
            enunciado: "¿Qué forma geométrica era sagrada para los incas?",
            opciones: ["Chakana", "Círculo", "Triángulo", "Cuadrado"],
            correcta: 0,
            categoria: "matematicas",
            dificultad: "hard",
            puntos: 20,
            explicacion: "La Chakana o cruz andina representaba el cosmos y los conceptos filosóficos del mundo andino."
        },
        
        // LENGUAJE - Quechua y comunicación
        {
            enunciado: "¿Qué era el quechua en el Tahuantinsuyo?",
            opciones: ["Lengua oficial del imperio", "Dios principal", "Ritual sagrado", "Instrumento musical"],
            correcta: 0,
            categoria: "lenguaje",
            dificultad: "easy",
            puntos: 5,
            explicacion: "El quechua (runa simi) era la lengua oficial usada en todo el imperio para la administración y comunicación."
        },
        {
            enunciado: "¿Cómo se llamaba el sistema de 'escritura' inca basado en cuerdas?",
            opciones: ["Quipu", "Jeroglíficos", "Alfabeto runas", "Escritura cuneiforme"],
            correcta: 0,
            categoria: "lenguaje",
            dificultad: "medium",
            puntos: 10,
            explicacion: "El quipu era un sistema de registro con cuerdas y nudos que servía como 'escritura' para contabilidad y memoria."
        },
        {
            enunciado: "¿Qué significa 'Ayllu' en quechua?",
            opciones: ["Comunidad familiar", "Montaña sagrada", "Río sagrado", "Dios del sol"],
            correcta: 0,
            categoria: "lenguaje",
            dificultad: "easy",
            puntos: 5,
            explicacion: "Ayllu era la unidad básica de organización social, una comunidad familiar con tierras y responsabilidades compartidas."
        },
        {
            enunciado: "¿Qué significa 'Inti' en la cultura inca?",
            opciones: ["Sol", "Tierra", "Agua", "Viento"],
            correcta: 0,
            categoria: "lenguaje",
            dificultad: "easy",
            puntos: 5,
            explicacion: "Inti era el dios del sol, la deidad principal del panteón inca y padre del primer inca."
        },
        
        // RUNAS - Preguntas especiales del juego
        {
            enunciado: "¿Qué representa la runa que acabas de coleccionar?",
            opciones: ["Sabiduría ancestral", "Poder del sol", "Fuerza terrenal", "Espíritu acuático"],
            correcta: 0,
            categoria: "runas",
            dificultad: "medium",
            puntos: 10,
            explicacion: "Las runas representan fragmentos de sabiduría ancestral transmitida a través de generaciones."
        },
        {
            enunciado: "¿Qué poder otorga la runa dorada del Tahuantinsuyo?",
            opciones: ["Protección espiritual", "Fuerza física", "Velocidad sobrenatural", "Invisibilidad temporal"],
            correcta: 0,
            categoria: "runas",
            dificultad: "medium",
            puntos: 15,
            explicacion: "La runa dorada otorga protección espiritual y conexión con los dioses del panteón andino."
        },
        {
            enunciado: "¿Quién puede activar el poder de las runas ancestrales?",
            opciones: ["Los puros de corazón", "Guerreros fuertes", "Sabios ancianos", "Cualquier persona"],
            correcta: 0,
            categoria: "runas",
            dificultad: "hard",
            puntos: 20,
            explicacion: "Solo aquellos con corazón puro y espíritu noble pueden activar el verdadero poder de las runas."
        },
        {
            enunciado: "¿Qué elemento natural está asociado a la runa de la sabiduría?",
            opciones: ["Tierra", "Agua", "Fuego", "Aire"],
            correcta: 0,
            categoria: "runas",
            dificultad: "medium",
            puntos: 10,
            explicacion: "La runa de la sabiduría está conectada con la tierra, fuente de conocimiento ancestral y estabilidad."
        },
        {
            enunciado: "¿Qué debes hacer para obtener el poder de una runa?",
            opciones: ["Responder correctamente su pregunta", "Vencer al guardián", "Ofrecer un sacrificio", "Recitar un hechizo"],
            correcta: 0,
            categoria: "runas",
            dificultad: "easy",
            puntos: 5,
            explicacion: "Las runas solo entregan su poder a quienes demuestran su sabiduría respondiendo correctamente sus preguntas."
        }
    ];
    
    let loaded = 0;
    let errors = 0;
    
    for (let i = 0; i < defaultQuestions.length; i++) {
        try {
            await window.createQuestion(defaultQuestions[i]);
            loaded++;
            console.log(`✅ Pregunta por defecto ${i + 1}/${defaultQuestions.length} cargada: ${defaultQuestions[i].categoria}`);
        } catch (error) {
            errors++;
            console.error(`❌ Error cargando pregunta por defecto ${i + 1}:`, error);
        }
    }
    
    console.log(`🎉 Carga completada: ${loaded} exitosas, ${errors} errores`);
    
    // Verificar resultado final
    const result = await window.verifyQuestionsLoaded();
    console.log('📊 Estado final:', result);
    
    return { loaded, errors, total: defaultQuestions.length };
}

// Función para verificar si ya hay preguntas cargadas
async function checkIfQuestionsExist() {
    try {
        const questions = await window.getQuestions();
        return questions && questions.length > 0;
    } catch (error) {
        return false;
    }
}

// Función principal de migración
async function performMigration() {
    console.log('🚀 Iniciando proceso de migración...');
    
    // Verificar si ya hay preguntas
    const questionsExist = await checkIfQuestionsExist();
    
    if (questionsExist) {
        const currentQuestions = await window.getQuestions();
        console.log(`⚠️ Ya existen ${currentQuestions.length} preguntas en Firebase`);
        
        const shouldContinue = confirm('¿Desea continuar y agregar más preguntas? (Esto duplicará las existentes)');
        if (!shouldContinue) {
            console.log('❌ Migración cancelada por el usuario');
            return;
        }
    }
    
    // Ejecutar migración
    await migrateMongoToFirebase();
    
    console.log('🎉 Proceso de migración completado');
    alert('Migración completada. Revisa la consola para detalles.');
}

// Hacer funciones globales
window.migrateMongoToFirebase = migrateMongoToFirebase;
window.performMigration = performMigration;
window.checkIfQuestionsExist = checkIfQuestionsExist;

console.log('🔄 Script de migración MongoDB a Firebase cargado');
console.log('📖 Ejecuta performMigration() para iniciar la migración automática');
