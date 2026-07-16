import express from 'express';
import { body } from 'express-validator';
import * as evaluationController from '../controllers/evaluation.controller.js'
import { validateToken, checkRole } from '../middlewares/auth-middleware.js';
import { verifyTeacherSubject, enrichUserContext } from '../middlewares/authorization-middleware.js';

const router = express.Router();

router.get('/', validateToken, enrichUserContext, checkRole(['admin', 'teacher']), evaluationController.getEvaluations);
router.post('/',
    validateToken,
    enrichUserContext,
    checkRole(['admin', 'teacher']),
    verifyTeacherSubject,
    [
      body('nombre').isString().withMessage('Nombre Invalido!'),
      body('nombreMateria').isString().withMessage('Materia Invalida!'),
      body('descripcion').isString().withMessage('Descripcion Invalida!'),
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
      body('nombre').isString().withMessage('Nombre Invalido!'),
      body('nuevoNombre').isString().withMessage('Nombre Invalido!'),
      body('nombreMateria').isString().withMessage('Materia Invalida!'),
      body('nuevaMateria').isString().withMessage('Materia Invalida!'),
      body('descripcion').isString().withMessage('Descripcion Invalida!'),
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
      body('nombre').isString().withMessage('Nombre Invalido!'),
      body('nombreMateria').isString().withMessage('Materia Invalida!'),
    ],
    evaluationController.eraseEvaluation
  );

export default router;