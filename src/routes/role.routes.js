import express from 'express';
import * as roleController from '../controllers/role-controller.js';
import { validateToken, checkRole } from '../middlewares/auth-middleware.js';

const router = express.Router();

// Los roles son un catálogo fijo (los 4 sembrados por seedRoles.js) usado en toda la
// autorización del sistema; no se exponen creación/edición/borrado (ver ADR en handoff).
router.get('/', validateToken, checkRole(['admin']), roleController.getAllRoles);

export default router;
