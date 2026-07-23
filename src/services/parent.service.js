import * as parentRepository from '../repositories/parent.repository.js'
import * as userService from '../services/user-service.js'
import { hardDeleteUserById, deleteUserById } from '../repositories/user-repository.js';
import { runInTransaction } from '../utils/transaction.js';
import logger from '../config/logger.js';
import { NotFoundError, ConflictError } from '../errors/errors.js';

export const getParents = async (page, limit) =>{
    return await parentRepository.findAllParents(page, limit);
};

export const createParent = async ({nombre, apellido, email, password, fecha_nacimiento, rolNombre,genero, domicilio, nacionalidad, telefono, telefono_trabajo, lugar_trabajo, profesion}) =>{

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
            const parentExists = await parentRepository.findParentByUserId(user.id);
            if(!parentExists){
                return await parentRepository.createParent({
                    usuario: user,
                    telefono,
                    telefono_trabajo,
                    lugar_trabajo,
                    profesion,
                });
            }else{
                throw new ConflictError("Padre ya existente");
            }
        } catch (error) {
            await hardDeleteUserById(user._id);
            logger.warn(`Rollback: Usuario ${email} eliminado tras fallo en creación de padre`);
            throw error;
        }
    }else{
        throw new ConflictError("Usuario ya existente");
    }
};

// Crea el perfil de padre sobre un usuario que YA existe. Lo usa el cambio de rol, donde
// el User no se crea de nuevo (a diferencia de createParent), solo se le arma el perfil nuevo.
export const createParentProfileForUser = async (user, {telefono, telefono_trabajo, lugar_trabajo, profesion}, session) => {
    return await parentRepository.createParent({
        usuario: user,
        telefono,
        telefono_trabajo,
        lugar_trabajo,
        profesion,
    }, session);
};

export const updateParent = async ({email, telefono, telefono_trabajo, lugar_trabajo, profesion}) =>{
    const parentUser = await userService.searchUserByEmail(email);

    if(parentUser){
        const parentExists = await parentRepository.findParentByUserId(parentUser.id);

        if(parentExists){
            return await parentRepository.updateParentByUserId(parentExists.id, {telefono,
                telefono_trabajo, lugar_trabajo, profesion
                });
        }else{
            throw new NotFoundError("El padre no existe");
        }
    }else{
        throw new NotFoundError("El usuario no existe");
    };
};

// Borra SOLO el perfil de padre, sin tocar el usuario. Lo usa el cambio de rol, donde la persona
// sigue existiendo y únicamente cambia de perfil.
export const deleteParentProfile = async (email, session) => {
    const parentUser = await userService.searchUserByEmail(email);
    if(!parentUser){
        throw new NotFoundError("El usuario no existe");
    }

    const parentExists = await parentRepository.findParentByUserId(parentUser.id);
    if(!parentExists){
        throw new NotFoundError("El padre no existe");
    }

    // No se borra un padre con hijos matriculados: dejaría a esos Student con un padre colgando
    // (Student.padre apuntando a un doc inexistente). Hay que reasignarlos o darlos de baja
    // primero. Mismo criterio que el borrado de una clase con alumnos.
    const studentRepository = await import('../repositories/student.repository.js');
    const hijos = await studentRepository.findStudentsByParentId(parentExists._id);
    if (hijos.length > 0) {
        throw new ConflictError(`No se puede eliminar el padre: tiene ${hijos.length} hijo(s) matriculado(s). Reasignalos o dalos de baja primero.`);
    }

    return await parentRepository.deleteParentByUserId(parentExists.id, session);
};

// Da de baja a un padre: borra su perfil y desactiva su usuario, en una transacción, para que no
// pueda quedar un perfil borrado con el usuario vivo (antes el eraseUser lo hacía el controller).
export const deleteParent = async (email) =>{
    const parentUser = await userService.searchUserByEmail(email);
    if(!parentUser){
        throw new NotFoundError("El usuario no existe");
    }

    return await runInTransaction(async (session) => {
        const borrado = await deleteParentProfile(email, session);
        await deleteUserById(parentUser.id, session);
        logger.info(`[ADMIN] Padre dado de baja (perfil borrado + usuario desactivado): ${email}`);
        return borrado;
    });
};

// ¿Ese alumno es hijo de este padre? Para un padre, los datos de sus hijos son recurso propio:
// puede ver su ficha completa (grado, contacto de emergencia, condiciones médicas), igual que
// ya veía sus notas. Se consulta el repositorio de estudiantes en vez de student.service para
// no cerrar un ciclo de imports (student.service ya importa parent.service).
export const isChildOf = async (parentEmail, studentEmail) => {
    const parentUser = await userService.searchUserByEmail(parentEmail);
    if (!parentUser) {
        return false;
    }

    const parent = await parentRepository.findParentByUserId(parentUser.id);
    if (!parent) {
        return false;
    }

    const studentRepository = await import('../repositories/student.repository.js');
    const children = await studentRepository.findStudentsByParentId(parent._id);

    return children.some((child) => child.usuario?.email === studentEmail);
};

export const getParentByUserIdAndEmail = async (email) =>{
    const parentUser = await userService.searchUserByEmail(email);
    if(!parentUser){
        return null;
    }
    return await parentRepository.findParentByUserId(parentUser.id);
};
