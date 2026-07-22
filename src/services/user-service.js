import {findUserByEmail, findUserByEmailWithPassword, createUser, updateUserById, deleteUserById, findAllusers, restoreUserById, findDeletedUserByEmail, saveResetToken, findUserByResetToken, resetUserPassword, updateLoginAttemptState } from '../repositories/user-repository.js';
import {hashPassword,verifyPassword} from '../middlewares/auth-middleware.js';
import * as roleService from '../services/role-service.js'
import { sendPasswordResetEmail } from './email.service.js';
import { config } from '../config/config.js';
import crypto from 'crypto';
import logger from '../config/logger.js';
import { ValidationError, InvalidCredentialsError, NotFoundError, UserAlreadyExistsError, ConflictError } from '../errors/errors.js';

// Bloqueo de cuenta por fuerza bruta, independiente de la IP. El rate limiter por IP no
// alcanza contra un atacante distribuido que rota de IP contra la misma cuenta.
const LOCKOUT_THRESHOLD = 5; // intentos fallidos a ritmo humano antes de bloquear
const LOCKOUT_DURATION_MS = 10 * 60 * 1000; // 10 minutos
// Dos intentos fallidos separados por menos de esto casi seguro no son un humano tipeando
// de nuevo su contraseña - se trata como bot y se bloquea de inmediato, más tiempo.
const BOT_INTERVAL_THRESHOLD_MS = 1000;
const BOT_LOCKOUT_DURATION_MS = 15 * 60 * 1000;

export const loginUser = async( {email, password} ) => {
    const user = await findUserByEmailWithPassword(email);

    if(!user){
      logger.warn(`[AUTH] Login fallido (usuario inexistente): ${email}`);
      throw new InvalidCredentialsError();
    }

    const now = new Date();

    // Cuenta bloqueada: mismo error genérico de siempre, nunca revelar que está bloqueada.
    // Si no, un atacante podría confirmar que el email existe y que ya lo está atacando.
    if (user.lockUntil && user.lockUntil > now) {
      logger.warn(`[AUTH] Intento de login sobre cuenta bloqueada: ${email}`);
      throw new InvalidCredentialsError();
    }

    // Cuenta sin contraseña local (ej. registrada solo por Google): responde el mismo error
    // genérico (nunca revela el motivo) en vez de que bcrypt.compare(password, undefined) tire
    // una excepción no controlada (500).
    if (!user.password) {
      logger.warn(`[AUTH] Login local sobre cuenta sin contraseña: ${email}`);
      throw new InvalidCredentialsError();
    }

    const isPasswordValid = await verifyPassword(password, user.password);

    if (isPasswordValid) {
      if (user.failedLoginAttempts > 0 || user.lockUntil || user.lastFailedLoginAt) {
        await updateLoginAttemptState(user._id, { failedLoginAttempts: 0, lockUntil: null, lastFailedLoginAt: null });
      }
      logger.info(`[AUTH] Login exitoso: ${email}`);
      return user;
    }

    // Si el bloqueo previo ya expiró, el contador arranca de nuevo desde cero
    const attemptsBeforeThis = (user.lockUntil && user.lockUntil <= now) ? 0 : user.failedLoginAttempts;
    const failedLoginAttempts = attemptsBeforeThis + 1;

    const msSinceLastFailure = user.lastFailedLoginAt ? now - user.lastFailedLoginAt : null;
    const looksAutomated = msSinceLastFailure !== null && msSinceLastFailure < BOT_INTERVAL_THRESHOLD_MS;

    let lockUntil = null;
    if (looksAutomated) {
      lockUntil = new Date(now.getTime() + BOT_LOCKOUT_DURATION_MS);
      logger.warn(`[AUTH] Patrón de fuerza bruta automatizada (intentos con <1s de diferencia), cuenta bloqueada: ${email}`);
    } else if (failedLoginAttempts >= LOCKOUT_THRESHOLD) {
      lockUntil = new Date(now.getTime() + LOCKOUT_DURATION_MS);
      logger.warn(`[AUTH] Cuenta bloqueada temporalmente por intentos fallidos repetidos: ${email}`);
    }

    await updateLoginAttemptState(user._id, { failedLoginAttempts, lockUntil, lastFailedLoginAt: now });

    logger.warn(`[AUTH] Login fallido (contraseña incorrecta): ${email}`);
    throw new InvalidCredentialsError();
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
  const user = await findUserByEmailWithPassword(email);

  if(user){
    // Cambiar el rol acá dejaba el User y su perfil desincronizados: el perfil viejo
    // (Student/Teacher/Parent) sobrevivía intacto, así que un usuario con rol student seguía
    // apareciendo en GET /teachers. La migración del perfil no puede ser automática porque los
    // perfiles no comparten campos obligatorios (un Teacher exige telefono y especialidad, que
    // un Student no tiene), así que el cambio de rol vive en su propio endpoint, que sí los pide.
    if (rolNombre !== user.rol?.nombre) {
      throw new ConflictError('No se puede cambiar el rol desde esta operación. Usá PATCH /api/users/change-role, que además migra el perfil.');
    }

    const rol = await roleService.searchRoleByName(rolNombre);

    if(rol){
      // La contraseña solo se toca si el admin manda una nueva. Si no viene, se conserva la
      // que ya tenía la cuenta: antes se reescribía siempre, así que corregir cualquier dato
      // (un domicilio) obligaba a re-enviar la contraseña y, si no coincidía con la vieja,
      // se la cambiaba en silencio. Si viene y ya es la misma, no se re-hashea al pedo.
      let finalPassword = user.password;
      if (password) {
        const isSamePassword = user.password ? await verifyPassword(password, user.password) : false;
        finalPassword = isSamePassword ? user.password : await hashPassword(password);
      }

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
    // No revelar si el email existe o no
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

  // Enviar el email con el enlace de reset. El envío se hace best-effort: si el SMTP no está
  // configurado se omite (no-op con warning), y si falla el envío se loguea pero NO se propaga
  // el error, porque el endpoint responde siempre lo mismo exista o no el usuario (anti-enumeración)
  // y un 500 solo cuando el email existe filtraría cuáles direcciones están registradas.
  const resetUrl = `${config.frontUrl}/reset-password/${resetToken}`;
  try {
    await sendPasswordResetEmail(user.email, resetUrl);
  } catch (err) {
    logger.error(`[PASSWORD RESET] Falló el envío del email de reset a ${email}: ${err.message}`);
  }

  // El token en texto plano solo se loguea fuera de producción. En producción no debe
  // quedar nunca en los logs, porque permitiría secuestrar un reset en curso.
  if (process.env.NODE_ENV !== 'production') {
    logger.info(`[PASSWORD RESET] Token generado para ${email}: ${resetToken}`);
  }

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