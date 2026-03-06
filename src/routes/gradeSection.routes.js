import express from 'express';
import { body } from 'express-validator';
import * as gradeSectionController from '../controllers/gradeSection.controller.js';
import { validateToken, checkRole } from '../middlewares/auth-middleware.js';

const router = express.Router();

// Obtener todas las combinaciones de grado y sección - requiere autenticación
router.get('/all', validateToken, gradeSectionController.getAllGradeAndSections);

// Crear un nuevo grado y sección - solo ADMIN
router.post(
    '/create',
    validateToken,
    checkRole(['admin']),
    [
        body('grado').isString().withMessage('Grado inválido.'),
        body('seccion').isString().isLength({ min: 1, max: 1 }).matches(/^[A-Za-z]$/).withMessage('Sección inválida.'),
        body('materias').isArray().withMessage('Las materias deben ser un arreglo de nombres.'),
        body('materias.*').isString().withMessage('Cada materia debe ser una cadena válida.'),
    ],
    gradeSectionController.createGradeSection
);

// Actualizar un grado y sección - solo ADMIN
router.put(
    '/update',
    validateToken,
    checkRole(['admin']),
    [
        body('grado').isString().withMessage('Grado inválido.'),
        body('seccion').isString().isLength({ min: 1, max: 1 }).matches(/^[A-Za-z]$/).withMessage('Sección inválida.'),
        body('nuevoGrado').isString().withMessage('Nuevo grado inválido.'),
        body('nuevaSeccion').isString().isLength({ min: 1, max: 1 }).matches(/^[A-Za-z]$/).withMessage('Nueva sección inválida.'),
        body('materias').isArray().withMessage('Las materias deben ser un arreglo de nombres.'),
        body('materias.*').isString().withMessage('Cada materia debe ser una cadena válida.'),
    ],
    gradeSectionController.updateGradeAndSection
);

// Eliminar un grado y sección - solo ADMIN
router.delete(
    '/delete',
    validateToken,
    checkRole(['admin']),
    [
        body('grado').isString().withMessage('Grado inválido.'),
        body('seccion').isString().isLength({ min: 1, max: 1 }).matches(/^[A-Za-z]$/).withMessage('Sección inválida.'),
    ],
    gradeSectionController.deleteGradeAndSection
);

// Agregar materias a un grado y sección - solo ADMIN
router.post(
    '/add-subjects',
    validateToken,
    checkRole(['admin']),
    [
        body('grado').isString().withMessage('Grado inválido.'),
        body('seccion').isString().isLength({ min: 1, max: 1 }).matches(/^[A-Za-z]$/).withMessage('Sección inválida.'),
        body('materias').isArray().withMessage('Las materias deben ser un arreglo de nombres.'),
        body('materias.*').isString().withMessage('Cada materia debe ser una cadena válida.'),
    ],
    gradeSectionController.addSubjectsToGradeSection
);

// Eliminar materias de un grado y sección - solo ADMIN
router.post(
    '/remove-subjects',
    validateToken,
    checkRole(['admin']),
    [
        body('grado').isString().withMessage('Grado inválido.'),
        body('seccion').isString().isLength({ min: 1, max: 1 }).matches(/^[A-Za-z]$/).withMessage('Sección inválida.'),
        body('materias').isArray().withMessage('Las materias deben ser un arreglo de nombres.'),
        body('materias.*').isString().withMessage('Cada materia debe ser una cadena válida.'),
    ],
    gradeSectionController.removeSubjectsFromGradeSection
);

export default router;
