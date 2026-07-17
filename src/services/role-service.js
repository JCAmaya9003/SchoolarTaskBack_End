import * as roleRepository from '../repositories/role-repository.js';

// Devuelve null en vez de tirar, para no dejar ramas muertas en quien la llama
export const searchRoleByName = async (nombre) =>{
    return await roleRepository.findRoleByName(nombre);
}

export const getRoles = async () =>{
    return await roleRepository.findAllRoles();
}
