import express from 'express';
import { body, query } from 'express-validator';
import * as newsController from '../controllers/news.controller.js'
import { validateToken, checkRole } from '../middlewares/auth-middleware.js';
import { verifyOwnResource, enrichUserContext } from '../middlewares/authorization-middleware.js';
import { rejectHtml } from '../utils/xss-guard.js';

const router = express.Router();

// Obtener todas las noticias paginadas
router.get('/', validateToken, checkRole(['admin', 'teacher', 'student']), newsController.getAllNews);

// Noticias de un usuario puntual; admin/teacher piden cualquiera, student solo la propia
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
        body('titulo').isString().withMessage('Titulo inválido').custom(rejectHtml),
        body('contenido').isString().withMessage('Contenido inválido').custom(rejectHtml),
    ],
    newsController.createNews);

// Actualizar noticia - solo ADMIN
router.put('/',
    validateToken,
    checkRole(['admin']),
    [
        body('email').isEmail().withMessage('Email inválido'),
        body('titulo').isString().withMessage('Titulo inválido').custom(rejectHtml),
        body('nuevoTitulo').isString().withMessage('Titulo inválido').custom(rejectHtml),
        body('contenido').isString().withMessage('Contenido inválido').custom(rejectHtml),
    ],
    newsController.updateNews);

// Eliminar noticia - solo ADMIN
router.delete('/',
    validateToken,
    checkRole(['admin']),
    [
        body('email').isEmail().withMessage('Email inválido'),
        body('titulo').isString().withMessage('Titulo inválido').custom(rejectHtml),
    ],
    newsController.deleteNews);

export default router;
