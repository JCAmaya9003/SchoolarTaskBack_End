import express from 'express';
import { body, query } from 'express-validator';
import * as reservationController from '../controllers/reservation.controller.js';

const router = express.Router();

// Ruta para crear una nueva reserva
router.post(
    '/create',
    [
        body('lugar').isString().withMessage('El lugar debe ser una cadena válida.'),
        body('usuarioEmail').isEmail().withMessage('El email del profesor debe ser válido.'),
        body('descripcion').isString().withMessage('Descripcion Invalida.'),
        body('fecha_inicio').isISO8601().withMessage('La fecha de inicio debe ser una fecha válida.'),
        body('fecha_fin').isISO8601().withMessage('La fecha de fin debe ser una fecha válida.'),
    ],
    reservationController.createReservation
);

// Ruta para actualizar una reserva
router.put(
    '/',
    [
        body('lugar').isString().withMessage('El lugar debe ser una cadena válida.'),
        body('nuevoLugar').isString().withMessage('El nuevo lugar debe ser una cadena válida.'),
        body('usuarioEmail').isEmail().withMessage('El email del profesor debe ser válido.'),
        body('descripcion').isString().withMessage('Descripcion Invalida.'),
        body('nueva_fecha_inicio').isISO8601().withMessage('La nueva fecha de inicio debe ser válida.'),
        body('nueva_fecha_fin').isISO8601().withMessage('La nueva fecha de fin debe ser válida.'),
    ],
    reservationController.updateReservation
);

// Ruta para eliminar una reserva
router.delete(
    '/',
    [
        body('lugar').isString().withMessage('El lugar debe ser una cadena válida.'),
        body('usuarioEmail').isEmail().withMessage('El email del profesor debe ser válido.'),
    ],
    reservationController.deleteReservation
);

// Ruta para obtener todas las reservas
router.get('/all',reservationController.getAllReservations);

// Ruta para obtener reservas en un rango de tiempo
router.get(
    '/by-time-range',
    [
        query('fecha_inicio').isISO8601().withMessage('La fecha de inicio debe ser una fecha válida.'),
        query('fecha_fin').isISO8601().withMessage('La fecha de fin debe ser una fecha válida.'),
    ],
    reservationController.getReservationsByTimeRange
);

// Ruta para obtener una reserva por profesor y lugar
router.get(
    '/by-teacher-and-place',
    [
        query('usuarioEmail').isEmail().withMessage('El email del profesor debe ser válido.'),
        query('lugar').isString().withMessage('El lugar debe ser una cadena válida.'),
    ],
    reservationController.getReservationByUserAndPlace
);

// Ruta para obtener todas las reservas realizadas por un profesor
router.get(
    '/by-teacher',
    [
        query('usuarioEmail').isEmail().withMessage('El email del profesor debe ser válido.'),
    ],
    reservationController.getReservationsByUser
);

router.post('/get-nombre', reservationController.getReservationNameById);

export default router;
