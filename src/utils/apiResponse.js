/**
 * Helper de respuesta estándar para toda la API.
 * Mantiene el mismo sobre { success, message, data } tanto en éxitos como en errores,
 * ya que los errores se emiten desde error-middleware.js con la misma forma.
 */
export const sendSuccess = (res, statusCode, message, data = null) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};
