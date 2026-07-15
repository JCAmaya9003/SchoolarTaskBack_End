import Role from '../models/role-model.js';
import logger from './logger.js';

const DEFAULT_ROLES = ['admin', 'teacher', 'parent', 'student'];

/**
 * Crea los roles por defecto si no existen.
 * El registro de usuarios busca roles por nombre, así que tienen que existir sí o sí.
 */
export const seedRoles = async () => {
  for (const nombre of DEFAULT_ROLES) {
    await Role.findOneAndUpdate(
      { nombre },
      { nombre },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }
  logger.info('Roles por defecto verificados/creados');
};
