import express from 'express';
import { body, query } from 'express-validator';
import * as reservationController from '../controllers/reservation.controller.js';
import { validateToken, checkRole } from '../middlewares/auth-middleware.js';
import { verifyResourceOwnerOrAdmin } from '../middlewares/authorization-middleware.js';
import { rejectHtml } from '../utils/xss-guard.js';

const router = express.Router();

// Ruta para crear una nueva reserva
router.post(
    '/create',
    validateToken,
    checkRole(['admin', 'teacher']),
    verifyResourceOwnerOrAdmin('body', 'usuarioEmail'),
    [
        body('lugar').isString().withMessage('El lugar debe ser una cadena válida.').custom(rejectHtml),
        body('usuarioEmail').isEmail().withMessage('El email del profesor debe ser válido.'),
        body('descripcion').isString().withMessage('Descripcion Invalida.').custom(rejectHtml),
        body('fecha_inicio').isISO8601().withMessage('La fecha de inicio debe ser una fecha válida.'),
        body('fecha_fin').isISO8601().withMessage('La fecha de fin debe ser una fecha válida.'),
    ],
    reservationController.createReservation
);

// Ruta para actualizar una reserva
router.put(
    '/',
    validateToken,
    checkRole(['admin', 'teacher']),
    verifyResourceOwnerOrAdmin('body', 'usuarioEmail'),
    [
        body('lugar').isString().withMessage('El lugar debe ser una cadena válida.').custom(rejectHtml),
        body('nuevoLugar').isString().withMessage('El nuevo lugar debe ser una cadena válida.').custom(rejectHtml),
        body('usuarioEmail').isEmail().withMessage('El email del profesor debe ser válido.'),
        body('descripcion').isString().withMessage('Descripcion Invalida.').custom(rejectHtml),
        body('nueva_fecha_inicio').isISO8601().withMessage('La nueva fecha de inicio debe ser válida.'),
        body('nueva_fecha_fin').isISO8601().withMessage('La nueva fecha de fin debe ser válida.'),
    ],
    reservationController.updateReservation
);

// Ruta para eliminar una reserva
router.delete(
    '/',
    validateToken,
    checkRole(['admin', 'teacher']),
    verifyResourceOwnerOrAdmin('body', 'usuarioEmail'),
    [
        body('lugar').isString().withMessage('El lugar debe ser una cadena válida.').custom(rejectHtml),
        body('usuarioEmail').isEmail().withMessage('El email del profesor debe ser válido.'),
    ],
    reservationController.deleteReservation
);

// Ruta para eliminar una reserva por ID - solo ADMIN
router.delete(
    '/id',
    validateToken,
    checkRole(['admin']),
    [
        body('id').isString().withMessage('Id inválido'),
    ],
    reservationController.deleteReservationById
);

// Ruta para obtener todas las reservas paginadas
router.get('/all', validateToken, checkRole(['admin', 'teacher']), reservationController.getAllReservations);

// Ruta para obtener reservas en un rango de tiempo
router.get(
    '/by-time-range',
    validateToken,
    checkRole(['admin', 'teacher']),
    [
        query('fecha_inicio').isISO8601().withMessage('La fecha de inicio debe ser una fecha válida.'),
        query('fecha_fin').isISO8601().withMessage('La fecha de fin debe ser una fecha válida.'),
    ],
    reservationController.getReservationsByTimeRange
);

// Ruta para obtener una reserva por profesor y lugar
router.get(
    '/by-teacher-and-place',
    validateToken,
    checkRole(['admin', 'teacher']),
    verifyResourceOwnerOrAdmin('query', 'usuarioEmail'),
    [
        query('usuarioEmail').isEmail().withMessage('El email del profesor debe ser válido.'),
        query('lugar').isString().withMessage('El lugar debe ser una cadena válida.').custom(rejectHtml),
    ],
    reservationController.getReservationByUserAndPlace
);

// Ruta para obtener todas las reservas realizadas por un profesor
router.get(
    '/by-teacher',
    validateToken,
    checkRole(['admin', 'teacher']),
    verifyResourceOwnerOrAdmin('query', 'usuarioEmail'),
    [
        query('usuarioEmail').isEmail().withMessage('El email del profesor debe ser válido.'),
    ],
    reservationController.getReservationsByUser
);

router.post('/get-nombre', validateToken, checkRole(['admin', 'teacher']), reservationController.getReservationNameById);

export default router;
