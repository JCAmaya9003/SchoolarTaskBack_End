import express from 'express';
import { body } from 'express-validator';
import * as subjectController from '../controllers/subject.controller.js';

const router = express.Router();
router.get('/', subjectController.getAllSubjects);
router.post('/',
    [
      body('nombre').isString().withMessage('Nombre Invalido!'),
    ],
    subjectController.createNewSubject
  );
router.put('/',
    [
      body('nombre').isString().withMessage('Nombre Invalido!'),
      body('nuevoNombre').isString().withMessage('Nuevo Nombre Invalido!'),
    ],
    subjectController.editSubject
  );
router.delete('/',
    [
      body('nombre').isString().withMessage('Nombre Invalido!'),
    ],
    subjectController.deleteSubject
  );

  export default router;