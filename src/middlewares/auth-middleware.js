import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from '../config/config.js';
import logger from '../config/logger.js';

export const generateToken = (user) => {
    return jwt.sign({ id: user.id, email: user.email }, config.jwtSecret, { expiresIn: '1h' });
};

export const hashPassword = async (password) => {
    const saltRounds = 13;
    return await bcrypt.hash(password, saltRounds);
};

export const verifyPassword = async (password, hashedPassword) => {
    return await bcrypt.compare(password, hashedPassword);
}; 

// CORREGIDO: Solo valida, no envía respuesta
export const validateToken = (req, res, next) => {
  const token = req.cookies?.token; 

  if (!token) {
    return res.status(401).json({ message: 'No se proporcionó token de autenticación' });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded; 
    next(); // CORREGIDO: ahora sí pasa al siguiente middleware
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: 'El token ha expirado' });
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: 'Token inválido' });
    }
    logger.error('Error validando token:', { error: error.message });
    return res.status(500).json({ message: 'Error al validar el token' });
  }
};

// CORREGIDO: Retorna email correctamente
export const getEmailFromToken = (req, res) => {
  const token = req.cookies?.token; 

  if (!token) {
    return res.status(401).json({ message: 'No se proporcionó token de autenticación' });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    return res.status(200).json({
      email: decoded.email,
    });
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: 'El token ha expirado' });
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: 'Token inválido' });
    }
    logger.error('Error validando token:', { error: error.message });
    return res.status(500).json({ message: 'Error al validar el token' });
  }
};

// NUEVO: Middleware para verificar roles
export const checkRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;
      
      // Aquí necesitarás importar el modelo User
      const User = (await import('../models/user-model.js')).default;
      const user = await User.findById(userId).populate('rol');
      
      if (!user || !user.rol) {
        return res.status(403).json({ message: 'Usuario sin rol asignado' });
      }

      const userRole = user.rol.nombre;
      
      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({ message: 'No tienes permisos para realizar esta acción' });
      }

      next();
    } catch (error) {
      logger.error('Error verificando rol:', { error: error.message });
      return res.status(500).json({ message: 'Error al verificar permisos' });
    }
  };
};