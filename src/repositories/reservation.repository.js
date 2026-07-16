import Reservation from '../models/reservation.model.js';
import { getPaginationParams, getPaginationMeta } from '../utils/pagination-helper.js';

/**
 * Crear una nueva reserva.
 * @param {Object} reservationData - Datos para crear la reserva.
 * @returns {Promise<Object>} - Reserva creada.
 */
export const createReservation = async (reservationData) => {
    const reservation = new Reservation(reservationData);
    return await reservation.save();
};

/**
 * Actualizar una reserva por ID.
 * @param {String} id - ID de la reserva.
 * @param {Object} updates - Datos para actualizar.
 * @returns {Promise<Object|null>} - Reserva actualizada o null si no se encontró.
 */
export const updateReservationById = async (id, updates) => {
    return await Reservation.findByIdAndUpdate(id, updates, { new: true, runValidators: true })
        .populate({
            path: 'lugar',
            select: 'lugar',
        })
        .populate({
            path: 'usuario',
            select: 'nombre apellido email rol',
        });
};

/**
 * Eliminar una reserva por ID.
 * @param {String} id - ID de la reserva.
 * @returns {Promise<Object|null>} - Reserva eliminada o null si no se encontró.
 */
export const deleteReservationById = async (id) => {
    return await Reservation.findByIdAndDelete(id)
        .populate({
            path: 'lugar',
            select: 'lugar',
        })
        .populate({
            path: 'usuario',
            select: 'nombre apellido email rol',
        });
};

/**
 * Buscar todas las reservas, paginadas.
 * @returns {Promise<{data: Array, pagination: Object}>}
 */
export const findAllReservations = async (page, limit) => {
    const { skip, limit: validLimit, page: validPage } = getPaginationParams(page, limit);

    const [reservations, total] = await Promise.all([
        Reservation.find()
            .skip(skip)
            .limit(validLimit)
            .populate({
                path: 'lugar',
                select: 'lugar',
            })
            .populate({
                path: 'usuario',
                select: 'nombre apellido email rol',
            }),
        Reservation.countDocuments(),
    ]);

    return {
        data: reservations,
        pagination: getPaginationMeta(validPage, validLimit, total),
    };
};


/**
 * Buscar reservas entre un rango de tiempo.
 * @param {Date} startDate - Fecha de inicio.
 * @param {Date} endDate - Fecha de fin.
 * @param {String} [excludeId] - ID de una reserva a excluir de la búsqueda (para no comparar una reserva contra sí misma al editarla).
 * @returns {Promise<Array>} - Lista de reservas en el rango de tiempo.
 */
export const findReservationsByTimeRange = async (startDate, endDate, lugarId, excludeId) => {
    return await Reservation.find({
        lugar: lugarId,
        ...(excludeId ? { _id: { $ne: excludeId } } : {}),
        $or: [
            { fecha_inicio: { $lt: endDate, $gte: startDate } },
            { fecha_fin: { $lte: endDate, $gt: startDate } },
            { fecha_inicio: { $lte: startDate }, fecha_fin: { $gte: endDate } },
        ],
    })
    .populate({
        path: 'lugar',
        select: 'lugar',
    })
    .populate({
        path: 'usuario',
        select: 'nombre apellido email rol',
    });
};

/**
 * Buscar una reserva por usuario y lugar.
 * @param {String} usuarioId - ID del usuario.
 * @param {String} lugarId - ID del lugar.
 * @returns {Promise<Object|null>} - Reserva encontrada o null.
 */
export const findReservationByUserAndPlace = async (usuarioId, lugarId) => {
    return await Reservation.findOne({ usuario: usuarioId, lugar: lugarId })
    .populate({
        path: 'lugar',
        select: 'lugar',
    })
    .populate({
        path: 'usuario',
        select: 'nombre apellido email rol',
    });
};

/**
 * Buscar todas las reservas hechas por un usuario.
 * @param {String} usuarioId - ID del usuario.
 * @returns {Promise<Array>} - Lista de reservas asociadas al usuario.
 */
export const findReservationsByUser = async (usuarioId) => {
    return await Reservation.find({ usuario: usuarioId })
    .populate({
        path: 'lugar',
        select: 'lugar',
    })
    .populate({
        path: 'usuario',
        select: 'nombre apellido email rol',
    });
};

export const findReservationById = async (id) => {
    return await Reservation.findById(id)
    .populate({
        path: 'lugar',
        select: 'lugar',
    })
    .populate({
        path: 'usuario',
        select: 'nombre apellido email rol',
    });
};