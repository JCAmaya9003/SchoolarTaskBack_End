import * as roleRepository from '../repositories/role-repository.js';

// Lookup helper usado por user-service.js/user-controller.js: devuelve null (no throw) para no
// dejar ramas muertas en quien la llama (mismo patrón que subjectService.searchSubjectByName).
export const searchRoleByName = async (nombre) =>{
    return await roleRepository.findRoleByName(nombre);
}

export const getRoles = async () =>{
    return await roleRepository.findAllRoles();
}
