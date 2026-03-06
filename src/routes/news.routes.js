import express from 'express';
import { body } from 'express-validator';
import * as newsController from '../controllers/news.controller.js'
import { validateToken, checkRole } from '../middlewares/auth-middleware.js';

const router = express.Router();

router.get('/get_all_news', validateToken, checkRole(['admin', 'teacher', 'student']), newsController.getAllNews);
router.get('/get_user_news', validateToken, checkRole(['admin', 'teacher', 'student']), newsController.getAllNewsFromUser);
router.post('/create_news',
    validateToken,
    checkRole(['admin']),
    [
    body('email').isEmail().withMessage('Email inválido'),
    body('titulo').isString().withMessage('Titulo inválido'),
    body('contenido').isString().withMessage('Contenido inválido'),
], newsController.createNews);

router.put('/edit_news',
    validateToken,
    checkRole(['admin']),
    [
    body('email').isEmail().withMessage('Email inválido'),
    body('titulo').isString().withMessage('Titulo inválido'),
    body('nuevoTitulo').isString().withMessage('Titulo inválido'),
    body('contenido').isString().withMessage('Contenido inválido'),
], newsController.updateNews);

router.delete( '/delete_news',
    validateToken,
    checkRole(['admin']),
    [
    body('email').isEmail().withMessage('Email inválido'),
    body('titulo').isString().withMessage('Titulo inválido'),
], newsController.deleteNews);

export default router;