import * as evaluationGradeRepository from '../repositories/evaluation_grade.repository.js';
import * as studentService from '../services/student.service.js';
import * as evaluationService from '../services/evaluation.service.js';

/**
 * Crear una nueva calificación para un estudiante y evaluación.
 * @param {Object} evaluationGradeData - Datos de la calificación.
 * @returns {Promise<Object>} - Registro de calificación creado.
 */
export const createEvaluationGrade = async ({ email, nombreMateria, nombreEvaluacion, calificacion }) => {
    // Validar que el estudiante existe
    const student = await studentService.getStudentByUserIdAndEmail(email);
    if (!student) {
        throw new Error(`Estudiante no encontrado con email: ${email}`);
    }

    // Validar que la evaluación existe
    const evaluation = await evaluationService.searchEvaluationbyNameAndSubject(nombreEvaluacion, nombreMateria);
    if (!evaluation) {
        throw new Error(`Evaluación no encontrada`);
    }

    // Verificar si ya existe una nota para este estudiante y evaluación
    const nota = await evaluationGradeRepository.findEvaluationGradeByStudentIdAndEvaluation(student.id, evaluation.id);
    console.log("nota: ", nota); // Ahora mostrará el resultado de la consulta, no una promesa

    if (!nota) {
        // Crear la calificación
        return await evaluationGradeRepository.createEvaluationGrade({
            estudiante: student,
            evaluacion: evaluation,
            calificacion,
        });
    } else {
        throw new Error(`La nota ya existe`);
    }
};

/**
 * Obtener todas las calificaciones de evaluación.
 * @returns {Promise<Array>} - Lista de calificaciones con los detalles de estudiantes y evaluaciones.
 */
export const getAllEvaluationGrades = async () => {
    return await evaluationGradeRepository.findAllEvaluationGrades();
};

/**
 * Obtener todas las calificaciones de un estudiante.
 * @param {String} estudianteId - ID del estudiante.
 * @returns {Promise<Array>} - Lista de calificaciones asociadas al estudiante.
 */
export const getEvaluationGradesByStudent = async (email) => {
    const student = await studentService.getStudentByUserIdAndEmail(email);
    if (!student) {
        throw new Error(`Estudiante no encontrado`);
    }
    return await evaluationGradeRepository.findEvaluationGradesByStudent(student) ;
};

/**
 * Obtener todas las calificaciones de una evaluación.
 * @param {String} evaluacionId - ID de la evaluación.
 * @returns {Promise<Array>} - Lista de calificaciones asociadas a la evaluación.
 */
export const getEvaluationGradesByEvaluation = async (nombreEvaluacion, nombreMateria) => {
    const evaluation = await evaluationService.searchEvaluationbyNameAndSubject(nombreEvaluacion, nombreMateria);
    if (!evaluation) {
        throw new Error(`Evaluación no encontrada`);
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
    console.log(email);
    const student = await studentService.getStudentByUserIdAndEmail(email);
    console.log(student);
    if(student){
        
        const evaluation = await evaluationService.searchEvaluationbyNameAndSubject(nombreEvaluacion, nombreMateria);
        if (!evaluation) {
            throw new Error(`Evaluación no encontrada`);
        }
        const nota = await evaluationGradeRepository.findEvaluationGradeByStudentIdAndEvaluation(student, evaluation);
        if(nota){
            return await evaluationGradeRepository.updateEvaluationGradeById(nota.id, {calificacion});
        }else{
            throw new Error(`Calificación no encontrada`);
        }
    }else{
        throw new Error(`Estudiante no encontrado `);
    }
};

/**
 * Eliminar una calificación por ID.
 * @param {String} id - ID de la calificación.
 * @returns {Promise<Object>} - Registro de calificación eliminado. AQUI ME QUEDE
 */
export const deleteEvaluationGradeById = async (email, nombreMateria, nombreEvaluacion) => {
    const student = await studentService.getStudentByUserIdAndEmail(email);
    if(student){

        const evaluacion = await evaluationService.searchEvaluationbyNameAndSubject(nombreEvaluacion, nombreMateria)
        if (!evaluacion) {
            throw new Error(`Evaluacion no encontrada`);
        }
        const nota = await evaluationGradeRepository.findEvaluationGradeByStudentIdAndEvaluation(student, evaluacion);
        console.log(nota);
        if(nota){
            return await evaluationGradeRepository.deleteEvaluationGradeById(nota.id);
        }else{
            throw new Error(`Calificación no encontrada`);
        }
    }else{
        throw new Error(`Estudiante no encontrado `);
    }
};

export const getEvaluationGradesByStudentAndEvaluation = async (studentId, evaluationId) => {
    return await evaluationGradeRepository.findEvaluationGradeByStudentAndEvaluation(studentId, evaluationId);
};
