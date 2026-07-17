import express from 'express';
import * as roleController from '../controllers/role-controller.js';
import { validateToken, checkRole } from '../middlewares/auth-middleware.js';

const router = express.Router();

// Los roles son un catálogo fijo, sembrado por seedRoles.js y usado en toda la
// autorización del sistema. No se expone creación, edición ni borrado.
router.get('/', validateToken, checkRole(['admin']), roleController.getAllRoles);

export default router;
