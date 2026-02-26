// Script para cargar preguntas iniciales en Firebase
// Ejecutar en la consola del navegador después de iniciar sesión

async function loadInitialQuestions() {
    const questions = [
        // Historia - Tahuantinsuyo
        {
            enunciado: "¿En qué año comenzó la invasión española al Tahuantinsuyo?",
            opciones: ["1492", "1532", "1822", "1555"],
            correcta: 1,
            categoria: "historia",
            dificultad: "medium",
            puntos: 10,
            explicacion: "La invasión española comenzó en 1532 con la llegada de Francisco Pizarro y sus hombres."
        },
        {
            enunciado: "¿Cuál era la capital del Tahuantinsuyo?",
            opciones: ["Cuzco", "Lima", "Quito", "Bogotá"],
            correcta: 0,
            categoria: "historia",
            dificultad: "easy",
            puntos: 5,
            explicacion: "Cuzco era la capital del Imperio Inca y el centro del Tahuantinsuyo."
        },
        {
            enunciado: "¿Qué significa la palabra 'Tahuantinsuyo'?",
            opciones: ["Cuatro partes", "Tierra del sol", "Imperio dorado", "Montaña sagrada"],
            correcta: 0,
            categoria: "historia",
            dificultad: "medium",
            puntos: 15,
            explicacion: "Tahuantinsuyo significa 'las cuatro regiones' o 'las cuatro partes', representando los cuatro suyus del imperio."
        },
        {
            enunciado: "¿Quién era el emperador inca cuando llegaron los españoles?",
            opciones: ["Atahualpa", "Huayna Cápac", "Pachacútec", "Manco Cápac"],
            correcta: 0,
            categoria: "historia",
            dificultad: "medium",
            puntos: 10,
            explicacion: "Atahualpa era el emperador inca en el momento de la llegada de los españoles."
        },
        
        // Ciencias
        {
            enunciado: "¿Qué sistema de agricultura utilizaban los incas para cultivos en montañas?",
            opciones: ["Terrazas o andenes", "Riego por goteo", "Hidroponía", "Quema y roza"],
            correcta: 0,
            categoria: "ciencias",
            dificultad: "easy",
            puntos: 5,
            explicacion: "Los incas usaban terrazas o andenes para cultivar en las laderas de las montañas."
        },
        {
            enunciado: "¿Qué animal era fundamental para el transporte en el Tahuantinsuyo?",
            opciones: ["Llama", "Caballo", "Perro", "Águila"],
            correcta: 0,
            categoria: "ciencias",
            dificultad: "easy",
            puntos: 5,
            explicacion: "La llama era el animal principal para transporte y carga en el imperio inca."
        },
        {
            enunciado: "¿Qué técnica usaban los incas para conservar alimentos?",
            opciones: ["Deshidratación", "Congelación", "Salazón", "Ahumado"],
            correcta: 0,
            categoria: "ciencias",
            dificultad: "medium",
            puntos: 10,
            explicacion: "Los incas usaban técnicas de deshidratación para crear chuño y otros alimentos conservados."
        },
        
        // Matemáticas
        {
            enunciado: "¿Qué sistema numérico utilizaban los incas?",
            opciones: ["Decimal", "Vigesimal", "Duodecimal", "Cuaternario"],
            correcta: 0,
            categoria: "matematicas",
            dificultad: "medium",
            puntos: 15,
            explicacion: "Los incas usaban un sistema decimal basado en grupos de diez."
        },
        {
            enunciado: "¿Qué instrumento usaban los incas para registrar datos numéricos?",
            opciones: ["Quipu", "Ábaco", "Papel", "Tablas de madera"],
            correcta: 0,
            categoria: "matematicas",
            dificultad: "medium",
            puntos: 10,
            explicacion: "El quipu era un sistema de cuerdas con nudos usado para registrar información numérica."
        },
        {
            enunciado: "Si un quipu tiene 3 grupos de 10 nudos cada uno, ¿qué número representa?",
            opciones: ["30", "13", "100", "3"],
            correcta: 0,
            categoria: "matematicas",
            dificultad: "easy",
            puntos: 5,
            explicacion: "3 grupos de 10 nudos cada uno representa 30 en el sistema decimal."
        },
        
        // Lenguaje
        {
            enunciado: "¿Qué era el quechua en el Tahuantinsuyo?",
            opciones: ["Lengua oficial", "Dios principal", "Ritual sagrado", "Instrumento musical"],
            correcta: 0,
            categoria: "lenguaje",
            dificultad: "easy",
            puntos: 5,
            explicacion: "El quechua era la lengua oficial del Imperio Inca."
        },
        {
            enunciado: "¿Cómo se llamaba el sistema de escritura inca?",
            opciones: ["No tenían escritura alfabética", "Jeroglíficos", "Alfabeto runas", "Escritura cuneiforme"],
            correcta: 0,
            categoria: "lenguaje",
            dificultad: "medium",
            puntos: 10,
            explicacion: "Los incas no desarrollaron escritura alfabética, usaban quipus y transmisión oral."
        },
        {
            enunciado: "¿Qué significa 'Ayllu' en quechua?",
            opciones: ["Comunidad", "Montaña", "Río", "Sol"],
            correcta: 0,
            categoria: "lenguaje",
            dificultad: "easy",
            puntos: 5,
            explicacion: "Ayllu significa comunidad o grupo familiar en la cultura quechua."
        },
        
        // Runas - preguntas especiales para el juego
        {
            enunciado: "¿Qué representa la runa que acabas de coleccionar?",
            opciones: ["El poder del sol", "La sabiduría ancestral", "La fuerza de la tierra", "El espíritu del agua"],
            correcta: 1,
            categoria: "runas",
            dificultad: "medium",
            puntos: 10,
            explicacion: "Las runas representan la sabiduría ancestral transmitida por generaciones."
        },
        {
            enunciado: "¿Qué poder otorga la runa dorada del Tahuantinsuyo?",
            opciones: ["Protección espiritual", "Fuerza física", "Velocidad", "Invisibilidad"],
            correcta: 0,
            categoria: "runas",
            dificultad: "medium",
            puntos: 15,
            explicacion: "La runa dorada otorga protección espiritual y conexión con los dioses."
        },
        {
            enunciado: "¿Quién puede activar el poder de las runas ancestrales?",
            opciones: ["Solo los puros de corazón", "Los guerreros fuertes", "Los sabios ancianos", "Cualquier persona"],
            correcta: 0,
            categoria: "runas",
            dificultad: "hard",
            puntos: 20,
            explicacion: "Solo aquellos con corazón puro y espíritu noble pueden activar el poder de las runas."
        },
        {
            enunciado: "¿Qué elemento natural está asociado a la runa de la sabiduría?",
            opciones: ["Agua", "Fuego", "Tierra", "Aire"],
            correcta: 2,
            categoria: "runas",
            dificultad: "medium",
            puntos: 10,
            explicacion: "La runa de la sabiduría está conectada con la tierra, fuente de conocimiento ancestral."
        }
    ];
    
    console.log(`Cargando ${questions.length} preguntas iniciales...`);
    
    try {
        for (let i = 0; i < questions.length; i++) {
            const question = questions[i];
            await window.createQuestion(question);
            console.log(`✅ Pregunta ${i + 1}/${questions.length} cargada: ${question.categoria}`);
        }
        
        console.log('🎉 Todas las preguntas iniciales han sido cargadas exitosamente');
        alert('Preguntas iniciales cargadas correctamente');
        
    } catch (error) {
        console.error('❌ Error cargando preguntas:', error);
        alert('Error al cargar preguntas: ' + error.message);
    }
}

// Función para verificar preguntas cargadas
async function verifyQuestionsLoaded() {
    try {
        const questions = await window.getQuestions();
        console.log(`📊 Total de preguntas en la base de datos: ${questions.length}`);
        
        const byCategory = {};
        questions.forEach(q => {
            byCategory[q.categoria] = (byCategory[q.categoria] || 0) + 1;
        });
        
        console.log('📈 Preguntas por categoría:', byCategory);
        return { total: questions.length, byCategory };
        
    } catch (error) {
        console.error('Error verificando preguntas:', error);
        return null;
    }
}

// Hacer funciones globales
window.loadInitialQuestions = loadInitialQuestions;
window.verifyQuestionsLoaded = verifyQuestionsLoaded;

console.log('🚀 Script de preguntas iniciales cargado. Ejecuta loadInitialQuestions() para comenzar');
