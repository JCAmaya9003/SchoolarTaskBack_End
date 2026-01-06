import * as roleRepository from '../repositories/role-repository.js';

export const newRole = async (nombre, permisos) =>{
    const role = await roleRepository.findRoleByName(nombre);

    if(!role){
        const newRole = await roleRepository.createRole({
            nombre: nombre,
            permisos: {
                student: permisos.student,
                parent: permisos.parent,
                teacher: permisos.teacher,
                admin: permisos.admin,
            },
        });
        return newRole;
    }else{
        throw new Error("El rol ya existe");
    };
}

export const updateRole = async (nombre, updates) =>{
    const role = await roleRepository.findRoleByName(nombre);
    if(role){
        const allowedUpdates = ['nombre', 'permisos'];
        const isValidUpdate = Object.keys(updates).every((key) => allowedUpdates.includes(key));
        
        if(isValidUpdate){
            const updatedRole = await roleRepository.updateRoleById(role.id, updates);
            return updatedRole;
        }else{
            throw new Error("Datos para editar invalidos! La estructura debe ser: Nombre, Permisos(adentro van los permisos)")
        }
    }else{
        throw new Error("No existe el rol");
    };
}

export const eraseRole = async (nombre)=>{
    const role = await roleRepository.findRoleByName(nombre);
    if(role){
        const deletedRole = await roleRepository.deleteRoleById(role.id);
        if(deletedRole){
            return deletedRole;
        }else{
            throw new Error("Datos invaliddos para eliminar el rol")
        }
    }else{
        throw new Error("El rol no existe");
    };
}
export const searchRoleByName = async (nombre) =>{
    const roleExists = await roleRepository.findRoleByName(nombre);
    if(roleExists){
        return roleExists;
    }else{
        throw new Error("El rol no existe");
    };
}

export const getRoles = async () =>{
    return await roleRepository.findAllRoles();
}