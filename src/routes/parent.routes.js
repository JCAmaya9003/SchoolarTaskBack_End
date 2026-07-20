import express from 'express';
import { body } from 'express-validator';
import * as parentController from '../controllers/parent.controller.js';
import { validateToken, checkRole } from '../middlewares/auth-middleware.js';
import { rejectHtml } from '../utils/xss-guard.js';

const router = express.Router();

// Obtener todos los padres - solo ADMIN
router.get('/', validateToken, checkRole(['admin']), parentController.getAllParents);

// Crear padre - solo ADMIN
router.post(
    '/',
    validateToken,
    checkRole(['admin']),
    [
        body('nombre').isString().matches(/^[A-Za-z\s]+$/).withMessage('Nombre Invalido! No use caracteres especiales!'),
        body('apellido').isString().matches(/^[A-Za-z\s]+$/).withMessage('Apellido Invalido! No use caracteres especiales!'),
        body('fecha_nacimiento').isDate().withMessage('Fecha de nacimiento invalida! Formato aceptado: yyyy-mm-dd'),
        body('email').isEmail().withMessage('Email inválido'),
        body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
        body('rolNombre').isString().withMessage('Rol Invalido!'),
        body('genero').isString().matches(/^(Masculino|Femenino)$/).withMessage('Género inválido. Valores aceptados: Masculino, Femenino.'),
        body('domicilio').isString().withMessage('Domicilio Incorrecto').custom(rejectHtml),
        body('nacionalidad').isString().withMessage('Nacionalidad Incorrecto').custom(rejectHtml),

        body('telefono').isString().matches(/^\+?[1-9]\d{1,14}$/).withMessage('Teléfono inválido. Debe incluir el prefijo del país y ser un número válido (e.g., +50312345678).'),
        body('telefono_trabajo').isString().matches(/^\+?[1-9]\d{1,14}$/).withMessage('Teléfono inválido. Debe incluir el prefijo del país y ser un número válido (e.g., +50312345678).'),
        body('lugar_trabajo').isString().withMessage('Lugar de Trabajo Invalido').custom(rejectHtml),
        body('profesion').isString().matches(/^[A-Za-z\s]+$/).withMessage('Profesion Incorrecta! No use caracteres especiales!'),
    ],
    parentController.createParent
  );

// Actualizar padre - solo ADMIN
router.put('/',
    validateToken,
    checkRole(['admin']),
    [
        body('email').isEmail().withMessage('Email inválido'),
        body('telefono').isString().matches(/^\+?[1-9]\d{1,14}$/).withMessage('Teléfono inválido. Debe incluir el prefijo del país y ser un número válido (e.g., +50312345678).'),
        body('telefono_trabajo').isString().matches(/^\+?[1-9]\d{1,14}$/).withMessage('Teléfono inválido. Debe incluir el prefijo del país y ser un número válido (e.g., +50312345678).'),
        body('lugar_trabajo').isString().withMessage('Lugar de Trabajo Invalido').custom(rejectHtml),
        body('profesion').isString().matches(/^[A-Za-z\s]+$/).withMessage('Profesion Incorrecta! No use caracteres especiales!'),
        
    ],
    parentController.updateParent);

// Eliminar padre - solo ADMIN
router.delete('/',
    validateToken,
    checkRole(['admin']),
    [
        body('email').isEmail().withMessage('Email inválido'),
    ],
    parentController.deleteParent);

  
export default router;