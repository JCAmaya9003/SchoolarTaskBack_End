import * as newsService from '../services/news.service.js'
import { validationResult } from 'express-validator';
import { sendSuccess } from '../utils/apiResponse.js';

// Optional chaining sobre `usuario`: una noticia es un anuncio general que sigue siendo válido
// aunque su autor haya sido desactivado (populate -> null). No se oculta, solo se evita el 500.
const formatNewsResponse = (news) => ({
    id: news._id,
    titulo: news.titulo,
    contenido: news.contenido,
    autor: {
        nombre: news.usuario?.nombre,
        apellido: news.usuario?.apellido,
        email: news.usuario?.email,
    },
    createdAt: news.createdAt,
    updatedAt: news.updatedAt,
});

export const createNews = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { email, titulo, contenido } = req.body;
    try {
        const createdNews = await newsService.createNews({ email, titulo, contenido });
        return sendSuccess(res, 201, 'Noticia creada con éxito', formatNewsResponse(createdNews));
    } catch (error) {
        next(error);
    }
};

export const updateNews = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const { email, titulo, nuevoTitulo, contenido } = req.body;
        const updatedNews = await newsService.editNews({ email, titulo, nuevoTitulo, contenido });
        return sendSuccess(res, 200, 'Noticia editada con éxito', formatNewsResponse(updatedNews));
    } catch (error) {
        next(error);
    }
};

export const deleteNews = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const { email, titulo } = req.body;
        const erasedNews = await newsService.eraseNews({ email, titulo });
        return sendSuccess(res, 200, 'Noticia eliminada con éxito', formatNewsResponse(erasedNews));
    } catch (error) {
        next(error);
    }
};

export const getAllNews = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const { page, limit } = req.query;
        const { data, pagination } = await newsService.getNews(page, limit);
        return sendSuccess(res, 200, 'Noticias obtenidas con éxito', { items: data.map(formatNewsResponse), pagination });
    } catch (error) {
        next(error);
    }
};

export const getAllNewsFromUser = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const { email } = req.query;
        const filteredNews = await newsService.getNewsByUser(email);
        return sendSuccess(res, 200, 'Noticias obtenidas con éxito', filteredNews.map(formatNewsResponse));
    } catch (error) {
        next(error);
    }
};
