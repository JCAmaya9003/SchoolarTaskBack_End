import { validationResult } from 'express-validator';
import * as evaluationService from '../services/evaluation.service.js'
import { sendSuccess } from '../utils/apiResponse.js';

const formatEvaluationResponse = (evaluation) => ({
    id: evaluation._id,
    nombre: evaluation.nombre,
    materia: evaluation.materia?.nombre,
    grado_seccion: evaluation.grado_seccion
        ? { grado: evaluation.grado_seccion.grado, seccion: evaluation.grado_seccion.seccion }
        : undefined,
    descripcion: evaluation.descripcion,
    fecha: evaluation.fecha,
    peso: evaluation.peso,
});

export const newEvaluation = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { nombre, nombreMateria, grado, seccion, descripcion, fecha, peso } = req.body;
    try {
        const evaluation = await evaluationService.createEvaluation({ nombre, nombreMateria, grado, seccion, descripcion, fecha, peso });
        return sendSuccess(res, 201, 'Evaluación creada con éxito', formatEvaluationResponse(evaluation));
    } catch (error) {
        next(error);
    }
};

export const updateEvaluation = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { nombre, nuevoNombre, nombreMateria, nuevaMateria, grado, seccion, descripcion, fecha, peso } = req.body;
    try {
        const evaluationUpdated = await evaluationService.editEvaluation({ nombre, nuevoNombre, nombreMateria, nuevaMateria, grado, seccion, descripcion, fecha, peso });
        return sendSuccess(res, 200, 'Evaluación editada con éxito', formatEvaluationResponse(evaluationUpdated));
    } catch (error) {
        next(error);
    }
};

export const eraseEvaluation = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { nombre, nombreMateria, grado, seccion } = req.body;
    try {
        const evaluationDeleted = await evaluationService.deleteEvaluation({ nombre, nombreMateria, grado, seccion });
        return sendSuccess(res, 200, 'Evaluación eliminada con éxito', formatEvaluationResponse(evaluationDeleted));
    } catch (error) {
        next(error);
    }
};

export const getEvaluations = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const { page, limit } = req.query;
        const { data, pagination } = await evaluationService.getAllEvaluations(page, limit, req.user);
        return sendSuccess(res, 200, 'Evaluaciones obtenidas con éxito', { items: data.map(formatEvaluationResponse), pagination });
    } catch (error) {
        next(error);
    }
};
