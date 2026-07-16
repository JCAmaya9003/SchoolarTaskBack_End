import { validationResult } from 'express-validator';
import * as studentService from '../services/student.service.js';
import * as parentService from '../services/parent.service.js';
import * as userService from '../services/user-service.js';
import { sendSuccess } from '../utils/apiResponse.js';

// Forma consistente para exponer un estudiante en las respuestas (antes variaba: Nombre/userRol/userParentnombre...)
const formatStudentResponse = (student) => ({
    nombre: student.usuario.nombre,
    apellido: student.usuario.apellido,
    email: student.usuario.email,
    genero: student.usuario.genero,
    domicilio: student.usuario.domicilio,
    nacionalidad: student.usuario.nacionalidad,
    fecha_nacimiento: student.usuario.fecha_nacimiento,
    rol: student.usuario.rol,
    padre: student.padre,
    grado_seccion: student.grado_seccion,
    alergias: student.alergias,
    condiciones_medicas: student.condiciones_medicas,
    contacto_emergencia: student.contacto_emergencia,
});

export const getAllStudents = async (req, res) =>{
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({message: "Error al intentar mostrar los estudiantes!", errors: errors.array() });
    }
    try {
        const { page, limit } = req.query;
        const { data, pagination } = await studentService.getStudents(page, limit);
        return sendSuccess(res, 200, 'Estudiantes obtenidos con éxito', { items: data.map(formatStudentResponse), pagination });
    } catch (e) {
        res.status(500).json({ message: 'Error al mostrar los estudiantes', error: e.message });
    }
}

export const createStudent = async (req, res) =>{
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
        res.status(500).json({ message: 'Error al crear el estudiante', error: error.message });
    }
}

export const deleteStudent = async (req, res) =>{
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { email } = req.body;
    try {
        if(email){
            const studentDeleted = await studentService.deleteStudent(email);

            if(studentDeleted){
                await userService.eraseUser(email);

                return sendSuccess(res, 200, 'Estudiante eliminado con éxito', formatStudentResponse(studentDeleted));
            }else{
                return res.status(409).json({ message: 'Datos Invalidos para eliminar el estudiante' });
            }
        }else{
            return res.status(404).json({ message: 'Porfavor ingrese un email!' });
        }
    }catch (error) {
        res.status(500).json({ message: 'Error al elimnar el estudiante', error: error.message });
    }
}

export const updateStudent = async (req, res) =>{
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
        if(editedStudent){
            return sendSuccess(res, 200, 'Estudiante editado con éxito', formatStudentResponse(editedStudent));
    }else{
        return res.status(409).json({ message: 'Datos Invalidos para editar el estudiante' });
    }
}catch (error) {
    res.status(500).json({ message: 'Error al editar el estudiante', error: error.message });
}
}
export const deleteById= async(req, res) =>{
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { id } = req.body;

try {
        const deleted = await studentService.deleteWithId({
            id
        });
    if(deleted){
        return sendSuccess(res, 200, 'Estudiante eliminado con éxito', formatStudentResponse(deleted));
    }else{
        return res.status(409).json({ message: 'Datos Invalidos para eliminar el estudiante' });
    }
}catch (error) {
    res.status(500).json({ message: 'Error al eliminar el estudiante', error: error.message });
}
}

export const getStudentGradesInfoParent = async (req, res) => {
    try {
        const { email } = req.user;

        // Verificar si el padre existe
        const parent = await parentService.getParentByUserIdAndEmail(email);
        if (!parent) {
            return res.status(404).json({ message: "Padre no encontrado" });
        }

        // Obtener estudiantes relacionados con el padre
        const students = await studentService.getStudentsByParentEmail(email);
        if (!students.length) {
            return res.status(404).json({ message: "No se encontraron estudiantes asociados al padre" });
        }

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
        res.status(500).json({ error: "Error al obtener las notas de los estudiantes: " + error.message });
    }
};

//POST
export const getStudentGradesInfo = async (req, res) => {
    try {
        const { email } = req.body;

        // Obtener estudiante
        const response =  await studentService.getStudentGradesInfo(email);

        return sendSuccess(res, 200, 'Notas del estudiante obtenidas con éxito', response);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener las notas del estudiante: " + error.message });
    }
};
