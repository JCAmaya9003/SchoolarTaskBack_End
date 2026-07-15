import { validationResult } from 'express-validator';
import { generateToken} from '../middlewares/auth-middleware.js';
import * as userService from '../services/user-service.js';
import * as teacherService from '../services/teacher.service.js'
import * as studentService from '../services/student.service.js'
import * as parentService from '../services/parent.service.js'
import * as roleService from '../services/role-service.js'
import { InvalidCredentialsError } from '../errors/errors.js';
import { sendSuccess } from '../utils/apiResponse.js';
import logger from '../config/logger.js';

const LOGIN_COOKIE_MAX_AGE = 60 * 60 * 1000; // 1 hora, igual que la cookie de OAuth

// Forma consistente para exponer un usuario en las respuestas del CRUD (antes variaba: Nombre/userNombre/genero/Genero...)
const formatUserResponse = (user) => ({
  nombre: user.nombre,
  apellido: user.apellido,
  email: user.email,
  fecha_nacimiento: user.fecha_nacimiento,
  rol: user.rol,
  genero: user.genero,
  domicilio: user.domicilio,
  nacionalidad: user.nacionalidad,
});

export const login = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;
  try {
    const user = await userService.loginUser({email, password});

    const token = generateToken(user);
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: LOGIN_COOKIE_MAX_AGE,
    });

    return sendSuccess(res, 200, 'Inicio de sesión exitoso');

  } catch (error) {
    if (error.message === "Contraseña inválida" || error.message === "Usuario inexistente") {
      return next(new InvalidCredentialsError());
    }
    next(error);
  }
};

export const getMe = (req, res) => {
  return sendSuccess(res, 200, 'Usuario autenticado obtenido con éxito', { email: req.user.email });
};

export const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const { nombre, apellido, email, password, fecha_nacimiento, rolNombre, genero, domicilio, nacionalidad } = req.body;
  try {
    const generosPermitidos = ['Masculino', 'Femenino'];
      if (!generosPermitidos.includes(genero)) {
          return res.status(400).json({
              message: 'El género proporcionado no es válido.',
              error: `Los valores permitidos son: ${generosPermitidos.join(', ')}.`,
          });
      }

    const newUser = await userService.registerUser({nombre, apellido, email, password, fecha_nacimiento, rolNombre, genero, domicilio, nacionalidad});
    if (newUser) {
      return sendSuccess(res, 201, 'Usuario creado con éxito', formatUserResponse(newUser));
    }else{
      return res.status(409).json({ message: 'Datos Invalidos para crear usuario' });
    }
    
  } catch (error) {
    res.status(500).json({ message: 'Error al registrar usuario', error: error.message });
  }
};

export const updateUser = async (req, res)=>{
  const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({message: "Error al intentar editar el usuario!", errors: errors.array() });
    }

    try {
        const { email, nombre, apellido,  password, fecha_nacimiento, rolNombre, genero, domicilio, nacionalidad } = req.body;

        const generosPermitidos = ['Masculino', 'Femenino'];
        if (!generosPermitidos.includes(genero)) {
            return res.status(400).json({
                message: 'El género proporcionado no es válido.',
                error: `Los valores permitidos son: ${generosPermitidos.join(', ')}.`,
            });
        }

        const updatedUser = await userService.editUser(email, nombre, apellido, password, fecha_nacimiento, rolNombre, genero, domicilio, nacionalidad );

        if (updatedUser) {
          return sendSuccess(res, 200, 'Usuario actualizado con éxito', formatUserResponse(updatedUser));
        }else{
          return res.status(404).json({ message: 'El usuario y/o rol especificado no existe' });
        }

    } catch (e) {
      res.status(500).json({ message: 'Error al editar el usuario.', error: e.message });
    }
};

export const deleteUser = async (req, res) =>{
  const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({message: "Error al intentar eliminar el usuario!", errors: errors.array() });
    }
    try{
        const {email} = req.body;
        if(email){
          const erasedUser = await userService.eraseUser(email);
          if(erasedUser){
            return sendSuccess(res, 200, 'Usuario eliminado con éxito', formatUserResponse(erasedUser));
          }else{
            return res.status(404).json({ message: 'El usuario especificado no existe!' });
          }
        }else{
          return res.status(400).json({ message: 'El email del usuario es obligatorio.' });
        }
    }catch(e){
        res.status(500).json({ message: 'Error al eliminar el usuario.', error: e.message });
    }
};

export const getAllUsers = async (req, res)=>{
  const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({message: "Error al intentar mostrar los usuarios!", errors: errors.array() });
    }
    try {
          const { page, limit } = req.query;
          const { data, pagination } = await userService.getUsers(page, limit);
          return sendSuccess(res, 200, 'Usuarios obtenidos con éxito', { items: data.map(formatUserResponse), pagination });
    } catch (e) {
      res.status(500).json({ message: 'Error al mostrar los usuarios', error: e.message });
    }
};

/**
 * Obtener el permiso activo del usuario a partir de su rol.
 * @param {Object} req - Objeto de la solicitud HTTP.
 * @param {Object} res - Objeto de la respuesta HTTP.
 */
export const getUserRole = async (req, res) => {
  try {
    const { email } = req.user;

    const user = await userService.searchUserByEmail(email);
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const populatedUser = await user.populate('rol');

    if (!populatedUser.rol || !populatedUser.rol.nombre) {
      return res.status(404).json({ message: "Rol no encontrado" });
    }

    const rolNombre = populatedUser.rol.nombre;
    return sendSuccess(res, 200, 'Rol obtenido con éxito', { rol: rolNombre });
  } catch (error) {
    logger.error('Error en getUserRole:', { error: error.message });
    return res.status(500).json({ message: "Error al obtener el rol del usuario", error: error.message });
  }
};

// Una estrategia por rol: cada una busca el detalle propio de ese rol y arma su respuesta.
const ROLE_INFO_HANDLERS = {
  student: async (email) => {
    const user = await studentService.getStudentByUserIdAndEmail(email);
    if (!user) return null;
    return {
      nombre: user.usuario.nombre,
      apellido: user.usuario.apellido,
      email: user.usuario.email,
      genero: user.usuario.genero,
      domicilio: user.usuario.domicilio,
      nacionalidad: user.usuario.nacionalidad,
      fecha_nacimiento: user.usuario.fecha_nacimiento,
      rol: user.usuario.rol,
      padre: user.padre,
      grado_seccion: user.grado_seccion,
      alergias: user.alergias,
      condiciones_medicas: user.condiciones_medicas,
      contacto_emergencia: user.contacto_emergencia,
    };
  },
  parent: async (email) => {
    const user = await parentService.getParentByUserIdAndEmail(email);
    if (!user) return null;
    return {
      nombre: user.usuario.nombre,
      apellido: user.usuario.apellido,
      email: user.usuario.email,
      genero: user.usuario.genero,
      domicilio: user.usuario.domicilio,
      nacionalidad: user.usuario.nacionalidad,
      fecha_nacimiento: user.usuario.fecha_nacimiento,
      rol: user.usuario.rol,
      telefono: user.telefono,
      telefono_trabajo: user.telefono_trabajo,
      lugar_trabajo: user.lugar_trabajo,
      profesion: user.profesion,
    };
  },
  teacher: async (email) => {
    const user = await teacherService.getTeacherByUserIdAndEmail(email);
    if (!user) return null;
    return {
      nombre: user.usuario.nombre,
      apellido: user.usuario.apellido,
      email: user.usuario.email,
      genero: user.usuario.genero,
      domicilio: user.usuario.domicilio,
      nacionalidad: user.usuario.nacionalidad,
      telefono: user.telefono,
      direccion: user.direccion,
      especialidad: user.especialidad,
      materias: user.materias,
      grados_secciones: user.grados_secciones,
    };
  },
};

const ROLE_NOT_FOUND_MESSAGE = {
  student: 'Estudiante no encontrado',
  parent: 'Padre no encontrado',
  teacher: 'Profesor no encontrado',
};

export const getUserInfo = async(req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
      return res.status(400).json({message: "Error al intentar obtener los datos!", errors: errors.array() });
  }
  try{
    const {email, rolNombre} = req.body;

    const rol = await roleService.searchRoleByName(rolNombre);
    if (!rol) {
      return res.status(404).json({ message: 'Rol no encontrado!' });
    }

    const handler = ROLE_INFO_HANDLERS[rol.nombre];
    if (!handler) {
      return res.status(403).json({ message: "Rol no tiene permisos para obtener información detallada" });
    }

    const info = await handler(email);
    if (!info) {
      return res.status(404).json({ message: ROLE_NOT_FOUND_MESSAGE[rol.nombre] });
    }

    return sendSuccess(res, 200, 'Datos obtenidos con éxito', info);
  } catch (e) {
    res.status(500).json({ message: 'Error al mostrar los datos del usuario!', error: e.message });
  }
};

export const restoreUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({message: "Error al intentar restaurar el usuario!", errors: errors.array() });
  }
  try {
    const { email } = req.body;
    if(email){
      const restoredUser = await userService.restoreUser(email);
      if(restoredUser){
        return sendSuccess(res, 200, 'Usuario restaurado con éxito', formatUserResponse(restoredUser));
      }else{
        return res.status(404).json({ message: 'No se encontró un usuario eliminado con ese email' });
      }
    }else{
      return res.status(400).json({ message: 'El email del usuario es obligatorio.' });
    }
  } catch(e) {
    res.status(500).json({ message: 'Error al restaurar el usuario.', error: e.message });
  }
};

export const forgotPassword = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const { email } = req.body;
    const resetToken = await userService.forgotPassword(email);

    // Respuesta genérica siempre, exista o no el usuario (anti user-enumeration)
    const data = {};
    if (resetToken && process.env.NODE_ENV !== 'production') {
      data.resetToken = resetToken;
      data.resetUrl = `${process.env.FRONT_URL}/reset-password/${resetToken}`;
    }

    return sendSuccess(res, 200, 'Se ha generado un enlace de recuperación de contraseña', data);
  } catch(e) {
    next(e);
  }
};

export const resetPassword = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const { token } = req.params;
    const { password } = req.body;

    await userService.resetPassword(token, password);

    return sendSuccess(res, 200, 'Contraseña actualizada con éxito');
  } catch(e) {
    next(e);
  }
};