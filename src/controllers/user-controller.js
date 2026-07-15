import { validationResult } from 'express-validator';
import { generateToken} from '../middlewares/auth-middleware.js';
import * as userService from '../services/user-service.js';
import * as teacherService from '../services/teacher.service.js'
import * as studentService from '../services/student.service.js'
import * as parentService from '../services/parent.service.js'
import * as roleService from '../services/role-service.js'

export const login = async (req, res) => {
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
    });

    return res.json({ message: 'Inicio de sesión exitoso' });

  } catch (error) {
    if (error.message === "Contraseña inválida" || error.message === "Usuario inexistente") {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }
    res.status(500).json({ message: 'Error al iniciar sesión', error: error.message });
  }
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
      return res.status(200).json({
        message: 'Usuario creado con éxito',
        Nombre: newUser.nombre,
        Apellido: newUser.apellido,
        Email: newUser.email,
        userFecha: newUser.fecha_nacimiento,
        userRol: newUser.rol,
        userGenero: newUser.genero,
        userDomicilio: newUser.domicilio,
        userNacionalidad: newUser.nacionalidad
      });
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
          return res.status(200).json({
            message: 'Usuario actualizado con éxito',
            userNombre: updatedUser.nombre,
            userApellido: updatedUser.apellido,
            userEmail: updatedUser.email,
            userFecha: updatedUser.fecha_nacimiento,
            userRol: updatedUser.rol,
            userGenero: updatedUser.genero,
            userDomicilio: updatedUser.domicilio,
            userNacionalidad: updatedUser.nacionalidad
          });
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
            return res.status(200).json({
              message: 'Usuario eliminado con éxito',
              userNombre: erasedUser.nombre,
              userApellido: erasedUser.apellido,
              userEmail: erasedUser.email,
              userFecha: erasedUser.fecha_nacimiento,
              userRol: erasedUser.rol,
              userGenero: erasedUser.genero,
              userDomicilio: erasedUser.domicilio,
              userNacionalidad: erasedUser.nacionalidad
            });
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
          const users = await userService.getUsers();
          res.json(users);
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
    return res.status(200).json({ rol: rolNombre });
  } catch (error) {
    console.error("Error en getUserRole:", error);
    return res.status(500).json({ message: "Error al obtener el rol del usuario", error: error.message });
  }
};

export const getUserInfo = async(req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
      return res.status(400).json({message: "Error al intentar obtener los datos!", errors: errors.array() });
  }
  try{
    const {email, rolNombre} = req.body;

    const rol = await roleService.searchRoleByName(rolNombre);
    if(rol){
      if(rol.nombre === 'student'){
        const user = await studentService.getStudentByUserIdAndEmail(email);
        if(user){
          return res.status(200).json({
            message: 'Datos Obtenido con Exito!',
            Nombre: user.usuario.nombre,
            Apellido: user.usuario.apellido,
            Email: user.usuario.email,
            genero: user.usuario.genero,
            domicilio: user.usuario.domicilio,
            nacionalidad: user.usuario.nacionalidad,
            userFecha: user.usuario.fecha_nacimiento,
            userRol: user.usuario.rol,
            userParent: user.padre,
            userGradeSection: user.grado_seccion,
            alergias: user.alergias,
            condiciones_medicas: user.condiciones_medicas,
            contacto_emergencia: user.contacto_emergencia,
          });
        }else{
          return res.status(404).json({ message: "Estudiante no encontrado" });
        }

      }else if(rol.nombre === 'parent'){
        const user = await parentService.getParentByUserIdAndEmail(email);

        if(user){
          return res.status(200).json({
            message: 'Datos Obtenido con Exito!',
            Nombre: user.usuario.nombre,
            Apellido: user.usuario.apellido,
            Email: user.usuario.email,
            genero: user.usuario.genero,
            domicilio: user.usuario.domicilio,
            nacionalidad: user.usuario.nacionalidad,
            userFecha: user.usuario.fecha_nacimiento,
            userRol: user.usuario.rol,
            telefono: user.telefono,
            telefono_trabajo: user.telefono_trabajo,
            lugar_trabajo: user.lugar_trabajo,
            profesion: user.profesion,
          });
        }else{
          return res.status(404).json({ message: "Padre no encontrado" });
        }

      }else if(rol.nombre === 'teacher'){
        const user = await teacherService.getTeacherByUserIdAndEmail(email);
        if(user){
          return res.status(200).json({
            message: 'Datos Obtenido con Exito!',
            Nombre: user.usuario.nombre,
            Apellido: user.usuario.apellido,
            Email: user.usuario.email,
            Genero: user.usuario.genero,
            Domicilio: user.usuario.domicilio, 
            Nacionalidad: user.usuario.nacionalidad,
            Telefono: user.telefono,
            Direccion: user.direccion,
            Especialidad: user.especialidad,
            Materias: user.materias,
            GradoSecciones: user.grados_secciones
          });
        }else{
          return res.status(404).json({ message: "Profesor no encontrado" });
        }
      }else{
        return res.status(403).json({ message: "Rol no tiene permisos para obtener información detallada" });
      }
    }else{
      return res.status(404).json({ message: 'Rol no encontrado!'});
    }
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
        return res.status(200).json({
          message: 'Usuario restaurado con éxito',
          userNombre: restoredUser.nombre,
          userApellido: restoredUser.apellido,
          userEmail: restoredUser.email,
        });
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

export const forgotPassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const { email } = req.body;
    const resetToken = await userService.forgotPassword(email);

    const response = { message: 'Se ha generado un enlace de recuperación de contraseña' };

    // En desarrollo, incluir el token en la respuesta para testing
    if (process.env.NODE_ENV !== 'production') {
      response.resetToken = resetToken;
      response.resetUrl = `${process.env.FRONT_URL}/reset-password/${resetToken}`;
    }

    return res.status(200).json(response);
  } catch(e) {
    res.status(500).json({ message: 'Error al procesar la solicitud.', error: e.message });
  }
};

export const resetPassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const { token } = req.params;
    const { password } = req.body;

    await userService.resetPassword(token, password);

    return res.status(200).json({ message: 'Contraseña actualizada con éxito' });
  } catch(e) {
    res.status(400).json({ message: 'Error al restablecer la contraseña.', error: e.message });
  }
};