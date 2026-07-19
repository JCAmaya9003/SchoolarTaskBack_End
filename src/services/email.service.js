import nodemailer from 'nodemailer';
import { config } from '../config/config.js';
import logger from '../config/logger.js';

// Envío de emails vía SMTP (nodemailer), agnóstico del proveedor: cualquier servicio con SMTP
// sirve (Resend, SendGrid, Mailtrap, Gmail, etc.). La configuración vive en config.smtp.

// El transporte se crea una sola vez y se reutiliza entre envíos.
let transporter = null;

// Hay email configurado solo si están los datos mínimos para autenticar contra el SMTP.
export const isEmailConfigured = () =>
  Boolean(config.smtp.host && config.smtp.port && config.smtp.user && config.smtp.pass);

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.pass,
      },
    });
  }
  return transporter;
};

/**
 * Envía el email con el enlace de recuperación de contraseña.
 *
 * Si no hay SMTP configurado (desarrollo local, CI, tests), no intenta enviar: avisa por log
 * y devuelve false, para no romper el flujo ni exigir un servidor de correo real. En ese caso
 * el token igual se loguea fuera de producción (ver userService.forgotPassword), así el flujo
 * se puede probar de punta a punta sin email real.
 *
 * @param {string} to - Email destino.
 * @param {string} resetUrl - Enlace completo de reset (ya incluye el token).
 * @returns {Promise<boolean>} true si se envió, false si no había SMTP configurado.
 */
export const sendPasswordResetEmail = async (to, resetUrl) => {
  if (!isEmailConfigured()) {
    logger.warn('[EMAIL] SMTP no configurado: se omite el envío del email de reset de contraseña');
    return false;
  }

  await getTransporter().sendMail({
    from: config.smtp.from,
    to,
    subject: 'Recuperación de contraseña - SchoolarTask',
    text:
      'Recibimos una solicitud para restablecer tu contraseña.\n\n' +
      `Entrá al siguiente enlace para elegir una nueva (expira en 1 hora):\n${resetUrl}\n\n` +
      'Si no fuiste vos, ignorá este mensaje: tu contraseña seguirá siendo la misma.',
    html:
      '<p>Recibimos una solicitud para restablecer tu contraseña.</p>' +
      '<p>Hacé clic en el siguiente enlace para elegir una nueva (expira en 1 hora):</p>' +
      `<p><a href="${resetUrl}">Restablecer contraseña</a></p>` +
      '<p>Si no fuiste vos, ignorá este mensaje: tu contraseña seguirá siendo la misma.</p>',
  });

  logger.info(`[EMAIL] Email de reset de contraseña enviado a ${to}`);
  return true;
};
