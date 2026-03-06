import express from 'express';
import { body } from 'express-validator';
import * as roleController from '../controllers/role-controller.js';
import { validateToken, checkRole } from '../middlewares/auth-middleware.js';

const router = express.Router();

router.get('/all', validateToken, checkRole(['admin']), roleController.getAllRoles);
router.post('/create',
  validateToken,
  checkRole(['admin']),
  [
    body('nombre').isString().withMessage('Nombre Invalido!'),
  ],
  roleController.createNewRole
);

router.put('/update',
    validateToken,
    checkRole(['admin']),
    [
      body('nombre').isString().withMessage('Nombre Invalido!'),
    ],
    roleController.editRole
);

router.delete('/delete',
    validateToken,
    checkRole(['admin']),
    [
        body('nombre').isString().withMessage('Nombre Invalido!'),
    ],
    roleController.deleteRole
)

export default router;