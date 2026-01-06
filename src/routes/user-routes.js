import express from 'express';
import { body } from 'express-validator';
import { login, register, updateUser, deleteUser, getAllUsers, getUserRole } from '../controllers/user-controller.js';
import * as middleware from '../middlewares/auth-middleware.js'

const router = express.Router();

router.get('/', getAllUsers);
router.post(
  '/login',
  [
    
    body('email').isEmail().withMessage('Email inválido'),
    body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  ],
  login
);

router.post(
  '/register',
  [
    body('nombre').isString().matches(/^[A-Za-z\s]+$/).withMessage('Nombre Invalido! No use caracteres especiales!'),
    body('apellido').isString().matches(/^[A-Za-z\s]+$/).withMessage('Apellido Invalido! No use caracteres especiales!'),
    body('fecha_nacimiento').isDate().withMessage('Fecha de nacimiento invalida! Formato aceptado: (yyyy-mm-dd)'),
    body('email').isEmail().withMessage('Email inválido'),
    body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
    body('genero').isString().matches(/^[A-Za-z\s]+$/).withMessage('Nombre Invalido! Generos validos: "Masculino" y "Femenino"'),
    body('domicilio').isString().withMessage('Domicilio Incorrecto'),
    body('nacionalidad').isString().withMessage('Nacionalidad Incorrecto'),
  ],
  register
);
router.put('/' ,
  [
    body('nombre').isString().matches(/^[A-Za-z\s]+$/).withMessage('Nombre Invalido! No use caracteres especiales!'),
    body('apellido').isString().matches(/^[A-Za-z\s]+$/).withMessage('Apellido Invalido! No use caracteres especiales!'),
    body('fecha_nacimiento').isDate().withMessage('Fecha de nacimiento invalida! Formato aceptado: (yyyy-mm-dd)'),
    body('email').isEmail().withMessage('Email inválido'),
    body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
    body('genero').isString().matches(/^[A-Za-z\s]+$/).withMessage('Nombre Invalido! Generos validos: "Masculino" y "Femenino"'),
    body('domicilio').isString().withMessage('Domicilio Incorrecto'),
    body('nacionalidad').isString().withMessage('Nacionalidad Incorrecto'),
  ],
  updateUser);
router.delete('/',
  [
    body('email').isEmail().withMessage('Email inválido'),
  ],
deleteUser);
router.get('/get-role', getUserRole);
router.get('/validate-token', middleware.validateToken)

export default router;