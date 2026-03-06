import express from 'express';
import { body } from 'express-validator';
import * as studentController from '../controllers/student.controller.js';
import { validateToken, checkRole } from '../middlewares/auth-middleware.js';
import { verifyOwnResource, enrichUserContext } from '../middlewares/authorization-middleware.js';

const router = express.Router();

/**
 * @swagger
 * /students:
 *   get:
 *     summary: Obtener todos los estudiantes (solo admin)
 *     tags: [Estudiantes]
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
 *         description: Lista paginada de estudiantes
 *   post:
 *     summary: Crear nuevo estudiante (solo admin)
 *     tags: [Estudiantes]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/User'
 *               - $ref: '#/components/schemas/Student'
 *     responses:
 *       200:
 *         description: Estudiante creado
 *       500:
 *         description: Error en creación
 *   put:
 *     summary: Actualizar estudiante (solo admin)
 *     tags: [Estudiantes]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Estudiante actualizado
 *   delete:
 *     summary: Eliminar estudiante (solo admin)
 *     tags: [Estudiantes]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Estudiante eliminado
 */
router.get('/', validateToken, checkRole(['admin']), studentController.getAllStudents);

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
        body('genero').isString().matches(/^[A-Za-z\s]+$/).withMessage('Nombre Invalido! Generos validos: "Masculino" y "Femenino"'),
        body('domicilio').isString().withMessage('Domicilio Incorrecto'),
        body('nacionalidad').isString().withMessage('Nacionalidad Incorrecto'),
        body('email_padre').isEmail().withMessage('Email inválido'),
        body('grado').isString().withMessage('Grado Invalido!'),
        body('seccion').isString().isLength({ min: 1, max: 1 }).matches(/^[A-Za-z]$/).withMessage('Grado Invalido!'),
        body('alergias').isString().withMessage('Alergia/s Invalida/s!'),
        body('condiciones_medicas').isString().withMessage('Condiones Medicas Invalidas! Si no tiene debe de escribir algo!'),
        body('contacto_emergencia.nombre').isString().matches(/^[A-Za-z\s]+$/).withMessage('Nombre del contaco de emergencia invalido! No use caracteres especiales!'),
        body('contacto_emergencia.telefono').isString().matches(/^\+?[1-9]\d{1,14}$/).withMessage('Teléfono inválido. Debe incluir el prefijo del país y ser un número válido (e.g., +50312345678).'),
    ],
    studentController.createStudent
);

// Actualizar estudiante - solo ADMIN
router.put('/',
    validateToken,
    checkRole(['admin']),
    [
        body('email').isEmail().withMessage('Email inválido'),
        body('grado').isString().withMessage('Grado Invalido!'),
        body('seccion').isString().isLength({ min: 1, max: 1 }).matches(/^[A-Za-z]$/).withMessage('Grado Invalido!'),
        body('alergias').isString().withMessage('Alergia/s Invalida/s!'),
        body('condiciones_medicas').isString().withMessage('Condiones Medicas Invalidas! Si no tiene debe de escribir algo!'),
        body('contacto_emergencia.nombre').isString().matches(/^[A-Za-z\s]+$/).withMessage('Nombre del contaco de emergencia invalido! No use caracteres especiales!'),
        body('contacto_emergencia.telefono').isString().matches(/^\+?[1-9]\d{1,14}$/).withMessage('Teléfono inválido. Debe incluir el prefijo del país y ser un número válido (e.g., +50312345678).'),
    ],
    studentController.updateStudent
);

// Eliminar estudiante - solo ADMIN
router.delete('/',
    validateToken,
    checkRole(['admin']),
    [
        body('email').isEmail().withMessage('Email inválido'),
    ],
    studentController.deleteStudent
);

// Eliminar estudiante por ID - solo ADMIN
router.delete('/id',
    validateToken,
    checkRole(['admin']),
    [
        body('id').isString().withMessage('Id inválido'),
    ],
    studentController.deleteById
);

/**
 * @swagger
 * /students/get-all:
 *   post:
 *     summary: Obtener calificaciones de un estudiante
 *     tags: [Estudiantes]
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
 *         description: Calificaciones del estudiante agrupadas por materia
 *       403:
 *         description: Sin permisos para ver este recurso
 */
router.post('/get-all',
    validateToken,
    enrichUserContext,
    verifyOwnResource('body'),
    [
        body('email').isEmail().withMessage('Email inválido'),
    ],
    studentController.getStudentGradesInfo
);

// Obtener estudiantes y calificaciones del padre (desde token) - para PARENT
router.get('/get-students-filterWithParent', validateToken, checkRole(['parent']), studentController.getStudentGradesInfoParent);

export default router;
