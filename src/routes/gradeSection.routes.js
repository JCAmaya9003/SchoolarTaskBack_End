import express from 'express';
import { body } from 'express-validator';
import * as gradeSectionController from '../controllers/gradeSection.controller.js';
import { validateToken, checkRole } from '../middlewares/auth-middleware.js';
import { rejectHtml } from '../utils/xss-guard.js';
import { GRADOS_VALIDOS } from '../models/gradeSection-model.js';

const router = express.Router();

// Obtener todas las combinaciones de grado y sección - requiere autenticación
router.get('/', validateToken, gradeSectionController.getAllGradeAndSections);

// Crear un nuevo grado y sección - solo ADMIN
router.post(
    '/',
    validateToken,
    checkRole(['admin']),
    [
        body('grado').isIn(GRADOS_VALIDOS).withMessage('Grado inválido. Debe ser un número del 1 al 12.'),
        body('seccion').isString().isLength({ min: 1, max: 1 }).matches(/^[A-Za-z]$/).withMessage('Sección inválida.'),
        body('materias').isArray().withMessage('Las materias deben ser un arreglo de nombres.'),
        body('materias.*').isString().withMessage('Cada materia debe ser una cadena válida.').custom(rejectHtml),
    ],
    gradeSectionController.createGradeSection
);

// Actualizar un grado y sección - solo ADMIN
router.put(
    '/',
    validateToken,
    checkRole(['admin']),
    [
        body('grado').isIn(GRADOS_VALIDOS).withMessage('Grado inválido. Debe ser un número del 1 al 12.'),
        body('seccion').isString().isLength({ min: 1, max: 1 }).matches(/^[A-Za-z]$/).withMessage('Sección inválida.'),
        body('nuevoGrado').isIn(GRADOS_VALIDOS).withMessage('Nuevo grado inválido. Debe ser un número del 1 al 12.'),
        body('nuevaSeccion').isString().isLength({ min: 1, max: 1 }).matches(/^[A-Za-z]$/).withMessage('Nueva sección inválida.'),
        body('materias').isArray().withMessage('Las materias deben ser un arreglo de nombres.'),
        body('materias.*').isString().withMessage('Cada materia debe ser una cadena válida.').custom(rejectHtml),
    ],
    gradeSectionController.updateGradeAndSection
);

// Eliminar un grado y sección - solo ADMIN
router.delete(
    '/',
    validateToken,
    checkRole(['admin']),
    [
        body('grado').isIn(GRADOS_VALIDOS).withMessage('Grado inválido. Debe ser un número del 1 al 12.'),
        body('seccion').isString().isLength({ min: 1, max: 1 }).matches(/^[A-Za-z]$/).withMessage('Sección inválida.'),
        // Borrado en dos pasos: sin esto, si la clase está en uso responde 409 con el impacto
        body('confirmar').optional().isBoolean().withMessage('Confirmar debe ser true o false.'),
    ],
    gradeSectionController.deleteGradeAndSection
);

// Agregar materias a un grado y sección - solo ADMIN
router.post(
    '/add-subjects',
    validateToken,
    checkRole(['admin']),
    [
        body('grado').isIn(GRADOS_VALIDOS).withMessage('Grado inválido. Debe ser un número del 1 al 12.'),
        body('seccion').isString().isLength({ min: 1, max: 1 }).matches(/^[A-Za-z]$/).withMessage('Sección inválida.'),
        body('materias').isArray().withMessage('Las materias deben ser un arreglo de nombres.'),
        body('materias.*').isString().withMessage('Cada materia debe ser una cadena válida.').custom(rejectHtml),
    ],
    gradeSectionController.addSubjectsToGradeSection
);

// Eliminar materias de un grado y sección - solo ADMIN
router.post(
    '/remove-subjects',
    validateToken,
    checkRole(['admin']),
    [
        body('grado').isIn(GRADOS_VALIDOS).withMessage('Grado inválido. Debe ser un número del 1 al 12.'),
        body('seccion').isString().isLength({ min: 1, max: 1 }).matches(/^[A-Za-z]$/).withMessage('Sección inválida.'),
        body('materias').isArray().withMessage('Las materias deben ser un arreglo de nombres.'),
        body('materias.*').isString().withMessage('Cada materia debe ser una cadena válida.').custom(rejectHtml),
    ],
    gradeSectionController.removeSubjectsFromGradeSection
);

export default router;
