import * as newsService from '../services/news.service.js'
import { validationResult } from 'express-validator';
import { sendSuccess } from '../utils/apiResponse.js';

const formatNewsResponse = (news) => ({
    id: news._id,
    titulo: news.titulo,
    contenido: news.contenido,
    autor: {
        nombre: news.usuario.nombre,
        apellido: news.usuario.apellido,
        email: news.usuario.email,
    },
    createdAt: news.createdAt,
    updatedAt: news.updatedAt,
});

export const createNews = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { email, titulo, contenido } = req.body;
    try {
        const createdNews = await newsService.createNews({ email, titulo, contenido });
        return sendSuccess(res, 201, 'Noticia creada con éxito', formatNewsResponse(createdNews));
    } catch (error) {
        res.status(500).json({ message: 'Error al crear noticia', error: error.message });
    }
};

export const updateNews = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const { email, titulo, nuevoTitulo, contenido } = req.body;
        const updatedNews = await newsService.editNews({ email, titulo, nuevoTitulo, contenido });
        return sendSuccess(res, 200, 'Noticia editada con éxito', formatNewsResponse(updatedNews));
    } catch (error) {
        res.status(500).json({ message: 'Error al editar la noticia.', error: error.message });
    }
};

export const deleteNews = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const { email, titulo } = req.body;
        const erasedNews = await newsService.eraseNews({ email, titulo });
        return sendSuccess(res, 200, 'Noticia eliminada con éxito', formatNewsResponse(erasedNews));
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar la noticia.', error: error.message });
    }
};

export const getAllNews = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const { page, limit } = req.query;
        const { data, pagination } = await newsService.getNews(page, limit);
        return sendSuccess(res, 200, 'Noticias obtenidas con éxito', { items: data.map(formatNewsResponse), pagination });
    } catch (error) {
        res.status(500).json({ message: 'Error al mostrar las noticias', error: error.message });
    }
};

export const getAllNewsFromUser = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const { email } = req.query;
        const filteredNews = await newsService.getNewsByUser(email);
        return sendSuccess(res, 200, 'Noticias obtenidas con éxito', filteredNews.map(formatNewsResponse));
    } catch (error) {
        res.status(500).json({ message: 'Error al mostrar las noticias', error: error.message });
    }
};
