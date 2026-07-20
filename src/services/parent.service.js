import * as parentRepository from '../repositories/parent.repository.js'
import * as userService from '../services/user-service.js'
import { hardDeleteUserById } from '../repositories/user-repository.js';
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
export const createParentProfileForUser = async (user, {telefono, telefono_trabajo, lugar_trabajo, profesion}) => {
    return await parentRepository.createParent({
        usuario: user,
        telefono,
        telefono_trabajo,
        lugar_trabajo,
        profesion,
    });
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

export const deleteParent = async (email) =>{
    const parentUser = await userService.searchUserByEmail(email);
    if(parentUser){
        const parentExists = await parentRepository.findParentByUserId(parentUser.id);

        if(parentExists){
            return await parentRepository.deleteParentByUserId(parentExists.id);
        }else{
            throw new NotFoundError("El padre no existe");
        }
    }else{
        throw new NotFoundError("El usuario no existe");
    }
};

export const getParentByUserIdAndEmail = async (email) =>{
    const parentUser = await userService.searchUserByEmail(email);
    if(!parentUser){
        return null;
    }
    return await parentRepository.findParentByUserId(parentUser.id);
};
