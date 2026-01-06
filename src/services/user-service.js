import {findUserByEmail, createUser, updateUserById, deleteUserById, findAllusers } from '../repositories/user-repository.js';
import {hashPassword,verifyPassword} from '../middlewares/auth-middleware.js';
import * as roleService from '../services/role-service.js'

export const loginUser = async( {email, password} ) => {
    const user = await findUserByEmail(email);
    
    if(user){
      const isPasswordValid = await verifyPassword(password, user.password);

      if (isPasswordValid) {
        return user;
      }else{
        throw new Error("Contrasenia invalida");
      }
    }else{
      throw new Error("Usuario inexistente");
    } 
};

export const registerUser = async ( {nombre, apellido, email, password, fecha_nacimiento, rolNombre, genero, domicilio, nacionalidad}) => {

    const userExists = await findUserByEmail(email);

    console.log(userExists);
    if (!userExists) {
      const rol = await roleService.searchRoleByName(rolNombre);


      if(rol){
        const hashedPassword = await hashPassword(password);
        console.log(hashedPassword + " " + password);

        const newUser = await createUser({
          nombre,
          apellido,
          username: email,
          email,
          password: hashedPassword,
          fecha_nacimiento,
          rol,
          genero,
          domicilio, 
          nacionalidad,
        });
        return newUser;
      }else{
        throw new Error("El rol no existe!");
      }
    }else{
      throw new Error("Usuario ya existe");
    }
};

export const editUser = async (email, nombre, apellido, password, fecha_nacimiento, rolNombre, genero, domicilio, nacionalidad) => {
  const user = await findUserByEmail(email);
  
  if(user){
    const rol = await roleService.searchRoleByName(rolNombre);
    console.log(rol);
      
    if(rol){
      const hashedPassword = await hashPassword(password);
      console.log(hashedPassword + " " + password);

      const updatedUser = updateUserById(user._id, {email, nombre, apellido, password: hashedPassword, fecha_nacimiento, rol, genero, domicilio, nacionalidad });
      return updatedUser;
    }else{
      throw new Error("Rol inexistente");
    }
  }else{
    throw new Error("Usuario inexistente!");
  }
};

export const eraseUser = async (email) => {
  const user = await findUserByEmail(email);

  if(user){
    const erasedUser = deleteUserById(user._id);
    return erasedUser;
  }else{
    throw new Error("Usuario no existe");
  }
};

export const searchUserByEmail = async (email) => {
  const user = await findUserByEmail(email);
  console.log("usuario encontrado: " + user);
  if(user){
    return user;
  }else{
    return null;
  }
};

export const getUsers = async () =>{
  return await findAllusers();
};