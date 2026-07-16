import * as evaluationGradeService from '../services/evaluation_grade.service.js';
import { sendSuccess } from '../utils/apiResponse.js';

const formatEvaluationGradeResponse = (grade) => ({
    id: grade._id,
    calificacion: grade.calificacion,
    estudiante: {
        nombre: grade.estudiante.usuario.nombre,
        apellido: grade.estudiante.usuario.apellido,
        email: grade.estudiante.usuario.email,
    },
    evaluacion: {
        nombre: grade.evaluacion.nombre,
        fecha: grade.evaluacion.fecha,
    },
});

export const createEvaluationGrade = async (req, res, next) => {
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
        return sendSuccess(res, 200, 'Calificaciones obtenidas con éxito', { items: data.map(formatEvaluationGradeResponse), pagination });
    } catch (error) {
        next(error);
    }
};

export const getEvaluationGradesByStudent = async (req, res, next) => {
    try {
        const { email } = req.query;
        const grades = await evaluationGradeService.getEvaluationGradesByStudent(email);
        return sendSuccess(res, 200, 'Calificaciones obtenidas con éxito', grades.map(formatEvaluationGradeResponse));
    } catch (error) {
        next(error);
    }
};

export const getEvaluationGradesByEvaluation = async (req, res, next) => {
    try {
        const { nombre, nombreMateria } = req.query;
        const grades = await evaluationGradeService.getEvaluationGradesByEvaluation(nombre, nombreMateria);
        return sendSuccess(res, 200, 'Calificaciones obtenidas con éxito', grades.map(formatEvaluationGradeResponse));
    } catch (error) {
        next(error);
    }
};

export const updateEvaluationGradeById = async (req, res, next) => {
    try {
        const { email, nombreMateria, nombreEvaluacion, calificacion } = req.body;
        const updatedGrade = await evaluationGradeService.updateEvaluationGradeByStudentAndEvaluation({ email, nombreMateria, nombreEvaluacion, calificacion });
        return sendSuccess(res, 200, 'Calificación actualizada con éxito', formatEvaluationGradeResponse(updatedGrade));
    } catch (error) {
        next(error);
    }
};

export const deleteEvaluationGradeById = async (req, res, next) => {
    try {
        const { email, nombreMateria, nombreEvaluacion } = req.body;
        const deletedGrade = await evaluationGradeService.deleteEvaluationGradeById(email, nombreMateria, nombreEvaluacion);
        return sendSuccess(res, 200, 'Calificación eliminada con éxito', formatEvaluationGradeResponse(deletedGrade));
    } catch (error) {
        next(error);
    }
};
