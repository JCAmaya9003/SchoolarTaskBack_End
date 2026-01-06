import * as teacherRepository from '../repositories/teacher.repository.js';
import * as gradeSectionService from '../services/gradeSection.service.js';
import * as subjectService from '../services/subject.service.js';
import * as userService from '../services/user-service.js';

/**
 * Obtener todos los profesores.
 * @returns {Promise<Array>} - Lista de profesores.
 */
export const getTeachers = async () => {
    return await teacherRepository.findAllTeachers();
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
                console.log(`Materia buscada: ${subjectName}, Resultado: ${subject}`);
                if (subject) {
                    validSubjects.push(subject._id);
                } else {
                    throw new Error(`Materia inválida: ${subjectName}`);
                }
            }

            // Validar grados y secciones
            const validGradeSections = [];
            for (const { grado, seccion } of grado_secciones) {
                const gradeSection = await gradeSectionService.getGradeAndSection(grado, seccion);
                console.log(`Grado y sección buscados: Grado=${grado}, Sección=${seccion}, Resultado: ${gradeSection}`);
                if (gradeSection) {
                    validGradeSections.push(gradeSection._id);
                } else {
                    throw new Error(`Grado y sección inválidos: Grado=${grado}, Sección=${seccion}`);
                }
            }

            validAssignments.push({ materias: validSubjects, grado_secciones: validGradeSections });
        }

        console.log("Asignaciones validadas:", validAssignments);

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
            return await teacherRepository.createTeacher({
                usuario: user,
                grado_encargado: validAssignments,
                telefono,
                especialidad,
            });
        } else {
            throw new Error("Usuario ya existente!");
        };
    };


        
    

/**
 * Actualizar un profesor por correo electrónico.
 * @param {Object} data - Datos para actualizar.
 * @returns {Promise<Object|null>} - Profesor actualizado o error si no existe.
 */
export const updateTeacher = async ({ email, asignaciones, telefono, especialidad }) => {
    const userExists = await userService.searchUserByEmail(email);
    console.log("userExists: " + userExists);

    if (userExists) {
        const teacherExists = await teacherRepository.findTeacherByUserId(userExists.id);
        console.log("teacherExists: " + teacherExists);

        if (teacherExists) {
            const validAssignments = [];
            for (const { materias, grado_secciones } of asignaciones) {
                const validSubjects = [];
                for (const subjectName of materias) {
                    const subject = await subjectService.searchSubjectByName(subjectName);
                    if (subject) {
                        validSubjects.push(subject._id);
                    } else {
                        throw new Error(`Materia inválida: ${subjectName}`);
                    }
                }

                const validGradeSections = [];
                for (const { grado, seccion } of grado_secciones) {
                    const gradeSection = await gradeSectionService.getGradeAndSection(grado, seccion);
                    if (gradeSection) {
                        validGradeSections.push(gradeSection._id);
                    } else {
                        throw new Error(`Grado y sección inválidos: Grado=${grado}, Sección=${seccion}`);
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
            throw new Error(`No existe el profesor!`);
        }
    } else {
        throw new Error(`No existe el usuario!`);
    }
};

/**
 * Eliminar un profesor por correo electrónico.
 * @param {String} email - Correo electrónico del usuario asociado.
 * @returns {Promise<Object|null>} - Profesor eliminado o error si no existe.
 */
export const deleteTeacher = async (email) => {
    const teacherUser = await userService.searchUserByEmail(email);
    console.log("teacherUser: " + teacherUser);
    if (teacherUser) {
        const teacherExists = await teacherRepository.findTeacherByUserId(teacherUser.id);

        if (teacherExists) {
            console.log("teacher existe: " + teacherExists);
            return await teacherRepository.deleteTeacherById(teacherExists.id);
        } else {
            throw new Error("No existe el profesor");
        }
    } else {
        throw new Error("No existe el usuario");
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
    console.log(deleted);
    return deleted;
};

export const getSubjectsByTeacherEmail = async (email) => {
    const teacherUser = await userService.searchUserByEmail(email);
    if (!teacherUser) {
        throw new Error("Usuario no encontrado");
    }

    const teacher = await teacherRepository.findTeacherByUserId(teacherUser.id);
    if (!teacher) {
        throw new Error("Profesor no encontrado");
    }

    // Extraer materias desde grado_encargado
    const subjects = [];
    for (const encargado of teacher.grado_encargado) {
        if (encargado.materias && Array.isArray(encargado.materias)) {
            subjects.push(...encargado.materias);
        }
    }

    if (!subjects.length) {
        throw new Error("No se encontraron materias para el profesor");
    }

    return subjects;
};


