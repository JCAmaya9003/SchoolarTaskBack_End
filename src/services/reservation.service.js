import * as reservationRepository from '../repositories/reservation.repository.js';
import * as userService from '../services/user-service.js';
import * as academicPlaceService from '../services/academic_place.service.js';

/**
 * Crear una nueva reserva.
 * @param {Object} reservationData - Datos de la reserva.
 * @returns {Promise<Object>} - Reserva creada.
 */
export const createReservation = async ({ lugar, usuarioEmail, descripcion, fecha_inicio, fecha_fin }) => {
    const lugarExistente = await academicPlaceService.searchPlaceByName(lugar);
    if (!lugarExistente) {
        throw new Error(`Lugar no encontrado con nombre: ${lugar}`);
    }

    const usuario = await userService.searchUserByEmail(usuarioEmail);
    if (!usuario) {
        throw new Error(`Usuario no encontrado con email: ${usuarioEmail}`);
    }

    // Validar si ya existe una reserva para el mismo lugar y horario
    const reservasConflicto = await reservationRepository.findReservationsByTimeRange(fecha_inicio, fecha_fin, lugarExistente.id);

    if (reservasConflicto.length > 0) {
        throw new Error(`El lugar '${lugar}' ya está reservado en las fechas especificadas.`);
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
 * @returns {Promise<Object|null>} - Reserva actualizada o null si no se encontró.
 */
export const updateReservation = async ({ lugar, nuevoLugar, usuarioEmail, descripcion, nueva_fecha_inicio, nueva_fecha_fin }) => {
    const lugarActual = await academicPlaceService.searchPlaceByName(lugar);
    if (!lugarActual) {
        throw new Error(`Lugar no encontrado con nombre: ${lugar}`);
    }

    const lugarNuevo = await academicPlaceService.searchPlaceByName(nuevoLugar);
    if (!lugarNuevo) {
        throw new Error(`Nuevo lugar no encontrado con nombre: ${nuevoLugar}`);
    }

    const usuario = await userService.searchUserByEmail(usuarioEmail);
    if (!usuario) {
        throw new Error(`Usuario no encontrado con email: ${usuarioEmail}`);
    }

    const reservaExistente = await reservationRepository.findReservationByUserAndPlace(usuario.id, lugarActual.id);
    if (!reservaExistente) {
        throw new Error(`No se encontró una reserva en el lugar '${lugar}' para el usuario con email '${usuarioEmail}'`);
    }

    const reservasEnFechas = await reservationRepository.findReservationsByTimeRange(nueva_fecha_inicio, nueva_fecha_fin);
    const conflicto = reservasEnFechas.some(reserva => reserva.lugar.toString() === lugarNuevo.id.toString());
    if (conflicto) {
        throw new Error(`El lugar '${nuevoLugar}' ya está reservado en las fechas especificadas.`);
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
 * @returns {Promise<Object|null>} - Reserva eliminada.
 */
export const deleteReservation = async ({ lugar, usuarioEmail }) => {
    const lugarExistente = await academicPlaceService.searchPlaceByName(lugar);
    if (!lugarExistente) {
        throw new Error(`Lugar no encontrado con nombre: ${lugar}`);
    }

    const usuario = await userService.searchUserByEmail(usuarioEmail);
    if (!usuario) {
        throw new Error(`Usuario no encontrado con email: ${usuarioEmail}`);
    }

    const reserva = await reservationRepository.findReservationByUserAndPlace(usuario.id, lugarExistente.id);
    if (!reserva) {
        throw new Error(`No se encontró una reserva en el lugar '${lugar}' para el usuario con email '${usuarioEmail}'`);
    }

    return await reservationRepository.deleteReservationById(reserva.id);
};

export const deleteReservationById = async (id) => {
    return await reservationRepository.deleteReservationById(id);
};

/**
 * Obtener todas las reservas.
 * @returns {Promise<Array>} - Lista de todas las reservas.
 */
export const getAllReservations = async () => {
    return await reservationRepository.findAllReservations();
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
        throw new Error(`Usuario no encontrado con email: ${usuarioEmail}`);
    }

    const lugarExistente = await academicPlaceService.searchPlaceByName(lugar);
    if (!lugarExistente) {
        throw new Error(`Lugar no encontrado con nombre: ${lugar}`);
    }

    return await reservationRepository.findReservationByUserAndPlace(usuario.id, lugarExistente.id);
};

/**
 * Buscar todas las reservas realizadas por un usuario.
 * @param {String} usuarioEmail - Email del usuario.
 * @returns {Promise<Array>} - Lista de reservas asociadas al usuario.
 */
export const getReservationsByUser = async (usuarioEmail) => {
    const usuario = await userService.searchUserByEmail(usuarioEmail);
    if (!usuario) {
        throw new Error(`Usuario no encontrado con email: ${usuarioEmail}`);
    }

    return await reservationRepository.findReservationsByUser(usuario.id);
};

export const getReservationById = async (id) =>{
    const reserva = await reservationRepository.findReservationById(id);
    console.log("service res " + reserva);
    if(reserva){
        return reserva;
    }else{
        throw new Error("Reserva inexistente!");
    }
}