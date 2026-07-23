import express from 'express';
import { body } from 'express-validator';
import * as evaluationController from '../controllers/evaluation.controller.js'
import { validateToken, checkRole } from '../middlewares/auth-middleware.js';
import { verifyTeacherSubject, enrichUserContext } from '../middlewares/authorization-middleware.js';
import { rejectHtml } from '../utils/xss-guard.js';
import { GRADOS_VALIDOS } from '../models/gradeSection-model.js';

// La evaluación pertenece a una clase (grado/sección). Validadores reutilizados en create/edit/delete.
const gradoValidator = body('grado').isIn(GRADOS_VALIDOS).withMessage('Grado inválido. Debe ser un número del 1 al 12.');
const seccionValidator = body('seccion').isString().isLength({ min: 1, max: 1 }).matches(/^[A-Za-z]$/).withMessage('Sección inválida.');

const router = express.Router();

router.get('/', validateToken, enrichUserContext, checkRole(['admin', 'teacher']), evaluationController.getEvaluations);
router.post('/',
    validateToken,
    enrichUserContext,
    checkRole(['admin', 'teacher']),
    verifyTeacherSubject,
    [
      body('nombre').isString().withMessage('Nombre Invalido!').custom(rejectHtml),
      body('nombreMateria').isString().withMessage('Materia Invalida!').custom(rejectHtml),
      gradoValidator,
      seccionValidator,
      body('descripcion').isString().withMessage('Descripcion Invalida!').custom(rejectHtml),
      body('fecha').isDate().withMessage('Fecha invalida! Formato aceptado: (yyyy-mm-dd)'),
      body('peso').isFloat({ gt: 0, max: 100 }).withMessage('Peso invalido! Debe ser un numero mayor que 0 y menor o igual a 100.'),
    ],
    evaluationController.newEvaluation
  );
  router.put('/',
    validateToken,
    enrichUserContext,
    checkRole(['admin', 'teacher']),
    verifyTeacherSubject,
    [
      body('nombre').isString().withMessage('Nombre Invalido!').custom(rejectHtml),
      body('nombreMateria').isString().withMessage('Materia Invalida!').custom(rejectHtml),
      gradoValidator,
      seccionValidator,
      // Campos editables: opcionales. Se actualiza solo lo que se envía (edición parcial).
      body('nuevoNombre').optional().isString().withMessage('Nombre Invalido!').custom(rejectHtml),
      body('nuevaMateria').optional().isString().withMessage('Materia Invalida!').custom(rejectHtml),
      body('descripcion').optional().isString().withMessage('Descripcion Invalida!').custom(rejectHtml),
      body('fecha').optional().isDate().withMessage('Fecha invalida! Formato aceptado: (yyyy-mm-dd)'),
      body('peso').optional().isFloat({ gt: 0, max: 100 }).withMessage('Peso invalido! Debe ser un numero mayor que 0 y menor o igual a 100.'),
    ],
    evaluationController.updateEvaluation
  );
  router.delete('/',
    validateToken,
    enrichUserContext,
    checkRole(['admin', 'teacher']),
    verifyTeacherSubject,
    [
      body('nombre').isString().withMessage('Nombre Invalido!').custom(rejectHtml),
      body('nombreMateria').isString().withMessage('Materia Invalida!').custom(rejectHtml),
      gradoValidator,
      seccionValidator,
    ],
    evaluationController.eraseEvaluation
  );

export default router;