import rateLimit from 'express-rate-limit';

const isTest = process.env.NODE_ENV === 'test';

// Middleware passthrough para tests
const passthrough = (req, res, next) => next();

// Rate limiter para endpoints de autenticación
// Limita a 5 intentos por 15 minutos
// No se define un keyGenerator propio: el default de express-rate-limit ya identifica por IP
// y además normaliza IPv6 agrupando por subred (/56), evitando que un usuario IPv6 esquive
// el límite rotando entre las miles de direcciones de su prefijo. Un `req.ip` a mano no hacía
// esa normalización y disparaba el warning ERR_ERL_KEY_GEN_IPV6.
export const authLimiter = isTest ? passthrough : rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Máximo 5 intentos
  message: {
    message: 'Demasiados intentos de autenticación. Por favor, intenta de nuevo en 15 minutos.',
  },
  standardHeaders: true, // Incluye headers RateLimit-*
  legacyHeaders: false, // Desactiva headers X-RateLimit-*
});

// Rate limiter general para APIs
// Limita a 100 requests por 15 minutos
export const apiLimiter = isTest ? passthrough : rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Máximo 100 requests
  message: {
    message: 'Demasiadas peticiones. Por favor, intenta de nuevo más tarde.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
