import * as subjectService from '../services/subject.service.js';
import { validationResult } from 'express-validator';
import { sendSuccess } from '../utils/apiResponse.js';

const formatSubjectResponse = (subject) => ({
    id: subject._id,
    nombre: subject.nombre,
});

export const createNewSubject = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const { nombre } = req.body;
        const createdSubject = await subjectService.newSubject(nombre);
        return sendSuccess(res, 201, 'Materia creada con éxito', formatSubjectResponse(createdSubject));
    } catch (error) {
        next(error);
    }
};

export const editSubject = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { nombre, nuevoNombre } = req.body;
        const editedSubject = await subjectService.updateSubject(nombre, nuevoNombre);
        return sendSuccess(res, 200, 'Materia editada con éxito', formatSubjectResponse(editedSubject));
    } catch (error) {
        next(error);
    }
};

export const deleteSubject = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { nombre } = req.body;
        const erasedSubject = await subjectService.eraseSubject(nombre);
        return sendSuccess(res, 200, 'Materia eliminada con éxito', formatSubjectResponse(erasedSubject));
    } catch (error) {
        next(error);
    }
};

export const getAllSubjects = async (req, res, next) => {
    try {
        const subjects = await subjectService.getSubjects();
        return sendSuccess(res, 200, 'Materias obtenidas con éxito', subjects.map(formatSubjectResponse));
    } catch (error) {
        next(error);
    }
};
