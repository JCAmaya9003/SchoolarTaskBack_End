import { validationResult } from 'express-validator';
import * as reservationService from '../services/reservation.service.js';
import { sendSuccess } from '../utils/apiResponse.js';

// Optional chaining como defensa: una reserva puede quedar con lugar null (el lugar académico
// se borró del catálogo) o usuario null (usuario desactivado). La reserva sigue siendo un
// registro válido de que alguien reservó un horario, así que no se oculta: solo se evita el crash.
const formatReservationResponse = (reservation) => ({
    id: reservation._id,
    lugar: reservation.lugar?.lugar,
    descripcion: reservation.descripcion,
    fecha_inicio: reservation.fecha_inicio,
    fecha_fin: reservation.fecha_fin,
    usuario: {
        nombre: reservation.usuario?.nombre,
        apellido: reservation.usuario?.apellido,
        email: reservation.usuario?.email,
    },
});

/**
 * Crear una nueva reserva.
 */
export const createReservation = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const { lugar, usuarioEmail, descripcion, fecha_inicio, fecha_fin } = req.body;

        const nuevaReserva = await reservationService.createReservation({
            lugar,
            usuarioEmail,
            descripcion,
            fecha_inicio,
            fecha_fin,
        });

        return sendSuccess(res, 201, 'Reserva creada con éxito', formatReservationResponse(nuevaReserva));
    } catch (error) {
        next(error);
    }
};

/**
 * Actualizar una reserva.
 */
export const updateReservation = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const { lugar, nuevoLugar, usuarioEmail, descripcion, nueva_fecha_inicio, nueva_fecha_fin } = req.body;

        const updatedReservation = await reservationService.updateReservation({
            lugar,
            nuevoLugar,
            usuarioEmail,
            descripcion,
            nueva_fecha_inicio,
            nueva_fecha_fin,
        });

        return sendSuccess(res, 200, 'Reserva actualizada con éxito', formatReservationResponse(updatedReservation));
    } catch (error) {
        next(error);
    }
};

/**
 * Eliminar una reserva.
 */
export const deleteReservation = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const { lugar, usuarioEmail } = req.body;

        const deletedReservation = await reservationService.deleteReservation({
            lugar,
            usuarioEmail,
        });

        return sendSuccess(res, 200, 'Reserva eliminada con éxito', formatReservationResponse(deletedReservation));
    } catch (error) {
        next(error);
    }
};

/**
 * Eliminar una reserva por id.
 */
export const deleteReservationById = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const { id } = req.body;

        const deletedReservation = await reservationService.deleteReservationById(id);

        return sendSuccess(res, 200, 'Reserva eliminada con éxito', formatReservationResponse(deletedReservation));
    } catch (error) {
        next(error);
    }
};

/**
 * Obtener todas las reservas paginadas.
 */
export const getAllReservations = async (req, res, next) => {
    try {
        const { page, limit } = req.query;
        const { data, pagination } = await reservationService.getAllReservations(page, limit);

        return sendSuccess(res, 200, 'Reservas obtenidas con éxito', { items: data.map(formatReservationResponse), pagination });
    } catch (error) {
        next(error);
    }
};

/**
 * Obtener reservas en un rango de tiempo.
 */
export const getReservationsByTimeRange = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const { fecha_inicio, fecha_fin } = req.query;

        const reservations = await reservationService.getReservationsByTimeRange(
            new Date(fecha_inicio),
            new Date(fecha_fin)
        );

        return sendSuccess(res, 200, 'Reservas obtenidas con éxito', reservations.map(formatReservationResponse));
    } catch (error) {
        next(error);
    }
};

/**
 * Obtener una reserva por usuario y lugar.
 */
export const getReservationByUserAndPlace = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const { usuarioEmail, lugar } = req.query;

        const reservation = await reservationService.getReservationByUserAndPlace(
            usuarioEmail,
            lugar
        );

        return sendSuccess(res, 200, 'Reserva obtenida con éxito', formatReservationResponse(reservation));
    } catch (error) {
        next(error);
    }
};

/**
 * Obtener todas las reservas realizadas por un usuario.
 */
export const getReservationsByUser = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const { usuarioEmail } = req.query;

        const reservations = await reservationService.getReservationsByUser(usuarioEmail);

        return sendSuccess(res, 200, 'Reservas obtenidas con éxito', reservations.map(formatReservationResponse));
    } catch (error) {
        next(error);
    }
};

export const getReservationNameById = async (req, res, next) => {
    try {
        const { id } = req.body;

        const reservation = await reservationService.getReservationById(id);

        return sendSuccess(res, 200, 'Nombre del lugar obtenido con éxito', { nombre: reservation.lugar?.lugar });
    } catch (error) {
        next(error);
    }
};
