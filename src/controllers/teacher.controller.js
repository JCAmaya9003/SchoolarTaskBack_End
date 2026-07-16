import * as userService from '../services/user-service.js';
import * as teacherService from '../services/teacher.service.js';
import * as studentService from '../services/student.service.js'
import * as evaluationService from '../services/evaluation.service.js'
import * as evaluationGradeService from '../services/evaluation_grade.service.js'
import { validationResult } from 'express-validator';
import { sendSuccess } from '../utils/apiResponse.js';

// Forma consistente para exponer un profesor en las respuestas
const formatTeacherResponse = (teacher) => ({
    id: teacher._id,
    nombre: teacher.usuario.nombre,
    apellido: teacher.usuario.apellido,
    email: teacher.usuario.email,
    genero: teacher.usuario.genero,
    domicilio: teacher.usuario.domicilio,
    nacionalidad: teacher.usuario.nacionalidad,
    rol: teacher.usuario.rol,
    telefono: teacher.telefono,
    especialidad: teacher.especialidad,
    grado_encargado: teacher.grado_encargado,
});

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
        const { page, limit } = req.query;
        const { data, pagination } = await teacherService.getTeachers(page, limit);
        return sendSuccess(res, 200, 'Profesores obtenidos con éxito', { items: data.map(formatTeacherResponse), pagination });
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

    try {
        const newTeacher = await teacherService.createTeacher({
            nombre, apellido, email, password, fecha_nacimiento, rolNombre,
            genero, domicilio,
            nacionalidad, asignaciones, telefono, especialidad
        });

        return sendSuccess(res, 201, 'Profesor creado con éxito', formatTeacherResponse(newTeacher));
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

    try {
        const updatedTeacher = await teacherService.updateTeacher({
            email,
            asignaciones,
            telefono,
            especialidad,
        });

        if (updatedTeacher) {
            return sendSuccess(res, 200, 'Profesor actualizado con éxito', formatTeacherResponse(updatedTeacher));
        } else {
            return res.status(400).json({ message: 'No se pudo actualizar el profesor' });
        }
    } catch (error) {
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

    try {
        const deletedTeacher = await teacherService.deleteTeacher(email);
        if (!deletedTeacher) {
            return res.status(404).json({ message: 'Profesor no encontrado' });
        }

        const deletedUser = await userService.eraseUser(email);

        if (deletedTeacher && deletedUser) {
            return sendSuccess(res, 200, 'Profesor eliminado con éxito', formatTeacherResponse(deletedTeacher));
        } else {
            return res.status(400).json({ message: 'No se pudo eliminar el profesor o el usuario' });
        }
    } catch (error) {
        return res.status(500).json({ message: 'Error al eliminar el profesor', error: error.message });
    }
};

/**
 * Eliminar un profesor por ID.
 * @param {Object} req - Solicitud HTTP.
 * @param {Object} res - Respuesta HTTP.
 */
export const deleteById = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.body;

    try {
        const deleted = await teacherService.deleteWithId({ id });
        return sendSuccess(res, 200, 'Profesor eliminado con éxito', formatTeacherResponse(deleted));
    } catch (error) {
        next(error);
    }
};

export const getTeacherSubjectInfo = async (req, res) => {
    try {
        const { email } = req.user;

        // Obtener materias relacionadas con el profesor
        const subjects = await teacherService.getSubjectsByTeacherEmail(email);

        if (!subjects || subjects.length === 0) {
            return res.status(404).json({ message: "No se encontraron materias asociadas al profesor" });
        }

        // Preparar la respuesta
        const response = [];

        for (const subject of subjects) {
            if (!subject || !subject.nombre) {
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
                    continue; // Salta si el student es inválido
                }

                const studentEvaluations = await Promise.all(
                    evaluations.map(async (evaluation) => {
                        if (!evaluation || !evaluation.nombre) {
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

        return sendSuccess(res, 200, 'Información de las materias y estudiantes obtenida con éxito', response);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener la información del profesor: " + error.message });
    }
};
