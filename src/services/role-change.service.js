import * as userService from './user-service.js';
import * as roleService from './role-service.js';
import * as studentService from './student.service.js';
import * as teacherService from './teacher.service.js';
import * as parentService from './parent.service.js';
import { updateUserById } from '../repositories/user-repository.js';
import logger from '../config/logger.js';
import { NotFoundError, ConflictError } from '../errors/errors.js';

// Cambiar el rol de un usuario implica cambiarle el perfil, no solo el campo `rol`: cada rol
// guarda datos propios en su propia colección. Acá se define, por rol, cómo encontrar el perfil
// actual, cómo borrarlo y cómo crear el nuevo. `admin` no tiene perfil asociado, por eso sus
// tres operaciones son no-ops.
const PROFILE_HANDLERS = {
    student: {
        find: (email) => studentService.getStudentByUserIdAndEmail(email),
        remove: (email) => studentService.deleteStudent(email),
        create: (user, datos) => studentService.createStudentProfileForUser(user, datos),
    },
    teacher: {
        find: (email) => teacherService.getTeacherByUserIdAndEmail(email),
        remove: (email) => teacherService.deleteTeacher(email),
        create: (user, datos) => teacherService.createTeacherProfileForUser(user, datos),
    },
    parent: {
        find: (email) => parentService.getParentByUserIdAndEmail(email),
        remove: (email) => parentService.deleteParent(email),
        create: (user, datos) => parentService.createParentProfileForUser(user, datos),
    },
    admin: {
        find: async () => null,
        remove: async () => null,
        create: async () => null,
    },
};

/**
 * Cambia el rol de un usuario migrando su perfil: borra el perfil del rol viejo y crea el del
 * rol nuevo con los datos que ese rol exige. Pensado para corregir un error de creación, no
 * para un uso cotidiano.
 * @param {String} email - Email del usuario.
 * @param {String} nuevoRol - Rol destino.
 * @param {Object} datosPerfil - Campos que exige el perfil del rol destino.
 */
export const changeUserRole = async (email, nuevoRol, datosPerfil = {}) => {
    const user = await userService.searchUserByEmail(email);
    if (!user) {
        throw new NotFoundError('El usuario no existe');
    }

    const rolActual = user.rol?.nombre;
    if (rolActual === nuevoRol) {
        throw new ConflictError(`El usuario ya tiene el rol ${nuevoRol}`);
    }

    const rol = await roleService.searchRoleByName(nuevoRol);
    if (!rol) {
        throw new NotFoundError('El rol no existe');
    }

    const destino = PROFILE_HANDLERS[nuevoRol];
    const origen = PROFILE_HANDLERS[rolActual];
    if (!destino || !origen) {
        throw new NotFoundError('El rol no existe');
    }

    // Si ya tuviera el perfil destino, migrar lo duplicaría
    if (await destino.find(email)) {
        throw new ConflictError(`El usuario ya tiene un perfil de ${nuevoRol}`);
    }

    // Se crea el perfil nuevo ANTES de borrar el viejo: si los datos del rol destino son
    // inválidos (grado inexistente, materia inexistente), esto tira y el usuario queda
    // exactamente como estaba, en vez de perder su perfil viejo a cambio de nada.
    const nuevoPerfil = await destino.create(user, datosPerfil);

    const perfilAnterior = await origen.find(email);
    if (perfilAnterior) {
        await origen.remove(email);
    }

    await updateUserById(user._id, { rol });

    logger.info(`[ADMIN] Rol cambiado para ${email}: ${rolActual} -> ${nuevoRol}`);
    return nuevoPerfil;
};
