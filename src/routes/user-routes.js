import express from 'express';
import { body, param } from 'express-validator';
import { login, register, updateUser, deleteUser, getAllUsers, getUserRole, getUserInfo, restoreUser, forgotPassword, resetPassword, getMe } from '../controllers/user-controller.js';
import { validateToken, checkRole } from '../middlewares/auth-middleware.js';
import { authLimiter } from '../middlewares/rate-limiter.js';
import { verifyOwnResource, enrichUserContext } from '../middlewares/authorization-middleware.js';

const router = express.Router();

/**
 * @swagger
 * /users/login:
 *   post:
 *     summary: Iniciar sesión
 *     tags: [Usuarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Login exitoso, retorna JWT token
 *       401:
 *         description: Credenciales inválidas
 *       429:
 *         description: Demasiados intentos
 */
router.post(
  '/login',
  authLimiter,
  [
    body('email').isEmail().withMessage('Email inválido'),
    body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  ],
  login
);

/**
 * @swagger
 * /users/register:
 *   post:
 *     summary: Registrar nuevo usuario
 *     tags: [Usuarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: Usuario creado exitosamente
 *       400:
 *         description: Datos de validación inválidos
 *       429:
 *         description: Demasiados intentos
 */
router.post(
  '/register',
  authLimiter,
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

/**
 * @swagger
 * /users/forgot-password:
 *   post:
 *     summary: Solicitar recuperación de contraseña
 *     tags: [Usuarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Token de reset generado
 *       500:
 *         description: Email no encontrado
 */
router.post(
  '/forgot-password',
  authLimiter,
  [
    body('email').isEmail().withMessage('Email inválido'),
  ],
  forgotPassword
);

/**
 * @swagger
 * /users/reset-password/{token}:
 *   post:
 *     summary: Restablecer contraseña con token
 *     tags: [Usuarios]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Token de reset recibido
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [password]
 *             properties:
 *               password:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Contraseña actualizada
 *       400:
 *         description: Token inválido o expirado
 */
router.post(
  '/reset-password/:token',
  authLimiter,
  [
    param('token').isHexadecimal().isLength({ min: 64, max: 64 }).withMessage('Token inválido'),
    body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  ],
  resetPassword
);

// Rutas protegidas (requieren autenticación)

/**
 * @swagger
 * /users/me:
 *   get:
 *     summary: Obtener el usuario autenticado actual
 *     tags: [Usuarios]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Email del usuario autenticado
 *       401:
 *         description: No autenticado
 */
router.get('/me', validateToken, getMe);

router.get('/get-role', validateToken, getUserRole);

router.post('/get-info',
  validateToken,
  enrichUserContext,
  verifyOwnResource('body'),
  [
    body('email').isEmail().withMessage('Email inválido'),
    body('rolNombre').isString().withMessage('Rol requerido'),
  ],
  getUserInfo
);

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Obtener todos los usuarios (solo admin)
 *     tags: [Usuarios]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Lista paginada de usuarios
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Sin permisos
 */
router.get('/', validateToken, checkRole(['admin']), getAllUsers);

router.put('/', 
  validateToken,
  checkRole(['admin']),
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
  updateUser
);

/**
 * @swagger
 * /users:
 *   delete:
 *     summary: Eliminar usuario - soft delete (solo admin)
 *     tags: [Usuarios]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Usuario eliminado (soft delete)
 *       404:
 *         description: Usuario no encontrado
 */
router.delete('/',
  validateToken,
  checkRole(['admin']),
  [
    body('email').isEmail().withMessage('Email inválido'),
  ],
  deleteUser
);

/**
 * @swagger
 * /users/restore:
 *   patch:
 *     summary: Restaurar usuario eliminado (solo admin)
 *     tags: [Usuarios]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Usuario restaurado
 *       404:
 *         description: No se encontró usuario eliminado
 */
router.patch('/restore',
  validateToken,
  checkRole(['admin']),
  [
    body('email').isEmail().withMessage('Email inválido'),
  ],
  restoreUser
);

export default router;