import express from 'express';
import { body } from 'express-validator';
import * as gradeSectionController from '../controllers/gradeSection.controller.js';

const router = express.Router();

// Obtener todas las combinaciones de grado y sección
router.get('/all', gradeSectionController.getAllGradeAndSections);

// Crear un nuevo grado y sección
router.post(
    '/create',
    [
        body('grado').isString().withMessage('Grado inválido.'),
        body('seccion').isString().isLength({ min: 1, max: 1 }).matches(/^[A-Za-z]$/).withMessage('Sección inválida.'),
        body('materias').isArray().withMessage('Las materias deben ser un arreglo de nombres.'),
        body('materias.*').isString().withMessage('Cada materia debe ser una cadena válida.'),
    ],
    gradeSectionController.createGradeSection
);

// Actualizar un grado y sección
router.put(
    '/update',
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

// Eliminar un grado y sección
router.delete(
    '/delete',
    [
        body('grado').isString().withMessage('Grado inválido.'),
        body('seccion').isString().isLength({ min: 1, max: 1 }).matches(/^[A-Za-z]$/).withMessage('Sección inválida.'),
    ],
    gradeSectionController.deleteGradeAndSection
);

// Agregar materias a un grado y sección
router.post(
    '/add-subjects',
    [
        body('grado').isString().withMessage('Grado inválido.'),
        body('seccion').isString().isLength({ min: 1, max: 1 }).matches(/^[A-Za-z]$/).withMessage('Sección inválida.'),
        body('materias').isArray().withMessage('Las materias deben ser un arreglo de nombres.'),
        body('materias.*').isString().withMessage('Cada materia debe ser una cadena válida.'),
    ],
    gradeSectionController.addSubjectsToGradeSection
);

// Eliminar materias de un grado y sección
router.post(
    '/remove-subjects',
    [
        body('grado').isString().withMessage('Grado inválido.'),
        body('seccion').isString().isLength({ min: 1, max: 1 }).matches(/^[A-Za-z]$/).withMessage('Sección inválida.'),
        body('materias').isArray().withMessage('Las materias deben ser un arreglo de nombres.'),
        body('materias.*').isString().withMessage('Cada materia debe ser una cadena válida.'),
    ],
    gradeSectionController.removeSubjectsFromGradeSection
);

export default router;
