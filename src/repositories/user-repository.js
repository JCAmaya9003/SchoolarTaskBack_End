import User from '../models/user-model.js';

export const findUserByEmail = async (email) => {
  return await User.findOne({ email }).populate('rol', 'nombre');;
};

export const findAllusers = async () =>{
  return await User.find().populate('rol', 'nombre');;
}

export const createUser = async (userData) => {
  const user = new User(userData);
  return await (await user.save()).populate('rol', 'nombre');
};

export const updateUserById = async (id, updates) => {
  return await User.findByIdAndUpdate(id, updates, { new: true, runValidators: true }).populate('rol');
};
	
export const deleteUserById = async (id) => {
  return await User.findByIdAndDelete(id).populate('rol', 'nombre');;
};