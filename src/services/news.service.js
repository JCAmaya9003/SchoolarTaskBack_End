import * as newsRepository from '../repositories/news.repository.js'
import * as userService from '../services/user-service.js';
import { NotFoundError, ConflictError } from '../errors/errors.js';

export const createNews = async ({email, titulo, contenido}) =>{
    const userExists = await userService.searchUserByEmail(email);

    if (userExists) {
        const newsExists = await newsRepository.findNewsByUserIdAndTitle(userExists.id, titulo);
        if(!newsExists){
            return await newsRepository.createNews({usuario: userExists, titulo, contenido});
        }else{
            throw new ConflictError("La noticia ya existe");
        }
    }else{
        throw new NotFoundError("El usuario no existe");
    }
};

export const editNews = async ({email, titulo, nuevoTitulo, contenido}) =>{
    const userExists = await userService.searchUserByEmail(email);

    if (userExists) {
        const newsExists = await newsRepository.findNewsByUserIdAndTitle(userExists.id, titulo);

        if(newsExists){
            return await newsRepository.updateNewsById(newsExists.id, {titulo: nuevoTitulo, contenido});
        }else{
            throw new NotFoundError("La noticia no existe");
        }
    }else{
        throw new NotFoundError("El usuario no existe");
    }
};

export const eraseNews = async ({email, titulo}) =>{
    const userExists = await userService.searchUserByEmail(email);

    if (userExists) {
        const newsExists = await newsRepository.findNewsByUserIdAndTitle(userExists.id, titulo);
        if(newsExists){
            return await newsRepository.deleteNewsById(newsExists.id);
        }else{
            throw new NotFoundError("La noticia no existe");
        }
    }else{
        throw new NotFoundError("El usuario no existe");
    }
};

export const getNews = async (page, limit) =>{
    return await newsRepository.findAllNews(page, limit);
};

export const getNewsByUser = async (email) =>{
    const userExists = await userService.searchUserByEmail(email);

    if (userExists) {
        return await newsRepository.findNewsByUserId(userExists.id);
    }else{
        throw new NotFoundError("El usuario no existe");
    }
};
