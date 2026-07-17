import sanitizeHtml from 'sanitize-html';

// Nada de regex propio: es fácil de esquivar y da falsos positivos con texto normal
// como "si x < 10". sanitize-html parsea el HTML de verdad.
//
// Tampoco comparamos contra el valor original: el parser re-codifica entidades aunque
// no haya ninguna etiqueta, así que eso solo ya marcaría cualquier texto como HTML.
// Por eso comparamos dos pasadas del mismo parser, una que no permite ninguna etiqueta
// y otra que las permite todas. Si no había etiquetas reales, ambas re-codifican las
// entidades igual y el resultado coincide. Si difieren, es porque había una etiqueta real.
const STRIP_ALL_TAGS = { allowedTags: [], allowedAttributes: {} };
// allowVulnerableTags silencia el warning de sanitize-html por permitir script y style acá.
// Esta versión permisiva nunca se guarda ni se devuelve, solo sirve de referencia.
const ALLOW_ALL_TAGS = { allowedTags: false, allowedAttributes: false, allowVulnerableTags: true };

export const containsHtml = (value) => {
  if (typeof value !== 'string' || value.length === 0) {
    return false;
  }
  return sanitizeHtml(value, STRIP_ALL_TAGS) !== sanitizeHtml(value, ALLOW_ALL_TAGS);
};

// Validador reusable para express-validator: .custom(rejectHtml)
export const rejectHtml = (value) => {
  if (containsHtml(value)) {
    throw new Error('No se permiten etiquetas HTML ni scripts en este campo');
  }
  return true;
};
