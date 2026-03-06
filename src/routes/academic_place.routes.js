import express from 'express';
import { body } from 'express-validator';
import * as academic_placeController from '../controllers/academic_place.controller.js';
import { validateToken, checkRole } from '../middlewares/auth-middleware.js';

const router = express.Router();
router.get('/all', validateToken, checkRole(['admin', 'teacher']), academic_placeController.getAllPlaces);
router.post('/create',
    validateToken,
    checkRole(['admin']),
    [
      body('lugar').isString().withMessage('Lugar Invalido!'),
    ],
    academic_placeController.createNewPlace
  );
router.put('/update',
    validateToken,
    checkRole(['admin']),
    [
      body('lugar').isString().withMessage('Lugar Invalido!'),
      body('nuevoLugar').isString().withMessage('Nuevo Lugar Invalido!'),
    ],
    academic_placeController.editPlace
  );
router.delete('/delete',
    validateToken,
    checkRole(['admin']),
    [
      body('lugar').isString().withMessage('Lugar Invalido!'),
    ],
    academic_placeController.deletePlace
  );

router.post('/get-name', validateToken, checkRole(['admin', 'teacher']), academic_placeController.getPlaceNameById);

  export default router;