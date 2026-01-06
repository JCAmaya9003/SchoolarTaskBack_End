import Reservation from '../models/reservation.model.js';

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
            select: 'nombre ubicacion capacidad',
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
    return await Reservation.findByIdAndDelete(id);
};

/**
 * Buscar todas las reservas.
 * @returns {Promise<Array>} - Lista de reservas con detalles de lugar y usuario.
 */
export const findAllReservations = async () => {
    return await Reservation.find()
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
 * Buscar reservas entre un rango de tiempo.
 * @param {Date} startDate - Fecha de inicio.
 * @param {Date} endDate - Fecha de fin.
 * @returns {Promise<Array>} - Lista de reservas en el rango de tiempo.
 */
export const findReservationsByTimeRange = async (startDate, endDate, lugarId) => {
    return await Reservation.find({
        lugar: lugarId,
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