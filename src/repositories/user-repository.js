import User from '../models/user-model.js';
import { getPaginationParams, getPaginationMeta } from '../utils/pagination-helper.js';

export const findUserByEmail = async (email) => {
  return await User.findOne({ email }).populate('rol', 'nombre');
};

// password tiene select:false a nivel de schema, para que ningún otro query lo devuelva
// por accidente. Esta función es la única que lo trae explícitamente, para los dos únicos
// casos que lo necesitan: comparar contraseña en login y en editUser. También trae los
// campos de control de fuerza bruta que loginUser necesita para saber si la cuenta está bloqueada.
export const findUserByEmailWithPassword = async (email) => {
  return await User.findOne({ email })
    .select('+password +failedLoginAttempts +lockUntil +lastFailedLoginAt')
    .populate('rol', 'nombre');
};

// Actualiza el estado de intentos fallidos y bloqueo sin pasar por las validaciones
// completas del usuario, ya que esto no es una edición de perfil.
export const updateLoginAttemptState = async (id, { failedLoginAttempts, lockUntil, lastFailedLoginAt }) => {
  return await User.findByIdAndUpdate(id, { failedLoginAttempts, lockUntil, lastFailedLoginAt });
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

// IDs de los usuarios activos (el plugin de soft-delete excluye a los desactivados). Se usa para
// filtrar los perfiles Student/Teacher/Parent a nivel de query en vez de en memoria, así la
// paginación no cuenta a los desactivados (antes una página de 20 podía traer menos).
// Se usa find().select() y no distinct('_id'): distinct NO dispara el pre('find') del plugin de
// soft-delete, así que devolvería también los usuarios desactivados.
export const findActiveUserIds = async () => {
  const users = await User.find().select('_id');
  return users.map((u) => u._id);
};

export const createUser = async (userData, session) => {
  const user = new User(userData);
  const guardado = await user.save(session ? { session } : undefined);
  return await guardado.populate('rol', 'nombre');
};

export const updateUserById = async (id, updates, session) => {
  const query = User.findByIdAndUpdate(id, updates, { new: true, runValidators: true }).populate('rol');
  return await (session ? query.session(session) : query);
};
	
export const deleteUserById = async (id, session) => {
  return await User.softDeleteById(id, session);
};

export const restoreUserById = async (id) => {
  return await User.restoreById(id);
};

// hardDeleteUserById se eliminó: existía solo para el rollback manual de los creates, que ahora
// corren dentro de una transacción y se deshacen solos.

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
    // Probar la propiedad del email vía el token de reset es una señal suficiente para
    // desbloquear la cuenta, aunque haya quedado bloqueada por intentos fallidos previos.
    failedLoginAttempts: 0,
    lockUntil: null,
    lastFailedLoginAt: null,
  }, { new: true });
};