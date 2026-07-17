import { describe, it, expect } from 'vitest';
import { containsHtml, rejectHtml } from '../../src/utils/xss-guard.js';

describe('containsHtml', () => {
  it('no marca texto normal con apóstrofes/acentos como HTML', () => {
    expect(containsHtml("O'Brien")).toBe(false);
    expect(containsHtml('González')).toBe(false);
    expect(containsHtml('Descripción normal, sin nada raro.')).toBe(false);
  });

  it('no marca comparaciones matemáticas con < y > como HTML', () => {
    expect(containsHtml('si x < 10 entonces...')).toBe(false);
    expect(containsHtml('5 < 10 y 20 > 15')).toBe(false);
  });

  it('no marca texto con ampersand suelto como HTML', () => {
    expect(containsHtml('texto & con ampersand')).toBe(false);
  });

  it('no marca "javascript:" como HTML si no está dentro de una etiqueta real', () => {
    expect(containsHtml('javascript:alert(1)')).toBe(false);
  });

  it('detecta un <script> real', () => {
    expect(containsHtml('<script>alert(1)</script>')).toBe(true);
  });

  it('detecta un atributo de evento, onerror en una etiqueta real', () => {
    expect(containsHtml('<img src=x onerror=alert(1)>')).toBe(true);
  });

  it('detecta cualquier etiqueta HTML, no solo las peligrosas', () => {
    expect(containsHtml('hola <b>mundo</b>')).toBe(true);
  });

  it('detecta un href con javascript: dentro de una etiqueta real', () => {
    expect(containsHtml('<a href="javascript:alert(1)">click</a>')).toBe(true);
  });

  it('detecta payloads vía SVG', () => {
    expect(containsHtml('<svg onload=alert(1)>')).toBe(true);
  });

  it('devuelve false para valores no-string o vacíos, sin tirar error', () => {
    expect(containsHtml(undefined)).toBe(false);
    expect(containsHtml(null)).toBe(false);
    expect(containsHtml('')).toBe(false);
    expect(containsHtml(123)).toBe(false);
  });
});

describe('rejectHtml, validador de express-validator', () => {
  it('devuelve true, pasa la validación para texto sin HTML', () => {
    expect(rejectHtml('Texto normal')).toBe(true);
  });

  it('tira un error cuando el valor contiene HTML', () => {
    expect(() => rejectHtml('<script>alert(1)</script>')).toThrow();
  });
});
