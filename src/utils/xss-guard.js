import sanitizeHtml from 'sanitize-html';

// No usamos regex propio para detectar HTML/scripts: un regex casero es fácil de esquivar
// (encoding, SVG, atributos de evento, etc.) y da falsos positivos con texto legítimo como
// "si x < 10". sanitize-html parsea el HTML de verdad.
//
// Comparar sanitizeHtml(value, sinTags) contra el value original da falsos positivos: el
// parser siempre re-codifica entidades (ej. "&" -> "&amp;", "<" suelto -> "&lt;") aunque no
// haya ninguna etiqueta real, así que ese solo cambio ya lo marcaría como "HTML". Por eso
// comparamos dos pasadas por el MISMO parser (una que no permite ninguna etiqueta, otra que
// las permite todas): si no había etiquetas reales, ambas pasadas re-codifican las entidades
// exactamente igual y el resultado es idéntico entre sí; solo difieren si sí había una
// etiqueta real que la primera pasada eliminó.
const STRIP_ALL_TAGS = { allowedTags: [], allowedAttributes: {} };
// allowVulnerableTags: silencia el warning de sanitize-html por permitir <script>/<style> acá -
// esta versión "permisiva" nunca se guarda ni se devuelve, solo se usa como referencia para
// detectar si el input tenía alguna etiqueta real (ver comentario de containsHtml).
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
