import express from 'express';
import { body } from 'express-validator';
import * as newsController from '../controllers/news.controller.js'

const router = express.Router();

router.get('/get_all_news', newsController.getAllNews);
router.get('/get_user_news', newsController.getAllNewsFromUser);
router.post('/create_news', [
    body('email').isEmail().withMessage('Email inválido'),
    body('titulo').isString().withMessage('Titulo inválido'),
    body('contenido').isString().withMessage('Contenido inválido'),
], newsController.createNews);

router.put('/edit_news', [
    body('email').isEmail().withMessage('Email inválido'),
    body('titulo').isString().withMessage('Titulo inválido'),
    body('nuevoTitulo').isString().withMessage('Titulo inválido'),
    body('contenido').isString().withMessage('Contenido inválido'),
], newsController.updateNews);

router.delete( '/delete_news', [
    body('email').isEmail().withMessage('Email inválido'),
    body('titulo').isString().withMessage('Titulo inválido'),
], newsController.deleteNews);

export default router;