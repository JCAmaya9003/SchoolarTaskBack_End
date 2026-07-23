import { validationResult } from 'express-validator';
import * as evaluationGradeService from '../services/evaluation_grade.service.js';
import { sendSuccess } from '../utils/apiResponse.js';

// Optional chaining como defensa: una nota puede quedar con estudiante.usuario null (usuario
// desactivado) o evaluacion null (nota huérfana vieja). Los listados filtran esos casos antes
// de mapear; esto es para no romper nunca.
const formatEvaluationGradeResponse = (grade) => ({
    id: grade._id,
    calificacion: grade.calificacion,
    estudiante: {
        nombre: grade.estudiante?.usuario?.nombre,
        apellido: grade.estudiante?.usuario?.apellido,
        email: grade.estudiante?.usuario?.email,
    },
    evaluacion: {
        nombre: grade.evaluacion?.nombre,
        fecha: grade.evaluacion?.fecha,
    },
});

// Una nota es "válida" para mostrar si su evaluación y el usuario del estudiante siguen vivos.
const isGradeDisplayable = (grade) => Boolean(grade.evaluacion && grade.estudiante?.usuario);

export const createEvaluationGrade = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const { email, nombreMateria, nombreEvaluacion, calificacion } = req.body;

        const createdGrade = await evaluationGradeService.createEvaluationGrade({
            email,
            nombreMateria,
            nombreEvaluacion,
            calificacion,
        });

        return sendSuccess(res, 201, 'Calificación creada con éxito', formatEvaluationGradeResponse(createdGrade));
    } catch (error) {
        next(error);
    }
};

export const getAllEvaluationGrades = async (req, res, next) => {
    try {
        const { page, limit } = req.query;
        const { data, pagination } = await evaluationGradeService.getAllEvaluationGrades(page, limit, req.user);
        const items = data.filter(isGradeDisplayable).map(formatEvaluationGradeResponse);
        return sendSuccess(res, 200, 'Calificaciones obtenidas con éxito', { items, pagination });
    } catch (error) {
        next(error);
    }
};

export const getEvaluationGradesByStudent = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const { email } = req.query;
        const grades = await evaluationGradeService.getEvaluationGradesByStudent(email, req.user);
        return sendSuccess(res, 200, 'Calificaciones obtenidas con éxito', grades.filter(isGradeDisplayable).map(formatEvaluationGradeResponse));
    } catch (error) {
        next(error);
    }
};

export const getEvaluationGradesByEvaluation = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const { nombre, nombreMateria, grado, seccion } = req.query;
        const grades = await evaluationGradeService.getEvaluationGradesByEvaluation(nombre, nombreMateria, grado, seccion);
        return sendSuccess(res, 200, 'Calificaciones obtenidas con éxito', grades.filter(isGradeDisplayable).map(formatEvaluationGradeResponse));
    } catch (error) {
        next(error);
    }
};

export const updateEvaluationGradeById = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const { email, nombreMateria, nombreEvaluacion, calificacion } = req.body;
        const updatedGrade = await evaluationGradeService.updateEvaluationGradeByStudentAndEvaluation({ email, nombreMateria, nombreEvaluacion, calificacion });
        return sendSuccess(res, 200, 'Calificación actualizada con éxito', formatEvaluationGradeResponse(updatedGrade));
    } catch (error) {
        next(error);
    }
};

export const deleteEvaluationGradeById = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const { email, nombreMateria, nombreEvaluacion } = req.body;
        const deletedGrade = await evaluationGradeService.deleteEvaluationGradeById(email, nombreMateria, nombreEvaluacion);
        return sendSuccess(res, 200, 'Calificación eliminada con éxito', formatEvaluationGradeResponse(deletedGrade));
    } catch (error) {
        next(error);
    }
};
