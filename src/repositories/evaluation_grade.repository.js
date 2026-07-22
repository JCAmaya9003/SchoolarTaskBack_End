import EvaluationGrade from '../models/evaluation_grade.model.js';
import { getPaginationParams, getPaginationMeta } from '../utils/pagination-helper.js';
import { findActiveStudentIds } from './student.repository.js';
import { findEvaluationIdsByFilter } from './evaluation.repository.js';

/**
 * Crear un registro de calificación de evaluación.
 * @param {Object} evaluationGradeData - Datos para crear la calificación.
 * @returns {Promise<Object>} - Registro de calificación creado.
 */
export const createEvaluationGrade = async (evaluationGradeData) => {
    const evaluationGrade = new EvaluationGrade(evaluationGradeData);
    await evaluationGrade.save();
    return await evaluationGrade.populate([
        {
            path: 'estudiante',
            select: 'usuario grado_seccion',
            populate: { path: 'usuario', select: 'nombre apellido email' },
        },
        {
            path: 'evaluacion',
            select: 'nombre materia fecha',
        },
    ]);
};

export const findEvaluationGradeByStudentAndEvaluation = async (studentId, evaluationId) => {
    return await EvaluationGrade.findOne({ estudiante: studentId, evaluacion: evaluationId });
};

// Borra en bloque todas las notas de una evaluación. Usado al eliminar una evaluación en
// cascada: una nota sin su evaluación no tiene sentido y quedaría huérfana.
export const deleteEvaluationGradesByEvaluationId = async (evaluationId) => {
    return await EvaluationGrade.deleteMany({ evaluacion: evaluationId });
};

// Las dos de abajo trabajan sobre un conjunto de evaluaciones a la vez: el borrado de un
// catálogo primero informa cuántas notas se van a perder y después las borra en bloque.
export const countEvaluationGradesByEvaluationIds = async (evaluationIds) => {
    return await EvaluationGrade.countDocuments({ evaluacion: { $in: evaluationIds } });
};

export const deleteEvaluationGradesByEvaluationIds = async (evaluationIds) => {
    return await EvaluationGrade.deleteMany({ evaluacion: { $in: evaluationIds } });
};

// Borra en bloque todas las notas de un estudiante. Usado al eliminar un estudiante en cascada:
// una nota sin su estudiante queda huérfana, igual que una nota sin su evaluación.
export const deleteEvaluationGradesByStudentId = async (studentId) => {
    return await EvaluationGrade.deleteMany({ estudiante: studentId });
};

// Todas las notas de un conjunto de evaluaciones, en una sola consulta. La usa el reporte del
// profesor para armar un mapa (estudiante, evaluación) -> nota en vez de consultar una por una.
export const findEvaluationGradesByEvaluationIds = async (evaluationIds) => {
    return await EvaluationGrade.find({ evaluacion: { $in: evaluationIds } }).select('estudiante evaluacion calificacion');
};

/**
 * Actualizar un registro de calificación por ID.
 * @param {String} id - ID del registro de calificación.
 * @param {Object} updates - Datos para actualizar.
 * @returns {Promise<Object|null>} - Registro actualizado o null si no se encontró.
 */
export const updateEvaluationGradeById = async (id, updates) => {
    return await EvaluationGrade.findByIdAndUpdate(id, updates, { new: true, runValidators: true })
        .populate({
            path: 'estudiante',
            select: 'usuario grado_seccion',
            populate: { path: 'usuario', select: 'nombre apellido email' },
        })
        .populate({
            path: 'evaluacion',
            select: 'nombre materia fecha',
        });
};

/**
 * Eliminar un registro de calificación por ID.
 * @param {String} id - ID del registro de calificación.
 * @returns {Promise<Object|null>} - Registro eliminado o null si no se encontró.
 */
export const deleteEvaluationGradeById = async (id) => {
    return await EvaluationGrade.findByIdAndDelete(id)
        .populate({
            path: 'estudiante',
            select: 'usuario grado_seccion',
            populate: { path: 'usuario', select: 'nombre apellido email' },
        })
        .populate({
            path: 'evaluacion',
            select: 'nombre materia fecha',
        });
};

/**
 * Buscar todas las calificaciones de evaluaciones, paginadas.
 * @param {Number} page
 * @param {Number} limit
 * @param {Array<String>|null} evaluationIds - Si se pasa, filtra solo calificaciones de esas evaluaciones.
 * @returns {Promise<{data: Array, pagination: Object}>}
 */
export const findAllEvaluationGrades = async (page, limit, evaluationIds = null) => {
    const { skip, limit: validLimit, page: validPage } = getPaginationParams(page, limit);

    // Una nota solo es mostrable si su evaluación existe y el usuario del estudiante está activo.
    // Antes esos casos se filtraban en memoria después de paginar, así que el total no coincidía
    // con lo devuelto. Ahora se excluyen a nivel de query, para que la paginación sea exacta.
    // Si viene evaluationIds (un teacher filtrando por sus clases), ya es un subconjunto de
    // evaluaciones existentes; si no (admin), se usan todas las evaluaciones que existen.
    const [activeStudentIds, existingEvaluationIds] = await Promise.all([
        findActiveStudentIds(),
        evaluationIds ? Promise.resolve(evaluationIds) : findEvaluationIdsByFilter({}),
    ]);
    const filter = {
        estudiante: { $in: activeStudentIds },
        evaluacion: { $in: existingEvaluationIds },
    };

    const [grades, total] = await Promise.all([
        EvaluationGrade.find(filter)
            .skip(skip)
            .limit(validLimit)
            .populate({
                path: 'estudiante',
                select: 'usuario grado_seccion',
                populate: {
                    path: 'usuario',
                    select: 'nombre apellido email'
                },
            })
            .populate({
                path: 'evaluacion',
                select: 'nombre materia fecha',
            }),
        EvaluationGrade.countDocuments(filter),
    ]);

    return {
        data: grades,
        pagination: getPaginationMeta(validPage, validLimit, total),
    };
};

/**
 * Buscar calificación por ID.
 * @param {String} id - ID del registro de calificación.
 * @returns {Promise<Object|null>} - Registro de calificación encontrado o null.
 */
export const findEvaluationGradeByStudentIdAndEvaluation = async (studentId, evaluationId) => {
    return await EvaluationGrade.findOne({estudiante: studentId, evaluacion: evaluationId})
        .populate({
            path: 'estudiante',
            select: 'usuario grado_seccion',
            populate: { path: 'usuario', select: 'nombre apellido email' },
        })
        .populate({
            path: 'evaluacion',
            select: 'nombre materia fecha',
        });
};

/**
 * Buscar calificaciones por estudiante.
 * @param {String} studentId - ID del estudiante.
 * @returns {Promise<Array>} - Lista de calificaciones asociadas al estudiante.
 */
export const findEvaluationGradesByStudent = async (student) => {
    return await EvaluationGrade.find({ estudiante: student })
        .populate({
            path: 'estudiante',
            select: 'usuario grado_seccion',
            populate: { path: 'usuario', select: 'nombre apellido email' },
        })
        .populate({
            path: 'evaluacion',
            select: 'nombre materia fecha',
        });
};

/**
 * Buscar calificaciones por evaluación.
 * @param {String} evaluationId - ID de la evaluación.
 * @returns {Promise<Array>} - Lista de calificaciones asociadas a la evaluación.
 */
export const findEvaluationGradesByEvaluation = async (evaluation) => {
    return await EvaluationGrade.find({ evaluacion: evaluation })
        .populate({
            path: 'estudiante',
            select: 'usuario grado_seccion',
            populate: { path: 'usuario', select: 'nombre apellido email' },
        })
        .populate({
            path: 'evaluacion',
            select: 'nombre materia fecha',
        });
};
