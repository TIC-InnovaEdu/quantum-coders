// Módulo de gestión de cursos para Runa Pachawan
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  where,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

const db = window.firebaseDB;

// Clase para gestionar cursos
class CoursesManager {
  constructor() {
    this.collection = 'courses';
    this.enrollmentsCollection = 'enrollments';
  }

  // Generar código único de curso
  generateCourseCode() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
  }

  // Crear nuevo curso
  async createCourse(courseData) {
    try {
      const currentUser = window.getCurrentUser();
      if (!currentUser || currentUser.role !== 'teacher') {
        throw new Error('Solo los docentes pueden crear cursos');
      }

      // Validar datos
      this.validateCourseData(courseData);

      // Generar código único
      let courseCode;
      let codeExists = true;
      let attempts = 0;
      
      while (codeExists && attempts < 10) {
        courseCode = this.generateCourseCode();
        const existingCourse = await this.getCourseByCode(courseCode);
        codeExists = !!existingCourse;
        attempts++;
      }

      if (codeExists) {
        throw new Error('No se pudo generar un código único después de varios intentos');
      }

      const course = {
        name: courseData.name,
        description: courseData.description || '',
        teacherId: currentUser.uid,
        teacherName: currentUser.displayName,
        teacherEmail: currentUser.email,
        code: courseCode,
        isActive: true,
        createdAt: serverTimestamp(),
        settings: {
          allowStudentRegistration: courseData.allowStudentRegistration !== false,
          maxStudents: courseData.maxStudents || 30,
          difficulty: courseData.difficulty || 'medio',
          category: courseData.category || 'general'
        },
        stats: {
          totalStudents: 0,
          activeStudents: 0,
          totalQuestions: 0,
          totalAnswers: 0
        }
      };

      const docRef = await addDoc(collection(db, this.collection), course);
      
      // Agregar curso a la lista del docente
      await this.addCourseToUser(currentUser.uid, docRef.id);

      return {
        id: docRef.id,
        ...course
      };
    } catch (error) {
      console.error('Error creando curso:', error);
      throw error;
    }
  }

  // Obtener curso por código
  async getCourseByCode(code) {
    try {
      const q = query(
        collection(db, this.collection),
        where('code', '==', code),
        where('isActive', '==', true)
      );
      
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        return null;
      }

      const courseDoc = snapshot.docs[0];
      return {
        id: courseDoc.id,
        ...courseDoc.data()
      };
    } catch (error) {
      console.error('Error obteniendo curso por código:', error);
      throw error;
    }
  }

  // Obtener cursos de un docente
  async getTeacherCourses(teacherId) {
    try {
      console.log('🔍 Buscando cursos para teacherId:', teacherId);
      console.log('🔍 Colección:', this.collection);
      console.log('🔍 DB disponible:', !!db);
      
      // Simplificar consulta para evitar índice compuesto
      const q = query(
        collection(db, this.collection),
        where('teacherId', '==', teacherId)
      );
      
      console.log('🔍 Consulta creada, ejecutando...');
      const snapshot = await getDocs(q);
      console.log('🔍 Snapshot obtenido, docs:', snapshot.docs.length);
      
      // Filtrar cursos activos en el cliente
      const result = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(course => course.isActive !== false);
      
      // Ordenar por fecha de creación en el cliente
      result.sort((a, b) => {
        const dateA = a.createdAt?.toMillis?.() || 0;
        const dateB = b.createdAt?.toMillis?.() || 0;
        return dateB - dateA;
      });
      
      console.log('🔍 Resultado final:', result);
      return result;
    } catch (error) {
      console.error('Error obteniendo cursos del docente:', error);
      console.log('🔍 Error completo:', JSON.stringify(error, null, 2));
      console.log('🔍 Mensaje:', error.message);
      console.log('🔍 Código:', error.code);
      
      // Si el error es por permisos o colección no existe, devolver array vacío
      if (error.message && (error.message.includes('permission-denied') || error.message.includes('not found'))) {
        console.log('ℹ️ La colección courses no existe o no hay permisos, devolviendo array vacío');
        return [];
      }
      throw error;
    }
  }

  // Obtener cursos donde está inscrito un estudiante
  async getStudentCourses(studentId) {
    try {
      const enrollmentsQuery = query(
        collection(db, this.enrollmentsCollection),
        where('studentId', '==', studentId),
        where('status', '==', 'active')
      );
      
      const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
      
      if (enrollmentsSnapshot.empty) {
        return [];
      }

      const courseIds = enrollmentsSnapshot.docs.map(doc => doc.data().courseId);
      
      if (courseIds.length === 0) {
        return [];
      }

      const coursesQuery = query(
        collection(db, this.collection),
        where('id', 'in', courseIds),
        where('isActive', '==', true)
      );
      
      const coursesSnapshot = await getDocs(coursesQuery);
      return coursesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error obteniendo cursos del estudiante:', error);
      // Si el error es por permisos o colección no existe, devolver array vacío
      if (error.message.includes('permission-denied') || error.message.includes('not found')) {
        console.log('ℹ️ Las colecciones no existen o no hay permisos, devolviendo array vacío');
        return [];
      }
      throw error;
    }
  }

  // Inscribir estudiante en curso
  async enrollStudent(courseCode, studentId) {
    try {
      // Verificar que el curso exista y esté activo
      const course = await this.getCourseByCode(courseCode);
      if (!course) {
        throw new Error('Código de curso inválido o inactivo');
      }

      // Verificar si el estudiante ya está inscrito
      const existingEnrollment = await this.getEnrollment(course.id, studentId);
      if (existingEnrollment) {
        throw new Error('Ya estás inscrito en este curso');
      }

      // Verificar límite de estudiantes
      const currentEnrollments = await this.getCourseEnrollments(course.id);
      if (currentEnrollments.length >= course.settings.maxStudents) {
        throw new Error('El curso ha alcanzado su límite de estudiantes');
      }

      const enrollment = {
        courseId: course.id,
        studentId: studentId,
        enrolledAt: serverTimestamp(),
        status: 'active',
        progress: {
          questionsAnswered: 0,
          correctAnswers: 0,
          totalPoints: 0,
          lastActivity: serverTimestamp()
        }
      };

      const enrollmentRef = await addDoc(collection(db, this.enrollmentsCollection), enrollment);

      // Agregar curso a la lista del estudiante
      await this.addCourseToStudent(studentId, course.id);

      // Actualizar estadísticas del curso
      await this.updateCourseStats(course.id, {
        totalStudents: currentEnrollments.length + 1,
        activeStudents: currentEnrollments.length + 1
      });

      return {
        id: enrollmentRef.id,
        ...enrollment,
        course: course
      };
    } catch (error) {
      console.error('Error inscribiendo estudiante:', error);
      throw error;
    }
  }

  // Obtener inscripción específica
  async getEnrollment(courseId, studentId) {
    try {
      const q = query(
        collection(db, this.enrollmentsCollection),
        where('courseId', '==', courseId),
        where('studentId', '==', studentId)
      );
      
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        return null;
      }

      const enrollmentDoc = snapshot.docs[0];
      return {
        id: enrollmentDoc.id,
        ...enrollmentDoc.data()
      };
    } catch (error) {
      console.error('Error obteniendo inscripción:', error);
      throw error;
    }
  }

  // Obtener todas las inscripciones de un curso
  async getCourseEnrollments(courseId) {
    try {
      const q = query(
        collection(db, this.enrollmentsCollection),
        where('courseId', '==', courseId),
        where('status', '==', 'active')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error obteniendo inscripciones del curso:', error);
      throw error;
    }
  }

  // Eliminar inscripción (estudiante abandona curso)
  async unenrollStudent(courseId, studentId) {
    try {
      const enrollment = await this.getEnrollment(courseId, studentId);
      if (!enrollment) {
        throw new Error('No se encontró la inscripción');
      }

      await deleteDoc(doc(db, this.enrollmentsCollection, enrollment.id));

      // Remover curso de la lista del estudiante
      await this.removeCourseFromStudent(studentId, courseId);

      // Actualizar estadísticas del curso
      const currentEnrollments = await this.getCourseEnrollments(courseId);
      await this.updateCourseStats(courseId, {
        totalStudents: currentEnrollments.length,
        activeStudents: currentEnrollments.length
      });

      return true;
    } catch (error) {
      console.error('Error eliminando inscripción:', error);
      throw error;
    }
  }

  // Actualizar curso
  async updateCourse(courseId, updateData) {
    try {
      const currentUser = window.getCurrentUser();
      if (!currentUser) {
        throw new Error('Usuario no autenticado');
      }

      // Verificar que el usuario sea el dueño del curso
      const course = await this.getCourseById(courseId);
      if (!course || course.teacherId !== currentUser.uid) {
        throw new Error('No tienes permisos para modificar este curso');
      }

      const courseRef = doc(db, this.collection, courseId);
      await updateDoc(courseRef, {
        ...updateData,
        updatedAt: serverTimestamp()
      });

      return true;
    } catch (error) {
      console.error('Error actualizando curso:', error);
      throw error;
    }
  }

  // Eliminar curso
  async deleteCourse(courseId) {
    try {
      const currentUser = window.getCurrentUser();
      if (!currentUser) {
        throw new Error('Usuario no autenticado');
      }

      // Verificar que el usuario sea el dueño del curso
      const course = await this.getCourseById(courseId);
      if (!course || course.teacherId !== currentUser.uid) {
        throw new Error('No tienes permisos para eliminar este curso');
      }

      // Eliminar todas las inscripciones del curso
      const enrollments = await this.getCourseEnrollments(courseId);
      for (const enrollment of enrollments) {
        await deleteDoc(doc(db, this.enrollmentsCollection, enrollment.id));
        await this.removeCourseFromStudent(enrollment.studentId, courseId);
      }

      // Eliminar preguntas del curso
      // (esto se implementará en questions.js)

      // Eliminar el curso
      await deleteDoc(doc(db, this.collection, courseId));

      // Remover curso de la lista del docente
      await this.removeCourseFromUser(currentUser.uid, courseId);

      return true;
    } catch (error) {
      console.error('Error eliminando curso:', error);
      throw error;
    }
  }

  // Obtener curso por ID
  async getCourseById(courseId) {
    try {
      const docRef = doc(db, this.collection, courseId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        };
      } else {
        throw new Error('Curso no encontrado');
      }
    } catch (error) {
      console.error('Error obteniendo curso:', error);
      throw error;
    }
  }

  // Métodos auxiliares para gestionar cursos en usuarios
  async addCourseToUser(userId, courseId) {
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        const courses = userData.courses || [];
        if (!courses.includes(courseId)) {
          courses.push(courseId);
          await updateDoc(userRef, { courses });
        }
      }
    } catch (error) {
      console.error('Error agregando curso al usuario:', error);
    }
  }

  async removeCourseFromUser(userId, courseId) {
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        const courses = userData.courses || [];
        const updatedCourses = courses.filter(id => id !== courseId);
        await updateDoc(userRef, { courses: updatedCourses });
      }
    } catch (error) {
      console.error('Error removiendo curso del usuario:', error);
    }
  }

  async addCourseToStudent(studentId, courseId) {
    try {
      const userRef = doc(db, 'users', studentId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        const enrolledCourses = userData.enrolledCourses || [];
        if (!enrolledCourses.includes(courseId)) {
          enrolledCourses.push(courseId);
          await updateDoc(userRef, { enrolledCourses });
        }
      }
    } catch (error) {
      console.error('Error agregando curso al estudiante:', error);
    }
  }

  async removeCourseFromStudent(studentId, courseId) {
    try {
      const userRef = doc(db, 'users', studentId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        const enrolledCourses = userData.enrolledCourses || [];
        const updatedCourses = enrolledCourses.filter(id => id !== courseId);
        await updateDoc(userRef, { enrolledCourses: updatedCourses });
      }
    } catch (error) {
      console.error('Error removiendo curso del estudiante:', error);
    }
  }

  async updateCourseStats(courseId, statsUpdate) {
    try {
      const courseRef = doc(db, this.collection, courseId);
      await updateDoc(courseRef, {
        stats: statsUpdate
      });
    } catch (error) {
      console.error('Error actualizando estadísticas del curso:', error);
    }
  }

  // Validaciones
  validateCourseData(courseData) {
    if (!courseData.name || courseData.name.trim().length === 0) {
      throw new Error('El nombre del curso es obligatorio');
    }

    if (courseData.name.length > 100) {
      throw new Error('El nombre del curso no puede exceder 100 caracteres');
    }

    if (courseData.description && courseData.description.length > 500) {
      throw new Error('La descripción no puede exceder 500 caracteres');
    }

    if (courseData.maxStudents && (courseData.maxStudents < 1 || courseData.maxStudents > 100)) {
      throw new Error('El número máximo de estudiantes debe estar entre 1 y 100');
    }
  }
}

// Crear instancia global
window.coursesManager = new CoursesManager();

// Exponer funciones globalmente
window.createCourse = (courseData) => window.coursesManager.createCourse(courseData);
window.getCourseByCode = (code) => window.coursesManager.getCourseByCode(code);
window.getTeacherCourses = (teacherId) => window.coursesManager.getTeacherCourses(teacherId);
window.getStudentCourses = (studentId) => window.coursesManager.getStudentCourses(studentId);
window.enrollStudent = (courseCode, studentId) => window.coursesManager.enrollStudent(courseCode, studentId);
window.unenrollStudent = (courseId, studentId) => window.coursesManager.unenrollStudent(courseId, studentId);
window.updateCourse = (courseId, data) => window.coursesManager.updateCourse(courseId, data);
window.deleteCourse = (courseId) => window.coursesManager.deleteCourse(courseId);
window.checkCourseAccess = (courseId, user) => {
  if (user.role === 'teacher') {
    return user.courses?.includes(courseId);
  } else if (user.role === 'student') {
    return user.enrolledCourses?.includes(courseId);
  }
  return false;
};

console.log('✅ Módulo de cursos cargado');
