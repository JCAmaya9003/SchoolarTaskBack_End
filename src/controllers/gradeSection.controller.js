import * as gradeSectionService from '../services/gradeSection.service.js';
import { validationResult } from 'express-validator';
import { sendSuccess } from '../utils/apiResponse.js';

const formatGradeSectionResponse = (gradeSection) => ({
    id: gradeSection._id,
    grado: gradeSection.grado,
    seccion: gradeSection.seccion,
    materias: gradeSection.materias.map((materia) => ({ id: materia._id, nombre: materia.nombre })),
});

/**
 * Crear un nuevo grado y sección.
 */
export const createGradeSection = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { grado, seccion, materias } = req.body;
    try {
        const newGradeSection = await gradeSectionService.newGradeSection(grado, seccion, materias);
        return sendSuccess(res, 201, 'Grado y sección creado con éxito', formatGradeSectionResponse(newGradeSection));
    } catch (error) {
        next(error);
    }
};

/**
 * Actualizar un grado y sección.
 */
export const updateGradeAndSection = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { grado, seccion, nuevoGrado, nuevaSeccion, materias } = req.body;
    try {
        const updatedGradeSection = await gradeSectionService.updateGradeAndSectionById(grado, seccion, nuevoGrado, nuevaSeccion, materias);
        return sendSuccess(res, 200, 'Grado y sección actualizado con éxito', formatGradeSectionResponse(updatedGradeSection));
    } catch (error) {
        next(error);
    }
};

/**
 * Eliminar un grado y sección.
 */
export const deleteGradeAndSection = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { grado, seccion } = req.body;
    try {
        const deletedGradeSection = await gradeSectionService.eraseGradeAndSectionById(grado, seccion);
        return sendSuccess(res, 200, 'Grado y sección eliminado con éxito', formatGradeSectionResponse(deletedGradeSection));
    } catch (error) {
        next(error);
    }
};

/**
 * Obtener todas las combinaciones de grado y sección.
 */
export const getAllGradeAndSections = async (req, res, next) => {
    try {
        const gradeSections = await gradeSectionService.getAllGradeAndSection();
        return sendSuccess(res, 200, 'Grados y secciones obtenidos con éxito', gradeSections.map(formatGradeSectionResponse));
    } catch (error) {
        next(error);
    }
};

/**
 * Agregar materias a un grado y sección.
 */
export const addSubjectsToGradeSection = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { grado, seccion, materias } = req.body;
    try {
        const updatedGradeSection = await gradeSectionService.addSubjectsToGradeSection(grado, seccion, materias);
        return sendSuccess(res, 200, 'Materias agregadas con éxito', formatGradeSectionResponse(updatedGradeSection));
    } catch (error) {
        next(error);
    }
};

/**
 * Eliminar materias de un grado y sección.
 */
export const removeSubjectsFromGradeSection = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { grado, seccion, materias } = req.body;
    try {
        const updatedGradeSection = await gradeSectionService.removeSubjectsFromGradeSection(grado, seccion, materias);
        return sendSuccess(res, 200, 'Materias eliminadas con éxito', formatGradeSectionResponse(updatedGradeSection));
    } catch (error) {
        next(error);
    }
};
