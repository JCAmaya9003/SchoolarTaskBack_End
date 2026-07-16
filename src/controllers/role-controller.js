import * as roleService from '../services/role-service.js'
import { sendSuccess } from '../utils/apiResponse.js';

const formatRoleResponse = (role) => ({
    id: role._id,
    nombre: role.nombre,
});

export const getAllRoles = async (req, res, next) =>{
    try {
        const roles = await roleService.getRoles();
        return sendSuccess(res, 200, 'Roles obtenidos con éxito', roles.map(formatRoleResponse));
    } catch (error) {
        next(error);
    }
}
