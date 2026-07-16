import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { setupTestDB, teardownTestDB } from '../setup.js';
import EvaluationGrade from '../../src/models/evaluation_grade.model.js';

beforeAll(async () => {
  await setupTestDB();
});

afterAll(async () => {
  await teardownTestDB();
});

describe('Evaluation_grade model (regresión: calificacion no tenía min/max, dependía únicamente del validador de la ruta)', () => {
  const fakeStudentId = new mongoose.Types.ObjectId();
  const fakeEvaluationId = new mongoose.Types.ObjectId();

  it('rechaza una calificación mayor a 10 a nivel de modelo', async () => {
    const grade = new EvaluationGrade({ estudiante: fakeStudentId, evaluacion: fakeEvaluationId, calificacion: 15 });
    await expect(grade.validate()).rejects.toThrow();
  });

  it('rechaza una calificación negativa a nivel de modelo', async () => {
    const grade = new EvaluationGrade({ estudiante: fakeStudentId, evaluacion: fakeEvaluationId, calificacion: -1 });
    await expect(grade.validate()).rejects.toThrow();
  });

  it('acepta una calificación de 0 (no debe rechazarla como si fuera falsy)', async () => {
    const grade = new EvaluationGrade({ estudiante: fakeStudentId, evaluacion: fakeEvaluationId, calificacion: 0 });
    await expect(grade.validate()).resolves.toBeUndefined();
  });

  it('acepta calificaciones dentro del rango 0-10', async () => {
    const grade = new EvaluationGrade({ estudiante: fakeStudentId, evaluacion: fakeEvaluationId, calificacion: 7.5 });
    await expect(grade.validate()).resolves.toBeUndefined();
  });
});
