import mongoose from 'mongoose';

/**
 * Ejecuta una función dentro de una transacción de MongoDB.
 *
 * Varias operaciones del sistema tocan más de una colección (dar de baja a una persona borra su
 * perfil Y desactiva su usuario; cambiar de rol crea un perfil, borra otro y actualiza el usuario).
 * Sin transacción, si la segunda escritura falla queda un estado imposible: un perfil borrado con
 * el usuario vivo, o un usuario con dos perfiles. Con `withTransaction`, o se aplican todas las
 * escrituras o no se aplica ninguna.
 *
 * Requiere que MongoDB corra como replica-set (Atlas ya lo es; en tests se usa MongoMemoryReplSet).
 *
 * @param {Function} fn - Recibe la sesión y hace las escrituras con ella.
 * @returns {Promise<*>} - Lo que devuelva `fn`.
 */
export const runInTransaction = async (fn) => {
    const session = await mongoose.startSession();
    try {
        let resultado;
        // withTransaction se encarga del commit, del abort ante una excepción, y de reintentar
        // los errores transitorios que Mongo marca como reintentables.
        await session.withTransaction(async () => {
            resultado = await fn(session);
        });
        return resultado;
    } finally {
        await session.endSession();
    }
};
