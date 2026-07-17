/**
 * Middleware de autorización para verificar propiedad de recursos
 */
import logger from '../config/logger.js';
import { ForbiddenError, UnauthorizedError } from '../errors/errors.js';

/**
 * Verifica que el email en el request coincida con el email del usuario autenticado
 * Usado para prevenir que estudiantes/padres accedan a datos de otros usuarios
 * @param {string} emailSource - Fuente del email ('body', 'query', 'params')
 */
export const verifyOwnResource = (emailSource = 'body') => {
  return async (req, res, next) => {
    try {
      const userEmail = req.user?.email; // Email del token JWT
      const requestEmail = req[emailSource]?.email; // Email del request

      if (!userEmail) {
        throw new UnauthorizedError('Usuario no autenticado');
      }

      if (!requestEmail) {
        // Sin email en el request, el recurso no requiere verificación
        return next();
      }

      // Obtener rol del usuario
      const User = (await import('../models/user-model.js')).default;
      const user = await User.findOne({ email: userEmail }).populate('rol');

      if (!user || !user.rol) {
        throw new ForbiddenError('Usuario sin rol asignado');
      }

      const userRole = user.rol.nombre;

      // Admin y teacher pueden acceder a cualquier recurso
      if (userRole === 'admin' || userRole === 'teacher') {
        return next();
      }

      // Para student y parent, verificar que el email coincida
      if (userRole === 'student' || userRole === 'parent') {
        if (userEmail !== requestEmail) {
          logger.warn('Intento de acceso no autorizado:', {
            userEmail,
            requestEmail,
            role: userRole,
            endpoint: req.originalUrl,
          });
          throw new ForbiddenError('No tienes permiso para acceder a este recurso');
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Verifica que el email del recurso coincida con el email del usuario autenticado.
 * A diferencia de verifyOwnResource, acá solo admin bypassea la verificación.
 * Cualquier otro rol, incluido teacher, tiene que ser dueño del recurso.
 * Usado para recursos donde un teacher no debería poder gestionar los de otro teacher.
 * @param {string} emailSource - Fuente del email ('body', 'query', 'params')
 * @param {string} emailField - Nombre del campo que contiene el email en esa fuente (default 'email')
 */
export const verifyResourceOwnerOrAdmin = (emailSource = 'body', emailField = 'email') => {
  return async (req, res, next) => {
    try {
      const userEmail = req.user?.email; // Email del token JWT
      const requestEmail = req[emailSource]?.[emailField]; // Email del recurso en el request

      if (!userEmail) {
        throw new UnauthorizedError('Usuario no autenticado');
      }

      if (!requestEmail) {
        // Sin email en el request, el recurso no requiere verificación
        return next();
      }

      const User = (await import('../models/user-model.js')).default;
      const user = await User.findOne({ email: userEmail }).populate('rol');

      if (!user || !user.rol) {
        throw new ForbiddenError('Usuario sin rol asignado');
      }

      const userRole = user.rol.nombre;

      // Solo admin puede gestionar recursos de otros
      if (userRole === 'admin') {
        return next();
      }

      if (userEmail !== requestEmail) {
        logger.warn('Intento de acceso no autorizado a recurso de otro usuario:', {
          userEmail,
          requestEmail,
          role: userRole,
          endpoint: req.originalUrl,
        });
        throw new ForbiddenError('No tienes permiso para gestionar este recurso');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Verifica que un teacher solo pueda acceder a evaluaciones de sus materias
 */
export const verifyTeacherSubject = async (req, res, next) => {
  try {
    const userEmail = req.user?.email;

    if (!userEmail) {
      throw new UnauthorizedError('Usuario no autenticado');
    }

    // Obtener rol del usuario
    const User = (await import('../models/user-model.js')).default;
    const user = await User.findOne({ email: userEmail }).populate('rol');

    if (!user || !user.rol) {
      throw new ForbiddenError('Usuario sin rol asignado');
    }

    const userRole = user.rol.nombre;

    // Admin puede acceder a todo
    if (userRole === 'admin') {
      return next();
    }

    // Si es teacher, verificar que la materia sea suya
    if (userRole === 'teacher') {
      // Valida tanto la materia actual como la nueva, si la evaluación se está moviendo.
      // Antes solo se validaba la materia actual, y un teacher podía reasignar su
      // evaluación a una materia que no dicta.
      const subjectNames = [
        req.body?.nombreMateria || req.query?.nombreMateria || req.params?.nombreMateria,
        req.body?.nuevaMateria || req.query?.nuevaMateria || req.params?.nuevaMateria,
      ].filter(Boolean);

      if (subjectNames.length === 0) {
        return next(); // Si no hay materia, continuar
      }

      const Teacher = (await import('../models/teacher-model.js')).default;
      const Subject = (await import('../models/subject-model.js')).default;

      // Obtener el teacher
      const teacher = await Teacher.findOne({ usuario: user._id }).populate('grado_encargado.materias');

      if (!teacher) {
        throw new ForbiddenError('Profesor no encontrado');
      }

      // Obtener todas las materias del teacher
      const teacherSubjects = teacher.grado_encargado.flatMap(gc => gc.materias);

      for (const subjectName of subjectNames) {
        // Buscar la materia solicitada
        const subject = await Subject.findOne({ nombre: subjectName });

        if (!subject) {
          throw new ForbiddenError('Materia no encontrada');
        }

        // Verificar que el teacher tenga esa materia
        const hasSubject = teacherSubjects.some(s => s._id.toString() === subject._id.toString());

        if (!hasSubject) {
          logger.warn('Intento de acceso no autorizado a materia de otro profesor:', {
            teacherEmail: userEmail,
            subjectName,
            endpoint: req.originalUrl,
          });
          throw new ForbiddenError('No tienes permiso para acceder a esta materia');
        }
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware que enriquece req.user con información adicional del usuario
 * Agrega el rol y el _id del usuario a req.user
 */
export const enrichUserContext = async (req, res, next) => {
  try {
    if (!req.user?.email) {
      return next();
    }

    const User = (await import('../models/user-model.js')).default;
    const user = await User.findOne({ email: req.user.email }).populate('rol');

    if (user) {
      req.user.role = user.rol?.nombre;
      req.user._id = user._id;
      req.user.fullUser = user;
    }

    next();
  } catch (error) {
    logger.error('Error enriqueciendo contexto de usuario:', { error: error.message });
    next(); // Continuar aunque falle, para no romper el flujo
  }
};