import News from "../models/news.model.js";
import { getPaginationParams, getPaginationMeta } from "../utils/pagination-helper.js";

export const findNewsByUserId = async (userId) =>{
    return await News.find({usuario: userId}).populate([
        {
            path: 'usuario', 
            select: 'nombre apellido email rol', 
            populate: {
                path: 'rol', 
                select: 'nombre',
            },
        }]);
};

export const findNewsByUserIdAndTitle = async (userId, title) =>{
    return await News.findOne({usuario: userId, titulo: title}).populate([
        {
            path: 'usuario', 
            select: 'nombre apellido email rol', 
            populate: {
                path: 'rol', 
                select: 'nombre',
            },
        }]);
};
export const findAllNews = async (page, limit) =>{
    const { skip, limit: validLimit, page: validPage } = getPaginationParams(page, limit);

    const [news, total] = await Promise.all([
      News.find()
        .skip(skip)
        .limit(validLimit)
        .sort({ createdAt: -1 }) // Ordenar por fecha de creación descendente
        .populate([
          {
              path: 'usuario',
              select: 'nombre apellido email rol',
              populate: {
                  path: 'rol',
                  select: 'nombre',
              },
          }]),
      News.countDocuments(),
    ]);

    return {
      data: news,
      pagination: getPaginationMeta(validPage, validLimit, total),
    };
  };
  
  export const createNews = async (newsData) => {
    const news = new News(newsData);
    return await (await news.save()).populate([
        {
            path: 'usuario', 
            select: 'nombre apellido email rol', 
            populate: {
                path: 'rol', 
                select: 'nombre',
            },
        }]);
  };
  
  export const updateNewsById = async (id, updates) => {
    return await News.findByIdAndUpdate(id, updates, { new: true, runValidators: true }).populate([
        {
            path: 'usuario', 
            select: 'nombre apellido email rol', 
            populate: {
                path: 'rol', 
                select: 'nombre',
            },
        }]);
  };
      
  export const deleteNewsById = async (id) => {
    return await News.findByIdAndDelete(id).populate([
        {
            path: 'usuario', 
            select: 'nombre apellido email rol', 
            populate: {
                path: 'rol', 
                select: 'nombre',
            },
        }]);
  };