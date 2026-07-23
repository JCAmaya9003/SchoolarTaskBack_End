import * as evaluationGradeRepository from '../repositories/evaluation_grade.repository.js';
import * as studentService from '../services/student.service.js';
import * as evaluationService from '../services/evaluation.service.js';
import * as gradeSectionService from '../services/gradeSection.service.js';
import * as teacherService from '../services/teacher.service.js';
import { NotFoundError, ConflictError } from '../errors/errors.js';

/**
 * Crear una nueva calificación para un estudiante y evaluación.
 * @param {Object} evaluationGradeData - Datos de la calificación.
 * @returns {Promise<Object>} - Registro de calificación creado.
 */
export const createEvaluationGrade = async ({ email, nombreMateria, nombreEvaluacion, calificacion }) => {
    // Validar que el estudiante existe
    const student = await studentService.getStudentByUserIdAndEmail(email);
    if (!student) {
        throw new NotFoundError(`Estudiante no encontrado con email: ${email}`);
    }

    // La evaluación es de la clase del estudiante: se busca por nombre + materia + grado_seccion
    // del propio estudiante (por eso el payload de notas no necesita grado/sección).
    const evaluation = await evaluationService.searchEvaluationbyNameSubjectAndGradeSection(nombreEvaluacion, nombreMateria, student.grado_seccion);
    if (!evaluation) {
        throw new NotFoundError(`Evaluación no encontrada`);
    }

    // Verificar si ya existe una nota para este estudiante y evaluación
    const nota = await evaluationGradeRepository.findEvaluationGradeByStudentIdAndEvaluation(student.id, evaluation.id);

    if (!nota) {
        // Crear la calificación
        return await evaluationGradeRepository.createEvaluationGrade({
            estudiante: student,
            evaluacion: evaluation,
            calificacion,
        });
    } else {
        throw new ConflictError(`La nota ya existe`);
    }
};

/**
 * Obtener todas las calificaciones de evaluación, paginadas.
 * Si requestingUser es teacher, filtra a solo las calificaciones de sus propias materias; admin ve todo.
 * @returns {Promise<{data: Array, pagination: Object}>}
 */
export const getAllEvaluationGrades = async (page, limit, requestingUser) => {
    let evaluationIds = null;
    if (requestingUser?.role === 'teacher') {
        // Solo las notas de las evaluaciones que el profe dicta (sus materias en sus clases).
        evaluationIds = await evaluationService.getTeacherEvaluationIds(requestingUser.email);
    }
    return await evaluationGradeRepository.findAllEvaluationGrades(page, limit, evaluationIds);
};

/**
 * Obtener todas las calificaciones de un estudiante.
 * @param {String} estudianteId - ID del estudiante.
 * @returns {Promise<Array>} - Lista de calificaciones asociadas al estudiante.
 */
export const getEvaluationGradesByStudent = async (email, requestingUser) => {
    const student = await studentService.getStudentByUserIdAndEmail(email);
    if (!student) {
        throw new NotFoundError(`Estudiante no encontrado`);
    }
    const grades = await evaluationGradeRepository.findEvaluationGradesByStudent(student);

    // Un teacher solo ve las notas del alumno en las materias que dicta EN la clase de ese alumno
    // (consistente con /all y /by-evaluation). Admin y el propio alumno ven todas.
    if (requestingUser?.role === 'teacher') {
        const ownSubjectIds = await teacherService.getTeacherSubjectIdsInClass(requestingUser.email, student.grado_seccion?._id);
        const ownSubjects = new Set(ownSubjectIds.map((id) => id.toString()));
        return grades.filter((g) => g.evaluacion?.materia && ownSubjects.has(g.evaluacion.materia.toString()));
    }
    return grades;
};

/**
 * Obtener todas las calificaciones de una evaluación.
 * @param {String} evaluacionId - ID de la evaluación.
 * @returns {Promise<Array>} - Lista de calificaciones asociadas a la evaluación.
 */
export const getEvaluationGradesByEvaluation = async (nombreEvaluacion, nombreMateria, grado, seccion) => {
    const gradeSection = await gradeSectionService.getGradeAndSection(grado, seccion);
    if (!gradeSection) {
        throw new NotFoundError(`Grado y sección no encontrados`);
    }
    const evaluation = await evaluationService.searchEvaluationbyNameSubjectAndGradeSection(nombreEvaluacion, nombreMateria, gradeSection.id);
    if (!evaluation) {
        throw new NotFoundError(`Evaluación no encontrada`);
    }
    return await evaluationGradeRepository.findEvaluationGradesByEvaluation(evaluation);
};

/**
 * Actualizar una calificación por ID.
 * @param {String} id - ID de la calificación.
 * @param {Object} updates - Datos a actualizar.
 * @returns {Promise<Object>} - Registro de calificación actualizado.
 */
export const updateEvaluationGradeByStudentAndEvaluation = async ({email, nombreMateria, nombreEvaluacion, calificacion}) => {
    const student = await studentService.getStudentByUserIdAndEmail(email);
    if(student){

        const evaluation = await evaluationService.searchEvaluationbyNameSubjectAndGradeSection(nombreEvaluacion, nombreMateria, student.grado_seccion);
        if (!evaluation) {
            throw new NotFoundError(`Evaluación no encontrada`);
        }
        const nota = await evaluationGradeRepository.findEvaluationGradeByStudentIdAndEvaluation(student, evaluation);
        if(nota){
            return await evaluationGradeRepository.updateEvaluationGradeById(nota.id, {calificacion});
        }else{
            throw new NotFoundError(`Calificación no encontrada`);
        }
    }else{
        throw new NotFoundError(`Estudiante no encontrado`);
    }
};

/**
 * Eliminar una calificación por ID.
 * @param {String} id - ID de la calificación.
 * @returns {Promise<Object>} - Registro de calificación eliminado.
 */
export const deleteEvaluationGradeById = async (email, nombreMateria, nombreEvaluacion) => {
    const student = await studentService.getStudentByUserIdAndEmail(email);
    if(student){

        const evaluacion = await evaluationService.searchEvaluationbyNameSubjectAndGradeSection(nombreEvaluacion, nombreMateria, student.grado_seccion)
        if (!evaluacion) {
            throw new NotFoundError(`Evaluación no encontrada`);
        }
        const nota = await evaluationGradeRepository.findEvaluationGradeByStudentIdAndEvaluation(student, evaluacion);
        if(nota){
            return await evaluationGradeRepository.deleteEvaluationGradeById(nota.id);
        }else{
            throw new NotFoundError(`Calificación no encontrada`);
        }
    }else{
        throw new NotFoundError(`Estudiante no encontrado`);
    }
};

export const getEvaluationGradesByStudentAndEvaluation = async (studentId, evaluationId) => {
    return await evaluationGradeRepository.findEvaluationGradeByStudentAndEvaluation(studentId, evaluationId);
};
