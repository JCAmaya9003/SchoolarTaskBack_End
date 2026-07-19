import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Se mockea nodemailer para no abrir conexiones SMTP reales. sendMailMock se define afuera
// para poder inspeccionar con qué se llamó en cada test.
const sendMailMock = vi.fn().mockResolvedValue({ messageId: 'test-message-id' });

vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn(() => ({ sendMail: sendMailMock })),
  },
}));

describe('email service, sendPasswordResetEmail', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    // config.js lee process.env al importarse, así que se resetean los módulos entre tests
    // para que cada uno vea el entorno que setea.
    vi.resetModules();
    sendMailMock.mockClear();
    process.env = { ...OLD_ENV };
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  it('cuando el SMTP está configurado, envía el email con el enlace de reset y devuelve true', async () => {
    process.env.SMTP_HOST = 'smtp.test.com';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_USER = 'user';
    process.env.SMTP_PASS = 'pass';
    process.env.EMAIL_FROM = 'SchoolarTask <no-reply@test.com>';

    const { sendPasswordResetEmail, isEmailConfigured } = await import('../../src/services/email.service.js');
    expect(isEmailConfigured()).toBe(true);

    const resetUrl = 'http://localhost:5173/reset-password/abc123def456';
    const result = await sendPasswordResetEmail('alumno@test.com', resetUrl);

    expect(result).toBe(true);
    expect(sendMailMock).toHaveBeenCalledTimes(1);

    const mailArgs = sendMailMock.mock.calls[0][0];
    expect(mailArgs.to).toBe('alumno@test.com');
    expect(mailArgs.from).toBe('SchoolarTask <no-reply@test.com>');
    expect(mailArgs.subject).toMatch(/contraseña/i);
    // El enlace de reset (con el token) tiene que estar tanto en la versión texto como en la HTML
    expect(mailArgs.text).toContain(resetUrl);
    expect(mailArgs.html).toContain(resetUrl);
  });

  it('cuando el SMTP no está configurado, no intenta enviar y devuelve false', async () => {
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_PORT;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;

    const { sendPasswordResetEmail, isEmailConfigured } = await import('../../src/services/email.service.js');
    expect(isEmailConfigured()).toBe(false);

    const result = await sendPasswordResetEmail('alumno@test.com', 'http://localhost:5173/reset-password/abc123');

    expect(result).toBe(false);
    expect(sendMailMock).not.toHaveBeenCalled();
  });
});
