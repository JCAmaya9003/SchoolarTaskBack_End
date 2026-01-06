import * as reservationService from '../services/reservation.service.js';

/**
 * Crear una nueva reserva.
 * @param {Object} req - Objeto de la solicitud HTTP.
 * @param {Object} res - Objeto de la respuesta HTTP.
 */
export const createReservation = async (req, res) => {
    try {
        const { lugar, usuarioEmail, descripcion, fecha_inicio, fecha_fin } = req.body;

        const nuevaReserva = await reservationService.createReservation({
            lugar,
            usuarioEmail,
            descripcion,
            fecha_inicio,
            fecha_fin,
        });

        return res.status(201).json({
            message: 'Reserva creada con éxito',
            data: nuevaReserva,
        });
    } catch (error) {
        console.error("Error al crear la reserva:", error.message);
        return res.status(500).json({ message: 'Error al crear la reserva', error: error.message });
    }
};

/**
 * Actualizar una reserva.
 * @param {Object} req - Objeto de la solicitud HTTP.
 * @param {Object} res - Objeto de la respuesta HTTP.
 */
export const updateReservation = async (req, res) => {
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

        return res.status(200).json({
            message: 'Reserva actualizada con éxito',
            data: updatedReservation,
        });
    } catch (error) {
        return res.status(500).json({
            message: 'Error al actualizar la reserva',
            error: error.message,
        });
    }
};

/**
 * Eliminar una reserva.
 * @param {Object} req - Objeto de la solicitud HTTP.
 * @param {Object} res - Objeto de la respuesta HTTP.
 */
export const deleteReservation = async (req, res) => {
    try {
        const { lugar, usuarioEmail } = req.body;

        const deletedReservation = await reservationService.deleteReservation({
            lugar,
            usuarioEmail,
        });

        return res.status(200).json({
            message: 'Reserva eliminada con éxito',
            data: deletedReservation,
        });
    } catch (error) {
        return res.status(500).json({
            message: 'Error al eliminar la reserva',
            error: error.message,
        });
    }
};

/**
 * Obtener todas las reservas.
 * @param {Object} req - Objeto de la solicitud HTTP.
 * @param {Object} res - Objeto de la respuesta HTTP.
 */
export const getAllReservations = async (req, res) => {
    try {
        const reservations = await reservationService.getAllReservations();

        return res.status(200).json(reservations);
    } catch (error) {
        return res.status(500).json({
            message: 'Error al obtener todas las reservas',
            error: error.message,
        });
    }
};

/**
 * Obtener reservas en un rango de tiempo.
 * @param {Object} req - Objeto de la solicitud HTTP.
 * @param {Object} res - Objeto de la respuesta HTTP.
 */
export const getReservationsByTimeRange = async (req, res) => {
    try {
        const { fecha_inicio, fecha_fin } = req.query;

        const reservations = await reservationService.getReservationsByTimeRange(
            new Date(fecha_inicio),
            new Date(fecha_fin)
        );

        return res.status(200).json(reservations);
    } catch (error) {
        return res.status(500).json({
            message: 'Error al obtener reservas en el rango de tiempo',
            error: error.message,
        });
    }
};

/**
 * Obtener una reserva por usuario y lugar.
 * @param {Object} req - Objeto de la solicitud HTTP.
 * @param {Object} res - Objeto de la respuesta HTTP.
 */
export const getReservationByUserAndPlace = async (req, res) => {
    try {
        const { usuarioEmail, lugar } = req.query;

        const reservation = await reservationService.getReservationByUserAndPlace(
            usuarioEmail,
            lugar
        );

        return res.status(200).json(reservation);
    } catch (error) {
        return res.status(500).json({
            message: 'Error al obtener la reserva por usuario y lugar',
            error: error.message,
        });
    }
};

/**
 * Obtener todas las reservas realizadas por un usuario.
 * @param {Object} req - Objeto de la solicitud HTTP.
 * @param {Object} res - Objeto de la respuesta HTTP.
 */
export const getReservationsByUser = async (req, res) => {
    try {
        const { usuarioEmail } = req.query;

        const reservations = await reservationService.getReservationsByUser(usuarioEmail);

        return res.status(200).json(reservations);
    } catch (error) {
        return res.status(500).json({
            message: 'Error al obtener reservas del usuario',
            error: error.message,
        });
    }
};

export const getReservationNameById = async (req, res) => {
    try {
        const { id } = req.body;

        const reservation = await reservationService.getReservationById(id);

        return res.status(200).json({nombre: reservation.lugar.lugar});
    } catch (error) {
        return res.status(500).json({
            message: 'Error al obtener reservas del usuario',
            error: error.message,
        });
    }
};

export const deleteReservationById = async (req, res) => {
    try {
        const { id } = req.body;

        const reservation = await reservationService.deleteReservationById(id);
        if(reservation){
            return res.status(200).json({message: "Reserva Eliminada con exito!"});
        }else{
            return res.status(404).json({message: "Reserva no encontrada!"});
        }
    } catch (error) {
        return res.status(500).json({
            message: 'Error al obtener reservas del usuario',
            error: error.message,
        });
    }
};