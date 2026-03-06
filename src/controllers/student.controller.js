import { validationResult } from 'express-validator';
import * as studentService from '../services/student.service.js';
import * as parentService from '../services/parent.service.js';
import * as userService from '../services/user-service.js';


export const getAllStudents = async (req, res) =>{
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({message: "Error al intentar mostrar los estudiantes!", errors: errors.array() });
    }
    try {
        const { page, limit } = req.query;
        const result = await studentService.getStudents(page, limit);
        res.json(result);
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
        
        return res.status(200).json({
            message: 'Estudiante creado con éxito',
            Nombre: newStudent.usuario.nombre,
            Apellido: newStudent.usuario.apellido,
            Email: newStudent.usuario.email,
            genero: newStudent.usuario.genero,
            domicilio: newStudent.usuario.domicilio,
            nacionalidad: newStudent.usuario.nacionalidad,
            userFecha: newStudent.usuario.fecha_nacimiento,
            userRol: newStudent.usuario.rol,
            userParent: newStudent.padre,
            userGradeSection: newStudent.grado_seccion,
            alergias: newStudent.alergias,
            condiciones_medicas: newStudent.condiciones_medicas,
            contacto_emergencia: newStudent.contacto_emergencia,
        }); 
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

                return res.status(200).json({
                    message: 'Estudiante eliminado con éxito',
                        Nombre: studentDeleted.usuario.nombre,
                        Apellido: studentDeleted.usuario.apellido,
                        Email: studentDeleted.usuario.email,
                        genero: studentDeleted.usuario.genero,
                        domicilio: studentDeleted.usuario.domicilio,
                        nacionalidad: studentDeleted.usuario.nacionalidad,
                        userFecha: studentDeleted.usuario.fecha_nacimiento,
                        userRol: studentDeleted.usuario.rol,
                        userParentnombre: studentDeleted.padre,
                        userGradeSection: studentDeleted.grado_seccion,
                        alergias: studentDeleted.alergias,
                        condiciones_medicas: studentDeleted.condiciones_medicas,
                        contacto_emergencia: studentDeleted.contacto_emergencia,
                });
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
            return res.status(200).json({
                message: 'Estudiante editado con éxito',
                Nombre: editedStudent.usuario.nombre,
                Apellido: editedStudent.usuario.apellido,
                Email: editedStudent.usuario.email,
                genero: editedStudent.usuario.genero,
                domicilio: editedStudent.usuario.domicilio,
                nacionalidad: editedStudent.usuario.nacionalidad,
                userFecha: editedStudent.usuario.fecha_nacimiento,
                userRol: editedStudent.usuario.rol,
                userParent: editedStudent.padre,
                userGradeSection: editedStudent.grado_seccion,
                alergias: editedStudent.alergias,
                condiciones_medicas: editedStudent.condiciones_medicas,
                contacto_emergencia: editedStudent.contacto_emergencia,
            });
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
        return res.status(200).json({
            message: 'Estudiante eliminado con éxito',
            telefono: deleted.telefono,
            telefono_trabajo: deleted.telefono_trabajo, 
            lugar_trabajo: deleted.lugar_trabajo, 
            profesion: deleted.profesion, 
          });
    }else{
        return res.status(409).json({ message: 'Datos Invalidos para eliminar el estudiante' });
    }
}catch (error) {
    res.status(500).json({ message: 'Error al eliminar el estudiante', error: error.message });
}
}

export const getStudentGradesInfoToken = async (req, res) => {
    try {
        const { email } = req.user;

        // Obtener estudiante
        const response =  await studentService.getStudentGradesInfo(email);
        res.json(response);

    } catch (error) {
        res.status(500).json({ error: "Error al obtener las notas del estudiante: " + error.message });
    }
};

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

        res.status(200).json({
            message: "Información de los estudiantes y sus notas obtenida con éxito",
            data: response,
        });
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

        res.json(response);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener las notas del estudiante: " + error.message });
    }
};

export const getStudentsByParentEmail = async (req, res) => {
    try {
        const { email } = req.body;

        // Verificar si el padre existe
        const students = await studentService.getStudentsByParentEmail(email);

        // Enviar respuesta
        res.status(200).json({
            message: "Estudiantes relacionados con el padre encontrados",
            estudiantes: students,
        });
    } catch (error) {
        res.status(500).json({ error: "Error al obtener estudiantes relacionados con el padre: " + error.message });
    }
};

