import * as reservationRepository from '../repositories/reservation.repository.js';
import * as userService from '../services/user-service.js';
import * as academicPlaceService from '../services/academic_place.service.js';
import { NotFoundError, ConflictError } from '../errors/errors.js';

/**
 * Crear una nueva reserva.
 * @param {Object} reservationData - Datos de la reserva.
 * @returns {Promise<Object>} - Reserva creada.
 */
export const createReservation = async ({ lugar, usuarioEmail, descripcion, fecha_inicio, fecha_fin }) => {
    const lugarExistente = await academicPlaceService.searchPlaceByName(lugar);
    if (!lugarExistente) {
        throw new NotFoundError(`Lugar no encontrado con nombre: ${lugar}`);
    }

    const usuario = await userService.searchUserByEmail(usuarioEmail);
    if (!usuario) {
        throw new NotFoundError(`Usuario no encontrado con email: ${usuarioEmail}`);
    }

    // Validar si ya existe una reserva para el mismo lugar y horario
    const reservasConflicto = await reservationRepository.findReservationsByTimeRange(fecha_inicio, fecha_fin, lugarExistente.id);

    if (reservasConflicto.length > 0) {
        throw new ConflictError(`El lugar '${lugar}' ya está reservado en las fechas especificadas.`);
    }

    // Crear la reserva con descripción incluida
    return await reservationRepository.createReservation({
        lugar: lugarExistente,
        usuario,
        descripcion,
        fecha_inicio,
        fecha_fin,
    });
};

/**
 * Actualizar una reserva por ID.
 * @param {Object} updates - Datos para actualizar.
 * @returns {Promise<Object>} - Reserva actualizada.
 */
export const updateReservation = async ({ lugar, nuevoLugar, usuarioEmail, descripcion, nueva_fecha_inicio, nueva_fecha_fin }) => {
    const lugarActual = await academicPlaceService.searchPlaceByName(lugar);
    if (!lugarActual) {
        throw new NotFoundError(`Lugar no encontrado con nombre: ${lugar}`);
    }

    const lugarNuevo = await academicPlaceService.searchPlaceByName(nuevoLugar);
    if (!lugarNuevo) {
        throw new NotFoundError(`Nuevo lugar no encontrado con nombre: ${nuevoLugar}`);
    }

    const usuario = await userService.searchUserByEmail(usuarioEmail);
    if (!usuario) {
        throw new NotFoundError(`Usuario no encontrado con email: ${usuarioEmail}`);
    }

    const reservaExistente = await reservationRepository.findReservationByUserAndPlace(usuario.id, lugarActual.id);
    if (!reservaExistente) {
        throw new NotFoundError(`No se encontró una reserva en el lugar '${lugar}' para el usuario con email '${usuarioEmail}'`);
    }

    const reservasEnFechas = await reservationRepository.findReservationsByTimeRange(nueva_fecha_inicio, nueva_fecha_fin, lugarNuevo.id);
    if (reservasEnFechas.length > 0) {
        throw new ConflictError(`El lugar '${nuevoLugar}' ya está reservado en las fechas especificadas.`);
    }

    return await reservationRepository.updateReservationById(reservaExistente.id, {
        lugar: lugarNuevo.id,
        descripcion,
        fecha_inicio: nueva_fecha_inicio,
        fecha_fin: nueva_fecha_fin,
    });
};

/**
 * Eliminar una reserva por lugar y usuario.
 * @param {Object} data - Datos para eliminar la reserva.
 * @returns {Promise<Object>} - Reserva eliminada.
 */
export const deleteReservation = async ({ lugar, usuarioEmail }) => {
    const lugarExistente = await academicPlaceService.searchPlaceByName(lugar);
    if (!lugarExistente) {
        throw new NotFoundError(`Lugar no encontrado con nombre: ${lugar}`);
    }

    const usuario = await userService.searchUserByEmail(usuarioEmail);
    if (!usuario) {
        throw new NotFoundError(`Usuario no encontrado con email: ${usuarioEmail}`);
    }

    const reserva = await reservationRepository.findReservationByUserAndPlace(usuario.id, lugarExistente.id);
    if (!reserva) {
        throw new NotFoundError(`No se encontró una reserva en el lugar '${lugar}' para el usuario con email '${usuarioEmail}'`);
    }

    return await reservationRepository.deleteReservationById(reserva.id);
};

export const deleteReservationById = async (id) => {
    const deleted = await reservationRepository.deleteReservationById(id);
    if (!deleted) {
        throw new NotFoundError('No se encontró una reserva con ese id');
    }
    return deleted;
};

/**
 * Obtener todas las reservas, paginadas.
 * @returns {Promise<{data: Array, pagination: Object}>}
 */
export const getAllReservations = async (page, limit) => {
    return await reservationRepository.findAllReservations(page, limit);
};

/**
 * Buscar reservas en un rango de tiempo.
 * @param {Date} fecha_inicio - Fecha de inicio del rango.
 * @param {Date} fecha_fin - Fecha de fin del rango.
 * @returns {Promise<Array>} - Lista de reservas en el rango de tiempo.
 */
export const getReservationsByTimeRange = async (fecha_inicio, fecha_fin) => {
    return await reservationRepository.findReservationsByTimeRange(fecha_inicio, fecha_fin);
};

/**
 * Buscar una reserva por usuario y lugar.
 * @param {String} usuarioEmail - Email del usuario.
 * @param {String} lugar - Nombre del lugar.
 * @returns {Promise<Object|null>} - Reserva encontrada o null.
 */
export const getReservationByUserAndPlace = async (usuarioEmail, lugar) => {
    const usuario = await userService.searchUserByEmail(usuarioEmail);
    if (!usuario) {
        throw new NotFoundError(`Usuario no encontrado con email: ${usuarioEmail}`);
    }

    const lugarExistente = await academicPlaceService.searchPlaceByName(lugar);
    if (!lugarExistente) {
        throw new NotFoundError(`Lugar no encontrado con nombre: ${lugar}`);
    }

    const reserva = await reservationRepository.findReservationByUserAndPlace(usuario.id, lugarExistente.id);
    if (!reserva) {
        throw new NotFoundError(`No se encontró una reserva en el lugar '${lugar}' para el usuario con email '${usuarioEmail}'`);
    }
    return reserva;
};

/**
 * Buscar todas las reservas realizadas por un usuario.
 * @param {String} usuarioEmail - Email del usuario.
 * @returns {Promise<Array>} - Lista de reservas asociadas al usuario.
 */
export const getReservationsByUser = async (usuarioEmail) => {
    const usuario = await userService.searchUserByEmail(usuarioEmail);
    if (!usuario) {
        throw new NotFoundError(`Usuario no encontrado con email: ${usuarioEmail}`);
    }

    return await reservationRepository.findReservationsByUser(usuario.id);
};

export const getReservationById = async (id) =>{
    const reserva = await reservationRepository.findReservationById(id);
    if(reserva){
        return reserva;
    }else{
        throw new NotFoundError("Reserva inexistente!");
    }
}