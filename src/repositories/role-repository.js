import Role from "../models/role-model.js";

export const findRoleByName = async (nombre) => {
    return await Role.findOne({nombre});
};
export const findAllRoles = async () =>{
    return await Role.find();
}
