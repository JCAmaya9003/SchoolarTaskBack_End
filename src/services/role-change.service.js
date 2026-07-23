import * as userService from './user-service.js';
import * as roleService from './role-service.js';
import * as studentService from './student.service.js';
import * as teacherService from './teacher.service.js';
import * as parentService from './parent.service.js';
import { updateUserById } from '../repositories/user-repository.js';
import { runInTransaction } from '../utils/transaction.js';
import logger from '../config/logger.js';
import { NotFoundError, ConflictError } from '../errors/errors.js';

// Cambiar el rol de un usuario implica cambiarle el perfil, no solo el campo `rol`: cada rol
// guarda datos propios en su propia colección. Acá se define, por rol, cómo encontrar el perfil
// actual, cómo borrarlo y cómo crear el nuevo. `admin` no tiene perfil asociado, por eso sus
// tres operaciones son no-ops.
const PROFILE_HANDLERS = {
    // `remove` borra SOLO el perfil, no da de baja a la persona: acá el usuario sigue vivo y
    // únicamente cambia de rol. Usar la baja completa lo dejaría desactivado.
    student: {
        find: (email) => studentService.getStudentByUserIdAndEmail(email),
        remove: (email, session) => studentService.deleteStudentProfile(email, session),
        create: (user, datos, session) => studentService.createStudentProfileForUser(user, datos, session),
    },
    teacher: {
        find: (email) => teacherService.getTeacherByUserIdAndEmail(email),
        remove: (email, session) => teacherService.deleteTeacherProfile(email, session),
        create: (user, datos, session) => teacherService.createTeacherProfileForUser(user, datos, session),
    },
    parent: {
        find: (email) => parentService.getParentByUserIdAndEmail(email),
        remove: (email, session) => parentService.deleteParentProfile(email, session),
        create: (user, datos, session) => parentService.createParentProfileForUser(user, datos, session),
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

    // Las tres escrituras (crear el perfil nuevo, borrar el viejo, actualizar el rol) van en una
    // transacción: sin ella, un fallo en el paso 2 dejaba al usuario con DOS perfiles.
    const perfilAnterior = await origen.find(email);

    const nuevoPerfil = await runInTransaction(async (session) => {
        // Se crea el perfil nuevo ANTES de borrar el viejo: si los datos del rol destino son
        // inválidos (grado inexistente, materia inexistente), esto tira antes de destruir nada.
        const creado = await destino.create(user, datosPerfil, session);

        if (perfilAnterior) {
            await origen.remove(email, session);
        }

        await updateUserById(user._id, { rol }, session);
        return creado;
    });

    logger.info(`[ADMIN] Rol cambiado para ${email}: ${rolActual} -> ${nuevoRol}`);
    return nuevoPerfil;
};
