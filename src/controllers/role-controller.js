import { ContextHandlerImpl } from 'express-validator/lib/chain/context-handler-impl.js';
import * as roleService from '../services/role-service.js'
import { validationResult } from 'express-validator';

export const createNewRole = async (req, res)=>{
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({message: "Error al intentar crear rol!", errors: errors.array() });
    }

    try {
      /*const userRoleId = req.user.rol;

      const userRole = await roleService.searchRoleById(userRoleId);

      if (userRole) {
        if (userRole.permisos.admin) {*/

          const {nombre, permisos } = req.body;
        
          const createdRole = await roleService.newRole(nombre, permisos);

          if(createdRole){
            return res.status(201).json({
              message: 'Rol creado con éxito!',
              roleName: createdRole.nombre,
              roleAccess: createdRole.permisos,
            });
          }else{
            return res.status(400).json({ message: 'Rol ya creado' });
          }
          
        
        /*}else{
          return res.status(403).json({ message: 'No tienes permisos para realizar esta acción.' });
        }*/
      /*}else{
        return res.status(403).json({ message: 'No se encontró el rol del usuario.' });
      }*/
    }catch (e) {
      console.error(e);
      res.status(500).json({ message: 'Error al crear el rol.', error: e.message });
    };
};

export const editRole = async (req, res) =>{
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({message: "Error al intentar editar el rol!", errors: errors.array() });
    }
    
    try {
      /*const userRoleId = req.user.rol;

      const userRole = await roleService.searchRoleById(userRoleId);

      if (userRole) {
        if (userRole.permisos.admin) {*/
          const {nombre, permisos } = req.body;
          const updatedRole = await roleService.updateRole(nombre, { nombre, permisos });

          if (updatedRole) {
            return res.status(200).json({
              message: 'Rol actualizado con éxito',
              roleId: updatedRole.id,
              roleName: updatedRole.nombre,
              roleAccess: updatedRole.permisos,
            });
          }else{
            return res.status(404).json({ message: 'El rol especificado no existe!' });
          }
        /*}else{
          return res.status(403).json({ message: 'No tienes permisos para realizar esta acción.' });
        }
      }else{
        return res.status(403).json({ message: 'No se encontró el rol del usuario.' });
      }*/

    }catch (e) {
      console.error(e);
      res.status(500).json({ message: 'Error al editar el rol.', error: e.message });
    }
};

export const deleteRole = async (req, res) =>{
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({message: "Error al intentar eliminar el rol!", errors: errors.array() });
    }
   try{
    /*const userRoleId = req.user.rol;

    const userRole = await roleService.searchRoleById(userRoleId); 
    if (userRole) {
      if (userRole.permisos.admin) {*/
        const { nombre} = req.body;
        if(nombre){
          const role = await roleService.searchRoleByName(nombre);

          if(role){
            const erasedRole = await roleService.eraseRole(role.nombre);

            return res.status(200).json({
              message: 'Rol eliminado con éxito',
              roleName: erasedRole.nombre,
              roleAccess: erasedRole.permisos,
            });
          }else{
            return res.status(404).json({ message: 'El rol especificado no existe!' });
          }
        }else{
          return res.status(400).json({ message: 'El nombre del rol es obligatorio.' });
        }
        
        

      /*}else{
        return res.status(403).json({ message: 'No tienes permisos para realizar esta acción.' });
      }
    }else{
      return res.status(403).json({ message: 'No se encontró el rol del usuario.' });
    }*/
  }catch(e){
    console.error(e);
      res.status(500).json({ message: 'Error al eliminar el rol.', error: e.message });
  }
};

export const getAllRoles = async (req, res) =>{
  const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({message: "Error al intentar mostrar los roles!", errors: errors.array() });
    }
  try {
    const roles = await roleService.getRoles();
    res.json(roles);
  } catch (e) {
    res.status(500).json({ message: 'Error al mostrar los roles', error: e.message });
  }
}

export const getRoleByName = async(req, res) =>{
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
      return res.status(400).json({message: "Error al intentar mostrar el rol!", errors: errors.array() });
  }
  const { nombre} = req.body;
  try{
    if(nombre){
      const role = await roleService.searchRoleByName(nombre);
      if(role){
        res.json(role);
      }else{
        return res.status(404).json({ message: 'El rol especificado no existe!' });
      }
    }else{
      return res.status(400).json({ message: 'El nombre del rol es obligatorio.' });
    }
  } catch (e) {
    res.status(500).json({ message: 'Error al obtener el rol', error: e.message });
  }
};