import express from 'express';
import { body, query } from 'express-validator';
import * as newsController from '../controllers/news.controller.js'
import { validateToken, checkRole } from '../middlewares/auth-middleware.js';
import { verifyOwnResource, enrichUserContext } from '../middlewares/authorization-middleware.js';

const router = express.Router();

// Obtener todas las noticias paginadas
router.get('/', validateToken, checkRole(['admin', 'teacher', 'student']), newsController.getAllNews);

// Obtener las noticias de un usuario puntual (admin/teacher pueden pedir cualquiera, student solo la propia)
router.get(
    '/by-user',
    validateToken,
    enrichUserContext,
    checkRole(['admin', 'teacher', 'student']),
    verifyOwnResource('query'),
    [
        query('email').isEmail().withMessage('Email inválido'),
    ],
    newsController.getAllNewsFromUser
);

// Crear noticia - solo ADMIN
router.post('/',
    validateToken,
    checkRole(['admin']),
    [
        body('email').isEmail().withMessage('Email inválido'),
        body('titulo').isString().withMessage('Titulo inválido'),
        body('contenido').isString().withMessage('Contenido inválido'),
    ],
    newsController.createNews);

// Actualizar noticia - solo ADMIN
router.put('/',
    validateToken,
    checkRole(['admin']),
    [
        body('email').isEmail().withMessage('Email inválido'),
        body('titulo').isString().withMessage('Titulo inválido'),
        body('nuevoTitulo').isString().withMessage('Titulo inválido'),
        body('contenido').isString().withMessage('Contenido inválido'),
    ],
    newsController.updateNews);

// Eliminar noticia - solo ADMIN
router.delete('/',
    validateToken,
    checkRole(['admin']),
    [
        body('email').isEmail().withMessage('Email inválido'),
        body('titulo').isString().withMessage('Titulo inválido'),
    ],
    newsController.deleteNews);

export default router;
