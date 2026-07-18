import dotenv from 'dotenv';

// Load environment variables from .env.test if in test environment
if (process.env.NODE_ENV === 'test') {
  dotenv.config({ path: '.env.test' });
} else {
  dotenv.config(); // Load .env by default
}

export const config = {
  port: process.env.PORT || 3000,
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  googleRedirectUrl: process.env.GOOGLE_REDIRECT_URL,
  frontUrl: process.env.FRONT_URL,
  // Configuración SMTP para el envío de emails (ej. reset de contraseña). Es opcional: si no
  // está definida, el envío se omite con un warning en vez de romper (ver email.service.js).
  // Funciona con cualquier proveedor SMTP (Resend, SendGrid, Mailtrap, Gmail, etc.).
  smtp: {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined,
    secure: process.env.SMTP_SECURE === 'true', // true para el puerto 465, false para el resto (STARTTLS)
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.EMAIL_FROM || 'SchoolarTask <no-reply@schoolartask.com>',
  },
};