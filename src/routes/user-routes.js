import express from 'express';
import { body, param } from 'express-validator';
import { login, updateUser, deleteUser, getAllUsers, getUserRole, getUserInfo, restoreUser, changeUserRole, forgotPassword, resetPassword, getMe } from '../controllers/user-controller.js';
import { validateToken, checkRole } from '../middlewares/auth-middleware.js';
import { authLimiter } from '../middlewares/rate-limiter.js';
import { verifyOwnResource, enrichUserContext } from '../middlewares/authorization-middleware.js';
import { rejectHtml } from '../utils/xss-guard.js';
import { GRADOS_VALIDOS } from '../models/gradeSection-model.js';

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

// El auto-registro publico se elimino: en un colegio la matricula es un acto administrativo.
// Los usuarios los crea el admin desde POST /students, /teachers y /parents, que ademas crean
// el perfil completo. Ver el comentario en el controller para el detalle.

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
 *         description: Respuesta genérica de éxito. Por diseño (anti-enumeración) responde lo mismo exista o no el email; si el email está registrado, se le envía el enlace de recuperación.
 *       400:
 *         description: Email con formato inválido
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

// Rutas protegidas, requieren autenticación

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
 *     summary: Obtener todos los usuarios, solo admin
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
    // La contraseña es opcional al editar: corregir el domicilio de un alumno no debería
    // obligar a mandar (y por lo tanto pisar) su contraseña. Solo se cambia si se envía.
    body('password').optional().isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
    body('genero').isString().matches(/^(Masculino|Femenino)$/).withMessage('Género inválido. Valores aceptados: Masculino, Femenino.'),
    body('domicilio').isString().withMessage('Domicilio Incorrecto').custom(rejectHtml),
    body('nacionalidad').isString().withMessage('Nacionalidad Incorrecto').custom(rejectHtml),
    body('rolNombre').isString().withMessage('Rol inválido.'),
  ],
  updateUser
);

/**
 * @swagger
 * /users:
 *   delete:
 *     summary: Eliminar usuario con soft delete, solo admin
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
 *         description: Usuario eliminado con soft delete
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
 * /users/change-role:
 *   patch:
 *     summary: Cambiar el rol de un usuario migrando su perfil, solo admin
 *     description: >
 *       Borra el perfil del rol viejo y crea el del rol nuevo. Como cada perfil exige campos
 *       propios que los otros no tienen, hay que mandar los datos que pide el rol destino:
 *       student (email_padre, grado, seccion, alergias, condiciones_medicas, contacto_emergencia),
 *       teacher (asignaciones, telefono, especialidad), parent (telefono, telefono_trabajo,
 *       lugar_trabajo, profesion). El rol admin no lleva datos de perfil.
 *     tags: [Usuarios]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Rol cambiado y perfil migrado
 *       404:
 *         description: Usuario, rol o datos referenciados inexistentes
 *       409:
 *         description: El usuario ya tiene ese rol o ya tiene el perfil destino
 */
router.patch('/change-role',
  validateToken,
  checkRole(['admin']),
  [
    body('email').isEmail().withMessage('Email inválido'),
    body('nuevoRol').isIn(['admin', 'teacher', 'parent', 'student']).withMessage('Rol inválido.'),

    // Datos del perfil destino: cada bloque solo aplica si se migra a ese rol
    body('email_padre').if(body('nuevoRol').equals('student')).isEmail().withMessage('Email del padre inválido'),
    body('grado').if(body('nuevoRol').equals('student')).isIn(GRADOS_VALIDOS).withMessage('Grado inválido. Debe ser un número del 1 al 12.'),
    body('seccion').if(body('nuevoRol').equals('student')).isString().isLength({ min: 1, max: 1 }).matches(/^[A-Za-z]$/).withMessage('Sección inválida.'),
    body('alergias').if(body('nuevoRol').equals('student')).isString().withMessage('Alergia/s Invalida/s!').custom(rejectHtml),
    body('condiciones_medicas').if(body('nuevoRol').equals('student')).isString().withMessage('Condiciones Medicas Invalidas!').custom(rejectHtml),
    body('contacto_emergencia.nombre').if(body('nuevoRol').equals('student')).isString().matches(/^[A-Za-z\s]+$/).withMessage('Nombre del contacto de emergencia inválido!'),
    body('contacto_emergencia.telefono').if(body('nuevoRol').equals('student')).isString().matches(/^\+?[1-9]\d{1,14}$/).withMessage('Teléfono inválido. Debe incluir el prefijo del país (e.g., +50312345678).'),

    body('asignaciones').if(body('nuevoRol').equals('teacher')).isArray().withMessage('Asignaciones debe ser un arreglo.'),
    body('asignaciones.*.materias').if(body('nuevoRol').equals('teacher')).isArray().withMessage('Materias debe ser un arreglo de cadenas.'),
    body('asignaciones.*.materias.*').if(body('nuevoRol').equals('teacher')).isString().withMessage('Cada materia debe ser una cadena.').custom(rejectHtml),
    body('asignaciones.*.grado').if(body('nuevoRol').equals('teacher')).isIn(GRADOS_VALIDOS).withMessage('Grado inválido. Debe ser un número del 1 al 12.'),
    body('asignaciones.*.seccion').if(body('nuevoRol').equals('teacher')).isString().isLength({ min: 1, max: 1 }).matches(/^[A-Za-z]$/).withMessage('Sección inválida.'),
    body('especialidad').if(body('nuevoRol').equals('teacher')).isString().withMessage('Especialidad inválida.').custom(rejectHtml),

    body('telefono_trabajo').if(body('nuevoRol').equals('parent')).isString().matches(/^\+?[1-9]\d{1,14}$/).withMessage('Teléfono de trabajo inválido.'),
    body('lugar_trabajo').if(body('nuevoRol').equals('parent')).isString().withMessage('Lugar de Trabajo Invalido').custom(rejectHtml),
    body('profesion').if(body('nuevoRol').equals('parent')).isString().matches(/^[A-Za-z\s]+$/).withMessage('Profesion Incorrecta! No use caracteres especiales!'),

    // teacher y parent piden teléfono; student no lo lleva a nivel de perfil
    body('telefono')
      .if(body('nuevoRol').custom((valor) => ['teacher', 'parent'].includes(valor)))
      .isString().matches(/^\+?[1-9]\d{1,14}$/).withMessage('Teléfono inválido. Debe incluir el prefijo del país (e.g., +50312345678).'),
  ],
  changeUserRole
);

/**
 * @swagger
 * /users/restore:
 *   patch:
 *     summary: Restaurar usuario eliminado, solo admin
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