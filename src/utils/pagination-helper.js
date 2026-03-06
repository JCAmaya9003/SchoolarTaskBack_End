/**
 * Helper para paginación consistente en todos los repositorios
 */

/**
 * Calcula skip y limit para consultas paginadas
 * @param {number} page - Número de página (default: 1)
 * @param {number} limit - Elementos por página (default: 20)
 * @returns {Object} - { skip, limit, page }
 */
export const getPaginationParams = (page = 1, limit = 20) => {
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 20;

  // Validar límites razonables
  const validLimit = Math.min(Math.max(limitNum, 1), 100); // Entre 1 y 100
  const validPage = Math.max(pageNum, 1); // Mínimo página 1

  const skip = (validPage - 1) * validLimit;

  return {
    skip,
    limit: validLimit,
    page: validPage,
  };
};

/**
 * Crea metadata de paginación para respuestas
 * @param {number} page - Página actual
 * @param {number} limit - Elementos por página
 * @param {number} total - Total de documentos
 * @returns {Object} - Metadata de paginación
 */
export const getPaginationMeta = (page, limit, total) => {
  const totalPages = Math.ceil(total / limit);

  return {
    currentPage: page,
    itemsPerPage: limit,
    totalItems: total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};
