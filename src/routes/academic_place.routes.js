import express from 'express';
import { body } from 'express-validator';
import * as academic_placeController from '../controllers/academic_place.controller.js';

const router = express.Router();
router.get('/all', academic_placeController.getAllPlaces);
router.post('/create',
    [
      body('lugar').isString().withMessage('Lugar Invalido!'),
    ],
    academic_placeController.createNewPlace
  );
router.put('/update',
    [
      body('lugar').isString().withMessage('Lugar Invalido!'),
      body('nuevoLugar').isString().withMessage('Nuevo Lugar Invalido!'),
    ],
    academic_placeController.editPlace
  );
router.delete('/delete',
    [
      body('lugar').isString().withMessage('Lugar Invalido!'),
    ],
    academic_placeController.deletePlace
  );

router.post('/get-name', academic_placeController.getPlaceNameById);

  export default router;