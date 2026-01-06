import * as userService from '../services/user-service.js';
import * as teacherService from '../services/teacher.service.js';
import * as studentService from '../services/student.service.js'
import * as evaluationService from '../services/evaluation.service.js'
import * as evaluationGradeService from '../services/evaluation_grade.service.js'
import { validationResult } from 'express-validator';

/**
 * Obtener todos los profesores.
 * @param {Object} req - Solicitud HTTP.
 * @param {Object} res - Respuesta HTTP.
 */
export const getAllTeachers = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: "Error al intentar mostrar los profesores!", errors: errors.array() });
    }
    try {
        const teachers = await teacherService.getTeachers();
        res.json(teachers);
    } catch (e) {
        res.status(500).json({ message: 'Error al mostrar los profesores', error: e.message });
    }
};

/**
 * Crear un nuevo profesor.
 * @param {Object} req - Solicitud HTTP.
 * @param {Object} res - Respuesta HTTP.
 */
export const createTeacher = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { nombre, apellido, email, password, fecha_nacimiento, rolNombre,
        genero, domicilio, nacionalidad, // Datos para el usuario
        asignaciones, telefono, especialidad // Datos para el profesor
    } = req.body;

    console.log(nombre, apellido, email, password, fecha_nacimiento, rolNombre,
        genero, domicilio, nacionalidad, asignaciones, telefono, especialidad);

    try {
        const newTeacher = await teacherService.createTeacher({
            nombre, apellido, email, password, fecha_nacimiento, rolNombre,
            genero, domicilio,
            nacionalidad, asignaciones, telefono, especialidad
        });

        return res.status(200).json({
            message: 'Profesor creado con éxito',
            Nombre: newTeacher.usuario.nombre,
            Apellido: newTeacher.usuario.apellido,
            Email: newTeacher.usuario.email,
            Genero: newTeacher.usuario.genero,
            Domicilio: newTeacher.usuario.domicilio,
            Nacionalidad: newTeacher.usuario.nacionalidad,
            Telefono: newTeacher.telefono,
            Especialidad: newTeacher.especialidad,
            Asignaciones: newTeacher.grado_encargado,
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al crear el profesor', error: error.message });
    }
};

/**
 * Actualizar un profesor.
 * @param {Object} req - Solicitud HTTP.
 * @param {Object} res - Respuesta HTTP.
 */
export const updateTeacher = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, asignaciones, telefono, especialidad } = req.body;

    console.log(email, asignaciones, telefono, especialidad);

    try {
        const updatedTeacher = await teacherService.updateTeacher({
            email,
            asignaciones,
            telefono,
            especialidad,
        });

        if (updatedTeacher) {
            return res.status(200).json({
                message: 'Profesor actualizado con éxito',
                Nombre: updatedTeacher.usuario.nombre,
                Apellido: updatedTeacher.usuario.apellido,
                Asignaciones: updatedTeacher.grado_encargado,
                Telefono: updatedTeacher.telefono,
                Especialidad: updatedTeacher.especialidad,
            });
        } else {
            return res.status(400).json({ message: 'No se pudo actualizar el profesor' });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error al actualizar el profesor', error: error.message });
    }
};

/**
 * Eliminar un profesor.
 * @param {Object} req - Solicitud HTTP.
 * @param {Object} res - Respuesta HTTP.
 */
export const deleteTeacher = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    console.log(`Eliminando profesor con email: ${email}`);

    try {
        const deletedTeacher = await teacherService.deleteTeacher(email);
        if (!deletedTeacher) {
            return res.status(404).json({ message: 'Profesor no encontrado' });
        }

        const deletedUser = await userService.eraseUser(email);

        if (deletedTeacher && deletedUser) {
            return res.status(200).json({
                message: 'Profesor eliminado con éxito',
                Nombre: deletedTeacher.usuario.nombre,
                Apellido: deletedTeacher.usuario.apellido,
                Email: deletedTeacher.usuario.email,
            });
        } else {
            return res.status(400).json({ message: 'No se pudo eliminar el profesor o el usuario' });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error al eliminar el profesor', error: error.message });
    }
};

export const getTeacherSubjectInfo = async (req, res) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ message: "No se proporcionó un token de autenticación" });
        }

        // Decodificar el token
        const decoded = jwt.decode(token);
        if (!decoded || !decoded.email) {
            return res.status(400).json({ message: "Token inválido. No se encontró un email." });
        }

        const { email } = decoded;

        //const { email } = req.body;

        // Obtener materias relacionadas con el profesor
        const subjects = await teacherService.getSubjectsByTeacherEmail(email);

        if (!subjects || subjects.length === 0) {
            return res.status(404).json({ message: "No se encontraron materias asociadas al profesor" });
        }

        console.log("Materias relacionadas:", subjects);

        // Preparar la respuesta
        const response = [];

        for (const subject of subjects) {
            if (!subject || !subject.nombre) {
                console.warn("Materia no válida encontrada:", subject);
                continue; // Salta si el subject es inválido
            }

            // Obtener estudiantes por materia
            const students = await studentService.getStudentsBySubject(subject._id);

            // Obtener evaluaciones y notas de la materia
            const evaluations = await evaluationService.getEvaluationsBySubject(subject.nombre);

            // Crear respuesta para cada materia
            const subjectData = {
                materia: subject.nombre,
                estudiantes: [],
            };

            for (const student of students) {
                if (!student || !student.usuario) {
                    console.warn("Estudiante no válido encontrado:", student);
                    continue; // Salta si el student es inválido
                }

                const studentEvaluations = await Promise.all(
                    evaluations.map(async (evaluation) => {
                        if (!evaluation || !evaluation.nombre) {
                            console.warn("Evaluación no válida encontrada:", evaluation);
                            return null; // Devuelve null si la evaluación es inválida
                        }
                        const grade = await evaluationGradeService.getEvaluationGradesByStudentAndEvaluation(student._id, evaluation._id);
                        return {
                            evaluacion: evaluation.nombre,
                            nota: grade ? grade.calificacion : null,
                            peso: evaluation.peso,
                        };
                    })
                );

                subjectData.estudiantes.push({
                    estudiante: {
                        nombre: student.usuario.nombre || "Desconocido",
                        apellido: student.usuario.apellido || "Desconocido",
                        email: student.usuario.email || "Desconocido",
                    },
                    evaluaciones: studentEvaluations.filter(Boolean), // Filtrar evaluaciones no válidas
                });
            }

            response.push(subjectData);
        }

        res.status(200).json({
            message: "Información de las materias y estudiantes obtenida con éxito",
            data: response,
        });
    } catch (error) {
        console.error("Error al obtener la información del profesor:", error);
        res.status(500).json({ error: "Error al obtener la información del profesor: " + error.message });
    }
};
