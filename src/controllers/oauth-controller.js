import * as userService from '../services/user-service.js';
import { config } from '../config/config.js';
import { OAuth2Client } from 'google-auth-library';
import { generateToken } from '../middlewares/auth-middleware.js';
import logger from '../config/logger.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { AppError, ValidationError, NotFoundError } from '../errors/errors.js';

const CLIENT_ID = config.googleClientId;
const client = new OAuth2Client(config.googleClientId, config.googleClientSecret, config.googleRedirectUrl);


export const generateAuthUrl = async (req, res, next) => {
  try {
    const authorizeUrl = client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
        'openid',
      ],
      prompt: 'consent',
    });

    return sendSuccess(res, 200, 'URL de autenticación generada con éxito', { url: authorizeUrl });
  } catch (error) {
    logger.error("Error generando URL de autenticación OAuth:", { error: error.message });
    next(new AppError('Failed to generate Google auth URL', 500));
  }
};


export const handleOAuthCallback = async (req, res, next) => {
  const { code } = req.query;

  if (!code) {
    return next(new ValidationError('Authorization code is required'));
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