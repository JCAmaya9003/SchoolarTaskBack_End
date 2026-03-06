import { describe, it, expect } from 'vitest';
import { getPaginationParams, getPaginationMeta } from '../../src/utils/pagination-helper.js';

describe('getPaginationParams', () => {
  it('debe retornar valores por defecto cuando no se pasan parámetros', () => {
    const result = getPaginationParams();
    expect(result).toEqual({ skip: 0, limit: 20, page: 1 });
  });

  it('debe calcular skip correctamente para página 2', () => {
    const result = getPaginationParams(2, 10);
    expect(result).toEqual({ skip: 10, limit: 10, page: 2 });
  });

  it('debe calcular skip correctamente para página 3 con limit 15', () => {
    const result = getPaginationParams(3, 15);
    expect(result).toEqual({ skip: 30, limit: 15, page: 3 });
  });

  it('debe limitar el máximo a 100 elementos por página', () => {
    const result = getPaginationParams(1, 500);
    expect(result.limit).toBe(100);
  });

  it('debe usar default cuando limit es 0 (falsy)', () => {
    const result = getPaginationParams(1, 0);
    expect(result.limit).toBe(20); // 0 es falsy, parseInt(0) || 20 = 20
  });

  it('debe asegurar mínimo de 1 elemento por página con límite negativo', () => {
    const result = getPaginationParams(1, -5);
    expect(result.limit).toBe(1);
  });

  it('debe asegurar mínimo de página 1', () => {
    const result = getPaginationParams(-5, 10);
    expect(result.page).toBe(1);
    expect(result.skip).toBe(0);
  });

  it('debe parsear strings a números', () => {
    const result = getPaginationParams('3', '25');
    expect(result).toEqual({ skip: 50, limit: 25, page: 3 });
  });

  it('debe usar valores por defecto con strings inválidos', () => {
    const result = getPaginationParams('abc', 'xyz');
    expect(result).toEqual({ skip: 0, limit: 20, page: 1 });
  });
});

describe('getPaginationMeta', () => {
  it('debe calcular metadata correctamente', () => {
    const result = getPaginationMeta(1, 10, 50);
    expect(result).toEqual({
      currentPage: 1,
      itemsPerPage: 10,
      totalItems: 50,
      totalPages: 5,
      hasNextPage: true,
      hasPrevPage: false,
    });
  });

  it('debe indicar que no hay siguiente página en la última', () => {
    const result = getPaginationMeta(5, 10, 50);
    expect(result.hasNextPage).toBe(false);
    expect(result.hasPrevPage).toBe(true);
  });

  it('debe manejar 0 elementos', () => {
    const result = getPaginationMeta(1, 10, 0);
    expect(result.totalPages).toBe(0);
    expect(result.hasNextPage).toBe(false);
    expect(result.hasPrevPage).toBe(false);
  });

  it('debe calcular totalPages con redondeo hacia arriba', () => {
    const result = getPaginationMeta(1, 10, 15);
    expect(result.totalPages).toBe(2);
  });
});
