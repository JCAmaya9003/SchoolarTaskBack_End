import crypto from 'crypto';
import * as userService from '../services/user-service.js';
import { config } from '../config/config.js';
import { OAuth2Client } from 'google-auth-library';
import { generateToken } from '../middlewares/auth-middleware.js';
import logger from '../config/logger.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { AppError, ValidationError, NotFoundError } from '../errors/errors.js';

const CLIENT_ID = config.googleClientId;
const client = new OAuth2Client(config.googleClientId, config.googleClientSecret, config.googleRedirectUrl);

const OAUTH_STATE_COOKIE = 'oauth_state';
const OAUTH_STATE_MAX_AGE = 10 * 60 * 1000; // 10 minutos, tiempo suficiente para completar el flujo con Google

export const generateAuthUrl = async (req, res, next) => {
  try {
    // Protección CSRF: se genera un state aleatorio, se guarda en una cookie httpOnly de corta
    // duración y se exige que vuelva sin cambios en el callback. Sin esto, un atacante podía
    // iniciar su propio flujo de OAuth y engañar a la víctima para que complete el callback
    // con su code, robándole la sesión.
    const state = crypto.randomBytes(32).toString('hex');

    res.cookie(OAUTH_STATE_COOKIE, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // 'strict' no se envía tras la redirección de vuelta desde Google
      maxAge: OAUTH_STATE_MAX_AGE,
    });

    const authorizeUrl = client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
        'openid',
      ],
      prompt: 'consent',
      state,
    });

    return sendSuccess(res, 200, 'URL de autenticación generada con éxito', { url: authorizeUrl });
  } catch (error) {
    logger.error("Error generando URL de autenticación OAuth:", { error: error.message });
    next(new AppError('Failed to generate Google auth URL', 500));
  }
};


export const handleOAuthCallback = async (req, res, next) => {
  const { code, state } = req.query;

  if (!code) {
    return next(new ValidationError('Authorization code is required'));
  }

  const expectedState = req.cookies?.[OAUTH_STATE_COOKIE];
  res.clearCookie(OAUTH_STATE_COOKIE);

  if (!state || !expectedState || state !== expectedState) {
    logger.warn('OAuth callback con state inválido o ausente (posible CSRF)', { ip: req.ip });
    return next(new ValidationError('Solicitud de OAuth inválida o expirada'));
  }

  try {
    // Exchange the code for tokens google
    const { tokens } = await client.getToken(code);
    const idToken = tokens.id_token;

    if (!idToken) {
      return next(new ValidationError('Failed to retrieve ID token'));
    }

    // Verify the ID token
    const ticket = await client.verifyIdToken({
      idToken,
      audience: CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const email = payload.email;

    if (!email) {
      return next(new ValidationError('Email not found in Google token'));
    }

    // No confiar en un email que Google mismo no marca como verificado
    if (!payload.email_verified) {
      return next(new ValidationError('El email de la cuenta de Google no está verificado'));
    }

    // Match the email with the database
    const user = await userService.searchUserByEmail(email);

    if (!user) {
      return next(new NotFoundError('User not found in local database'));
    }

    // Generate a JWT for the authenticated user
    const jwtToken = generateToken({ id: user._id, email: user.email });

    // Set the token in a cookie
    res.cookie("token", jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge:   60 * 60 * 1000, //1 hour
    });

  const frontendUrl = `${config.frontUrl}/googleload`;
    return res.redirect(frontendUrl);
  } catch (error) {
    logger.error("Error durante callback de OAuth:", { error: error.message });
    next(new AppError('Internal server error', 500));
  }
};