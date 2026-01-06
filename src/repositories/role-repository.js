import Role from "../models/role-model.js";

export const findRolebyId = async (id) => {
    return await Role.find({id});
};
export const findRoleByName = async (nombre) => {
    return await Role.findOne({nombre});
};
export const findAllRoles = async () =>{
    return await Role.find();
}
export const createRole = async (roleData) => {
    const role = new Role(roleData);
    return await role.save();
};
export const updateRoleById = async (id, updates) => {
    return await Role.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
};
export const deleteRoleById = async (id) => {
    return await Role.findByIdAndDelete(id);
};