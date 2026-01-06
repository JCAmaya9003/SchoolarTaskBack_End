import News from "../models/news.model.js";

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

export const findNewsByUserIdAndTittle = async (userId, tittle) =>{
    return await News.findOne({usuario: userId, titulo: tittle}).populate([
        {
            path: 'usuario', 
            select: 'nombre apellido email rol', 
            populate: {
                path: 'rol', 
                select: 'nombre',
            },
        }]);
};
export const findAllNews = async () =>{
    return await News.find().populate([
        {
            path: 'usuario', 
            select: 'nombre apellido email rol', 
            populate: {
                path: 'rol', 
                select: 'nombre',
            },
        }]);
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