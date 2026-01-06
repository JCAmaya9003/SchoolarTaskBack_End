import * as evaluationGradeService from '../services/evaluationGrade.service.js';

/**
 * Crear una nueva calificación de evaluación.
 * @param {Object} req - Objeto de la solicitud HTTP.
 * @param {Object} res - Objeto de la respuesta HTTP.
 */
export const createEvaluationGrade = async (req, res) => {
    try {
        const { estudianteId, evaluacionId, calificacion } = req.body;

        const createdGrade = await evaluationGradeService.createEvaluationGrade({
            estudianteId,
            evaluacionId,
            calificacion,
        });

        return res.status(201).json({
            message: 'Calificación creada con éxito',
            data: createdGrade,
        });
    } catch (error) {
        return res.status(500).json({
            message: 'Error al crear la calificación',
            error: error.message,
        });
    }
};

/**
 * Obtener todas las calificaciones de evaluación.
 * @param {Object} req - Objeto de la solicitud HTTP.
 * @param {Object} res - Objeto de la respuesta HTTP.
 */
export const getAllEvaluationGrades = async (req, res) => {
    try {
        const grades = await evaluationGradeService.getAllEvaluationGrades();
        return res.status(200).json(grades);
    } catch (error) {
        return res.status(500).json({
            message: 'Error al obtener las calificaciones',
            error: error.message,
        });
    }
};

/**
 * Obtener una calificación por ID.
 * @param {Object} req - Objeto de la solicitud HTTP.
 * @param {Object} res - Objeto de la respuesta HTTP.
 */
export const getEvaluationGradeById = async (req, res) => {
    try {
        const { id } = req.params;
        const grade = await evaluationGradeService.getEvaluationGradeById(id);

        if (!grade) {
            return res.status(404).json({ message: 'Calificación no encontrada' });
        }

        return res.status(200).json(grade);
    } catch (error) {
        return res.status(500).json({
            message: 'Error al obtener la calificación',
            error: error.message,
        });
    }
};

/**
 * Obtener todas las calificaciones de un estudiante.
 * @param {Object} req - Objeto de la solicitud HTTP.
 * @param {Object} res - Objeto de la respuesta HTTP.
 */
export const getEvaluationGradesByStudent = async (req, res) => {
    try {
        const { estudianteId } = req.params;
        const grades = await evaluationGradeService.getEvaluationGradesByStudent(estudianteId);

        return res.status(200).json(grades);
    } catch (error) {
        return res.status(500).json({
            message: 'Error al obtener las calificaciones del estudiante',
            error: error.message,
        });
    }
};

/**
 * Obtener todas las calificaciones de una evaluación.
 * @param {Object} req - Objeto de la solicitud HTTP.
 * @param {Object} res - Objeto de la respuesta HTTP.
 */
export const getEvaluationGradesByEvaluation = async (req, res) => {
    try {
        const { evaluacionId } = req.params;
        const grades = await evaluationGradeService.getEvaluationGradesByEvaluation(evaluacionId);

        return res.status(200).json(grades);
    } catch (error) {
        return res.status(500).json({
            message: 'Error al obtener las calificaciones de la evaluación',
            error: error.message,
        });
    }
};

/**
 * Actualizar una calificación por ID.
 * @param {Object} req - Objeto de la solicitud HTTP.
 * @param {Object} res - Objeto de la respuesta HTTP.
 */
export const updateEvaluationGradeById = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const updatedGrade = await evaluationGradeService.updateEvaluationGradeById(id, updates);

        if (!updatedGrade) {
            return res.status(404).json({ message: 'Calificación no encontrada' });
        }

        return res.status(200).json({
            message: 'Calificación actualizada con éxito',
            data: updatedGrade,
        });
    } catch (error) {
        return res.status(500).json({
            message: 'Error al actualizar la calificación',
            error: error.message,
        });
    }
};

/**
 * Eliminar una calificación por ID.
 * @param {Object} req - Objeto de la solicitud HTTP.
 * @param {Object} res - Objeto de la respuesta HTTP.
 */
export const deleteEvaluationGradeById = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedGrade = await evaluationGradeService.deleteEvaluationGradeById(id);

        if (!deletedGrade) {
            return res.status(404).json({ message: 'Calificación no encontrada' });
        }

        return res.status(200).json({
            message: 'Calificación eliminada con éxito',
            data: deletedGrade,
        });
    } catch (error) {
        return res.status(500).json({
            message: 'Error al eliminar la calificación',
            error: error.message,
        });
    }
};
