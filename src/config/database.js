import mongoose from 'mongoose';
import logger from './logger.js';

export const conexionDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    logger.info('Conexión exitosa a MongoDB');
  } catch (error) {
    logger.error('Error al conectar a la base de datos:', { error: error.message });
    process.exit(1);
  }
};
