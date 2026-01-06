import * as parentService from '../services/parent.service.js'
import * as userService from '../services/user-service.js'
import { validationResult } from 'express-validator';

export const getAllParents = async (req, res) =>{
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({message: "Error al intentar mostrar los padres!", errors: errors.array() });
    }
    try {
        const padres = await parentService.getParents();
        res.json(padres);
    } catch (e) {
        res.status(500).json({ message: 'Error al mostrar los padres', error: e.message });
    }
}

export const createParent = async (req, res) =>{
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { nombre, apellido, email, password, fecha_nacimiento, rolNombre,
            genero, domicilio, nacionalidad, //datos para el user
            telefono, telefono_trabajo, lugar_trabajo, profesion} = req.body;

    console.log(nombre, apellido, email, password, fecha_nacimiento, rolNombre,
        telefono, telefono_trabajo, lugar_trabajo, profesion, domicilio, nacionalidad);

    try {
        const newParent = await parentService.createParent({
            nombre, apellido, email, password, fecha_nacimiento, rolNombre,
            genero, domicilio, nacionalidad, 
            telefono, telefono_trabajo, lugar_trabajo, profesion 
        });
        
        return res.status(200).json({
            message: 'Padre creado con éxito',
            Nombre: newParent.usuario.nombre,
            Apellido: newParent.usuario.apellido,
            Email: newParent.usuario.email,
            genero: newParent.usuario.genero,
            domicilio: newParent.usuario.domicilio, 
            nacionalidad: newParent.usuario.nacionalidad,
            userPassw: newParent.usuario.password,
            userFecha: newParent.usuario.fecha_nacimiento,
            userRol: newParent.usuario.rol,
            telefono: newParent.telefono,
            telefono_trabajo: newParent.telefono_trabajo, 
            lugar_trabajo: newParent.lugar_trabajo, 
            profesion: newParent.profesion, 
        });
                
    }catch (error) {
        res.status(500).json({ message: 'Error al crear el padre', error: error.message });
    }
}

export const deleteParent = async (req, res) =>{
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { email } = req.body;
    try {
        if(email){
            const parentDeleted = await parentService.deleteParent(email);
            console.log(parentDeleted);
            await userService.eraseUser(email);

            if(parentDeleted){
                return res.status(200).json({
                    message: 'Padre eliminado con éxito',
                    userPadreNombre: parentDeleted.usuario.nombre,
                    userPadreApellido: parentDeleted.usuario.apellido,
                    userPadreEmail: parentDeleted.usuario.email,
                    userPadrePassw: parentDeleted.usuario.password,
                    domicilio: parentDeleted.domicilio,
                    genero: parentDeleted.usuario.genero,
                    nacionalidad: parentDeleted.usuario.nacionalidad,
                    telefono: parentDeleted.telefono,
                    telefono_trabajo: parentDeleted.telefono_trabajo,
                    lugar_trabajo: parentDeleted.lugar_trabajo,
                    profesion: parentDeleted.profesion,
                });
            }else{
                return res.status(409).json({ message: 'Datos Invalidos para eliminar padre' });
            }
        }else{
            return res.status(404).json({ message: 'Porfavor ingrese un email!' });
        }
    }catch (error) {
        res.status(500).json({ message: 'Error al crear el padre', error: error.message });
    }

}

export const updateParent = async (req, res) =>{
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { email, //datos para el user
        telefono, telefono_trabajo, lugar_trabajo, profesion} = req.body;
    console.log(email,
        telefono, telefono_trabajo, lugar_trabajo, profesion);

try {
        const editedParent = await parentService.updateParent({
            email, 
            telefono, 
            telefono_trabajo, 
            lugar_trabajo, 
            profesion
        });
    if(editedParent){
        return res.status(200).json({
            message: 'Padre editado con éxito',
            Nombre: editedParent.usuario.nombre,
            Apellido: editedParent.usuario.apellido,
            Email: editedParent.usuario.email,
            userPassw: editedParent.usuario.password,
            genero: editedParent.usuario.genero,
            domicilio: editedParent.usuario.domicilio, 
            nacionalidad: editedParent.usuario.nacionalidad,
            userFecha: editedParent.usuario.fecha_nacimiento,
            userRol: editedParent.usuario.rol,
            telefono: editedParent.telefono,
            telefono_trabajo: editedParent.telefono_trabajo, 
            lugar_trabajo: editedParent.lugar_trabajo, 
            profesion: editedParent.profesion, 
          });
    }else{
        return res.status(409).json({ message: 'Datos Invalidos para editar el padre' });
    }
}catch (error) {
    res.status(500).json({ message: 'Error al editar el padre', error: error.message });
}
};

export const deleteById= async(req, res) =>{
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { id } = req.body;
    console.log(id);

try {

        const deleted = await parentService.deleteWithId({
            id
        });
    if(deleted){
        return res.status(200).json({
            message: 'Padre eliminado con éxito',
            telefono: deleted.telefono,
            telefono_trabajo: deleted.telefono_trabajo, 
            lugar_trabajo: deleted.lugar_trabajo, 
            profesion: deleted.profesion, 
          });
    }else{
        return res.status(409).json({ message: 'Datos Invalidos para eliminar el padre' });
    }
}catch (error) {
    res.status(500).json({ message: 'Error al eliminar el padre', error: error.message });
}
}
