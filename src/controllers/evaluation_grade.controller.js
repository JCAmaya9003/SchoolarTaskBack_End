import * as evaluationGradeService from '../services/evaluation_grade.service.js';

export const createEvaluationGrade = async (req, res) => {
    try {
        const { email, nombreMateria, nombreEvaluacion, calificacion } = req.body;

        const createdGrade = await evaluationGradeService.createEvaluationGrade({
            email,
            nombreMateria,
            nombreEvaluacion,
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

export const getEvaluationGradesByStudent = async (req, res) => {
    try {
        const { email } = req.query;
        console.log(email);
        const grades = await evaluationGradeService.getEvaluationGradesByStudent(email);

        return res.status(200).json(grades);
    } catch (error) {
        return res.status(500).json({
            message: 'Error al obtener las calificaciones del estudiante',
            error: error.message,
        });
    }
};


export const getEvaluationGradesByEvaluation = async (req, res) => {
    try {
        const { nombreEvaluacion, nombreMateria } = req.query;
        const grades = await evaluationGradeService.getEvaluationGradesByEvaluation(nombreEvaluacion, nombreMateria);

        return res.status(200).json(grades);
    } catch (error) {
        return res.status(500).json({
            message: 'Error al obtener las calificaciones de la evaluación',
            error: error.message,
        });
    }
};


export const updateEvaluationGradeById = async (req, res) => {
    try {
        const { email, nombreMateria, nombreEvaluacion, calificacion } = req.body;
        console.log(email, nombreMateria, nombreEvaluacion, calificacion)
        const updatedGrade = await evaluationGradeService.updateEvaluationGradeByStudentAndEvaluation( {email, nombreMateria, nombreEvaluacion, calificacion});

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


export const deleteEvaluationGradeById = async (req, res) => {
    try {
        const { email, nombreMateria, nombreEvaluacion } = req.body;

        const deletedGrade = await evaluationGradeService.deleteEvaluationGradeById(email, nombreMateria, nombreEvaluacion);

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
