import * as teacherRepository from '../repositories/teacher.repository.js';
import * as gradeSectionService from '../services/gradeSection.service.js';
import * as subjectService from '../services/subject.service.js';
import * as userService from '../services/user-service.js';
import { hardDeleteUserById } from '../repositories/user-repository.js';
import logger from '../config/logger.js';
import { NotFoundError, ConflictError } from '../errors/errors.js';

/**
 * Obtener todos los profesores.
 * @param {number} page - Número de página
 * @param {number} limit - Elementos por página
 * @returns {Promise<Object>} - Objeto con data y pagination
 */
export const getTeachers = async (page, limit) => {
    return await teacherRepository.findAllTeachers(page, limit);
};

/**
 * Crear un nuevo profesor.
 * @param {Object} data - Datos del profesor.
 * @returns {Promise<Object|null>} - Profesor creado o null si ya existe.
 */
export const createTeacher = async ({ nombre, apellido, email, password, fecha_nacimiento, rolNombre,
    genero, domicilio, nacionalidad, asignaciones, telefono, especialidad}) => {

        // Validar las asignaciones
        const validAssignments = [];
        for (const { materias, grado_secciones } of asignaciones) {
            // Validar materias
            const validSubjects = [];
            for (const subjectName of materias) {
                const subject = await subjectService.searchSubjectByName(subjectName);
                if (subject) {
                    validSubjects.push(subject._id);
                } else {
                    throw new NotFoundError(`Materia inválida: ${subjectName}`);
                }
            }

            // Validar grados y secciones
            const validGradeSections = [];
            for (const { grado, seccion } of grado_secciones) {
                const gradeSection = await gradeSectionService.getGradeAndSection(grado, seccion);
                if (gradeSection) {
                    validGradeSections.push(gradeSection._id);
                } else {
                    throw new NotFoundError(`Grado y sección inválidos: Grado=${grado}, Sección=${seccion}`);
                }
            }

            validAssignments.push({ materias: validSubjects, grado_secciones: validGradeSections });
        }

        const userExists = await userService.searchUserByEmail(email);

        if (!userExists) {
            const user = await userService.registerUser({
                nombre,
                apellido,
                email,
                password,
                fecha_nacimiento,
                rolNombre,
                genero,
                domicilio,
                nacionalidad
            });
            try {
                return await teacherRepository.createTeacher({
                    usuario: user,
                    grado_encargado: validAssignments,
                    telefono,
                    especialidad,
                });
            } catch (error) {
                await hardDeleteUserById(user._id);
                logger.warn(`Rollback: Usuario ${email} eliminado tras fallo en creación de profesor`);
                throw error;
            }
        } else {
            throw new ConflictError("Usuario ya existente!");
        };
    };


        
    

/**
 * Actualizar un profesor por correo electrónico.
 * @param {Object} data - Datos para actualizar.
 * @returns {Promise<Object|null>} - Profesor actualizado o error si no existe.
 */
export const updateTeacher = async ({ email, asignaciones, telefono, especialidad }) => {
    const userExists = await userService.searchUserByEmail(email);

    if (userExists) {
        const teacherExists = await teacherRepository.findTeacherByUserId(userExists.id);

        if (teacherExists) {
            const validAssignments = [];
            for (const { materias, grado_secciones } of asignaciones) {
                const validSubjects = [];
                for (const subjectName of materias) {
                    const subject = await subjectService.searchSubjectByName(subjectName);
                    if (subject) {
                        validSubjects.push(subject._id);
                    } else {
                        throw new NotFoundError(`Materia inválida: ${subjectName}`);
                    }
                }

                const validGradeSections = [];
                for (const { grado, seccion } of grado_secciones) {
                    const gradeSection = await gradeSectionService.getGradeAndSection(grado, seccion);
                    if (gradeSection) {
                        validGradeSections.push(gradeSection._id);
                    } else {
                        throw new NotFoundError(`Grado y sección inválidos: Grado=${grado}, Sección=${seccion}`);
                    }
                }

                validAssignments.push({ materias: validSubjects, grado_secciones: validGradeSections });
            }

            return await teacherRepository.updateTeacherByUserId(teacherExists.id, {
                grado_encargado: validAssignments,
                telefono,
                especialidad,
            });
        } else {
            throw new NotFoundError(`No existe el profesor!`);
        }
    } else {
        throw new NotFoundError(`No existe el usuario!`);
    }
};

/**
 * Eliminar un profesor por correo electrónico.
 * @param {String} email - Correo electrónico del usuario asociado.
 * @returns {Promise<Object|null>} - Profesor eliminado o error si no existe.
 */
export const deleteTeacher = async (email) => {
    const teacherUser = await userService.searchUserByEmail(email);
    if (teacherUser) {
        const teacherExists = await teacherRepository.findTeacherByUserId(teacherUser.id);

        if (teacherExists) {
            return await teacherRepository.deleteTeacherById(teacherExists.id);
        } else {
            throw new NotFoundError("No existe el profesor");
        }
    } else {
        throw new NotFoundError("No existe el usuario");
    }
};

/**
 * Obtener un profesor por ID de usuario y correo electrónico.
 * @param {String} email - Correo electrónico del usuario.
 * @returns {Promise<Object|null>} - Profesor encontrado o null.
 */
export const getTeacherByUserIdAndEmail = async (email) => {
    const teacherUser = await userService.searchUserByEmail(email);
    if (teacherUser) {
        const teacher = await teacherRepository.findTeacherByUserId(teacherUser.id);
        return teacher;
    } else {
        return null;
    }
};

/**
 * Eliminar un profesor por ID.
 * @param {Object} data - ID del profesor.
 * @returns {Promise<Object|null>} - Profesor eliminado.
 */
export const deleteWithId = async ({ id }) => {
    const deleted = await teacherRepository.deleteTeacherById(id);
    if (!deleted) {
        throw new NotFoundError("No se encontró un profesor con ese id");
    }
    return deleted;
};

export const getSubjectsByTeacherEmail = async (email) => {
    const teacherUser = await userService.searchUserByEmail(email);
    if (!teacherUser) {
        throw new NotFoundError("Usuario no encontrado");
    }

    const teacher = await teacherRepository.findTeacherByUserId(teacherUser.id);
    if (!teacher) {
        throw new NotFoundError("Profesor no encontrado");
    }

    // Extraer materias desde grado_encargado
    const subjects = [];
    for (const encargado of teacher.grado_encargado) {
        if (encargado.materias && Array.isArray(encargado.materias)) {
            subjects.push(...encargado.materias);
        }
    }

    if (!subjects.length) {
        throw new NotFoundError("No se encontraron materias para el profesor");
    }

    return subjects;
};


