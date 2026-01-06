import express from 'express';
import { body } from 'express-validator';
import * as roleController from '../controllers/role-controller.js';

const router = express.Router();

router.get('/all', roleController.getAllRoles);
router.post('/create',
  [
    body('nombre').isString().withMessage('Nombre Invalido!'),
    body('permisos.student').optional().isBoolean().withMessage('student debe ser un valor booleano.'),
    body('permisos.parent').optional().isBoolean().withMessage('parent debe ser un valor booleano.'),
    body('permisos.teacher').optional().isBoolean().withMessage('teacher debe ser un valor booleano.'),
    body('permisos.admin').optional().isBoolean().withMessage('admin debe ser un valor booleano.'),
  ],
  roleController.createNewRole
);

router.put('/update',
    [
      body('nombre').isString().withMessage('Nombre Invalido!'),
      body('permisos.student').optional().isBoolean().withMessage('student debe ser un valor booleano.'),
      body('permisos.parent').optional().isBoolean().withMessage('parent debe ser un valor booleano.'),
      body('permisos.teacher').optional().isBoolean().withMessage('teacher debe ser un valor booleano.'),
      body('permisos.admin').optional().isBoolean().withMessage('admin debe ser un valor booleano.'),
    ],
    roleController.editRole
);

router.delete('/delete',
    [
        body('nombre').isString().withMessage('Nombre Invalido!'),
    ],
    roleController.deleteRole
)

export default router;