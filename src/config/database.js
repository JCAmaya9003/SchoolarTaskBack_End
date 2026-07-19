import mongoose from 'mongoose';
import logger from './logger.js';

export const conexionDB = async () => {
  // Sin MONGO_URI no hay nada que hacer: mejor un mensaje claro que un error críptico de Mongoose.
  if (!process.env.MONGO_URI) {
    logger.error('MONGO_URI no está definida. Configurá tu .env (ver .env.example) o levantá el proyecto con Docker (docker compose up), que ya incluye MongoDB.');
    process.exit(1);
  }
  try {
    await mongoose.connect(process.env.MONGO_URI);
    logger.info('Conexión exitosa a MongoDB');
  } catch (error) {
    logger.error('Error al conectar a la base de datos:', { error: error.message });
    process.exit(1);
  }
};
