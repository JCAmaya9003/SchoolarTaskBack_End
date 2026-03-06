import express from 'express';
import { body } from 'express-validator';
import * as evaluationController from '../controllers/evaluation.controller.js'
import { validateToken, checkRole } from '../middlewares/auth-middleware.js';

const router = express.Router();

router.get('/', validateToken, checkRole(['admin', 'teacher']), evaluationController.getEvaluations);
router.post('/',
    validateToken,
    checkRole(['admin', 'teacher']),
    [
      body('nombre').isString().withMessage('Nombre Invalido!'),
      body('descripcion').isString().withMessage('Descripcion Invalida!'),
      body('fecha').isDate().withMessage('Fecha invalida! Formato aceptado: (yyyy-mm-dd)'),
      body('peso').isNumeric().withMessage('Peso invalido! Tiene que ser en formato decimal'),
    ],
    evaluationController.newEvaluation
  );
  router.put('/',
    validateToken,
    checkRole(['admin', 'teacher']),
    [
      body('nombre').isString().withMessage('Nombre Invalido!'),
      body('nuevoNombre').isString().withMessage('Nombre Invalido!'),
      body('descripcion').isString().withMessage('Descripcion Invalida!'),
      body('fecha').isDate().withMessage('Fecha invalida! Formato aceptado: (yyyy-mm-dd)'),
      body('peso').isNumeric().withMessage('Peso invalido! Tiene que ser en formato decimal'),
    ],
    evaluationController.updateEvaluation
  );
  router.delete('/',
    validateToken,
    checkRole(['admin', 'teacher']),
    [
      body('nombre').isString().withMessage('Nombre Invalido!'),
    ],
    evaluationController.eraseEvaluation
  );

export default router;