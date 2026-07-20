import * as userService from '../services/user-service.js';
import * as teacherService from '../services/teacher.service.js';
import * as studentService from '../services/student.service.js'
import * as evaluationService from '../services/evaluation.service.js'
import * as evaluationGradeService from '../services/evaluation_grade.service.js'
import { validationResult } from 'express-validator';
import { sendSuccess } from '../utils/apiResponse.js';

// Forma consistente para exponer un profesor en las respuestas.
// Optional chaining sobre `usuario` como defensa por si fue desactivado (populate -> null);
// los listados igual filtran esos casos antes de mapear (ver getAllTeachers).
const formatTeacherResponse = (teacher) => ({
    id: teacher._id,
    nombre: teacher.usuario?.nombre,
    apellido: teacher.usuario?.apellido,
    email: teacher.usuario?.email,
    genero: teacher.usuario?.genero,
    domicilio: teacher.usuario?.domicilio,
    nacionalidad: teacher.usuario?.nacionalidad,
    rol: teacher.usuario?.rol,
    telefono: teacher.telefono,
    especialidad: teacher.especialidad,
    grado_encargado: teacher.grado_encargado,
});

/**
 * Obtener todos los profesores.
 * @param {Object} req - Solicitud HTTP.
 * @param {Object} res - Respuesta HTTP.
 */
export const getAllTeachers = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: "Error al intentar mostrar los profesores!", errors: errors.array() });
    }
    try {
        const { page, limit } = req.query;
        const { data, pagination } = await teacherService.getTeachers(page, limit);
        // Oculta del listado a los profesores cuyo usuario fue desactivado (soft-delete).
        const items = data.filter((teacher) => teacher.usuario).map(formatTeacherResponse);
        return sendSuccess(res, 200, 'Profesores obtenidos con éxito', { items, pagination });
    } catch (e) {
        next(e);
    }
};

/**
 * Crear un nuevo profesor.
 * @param {Object} req - Solicitud HTTP.
 * @param {Object} res - Respuesta HTTP.
 */
export const createTeacher = async (req, res, next) => {
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
            // El rol se fuerza según el endpoint, no se toma del body.
            nombre, apellido, email, password, fecha_nacimiento, rolNombre: 'teacher',
            genero, domicilio,
            nacionalidad, asignaciones, telefono, especialidad
        });

        return sendSuccess(res, 201, 'Profesor creado con éxito', formatTeacherResponse(newTeacher));
    } catch (error) {
        next(error);
    }
};

/**
 * Actualizar un profesor.
 * @param {Object} req - Solicitud HTTP.
 * @param {Object} res - Respuesta HTTP.
 */
export const updateTeacher = async (req, res, next) => {
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

        return sendSuccess(res, 200, 'Profesor actualizado con éxito', formatTeacherResponse(updatedTeacher));
    } catch (error) {
        next(error);
    }
};

/**
 * Eliminar un profesor.
 * @param {Object} req - Solicitud HTTP.
 * @param {Object} res - Respuesta HTTP.
 */
export const deleteTeacher = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    try {
        const deletedTeacher = await teacherService.deleteTeacher(email);
        const deletedUser = await userService.eraseUser(email);

        if (!deletedUser) {
            return res.status(500).json({ message: 'No se pudo eliminar el usuario asociado al profesor' });
        }

        return sendSuccess(res, 200, 'Profesor eliminado con éxito', formatTeacherResponse(deletedTeacher));
    } catch (error) {
        next(error);
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

export const getTeacherSubjectInfo = async (req, res, next) => {
    try {
        const { email } = req.user;

        // El service ya lanza NotFoundError si no hay materias
        const subjects = await teacherService.getSubjectsByTeacherEmail(email);

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
        next(error);
    }
};
