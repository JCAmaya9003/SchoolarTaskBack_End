import express from 'express';
import { body } from 'express-validator';
import * as academic_placeController from '../controllers/academic_place.controller.js';
import { validateToken, checkRole } from '../middlewares/auth-middleware.js';

const router = express.Router();
router.get('/', validateToken, checkRole(['admin', 'teacher']), academic_placeController.getAllPlaces);
router.post('/',
    validateToken,
    checkRole(['admin']),
    [
      body('lugar').isString().withMessage('Lugar Invalido!'),
    ],
    academic_placeController.createNewPlace
  );
router.put('/',
    validateToken,
    checkRole(['admin']),
    [
      body('lugar').isString().withMessage('Lugar Invalido!'),
      body('nuevoLugar').isString().withMessage('Nuevo Lugar Invalido!'),
    ],
    academic_placeController.editPlace
  );
router.delete('/',
    validateToken,
    checkRole(['admin']),
    [
      body('lugar').isString().withMessage('Lugar Invalido!'),
    ],
    academic_placeController.deletePlace
  );

router.post('/get-name',
    validateToken,
    checkRole(['admin', 'teacher']),
    [
      body('id').isString().withMessage('Id inválido'),
    ],
    academic_placeController.getPlaceNameById
  );

  export default router;