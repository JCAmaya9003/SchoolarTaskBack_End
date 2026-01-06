import express from 'express';
import { generateAuthUrl, handleOAuthCallback } from '../controllers/oauth-controller.js';

const router = express.Router();

router.post('/', generateAuthUrl);
router.get('/', handleOAuthCallback);

export default router;