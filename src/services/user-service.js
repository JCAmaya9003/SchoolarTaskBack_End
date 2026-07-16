import {findUserByEmail, createUser, updateUserById, deleteUserById, findAllusers, restoreUserById, findDeletedUserByEmail, saveResetToken, findUserByResetToken, resetUserPassword } from '../repositories/user-repository.js';
import {hashPassword,verifyPassword} from '../middlewares/auth-middleware.js';
import * as roleService from '../services/role-service.js'
import crypto from 'crypto';
import logger from '../config/logger.js';
import { ValidationError, InvalidCredentialsError, NotFoundError, UserAlreadyExistsError } from '../errors/errors.js';

export const loginUser = async( {email, password} ) => {
    const user = await findUserByEmail(email);

    if(user){
      const isPasswordValid = await verifyPassword(password, user.password);

      if (isPasswordValid) {
        logger.info(`[AUTH] Login exitoso: ${email}`);
        return user;
      }else{
        logger.warn(`[AUTH] Login fallido (contraseña incorrecta): ${email}`);
        throw new InvalidCredentialsError();
      }
    }else{
      logger.warn(`[AUTH] Login fallido (usuario inexistente): ${email}`);
      throw new InvalidCredentialsError();
    }
};

export const registerUser = async ( {nombre, apellido, email, password, fecha_nacimiento, rolNombre, genero, domicilio, nacionalidad}) => {

    const userExists = await findUserByEmail(email);

    if (!userExists) {
      const rol = await roleService.searchRoleByName(rolNombre);

      if(rol){
        const hashedPassword = await hashPassword(password);

        const newUser = await createUser({
          nombre,
          apellido,
          username: email,
          email,
          password: hashedPassword,
          fecha_nacimiento,
          rol,
          genero,
          domicilio,
          nacionalidad,
        });
        logger.info(`[AUTH] Usuario registrado: ${email}, rol: ${rolNombre}`);
        return newUser;
      }else{
        throw new NotFoundError("El rol no existe");
      }
    }else{
      throw new UserAlreadyExistsError();
    }
};

export const editUser = async (email, nombre, apellido, password, fecha_nacimiento, rolNombre, genero, domicilio, nacionalidad) => {
  const user = await findUserByEmail(email);

  if(user){
    const rol = await roleService.searchRoleByName(rolNombre);

    if(rol){
      // Solo re-hashear si el password cambió (no es el hash actual)
      const isSamePassword = await verifyPassword(password, user.password);
      const finalPassword = isSamePassword ? user.password : await hashPassword(password);

      const updatedUser = await updateUserById(user._id, {email, nombre, apellido, password: finalPassword, fecha_nacimiento, rol, genero, domicilio, nacionalidad });
      logger.info(`[ADMIN] Usuario editado: ${email}, nuevo rol: ${rolNombre}`);
      return updatedUser;
    }else{
      throw new NotFoundError("El rol no existe");
    }
  }else{
    throw new NotFoundError("El usuario no existe");
  }
};

export const eraseUser = async (email) => {
  const user = await findUserByEmail(email);

  if(!user){
    return null;
  }

  const erasedUser = await deleteUserById(user._id);
  logger.info(`[ADMIN] Usuario eliminado (soft delete): ${email}`);
  return erasedUser;
};

export const searchUserByEmail = async (email) => {
  const user = await findUserByEmail(email);
  if(user){
    return user;
  }else{
    return null;
  }
};

export const getUsers = async (page, limit) =>{
  return await findAllusers(page, limit);
};

export const restoreUser = async (email) => {
  const deletedUser = await findDeletedUserByEmail(email);

  if(!deletedUser){
    return null;
  }

  const restoredUser = await restoreUserById(deletedUser._id);
  logger.info(`[ADMIN] Usuario restaurado: ${email}`);
  return restoredUser;
};

export const forgotPassword = async (email) => {
  const user = await findUserByEmail(email);

  if(!user){
    // No revelar si el email existe o no (anti user-enumeration)
    logger.warn(`[PASSWORD RESET] Intento con email no registrado: ${email}`);
    return null;
  }

  // Generar token aleatorio
  const resetToken = crypto.randomBytes(32).toString('hex');

  // Hashear el token antes de guardarlo en la BD
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  // Expira en 1 hora
  const expires = new Date(Date.now() + 60 * 60 * 1000);

  await saveResetToken(user._id, hashedToken, expires);

  // En desarrollo, loguear el token para testing
  logger.info(`[PASSWORD RESET] Token generado para ${email}: ${resetToken}`);

  return resetToken;
};

export const resetPassword = async (token, newPassword) => {
  // Hashear el token recibido para comparar con el guardado
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await findUserByResetToken(hashedToken);

  if(!user){
    throw new ValidationError("Token inválido o expirado");
  }

  const hashedPassword = await hashPassword(newPassword);
  await resetUserPassword(user._id, hashedPassword);

  logger.info(`[AUTH] Contraseña restablecida para usuario: ${user.email}`);
  return true;
};