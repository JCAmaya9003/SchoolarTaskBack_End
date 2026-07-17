import User from '../models/user-model.js';
import { getPaginationParams, getPaginationMeta } from '../utils/pagination-helper.js';

export const findUserByEmail = async (email) => {
  return await User.findOne({ email }).populate('rol', 'nombre');
};

// password tiene select:false a nivel de schema (defensa en profundidad para que ningún otro
// query lo devuelva por accidente); esta función es la única que lo trae explícitamente,
// para los dos únicos casos que lo necesitan: comparar contraseña en login y en editUser.
export const findUserByEmailWithPassword = async (email) => {
  return await User.findOne({ email }).select('+password').populate('rol', 'nombre');
};

export const findAllusers = async (page, limit) => {
  const { skip, limit: validLimit, page: validPage } = getPaginationParams(page, limit);

  const [users, total] = await Promise.all([
    User.find().skip(skip).limit(validLimit).populate('rol', 'nombre'),
    User.countDocuments(),
  ]);

  return {
    data: users,
    pagination: getPaginationMeta(validPage, validLimit, total),
  };
}

export const createUser = async (userData) => {
  const user = new User(userData);
  return await (await user.save()).populate('rol', 'nombre');
};

export const updateUserById = async (id, updates) => {
  return await User.findByIdAndUpdate(id, updates, { new: true, runValidators: true }).populate('rol');
};
	
export const deleteUserById = async (id) => {
  return await User.softDeleteById(id);
};

export const restoreUserById = async (id) => {
  return await User.restoreById(id);
};

// Hard delete para rollback en transacciones compensatorias
export const hardDeleteUserById = async (id) => {
  return await User.findByIdAndDelete(id).setOptions({ includeDeleted: true });
};

export const findDeletedUserByEmail = async (email) => {
  return await User.findOneWithDeleted({ email, deletedAt: { $ne: null } }).populate('rol', 'nombre');
};

export const saveResetToken = async (id, hashedToken, expires) => {
  return await User.findByIdAndUpdate(id, {
    resetPasswordToken: hashedToken,
    resetPasswordExpires: expires,
  }, { new: true });
};

export const findUserByResetToken = async (hashedToken) => {
  return await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: new Date() },
  });
};

export const resetUserPassword = async (id, hashedPassword) => {
  return await User.findByIdAndUpdate(id, {
    password: hashedPassword,
    resetPasswordToken: null,
    resetPasswordExpires: null,
  }, { new: true });
};