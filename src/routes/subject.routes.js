import express from 'express';
import { body } from 'express-validator';
import * as subjectController from '../controllers/subject.controller.js';
import { validateToken, checkRole } from '../middlewares/auth-middleware.js';

const router = express.Router();

// Rutas protegidas - requieren autenticación
router.get('/', validateToken, subjectController.getAllSubjects);

// Rutas solo para ADMIN
router.post('/',
    validateToken,
    checkRole(['admin']),
    [
      body('nombre').isString().withMessage('Nombre Invalido!'),
    ],
    subjectController.createNewSubject
  );

router.put('/',
    validateToken,
    checkRole(['admin']),
    [
      body('nombre').isString().withMessage('Nombre Invalido!'),
      body('nuevoNombre').isString().withMessage('Nuevo Nombre Invalido!'),
    ],
    subjectController.editSubject
  );

router.delete('/',
    validateToken,
    checkRole(['admin']),
    [
      body('nombre').isString().withMessage('Nombre Invalido!'),
    ],
    subjectController.deleteSubject
  );

export default router;