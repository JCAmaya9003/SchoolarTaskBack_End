import * as academic_placeService from '../services/academic_place.service.js';
import { validationResult } from 'express-validator';
import { sendSuccess } from '../utils/apiResponse.js';

const formatPlaceResponse = (place) => ({
    id: place._id,
    lugar: place.lugar,
});

export const createNewPlace = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const { lugar } = req.body;
        const createdPlace = await academic_placeService.newPlace(lugar);
        return sendSuccess(res, 201, 'Lugar creado con éxito', formatPlaceResponse(createdPlace));
    } catch (error) {
        next(error);
    }
};

export const editPlace = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { lugar, nuevoLugar } = req.body;
        const editedPlace = await academic_placeService.updatePlace(lugar, nuevoLugar);
        return sendSuccess(res, 200, 'Lugar actualizado con éxito', formatPlaceResponse(editedPlace));
    } catch (error) {
        next(error);
    }
};

export const deletePlace = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { lugar } = req.body;
        const erasedPlace = await academic_placeService.erasePlace(lugar);
        return sendSuccess(res, 200, 'Lugar eliminado con éxito', formatPlaceResponse(erasedPlace));
    } catch (error) {
        next(error);
    }
};

export const getAllPlaces = async (req, res, next) => {
    try {
        const places = await academic_placeService.getPlaces();
        return sendSuccess(res, 200, 'Lugares obtenidos con éxito', places.map(formatPlaceResponse));
    } catch (error) {
        next(error);
    }
};

export const getPlaceNameById = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { id } = req.body;
        const place = await academic_placeService.getPlaceById(id);
        return sendSuccess(res, 200, 'Nombre del lugar obtenido con éxito', { nombre: place.lugar });
    } catch (error) {
        next(error);
    }
};
