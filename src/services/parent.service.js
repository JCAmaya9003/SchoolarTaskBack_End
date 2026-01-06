import * as parentRepository from '../repositories/parent.repository.js'
import * as userService from '../services/user-service.js'

export const getParents = async () =>{
    return await parentRepository.findAllParents();
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

        const parentExists = await parentRepository.findParentByUserId(user.id);
        if(!parentExists){

            console.log("exite: " + parentExists);

            return await parentRepository.createParent({
                usuario: user,
                telefono,
                telefono_trabajo,
                lugar_trabajo,
                profesion, 
            });

        }else{
            throw new Error("Padre ya existente");
        }
    }else{
        throw new Error("Usuario ya existente");
    }
};

export const updateParent = async ({email, telefono, telefono_trabajo, lugar_trabajo, profesion}) =>{
    const parentUser = await userService.searchUserByEmail(email);
    console.log("parentuser: " + parentUser);

    if(parentUser){
        const parentExists = await parentRepository.findParentByUserId(parentUser.id);
        console.log("parentexiste: " + parentExists);

        if(parentExists){
            console.log("si existe asi que puede editarse");
            return await parentRepository.updateParentByUserId(parentExists.id, {telefono, 
                telefono_trabajo, lugar_trabajo, profesion
                });
        }else{
            throw new Error("El padre no existe");
        }
    }else{
        throw new Error("EL usuario no existe");
    };
};

export const deleteParent = async (email) =>{
    const parentUser = await userService.searchUserByEmail(email);
    console.log(parentUser);
    if(parentUser){
        const parentExists = await parentRepository.findParentByUserId(parentUser.id);

        if(parentExists){
            return await parentRepository.deleteParentByUserId(parentExists.id);
        }else{
            throw new Error("El padre no existe");
        }
    }else{
        throw new Error("EL usuario no existe");
    }
};

export const getParentByUserIdAndEmail = async (email) =>{
    const parentUser = await userService.searchUserByEmail(email);
    if(parentUser){
        const parent = await parentRepository.findParentByUserId(parentUser.id);
        return parent;
    }else{
        throw new Error("EL usuario no existe");
    }
};

export const deleteWithId = async ({id}) =>{
    const deleted = await parentRepository.deleteParentById(id);
    console.log(deleted);
    return deleted;
};