import { validationResult } from 'express-validator';
import { generateToken} from '../middlewares/auth-middleware.js';
import { UserAlreadyExistsError, InvalidCredentialsError } from '../errors/errors.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
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
  console.log( email, password);
  try {
    const user = await userService.loginUser({email, password});

    if (user && (await bcrypt.compare(password, user.password))) {
      const token = generateToken(user);
      res.cookie('token', token, { 
        httpOnly: true,
        //secure: process.env.NODE_ENV === "production",
        sameSite: "strict", // Restricts the cookie to same-site requests
      });

      return res.json({ message: 'Inicio de sesión exitoso', token });
    } else {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

  } catch (error) {
    res.status(500).json({ message: 'Error al iniciar sesión', error: error.message });
  }
};

export const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const { nombre, apellido, email, password, fecha_nacimiento, rolNombre, genero, domicilio, nacionalidad } = req.body;
  console.log(nombre, apellido, email, password, fecha_nacimiento, rolNombre, genero, domicilio, nacionalidad );
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
        userPassw: newUser.password,
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

      /*const userRoleId = req.user.rol;

      const userRole = await roleService.searchRoleById(userRoleId);

      if (userRole) {
        if (userRole.permisos.admin) {*/

        const { email, nombre, apellido,  password, fecha_nacimiento, rolNombre, genero, domicilio, nacionalidad } = req.body;
    
        const generosPermitidos = ['Masculino', 'Femenino'];
        if (!generosPermitidos.includes(genero)) {
            return res.status(400).json({
                message: 'El género proporcionado no es válido.',
                error: `Los valores permitidos son: ${generosPermitidos.join(', ')}.`,
            });
        }
        
        //const updatedUser = await userService.editUser(email, { nombre, apellido, email, password, fecha_nacimiento, rol });
        const updatedUser = await userService.editUser(email, nombre, apellido, password, fecha_nacimiento, rolNombre, genero, domicilio, nacionalidad );

        if (updatedUser) {
          return res.status(200).json({
            message: 'Usuario actualizado con éxito',
            userNombre: updatedUser.nombre,
            userApellido: updatedUser.apellido,
            userEmail: updatedUser.email,
            userPassw: updatedUser.password,
            userFecha: updatedUser.fecha_nacimiento,
            userRol: updatedUser.rol,
            userGenero: updatedUser.genero,
            userDomicilio: updatedUser.domicilio, 
            userNacionalidad: updatedUser.nacionalidad
          });
        }else{
          return res.status(404).json({ message: 'El usuario y/o rol especificado no existe' });
        }
      /*}else{
          return res.status(403).json({ message: 'No tienes permisos para realizar esta acción.' });
        }
      }else{
        return res.status(403).json({ message: 'No se encontró el rol del usuario.' });
      }*/
      
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
    /*const userRoleId = req.user.rol;

    const userRole = await roleService.searchRoleById(userRoleId); 
    if (userRole) {
      if (userRole.permisos.admin) {*/
        const {email} = req.body;
        if(email){
          const erasedUser = await userService.eraseUser(email);
          if(erasedUser){
            return res.status(200).json({
              message: 'Usuario eliminado con éxito',
              userNombre: erasedUser.nombre,
              userApellido: erasedUser.apellido,
              userEmail: erasedUser.email,
              userPassw: erasedUser.password,
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

    
      /*}else{
        return res.status(403).json({ message: 'No tienes permisos para realizar esta acción.' });
      }
    }else{
      return res.status(403).json({ message: 'No se encontró el rol del usuario.' });
    }*/
    }catch(e){
      console.error(e);
        res.status(500).json({ message: 'Error al eliminar el usuario.', error: e.message });
    }
};

export const getAllUsers = async (req, res)=>{
  const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({message: "Error al intentar mostrar los usuarios!", errors: errors.array() });
    }
    try {
        /*const userRoleId = req.user.rol;

      const userRole = await roleService.searchRoleById(userRoleId); 
      if (userRole) {
        if (userRole.permisos.admin) {*/
          const users = await userService.getUsers();
          res.json(users);
        /*}else{
          return res.status(403).json({ message: 'No tienes permisos para realizar esta acción.' });
        }
      }else{
        return res.status(403).json({ message: 'No se encontró el rol del usuario.' });
      }*/
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
    // Obtener el token de las cookies
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: "No se proporcionó un token de autenticación" });
    }

    // Decodificar el token
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.email) {
      return res.status(400).json({ message: "Token inválido. No se encontró un email." });
    }

    const { email } = decoded;

    // Buscar al usuario por su email y popular su rol
    const user = await userService.searchUserByEmail(email);
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // Popular el rol directamente al buscar al usuario
    const populatedUser = await user.populate('rol');

    // Verificar si el rol tiene permisos definidos
    if (!populatedUser.rol || !populatedUser.rol.permisos) {
      return res.status(404).json({ message: "Rol no encontrado o permisos inválidos" });
    }

    // Buscar el permiso que está activo
    const permisos = populatedUser.rol.permisos;
    const permisoActivo = Object.keys(permisos).find(key => permisos[key] === true);

    if (!permisoActivo) {
      return res.status(404).json({ message: "No hay permisos activos para este usuario" });
    }

    // Responder con el permiso activo
    return res.status(200).json({ [permisoActivo]: true });
  } catch (error) {
    console.error("Error en getUserRole:", error);
    return res.status(500).json({ message: "Error al obtener el rol del usuario", error: error.message });
  }
};

export const getUserInfo = async(req, res) =>{
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
      return res.status(400).json({message: "Error al intentar obtener los datos!", errors: errors.array() });
  }
  try{
    const {email, rolNombre} = req.body;
    console.log(email, rol);

    const rol = await roleService.searchRoleByName(rolNombre);
    if(rol){
      if(rol.permisos.verNotas){
        const user = studentService.getStudentByUserIdAndEmail(email);
        if(user){
          return res.status(200).json({
            message: 'Datos Obtenido con Exito!',
            Nombre: user.usuario.nombre,
            Apellido: user.usuario.apellido,
            Email: user.usuario.email,
            genero: user.usuario.genero,
            domicilio: user.usuario.domicilio, 
            nacionalidad: user.usuario.nacionalidad,
            userPassw: user.usuario.password,
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

      }else if(rol.permisos.edicionInformacionFamiliar){
        const user = parentService.getParentByUserIdAndEmail(email);

        if(user){
          return res.status(200).json({
            message: 'Datos Obtenido con Exito!',
            Nombre: user.usuario.nombre,
            Apellido: user.usuario.apellido,
            Email: user.usuario.email,
            genero: user.usuario.genero,
            domicilio: user.usuario.domicilio, 
            nacionalidad: user.usuario.nacionalidad,
            userPassw: user.usuario.password,
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

      }else if(rol.permisos.edicionNotas){
        const user = teacherService.getTeacherByUserIdAndEmail(email);
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
      }
    }else{
      res.status(404).json({ message: 'Rol no encontrado!', error: e.message });
    }
  } catch (e) {
    res.status(500).json({ message: 'Error al mostrar los datos del usuario!', error: e.message });
  } 
};