// Módulo de gestión de preguntas para Runa Pachawan
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  query,
  orderBy,
  limit,
  where,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

const db = window.firebaseDB;

// Clase para gestionar preguntas
class QuestionsManager {
  constructor() {
    this.collection = 'questions';
    this.categoriesCollection = 'categories';
  }

  // Obtener todas las preguntas activas (con filtro de curso opcional)
  async getAllQuestions(activeOnly = true, courseId = null) {
    try {
      let q = query(collection(db, this.collection));

      if (courseId) {
        q = query(q, where('courseId', '==', courseId));
      }

      if (activeOnly) {
        q = query(q, where('activa', '==', true));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error obteniendo preguntas:', error);
      throw error;
    }
  }

  // Obtener preguntas por categoría y curso
  async getQuestionsByCategory(category, activeOnly = true, courseId = null) {
    try {
      let q = query(
        collection(db, this.collection),
        where('categoria', '==', category)
      );

      if (courseId) {
        q = query(q, where('courseId', '==', courseId));
      }

      if (activeOnly) {
        q = query(q, where('activa', '==', true));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error obteniendo preguntas por categoría:', error);
      throw error;
    }
  }

  // Obtener preguntas por curso
  async getQuestionsByCourse(courseId, activeOnly = true) {
    try {
      let q = query(
        collection(db, this.collection),
        where('courseId', '==', courseId)
      );

      if (activeOnly) {
        q = query(q, where('activa', '==', true));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error obteniendo preguntas por curso:', error);
      throw error;
    }
  }

  // Obtener pregunta aleatoria para un curso
  async getRandomQuestion(courseId, category = null) {
    try {
      let q = query(collection(db, this.collection), where('activa', '==', true));

      if (courseId) {
        q = query(q, where('courseId', '==', courseId));
      }

      if (category) {
        q = query(q, where('categoria', '==', category));
      }

      const snapshot = await getDocs(q);
      const questions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      if (questions.length === 0) {
        return null;
      }

      const randomIndex = Math.floor(Math.random() * questions.length);
      return questions[randomIndex];
    } catch (error) {
      console.error('Error obteniendo pregunta aleatoria:', error);
      throw error;
    }
  }

  /**
   * Obtener preguntas aleatorias
   * @param {number} count - Cantidad de preguntas
   * @param {string} courseId - ID del curso (opcional)
   * @param {string} category - Categoría (opcional)
   * @returns {Promise<Array>} - Array de preguntas
   */
  async getRandomQuestions(count = 5, courseId = null, category = null) {
    try {
      let q = query(collection(db, this.collection), where('activa', '==', true));

      if (courseId) {
        q = query(q, where('courseId', '==', courseId));
      }

      if (category) {
        q = query(q, where('categoria', '==', category));
      }

      const snapshot = await getDocs(q);
      const questions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      if (questions.length === 0) {
        return [];
      }

      // Mezclar array y tomar las primeras N preguntas
      const shuffled = [...questions].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, Math.min(count, questions.length));
    } catch (error) {
      console.error('Error obteniendo preguntas aleatorias:', error);
      throw error;
    }
  }

  // Obtener pregunta por ID
  async getQuestionById(id) {
    try {
      const docRef = doc(db, this.collection, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        };
      } else {
        throw new Error('Pregunta no encontrada');
      }
    } catch (error) {
      console.error('Error obteniendo pregunta:', error);
      throw error;
    }
  }

  // Crear nueva pregunta (con soporte para curso)
  async createQuestion(questionData) {
    try {
      // Validar datos
      this.validateQuestionData(questionData);

      const currentUser = window.getCurrentUser();
      if (!currentUser) {
        throw new Error('Usuario no autenticado');
      }

      // Verificar acceso al curso si se especifica (los docentes siempre pueden agregar preguntas)
      if (questionData.courseId && currentUser.role !== 'teacher') {
        if (!window.checkCourseAccess || !window.checkCourseAccess(questionData.courseId, currentUser)) {
          throw new Error('No tienes permisos para agregar preguntas a este curso');
        }
      }

      const question = {
        enunciado: questionData.enunciado,
        categoria: questionData.categoria || 'general',
        dificultad: questionData.dificultad || 'medio',
        puntos: questionData.puntos || 10,
        opciones: questionData.opciones,
        correcta: questionData.correcta,
        explicacion: questionData.explicacion || null,
        activa: questionData.activa !== false,
        courseId: questionData.courseId || null, // ← NUEVO: Asociación a curso
        teacherId: currentUser.uid, // ← NUEVO: Dueño de la pregunta
        teacherName: currentUser.displayName,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, this.collection), question);

      // Actualizar estadísticas del curso si aplica
      if (questionData.courseId) {
        await this.updateCourseQuestionCount(questionData.courseId, 1);
      }

      return {
        id: docRef.id,
        ...question
      };
    } catch (error) {
      console.error('Error creando pregunta:', error);
      throw error;
    }
  }

  // Actualizar pregunta
  async updateQuestion(id, questionData) {
    try {
      // Validar datos
      this.validateQuestionData(questionData);

      const currentUser = window.getCurrentUser();
      if (!currentUser) {
        throw new Error('Usuario no autenticado');
      }

      // Verificar que el usuario sea el creador o admin
      const existingQuestion = await this.getQuestionById(id);
      if (existingQuestion.teacherId !== currentUser.uid && currentUser.role !== 'admin' && currentUser.role !== 'teacher') {
        throw new Error('No tienes permisos para editar esta pregunta');
      }

      const questionRef = doc(db, this.collection, id);
      await updateDoc(questionRef, {
        ...questionData,
        updatedAt: serverTimestamp()
      });

      return await this.getQuestionById(id);
    } catch (error) {
      console.error('Error actualizando pregunta:', error);
      throw error;
    }
  }

  // Eliminar pregunta (soft delete)
  async deleteQuestion(id) {
    try {
      const currentUser = window.getCurrentUser();
      if (!currentUser) {
        throw new Error('Usuario no autenticado');
      }

      // Verificar permisos
      const existingQuestion = await this.getQuestionById(id);
      if (existingQuestion.teacherId !== currentUser.uid && currentUser.role !== 'admin' && currentUser.role !== 'teacher') {
        throw new Error('No tienes permisos para eliminar esta pregunta');
      }

      const questionRef = doc(db, this.collection, id);
      await updateDoc(questionRef, {
        activa: false,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error eliminando pregunta:', error);
      throw error;
    }
  }



  // Validar datos de pregunta
  validateQuestionData(data) {
    if (!data.enunciado || data.enunciado.trim().length < 10) {
      throw new Error('El enunciado debe tener al menos 10 caracteres');
    }

    if (!data.opciones || !Array.isArray(data.opciones) || data.opciones.length < 3) {
      throw new Error('Debe haber al menos 3 opciones');
    }

    if (typeof data.correcta !== 'number' || isNaN(data.correcta) || data.correcta < 0 || data.correcta >= data.opciones.length) {
      throw new Error('La respuesta correcta no es válida');
    }

    // Categoría: cualquier string no vacío (las categorías son dinámicas)
    if (data.categoria !== undefined && data.categoria !== null && typeof data.categoria === 'string' && data.categoria.trim().length === 0) {
      throw new Error('La categoría no puede estar vacía');
    }

    const validDifficulties = ['facil', 'medio', 'dificil', 'easy', 'medium', 'hard'];
    if (data.dificultad && !validDifficulties.includes(data.dificultad)) {
      throw new Error('Dificultad no válida');
    }

    if (typeof data.puntos !== 'number' || data.puntos <= 0) {
      throw new Error('Los puntos deben ser un número positivo');
    }
  }

  // Obtener preguntas de un docente (por teacherId y curso opcional)
  async getTeacherQuestions(teacherId, courseId = null) {
    try {
      let q;
      if (courseId) {
        q = query(
          collection(db, this.collection),
          where('teacherId', '==', teacherId),
          where('courseId', '==', courseId)
        );
      } else {
        q = query(
          collection(db, this.collection),
          where('teacherId', '==', teacherId)
        );
      }

      const snapshot = await getDocs(q);
      return snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(q => q.activa !== false);
    } catch (error) {
      console.error('Error obteniendo preguntas del docente:', error);
      if (error.message && (error.message.includes('permission-denied') || error.message.includes('not found'))) {
        return [];
      }
      throw error;
    }
  }

  // Actualizar contador de preguntas en un curso
  async updateCourseQuestionCount(courseId, delta) {
    try {
      const courseRef = doc(db, 'courses', courseId);
      const courseSnap = await getDoc(courseRef);
      if (courseSnap.exists()) {
        const stats = courseSnap.data().stats || {};
        await updateDoc(courseRef, {
          'stats.totalQuestions': (stats.totalQuestions || 0) + delta
        });
      }
    } catch (e) {
      console.warn('Error actualizando contador de preguntas del curso:', e);
    }
  }

  // Registrar intento de respuesta
  async recordAttempt(questionId, studentId, selectedAnswer, timeSpent) {
    try {
      const question = await this.getQuestionById(questionId);
      const isCorrect = selectedAnswer === question.correcta;
      const points = isCorrect ? question.puntos : 0;

      const attemptData = {
        questionId,
        studentId,
        respuesta: selectedAnswer,
        correcta: isCorrect,
        tiempoRespuesta: timeSpent,
        puntos: points,
        fecha: new Date().toISOString(),
        sessionId: this.generateSessionId()
      };

      await addDoc(collection(db, 'attempts'), attemptData);

      // Actualizar estadísticas de la pregunta
      await this.updateQuestionStats(questionId, isCorrect, timeSpent);

      return {
        success: true,
        correct: isCorrect,
        points: points,
        explanation: question.explicacion
      };
    } catch (error) {
      console.error('Error registrando intento:', error);
      throw error;
    }
  }

  // Actualizar estadísticas de pregunta
  async updateQuestionStats(questionId, isCorrect, timeSpent) {
    try {
      const questionRef = doc(db, this.collection, questionId);
      const questionSnap = await getDoc(questionRef);

      if (questionSnap.exists()) {
        const question = questionSnap.data();
        const metadata = question.metadata || { timesUsed: 0, correctRate: 0, avgTime: 0 };

        const newTimesUsed = metadata.timesUsed + 1;
        const newCorrectRate = ((metadata.correctRate * metadata.timesUsed) + (isCorrect ? 1 : 0)) / newTimesUsed;
        const newAvgTime = ((metadata.avgTime * metadata.timesUsed) + timeSpent) / newTimesUsed;

        await updateDoc(questionRef, {
          'metadata.timesUsed': newTimesUsed,
          'metadata.correctRate': newCorrectRate,
          'metadata.avgTime': newAvgTime
        });
      }
    } catch (error) {
      console.error('Error actualizando estadísticas:', error);
    }
  }

  // Generar ID de sesión
  generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Obtener categorías disponibles
  async getCategories() {
    try {
      const snapshot = await getDocs(collection(db, this.categoriesCollection));
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error obteniendo categorías:', error);
      // Retornar categorías por defecto si no hay en la BD
      return [
        { id: 'ciencias', nombre: 'Ciencias', color: '#2E7D32' },
        { id: 'matematicas', nombre: 'Matemáticas', color: '#1565C0' },
        { id: 'lenguaje', nombre: 'Lenguaje', color: '#6A1B9A' },
        { id: 'historia', nombre: 'Historia', color: '#B71C1C' },
        { id: 'runas', nombre: 'Runas', color: '#FF6F00' }
      ];
    }
  }

  // Inicializar categorías por defecto
  async initializeCategories() {
    try {
      const defaultCategories = [
        {
          id: 'ciencias',
          nombre: 'Ciencias',
          descripcion: 'Preguntas sobre ciencias naturales y experimentales',
          color: '#2E7D32',
          icono: 'science',
          orden: 1,
          activa: true
        },
        {
          id: 'matematicas',
          nombre: 'Matemáticas',
          descripcion: 'Preguntas sobre conceptos matemáticos y problemas',
          color: '#1565C0',
          icono: 'calculate',
          orden: 2,
          activa: true
        },
        {
          id: 'lenguaje',
          nombre: 'Lenguaje',
          descripcion: 'Preguntas sobre gramática, literatura y comunicación',
          color: '#6A1B9A',
          icono: 'language',
          orden: 3,
          activa: true
        },
        {
          id: 'historia',
          nombre: 'Historia',
          descripcion: 'Preguntas sobre historia universal y local',
          color: '#B71C1C',
          icono: 'history',
          orden: 4,
          activa: true
        },
        {
          id: 'runas',
          nombre: 'Runas',
          descripcion: 'Preguntas especiales para las runas del juego',
          color: '#FF6F00',
          icono: 'auto_stories',
          orden: 5,
          activa: true
        }
      ];

      for (const category of defaultCategories) {
        const categoryRef = doc(db, this.categoriesCollection, category.id);
        const categorySnap = await getDoc(categoryRef);

        if (!categorySnap.exists()) {
          await setDoc(categoryRef, {
            ...category,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        }
      }
    } catch (error) {
      console.error('Error inicializando categorías:', error);
    }
  }
}

// Exportar instancia global
window.questionsManager = new QuestionsManager();

// Funciones de conveniencia para uso global
window.createQuestion = (data) => window.questionsManager.createQuestion(data);
window.updateQuestion = (id, data) => window.questionsManager.updateQuestion(id, data);
window.deleteQuestion = (id) => window.questionsManager.deleteQuestion(id);
window.getQuestions = () => window.questionsManager.getAllQuestions();
window.getQuestionsByCategory = (category) => window.questionsManager.getQuestionsByCategory(category);
window.getTeacherQuestions = (teacherId, courseId) => window.questionsManager.getTeacherQuestions(teacherId, courseId);
window.getRandomQuestions = (count, courseId, category) => window.questionsManager.getRandomQuestions(count, courseId, category);
window.recordAnswer = (questionId, answer, time) => window.questionsManager.recordAttempt(questionId, window.getCurrentUser()?.uid, answer, time);

// ─── Gestión dinámica de categorías ───
window.loadCategories = async function () {
  try {
    const snapshot = await getDocs(collection(db, 'categories'));
    return snapshot.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(c => c.activa !== false)
      .sort((a, b) => (a.orden || 99) - (b.orden || 99));
  } catch (e) {
    console.warn('Error cargando categorías, usando defaults:', e);
    return [
      { id: 'ciencias', nombre: 'Ciencias', icono: '🔬' },
      { id: 'matematicas', nombre: 'Matemáticas', icono: '🔢' },
      { id: 'lenguaje', nombre: 'Lenguaje', icono: '📖' },
      { id: 'historia', nombre: 'Historia', icono: '🏛️' },
      { id: 'runas', nombre: 'Runas', icono: '✨' }
    ];
  }
};

window.addCategory = async function (categoryData) {
  const id = categoryData.id || categoryData.nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_');
  await setDoc(doc(db, 'categories', id), {
    id,
    nombre: categoryData.nombre,
    color: categoryData.color || '#3498db',
    icono: categoryData.icono || '📁',
    orden: categoryData.orden || 99,
    activa: true,
    editable: true,
    createdAt: new Date().toISOString()
  });
  return id;
};

window.removeCategoryById = async function (categoryId) {
  await updateDoc(doc(db, 'categories', categoryId), { activa: false });
};

// Inicializar categorías al cargar
document.addEventListener('DOMContentLoaded', () => {
  window.questionsManager.initializeCategories();
});
