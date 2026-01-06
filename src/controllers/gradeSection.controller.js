import * as gradeSectionService from '../services/gradeSection.service.js';
import { validationResult } from 'express-validator';

/**
 * Crear un nuevo grado y sección.
 */
export const createGradeSection = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { grado, seccion, materias } = req.body;
    try {
        const newGrade_section = await gradeSectionService.newGradeSection(grado, seccion, materias);

        return res.status(200).json({
            message: 'Grado y sección creado con éxito',
            grado: newGrade_section.grado,
            seccion: newGrade_section.seccion,
            materias: newGrade_section.materias,
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al crear grado y sección', error: error.message });
    }
};

/**
 * Actualizar un grado y sección.
 */
export const updateGradeAndSection = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { grado, seccion, nuevoGrado, nuevaSeccion, materias } = req.body;
    try {
        const updatedGradeSection = await gradeSectionService.updateGradeAndSectionById(grado, seccion, nuevoGrado, nuevaSeccion, materias);

        return res.status(200).json({
            message: 'Grado y sección actualizado con éxito',
            grado: updatedGradeSection.grado,
            seccion: updatedGradeSection.seccion,
            materias: updatedGradeSection.materias,
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar grado y sección', error: error.message });
    }
};

/**
 * Eliminar un grado y sección.
 */
export const deleteGradeAndSection = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Error al intentar eliminar el grado y sección', errors: errors.array() });
    }

    const { grado, seccion } = req.body;
    try {
        const deletedGradeSection = await gradeSectionService.eraseGradeAndSectionById(grado, seccion);

        return res.status(200).json({
            message: 'Grado y sección eliminado con éxito',
            grado: deletedGradeSection.grado,
            seccion: deletedGradeSection.seccion,
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar grado y sección', error: error.message });
    }
};

/**
 * Obtener todas las combinaciones de grado y sección.
 */
export const getAllGradeAndSections = async (req, res) => {
    try {
        const GradeSections = await gradeSectionService.getAllGradeAndSection();
        res.status(200).json(GradeSections);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener todas las combinaciones de grado y sección', error: error.message });
    }
};

/**
 * Obtener un grado y sección específicos.
 */
export const getGradeAndSection = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Error al intentar obtener el grado y sección', errors: errors.array() });
    }

    const { grado, seccion } = req.body;
    try {
        const GradeSections = await gradeSectionService.getGradeAndSection(grado, seccion);
        res.status(200).json(GradeSections);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener grado y sección', error: error.message });
    }
};

/**
 * Agregar materias a un grado y sección.
 */
export const addSubjectsToGradeSection = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { grado, seccion, materias } = req.body;
    try {
        const updatedGradeSection = await gradeSectionService.addSubjectsToGradeSection(grado, seccion, materias);

        return res.status(200).json({
            message: 'Materias agregadas con éxito',
            grado: updatedGradeSection.grado,
            seccion: updatedGradeSection.seccion,
            materias: updatedGradeSection.materias,
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al agregar materias', error: error.message });
    }
};

/**
 * Eliminar materias de un grado y sección.
 */
export const removeSubjectsFromGradeSection = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { grado, seccion, materias } = req.body;
    try {
        const updatedGradeSection = await gradeSectionService.removeSubjectsFromGradeSection(grado, seccion, materias);

        return res.status(200).json({
            message: 'Materias eliminadas con éxito',
            grado: updatedGradeSection.grado,
            seccion: updatedGradeSection.seccion,
            materias: updatedGradeSection.materias,
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar materias', error: error.message });
    }
};
