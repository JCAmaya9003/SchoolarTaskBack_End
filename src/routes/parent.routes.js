import express from 'express';
import { body } from 'express-validator';
import * as parentController from '../controllers/parent.controller.js';

const router = express.Router();

router.get('/', parentController.getAllParents);


router.post(
    '/',
    [
        body('nombre').isString().matches(/^[A-Za-z\s]+$/).withMessage('Nombre Invalido! No use caracteres especiales!'),
        body('apellido').isString().matches(/^[A-Za-z\s]+$/).withMessage('Apellido Invalido! No use caracteres especiales!'),
        body('fecha_nacimiento').isDate().withMessage('Fecha de nacimiento invalida! Formato aceptado: yyyy-mm-dd'),
        body('email').isEmail().withMessage('Email inválido'),
        body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
        body('rolNombre').isString().withMessage('Rol Invalido!'),
        body('genero').isString().matches(/^[A-Za-z\s]+$/).withMessage('Nombre Invalido! Generos validos: "Masculino" y "Femenino"'),
        body('domicilio').isString().withMessage('Domicilio Incorrecto'),
        body('nacionalidad').isString().withMessage('Nacionalidad Incorrecto'),
        
        body('telefono').isString().matches(/^\+?[1-9]\d{1,14}$/).withMessage('Teléfono inválido. Debe incluir el prefijo del país y ser un número válido (e.g., +50312345678).'),
        body('telefono_trabajo').isString().matches(/^\+?[1-9]\d{1,14}$/).withMessage('Teléfono inválido. Debe incluir el prefijo del país y ser un número válido (e.g., +50312345678).'),
        body('lugar_trabajo').isString().withMessage('Lugar de Trabajo Invalido'),
        body('profesion').isString().matches(/^[A-Za-z\s]+$/).withMessage('Profesion Incorrecta! No use caracteres especiales!'),
    ],
    parentController.createParent
  );
router.put('/' ,
    [
        body('email').isEmail().withMessage('Email inválido'),
        body('telefono').isString().matches(/^\+?[1-9]\d{1,14}$/).withMessage('Teléfono inválido. Debe incluir el prefijo del país y ser un número válido (e.g., +50312345678).'),
        body('telefono_trabajo').isString().matches(/^\+?[1-9]\d{1,14}$/).withMessage('Teléfono inválido. Debe incluir el prefijo del país y ser un número válido (e.g., +50312345678).'),
        body('lugar_trabajo').isString().withMessage('Lugar de Trabajo Invalido'),
        body('profesion').isString().matches(/^[A-Za-z\s]+$/).withMessage('Profesion Incorrecta! No use caracteres especiales!'),
        
    ],
parentController.updateParent);

router.delete('/',
    [
        body('email').isEmail().withMessage('Email inválido'),
    ],
    parentController.deleteParent);

router.delete('/id',
    [
        body('id').isString().withMessage('Id inválido'),
    ],
    parentController.deleteById);

  
export default router;