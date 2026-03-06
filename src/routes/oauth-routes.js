import express from 'express';
import { generateAuthUrl, handleOAuthCallback } from '../controllers/oauth-controller.js';
import { authLimiter } from '../middlewares/rate-limiter.js';

const router = express.Router();

router.post('/', authLimiter, generateAuthUrl);
router.get('/', authLimiter, handleOAuthCallback);

export default router;