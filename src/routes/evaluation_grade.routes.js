import express from 'express';
import { body, query } from 'express-validator';
import * as evaluation_gradeController from '../controllers/evaluation_grade.controller.js';
import { validateToken, checkRole } from '../middlewares/auth-middleware.js';
import { verifyTeacherSubject, verifyOwnResource, enrichUserContext } from '../middlewares/authorization-middleware.js';

const router = express.Router();

router.post(
    '/',
    validateToken,
    enrichUserContext,
    checkRole(['admin', 'teacher']),
    verifyTeacherSubject,
    [
        body('email').isEmail().withMessage('El email debe ser válido.'),
        body('nombreMateria').isString().withMessage('El nombre de la materia debe ser una cadena válida.'),
        body('nombreEvaluacion').isString().withMessage('El nombre de la evaluación debe ser una cadena válida.'),
        body('calificacion').isNumeric().withMessage('La calificación debe ser un número.').custom((value) => value >= 0 && value <= 10).withMessage('La calificación debe estar entre 0 y 10.'),
    ],
    evaluation_gradeController.createEvaluationGrade
);

// Ruta para obtener todas las calificaciones de evaluación
router.get('/all', validateToken, checkRole(['admin', 'teacher']), evaluation_gradeController.getAllEvaluationGrades);

// Ruta para obtener calificaciones de un estudiante por email
router.get(
    '/by-student',
    validateToken,
    enrichUserContext,
    checkRole(['admin', 'teacher', 'student']),
    verifyOwnResource('query'),
    [
        query('email').isEmail().withMessage('El email debe ser válido.'),
    ],
    evaluation_gradeController.getEvaluationGradesByStudent
);

// Ruta para obtener calificaciones de una evaluación por su nombre y materia
router.get(
    '/by-evaluation',
    validateToken,
    enrichUserContext,
    checkRole(['admin', 'teacher']),
    verifyTeacherSubject,
    [
        query('nombre').isString().withMessage('El nombre de la evaluación debe ser una cadena válida.'),
        query('nombreMateria').isString().withMessage('El nombre de la materia debe ser una cadena válida.'),
    ],
    evaluation_gradeController.getEvaluationGradesByEvaluation
);

// Ruta para actualizar una calificación por ID
router.put(
    '/',
    validateToken,
    enrichUserContext,
    checkRole(['admin', 'teacher']),
    verifyTeacherSubject,
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
    validateToken,
    enrichUserContext,
    checkRole(['admin', 'teacher']),
    verifyTeacherSubject,
    [
        body('email').isEmail().withMessage('El email debe ser válido.'),
        body('nombreMateria').isString().withMessage('El nombre de la materia debe ser una cadena válida.'),
        body('nombreEvaluacion').isString().withMessage('El nombre de la evaluación debe ser una cadena válida.'),
    ],
    evaluation_gradeController.deleteEvaluationGradeById
);

export default router;
