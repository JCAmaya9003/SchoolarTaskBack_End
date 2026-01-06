import * as newsRepository from '../repositories/news.repository.js'
import * as userService from '../services/user-service.js';

export const createNews = async ({email, titulo, contenido}) =>{
    const userExists = await userService.searchUserByEmail(email);
    console.log(userExists);

    if (userExists) {
        const newsExists = await newsRepository.findNewsByUserIdAndTittle(userExists.id, titulo);
        console.log("newsExists " + newsExists);
        if(!newsExists){
            return await newsRepository.createNews({usuario: userExists, titulo, contenido});
        }else{
            throw new Error("La noticia ya existe");
        }
    }else{
        throw new Error("EL usuario no existe");
    }
};

export const editNews = async ({email, titulo, nuevoTitulo, contenido}) =>{
    const userExists = await userService.searchUserByEmail(email);
    console.log(userExists);

    if (userExists) {
        const newsExists = await newsRepository.findNewsByUserIdAndTittle(userExists.id, titulo);
        console.log("newsExists " + newsExists);

        if(newsExists){
            console.log("si entro")
            return await newsRepository.updateNewsById(newsExists.id, {titulo: nuevoTitulo, contenido});
        }else{
            throw new Error("La noticia no existe");
        }
    }else{
        throw new Error("EL usuario no existe");
    }
};

export const eraseNews = async ({email, titulo}) =>{
    const userExists = await userService.searchUserByEmail(email);
    console.log(userExists);

    if (userExists) {
        const newsExists = await newsRepository.findNewsByUserIdAndTittle(userExists.id, titulo);
        console.log(newsExists);
        if(newsExists){
            return await newsRepository.deleteNewsById(newsExists.id);
        }else{
            throw new Error("La noticia no existe");
        }
    }else{
        throw new Error("EL usuario no existe");
    }
};

export const getNews = async () =>{
    return await newsRepository.findAllNews();
};

export const getNewsByUser = async (email) =>{
    const userExists = await userService.searchUserByEmail(email);
    console.log(userExists);

    if (userExists) {
        return await newsRepository.findNewsByUserId(userExists.id);
    }else{
        throw new Error("EL usuario no existe");
    }
};
