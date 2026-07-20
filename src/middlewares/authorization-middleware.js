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

      // Un padre es dueño de los datos de sus hijos, así que puede consultarlos igual que
      // los propios. Cualquier otro alumno sigue siendo ajeno.
      if (userRole === 'parent' && userEmail !== requestEmail) {
        const parentService = await import('../services/parent.service.js');
        if (await parentService.isChildOf(userEmail, requestEmail)) {
          return next();
        }
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

    // Si es teacher, verificar que dicte esa materia EN ese grado/sección (a nivel de clase).
    if (userRole === 'teacher') {
      // Valida tanto la materia actual como la nueva, si la evaluación se está moviendo.
      const subjectNames = [
        req.body?.nombreMateria || req.query?.nombreMateria || req.params?.nombreMateria,
        req.body?.nuevaMateria || req.query?.nuevaMateria || req.params?.nuevaMateria,
      ].filter(Boolean);

      if (subjectNames.length === 0) {
        return next(); // Si no hay materia, continuar
      }

      // Resolver la clase (grado/sección) de la operación: viene explícita en el CRUD de
      // evaluaciones y en by-evaluation; en el CRUD de notas se deriva del propio estudiante.
      const GradeSection = (await import('../models/gradeSection-model.js')).default;
      const grado = req.body?.grado || req.query?.grado;
      const seccion = req.body?.seccion || req.query?.seccion;
      let targetGradeSection = null;

      if (grado && seccion) {
        targetGradeSection = await GradeSection.findOne({ grado, seccion });
      } else {
        const studentEmail = req.body?.email || req.query?.email;
        if (studentEmail) {
          const studentService = await import('../services/student.service.js');
          const student = await studentService.getStudentByUserIdAndEmail(studentEmail);
          targetGradeSection = student?.grado_seccion || null;
        }
      }

      // Si no se puede determinar la clase (input inválido, estudiante inexistente), se deja
      // pasar: el validador de la ruta o el controller responderán el error correspondiente.
      // Solo bloqueamos cuando SÍ hay una clase real y el teacher no la dicta.
      if (!targetGradeSection) {
        return next();
      }

      const Teacher = (await import('../models/teacher-model.js')).default;
      const Subject = (await import('../models/subject-model.js')).default;

      const teacher = await Teacher.findOne({ usuario: user._id });
      if (!teacher) {
        throw new ForbiddenError('Profesor no encontrado');
      }

      const targetGsId = targetGradeSection._id.toString();

      for (const subjectName of subjectNames) {
        const subject = await Subject.findOne({ nombre: subjectName });
        if (!subject) {
          throw new ForbiddenError('Materia no encontrada');
        }

        // El teacher debe tener una asignación para esta clase que incluya esta materia.
        const teachesSubjectHere = teacher.grado_encargado.some((asignacion) =>
          asignacion.grado_seccion?.toString() === targetGsId &&
          asignacion.materias.some((m) => m.toString() === subject._id.toString())
        );

        if (!teachesSubjectHere) {
          logger.warn('Intento de acceso no autorizado a una materia/clase que el profesor no dicta:', {
            teacherEmail: userEmail,
            subjectName,
            gradoSeccion: targetGsId,
            endpoint: req.originalUrl,
          });
          throw new ForbiddenError('No tienes permiso para operar sobre esta materia en este grado y sección');
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