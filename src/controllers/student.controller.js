import { validationResult } from 'express-validator';
import * as studentService from '../services/student.service.js';
import * as userService from '../services/user-service.js';
import { sendSuccess } from '../utils/apiResponse.js';

// Forma consistente para exponer un estudiante en las respuestas.
// Se usa optional chaining sobre `usuario` como defensa: si el usuario fue desactivado
// (soft-delete), el populate lo trae null. Los listados igual filtran esos casos antes de
// mapear (ver getAllStudents), esto es solo para no romper nunca.
const formatStudentResponse = (student) => ({
    id: student._id,
    nombre: student.usuario?.nombre,
    apellido: student.usuario?.apellido,
    email: student.usuario?.email,
    genero: student.usuario?.genero,
    domicilio: student.usuario?.domicilio,
    nacionalidad: student.usuario?.nacionalidad,
    fecha_nacimiento: student.usuario?.fecha_nacimiento,
    rol: student.usuario?.rol,
    padre: student.padre,
    grado_seccion: student.grado_seccion,
    alergias: student.alergias,
    condiciones_medicas: student.condiciones_medicas,
    contacto_emergencia: student.contacto_emergencia,
});

export const getAllStudents = async (req, res, next) =>{
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({message: "Error al intentar mostrar los estudiantes!", errors: errors.array() });
    }
    try {
        const { page, limit } = req.query;
        const { data, pagination } = await studentService.getStudents(page, limit);
        // Oculta del listado a los estudiantes cuyo usuario fue desactivado (soft-delete):
        // el populate lo trae null, así que no debe figurar en el roster activo.
        const items = data.filter((student) => student.usuario).map(formatStudentResponse);
        return sendSuccess(res, 200, 'Estudiantes obtenidos con éxito', { items, pagination });
    } catch (e) {
        next(e);
    }
}

export const createStudent = async (req, res, next) =>{
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { nombre, apellido, email, password, fecha_nacimiento, rolNombre,
            genero, domicilio, nacionalidad,
            email_padre,
            grado, seccion,
            alergias, condiciones_medicas, contacto_emergencia } = req.body;

    try {
        const newStudent = await studentService.createStudent({
            nombre, apellido, email, password, fecha_nacimiento, rolNombre,
            genero, domicilio, nacionalidad,
            email_padre,
            grado, seccion,
            alergias, condiciones_medicas, contacto_emergencia
        });

        return sendSuccess(res, 201, 'Estudiante creado con éxito', formatStudentResponse(newStudent));
    }catch (error) {
        next(error);
    }
}

export const deleteStudent = async (req, res, next) =>{
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { email } = req.body;
    try {
        const studentDeleted = await studentService.deleteStudent(email);
        await userService.eraseUser(email);

        return sendSuccess(res, 200, 'Estudiante eliminado con éxito', formatStudentResponse(studentDeleted));
    }catch (error) {
        next(error);
    }
}

export const updateStudent = async (req, res, next) =>{
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { email,
            grado, seccion,
            alergias, condiciones_medicas, contacto_emergencia} = req.body;

    try {
        const editedStudent = await studentService.updateStudent({
            email,
            grado, seccion,
            alergias, condiciones_medicas, contacto_emergencia
        });
        return sendSuccess(res, 200, 'Estudiante editado con éxito', formatStudentResponse(editedStudent));
    }catch (error) {
        next(error);
    }
}

export const deleteById = async (req, res, next) =>{
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { id } = req.body;

    try {
        const deleted = await studentService.deleteWithId({ id });
        return sendSuccess(res, 200, 'Estudiante eliminado con éxito', formatStudentResponse(deleted));
    }catch (error) {
        next(error);
    }
}

export const getStudentGradesInfoParent = async (req, res, next) => {
    try {
        const { email } = req.user;

        // El service ya valida que el padre exista
        const students = await studentService.getStudentsByParentEmail(email);

        // Preparar la respuesta
        const response = [];

        for (const student of students) {
            // Obtener notas y evaluaciones por estudiante
            const gradesInfo = await studentService.getStudentGradesInfo(student.usuario.email);

            // Agregar información del estudiante y sus notas
            response.push({
                estudiante: {
                    nombre: student.usuario.nombre,
                    apellido: student.usuario.apellido,
                    email: student.usuario.email,
                },
                notas: gradesInfo,
            });
        }

        return sendSuccess(res, 200, 'Información de los estudiantes y sus notas obtenida con éxito', response);
    } catch (error) {
        next(error);
    }
};

//POST
export const getStudentGradesInfo = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const { email } = req.body;

        // Obtener estudiante
        const response =  await studentService.getStudentGradesInfo(email);

        return sendSuccess(res, 200, 'Notas del estudiante obtenidas con éxito', response);
    } catch (error) {
        next(error);
    }
};
