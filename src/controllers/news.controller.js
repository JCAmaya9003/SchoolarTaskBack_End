import * as newsService from '../services/news.service.js'
import { validationResult } from 'express-validator';

export const createNews = async (req, res) =>{
    const errors = validationResult(req);
  
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { email, titulo, contenido } = req.body;
    try {
        const createdNews = await newsService.createNews({ email, titulo, contenido });
        console.log("createdNews " + createdNews);

        if(createdNews){
            return res.status(200).json({
                message: 'Usuario creado con éxito',
                Nombre: createdNews.usuario.nombre,
                Apellido: createdNews.usuario.apellido,
                Email: createdNews.usuario.email,
                Titulo: createdNews.titulo,
                Contenido: createdNews.contenido
            });
        }else{
            return res.status(409).json({ message: 'Datos Invalidos para crear la noticia' });
        }
        
    } catch (error) {
        res.status(500).json({ message: 'Error al crear notica', error: error.message });
    }
};

export const updateNews = async (req, res)=>{
    const errors = validationResult(req);
      if (!errors.isEmpty()) {
          return res.status(400).json({message: "Error al intentar editar la noticia!", errors: errors.array() });
      }
  
      try {
  
        /*const userRoleId = req.user.rol;
  
        const userRole = await roleService.searchRoleById(userRoleId);
  
        if (userRole) {
          if (userRole.permisos.admin) {*/
  
          const { email, titulo, nuevoTitulo, contenido } = req.body;
          console.log(email, titulo, nuevoTitulo, contenido);
          
          //const updatedUser = await userService.editUser(email, { nombre, apellido, email, password, fecha_nacimiento, rol });
          const updatedNews = await newsService.editNews({email, titulo, nuevoTitulo,  contenido} );
            console.log("updatedNews " + updatedNews);
          if (updatedNews) {
            return res.status(200).json({
              message: 'Noticia editada con éxito',
                Nombre: updatedNews.usuario.nombre,
                Apellido: updatedNews.usuario.apellido,
                Email: updatedNews.usuario.email,
                Titulo: updatedNews.titulo,
                Contenido: updatedNews.contenido
            });
          }else{
            return res.status(404).json({ message: 'El usuario y/o noticia especificado no existe' });
          }
        /*}else{
            return res.status(403).json({ message: 'No tienes permisos para realizar esta acción.' });
          }
        }else{
          return res.status(403).json({ message: 'No se encontró el rol del usuario.' });
        }*/
        
      } catch (e) {
        res.status(500).json({ message: 'Error al editar la noticia.', error: e.message });
      }
  };

  export const deleteNews = async (req, res) =>{
    const errors = validationResult(req);
      if (!errors.isEmpty()) {
          return res.status(400).json({message: "Error al intentar eliminar la noticia!", errors: errors.array() });
      }
      try{
      /*const userRoleId = req.user.rol;
  
      const userRole = await roleService.searchRoleById(userRoleId); 
      if (userRole) {
        if (userRole.permisos.admin) {*/
          const {email, titulo} = req.body;
          if(email && titulo){
            const erasedNews = await newsService.eraseNews({email, titulo});
            if(erasedNews){
              return res.status(200).json({
                message: 'Noticia eliminada con éxito',
                Nombre: erasedNews.usuario.nombre,
                Apellido: erasedNews.usuario.apellido,
                Email: erasedNews.usuario.email,
                Titulo: erasedNews.titulo,
                Contenido: erasedNews.contenido
            });
            }else{
              return res.status(404).json({ message: 'El usuario y/o noticia especificado no existe' });
            }
          }else{
            return res.status(400).json({ message: 'El email del usuario y titulo de la noticia es obligatorio.' });
          }
  
      
        /*}else{
          return res.status(403).json({ message: 'No tienes permisos para realizar esta acción.' });
        }
      }else{
        return res.status(403).json({ message: 'No se encontró el rol del usuario.' });
      }*/
      }catch(e){
        console.error(e);
          res.status(500).json({ message: 'Error al eliminar la noticia.', error: e.message });
      }
  };

  export const getAllNews = async (req, res) =>{
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({message: "Error al intentar mostrar las noticias!", errors: errors.array() });
    }
    try {
        /*const userRoleId = req.user.rol;

      const userRole = await roleService.searchRoleById(userRoleId); 
      if (userRole) {
        if (userRole.permisos.admin) {*/
          const allNews = await newsService.getNews();
          res.json(allNews);
        /*}else{
          return res.status(403).json({ message: 'No tienes permisos para realizar esta acción.' });
        }
      }else{
        return res.status(403).json({ message: 'No se encontró el rol del usuario.' });
      }*/
    } catch (e) {
      res.status(500).json({ message: 'Error al mostrar las noticias', error: e.message });
    }
  };

  export const getAllNewsFromUser = async (req, res)=>{
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({message: "Error al intentar mostrar las noticias!", errors: errors.array() });
    }
    try {
        /*const userRoleId = req.user.rol;

      const userRole = await roleService.searchRoleById(userRoleId); 
      if (userRole) {
        if (userRole.permisos.admin) {*/
            const {email} = req.body;

            const filteredNews = await newsService.getNewsByUser(email);
            res.json(filteredNews);
        /*}else{
          return res.status(403).json({ message: 'No tienes permisos para realizar esta acción.' });
        }
      }else{
        return res.status(403).json({ message: 'No se encontró el rol del usuario.' });
      }*/
    } catch (e) {
      res.status(500).json({ message: 'Error al mostrar las noticias', error: e.message });
    }
  }