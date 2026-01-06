import express from 'express';
import { body, param } from 'express-validator';
import * as evaluation_gradeController from '../controllers/evaluation_grade.controller.js';

const router = express.Router();

router.post(
    '/',
    [
        body('email').isEmail().withMessage('El email debe ser válido.'),
        body('nombreMateria').isString().withMessage('El nombre de la materia debe ser una cadena válida.'),
        body('nombreEvaluacion').isString().withMessage('El nombre de la evaluación debe ser una cadena válida.'),
        body('calificacion').isNumeric().withMessage('La calificación debe ser un número.').custom((value) => value >= 0 && value <= 10).withMessage('La calificación debe estar entre 0 y 10.'),
    ],
    evaluation_gradeController.createEvaluationGrade
);

// Ruta para obtener todas las calificaciones de evaluación
router.get('/all', evaluation_gradeController.getAllEvaluationGrades);

// Ruta para obtener calificaciones de un estudiante por email
router.get(
    '/by-student',
    [
        param('email').isEmail().withMessage('El email debe ser válido.'),
    ],
    evaluation_gradeController.getEvaluationGradesByStudent
);

// Ruta para obtener calificaciones de una evaluación por su nombre y materia
router.get(
    '/by-evaluation',
    [
        param('nombre').isString().withMessage('El nombre de la evaluación debe ser una cadena válida.'),
        param('nombreMateria').isString().withMessage('El nombre de la materia debe ser una cadena válida.'),
    ],
    evaluation_gradeController.getEvaluationGradesByEvaluation
);

// Ruta para actualizar una calificación por ID
router.put(
    '/',
    [
        body('email').isEmail().withMessage('El email debe ser válido.'),
        body('nombreMateria').isString().withMessage('El nombre de la materia debe ser una cadena válida.'),
        body('nombreEvaluacion').isString().withMessage('El nombre de la evaluación debe ser una cadena válida.'),
        body('calificacion').isNumeric().withMessage('La calificación debe ser un número.').custom((value) => value >= 0 && value <= 10)
    ],
    evaluation_gradeController.updateEvaluationGradeById
);

// Ruta para eliminar una calificación por email, materia y evaluación
router.delete(
    '/',
    [
        body('email').isEmail().withMessage('El email debe ser válido.'),
        body('nombreMateria').isString().withMessage('El nombre de la materia debe ser una cadena válida.'),
        body('nombreEvaluacion').isString().withMessage('El nombre de la evaluación debe ser una cadena válida.'),
    ],
    evaluation_gradeController.deleteEvaluationGradeById
);

export default router;
