import express from 'express';
import { body } from 'express-validator';
import * as evaluationController from '../controllers/evaluation.controller.js'
import { validateToken, checkRole } from '../middlewares/auth-middleware.js';
import { verifyTeacherSubject, enrichUserContext } from '../middlewares/authorization-middleware.js';
import { rejectHtml } from '../utils/xss-guard.js';

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
      body('descripcion').isString().withMessage('Descripcion Invalida!').custom(rejectHtml),
      body('fecha').isDate().withMessage('Fecha invalida! Formato aceptado: (yyyy-mm-dd)'),
      body('peso').isNumeric().withMessage('Peso invalido! Tiene que ser en formato decimal'),
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
      body('nuevoNombre').isString().withMessage('Nombre Invalido!').custom(rejectHtml),
      body('nombreMateria').isString().withMessage('Materia Invalida!').custom(rejectHtml),
      body('nuevaMateria').isString().withMessage('Materia Invalida!').custom(rejectHtml),
      body('descripcion').isString().withMessage('Descripcion Invalida!').custom(rejectHtml),
      body('fecha').isDate().withMessage('Fecha invalida! Formato aceptado: (yyyy-mm-dd)'),
      body('peso').isNumeric().withMessage('Peso invalido! Tiene que ser en formato decimal'),
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
    ],
    evaluationController.eraseEvaluation
  );

export default router;