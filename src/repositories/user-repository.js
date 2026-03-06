import User from '../models/user-model.js';

export const findUserByEmail = async (email) => {
  return await User.findOne({ email }).populate('rol', 'nombre');
};

export const findAllusers = async () =>{
  return await User.find().populate('rol', 'nombre');
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