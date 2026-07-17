import * as parentService from '../services/parent.service.js'
import * as userService from '../services/user-service.js'
import { validationResult } from 'express-validator';
import { sendSuccess } from '../utils/apiResponse.js';

// Forma consistente para exponer un padre en las respuestas
const formatParentResponse = (parent) => ({
    id: parent._id,
    nombre: parent.usuario.nombre,
    apellido: parent.usuario.apellido,
    email: parent.usuario.email,
    genero: parent.usuario.genero,
    domicilio: parent.usuario.domicilio,
    nacionalidad: parent.usuario.nacionalidad,
    fecha_nacimiento: parent.usuario.fecha_nacimiento,
    rol: parent.usuario.rol,
    telefono: parent.telefono,
    telefono_trabajo: parent.telefono_trabajo,
    lugar_trabajo: parent.lugar_trabajo,
    profesion: parent.profesion,
});

export const getAllParents = async (req, res, next) =>{
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({message: "Error al intentar mostrar los padres!", errors: errors.array() });
    }
    try {
        const { page, limit } = req.query;
        const { data, pagination } = await parentService.getParents(page, limit);
        return sendSuccess(res, 200, 'Padres obtenidos con éxito', { items: data.map(formatParentResponse), pagination });
    } catch (e) {
        next(e);
    }
}

export const createParent = async (req, res, next) =>{
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { nombre, apellido, email, password, fecha_nacimiento, rolNombre,
            genero, domicilio, nacionalidad, //datos para el user
            telefono, telefono_trabajo, lugar_trabajo, profesion} = req.body;

    try {
        const newParent = await parentService.createParent({
            nombre, apellido, email, password, fecha_nacimiento, rolNombre,
            genero, domicilio, nacionalidad,
            telefono, telefono_trabajo, lugar_trabajo, profesion
        });

        return sendSuccess(res, 201, 'Padre creado con éxito', formatParentResponse(newParent));
    }catch (error) {
        next(error);
    }
}

export const deleteParent = async (req, res, next) =>{
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { email } = req.body;
    try {
        const parentDeleted = await parentService.deleteParent(email);
        await userService.eraseUser(email);

        return sendSuccess(res, 200, 'Padre eliminado con éxito', formatParentResponse(parentDeleted));
    }catch (error) {
        next(error);
    }
}

export const updateParent = async (req, res, next) =>{
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { email, //datos para el user
        telefono, telefono_trabajo, lugar_trabajo, profesion} = req.body;

    try {
        const editedParent = await parentService.updateParent({
            email,
            telefono,
            telefono_trabajo,
            lugar_trabajo,
            profesion
        });
        return sendSuccess(res, 200, 'Padre editado con éxito', formatParentResponse(editedParent));
    }catch (error) {
        next(error);
    }
};

export const deleteById= async(req, res, next) =>{
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { id } = req.body;

    try {
        const deleted = await parentService.deleteWithId({ id });
        return sendSuccess(res, 200, 'Padre eliminado con éxito', formatParentResponse(deleted));
    }catch (error) {
        next(error);
    }
}
