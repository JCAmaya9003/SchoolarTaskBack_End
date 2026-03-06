import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import mongoose from 'mongoose';
import { setupTestDB, teardownTestDB } from '../setup.js';
import softDeletePlugin from '../../src/utils/soft-delete-plugin.js';

// Modelo de prueba con el plugin
const TestSchema = new mongoose.Schema({ name: String });
TestSchema.plugin(softDeletePlugin);
const TestModel = mongoose.model('TestSoftDelete', TestSchema);

beforeAll(async () => {
  await setupTestDB();
});

afterAll(async () => {
  await teardownTestDB();
});

afterEach(async () => {
  await TestModel.deleteMany({}).setOptions({ includeDeleted: true });
});

describe('softDeletePlugin', () => {
  it('debe agregar el campo deletedAt al schema', async () => {
    const doc = await TestModel.create({ name: 'Test' });
    expect(doc.deletedAt).toBeNull();
  });

  it('softDeleteById debe marcar deletedAt', async () => {
    const doc = await TestModel.create({ name: 'Test' });
    const deleted = await TestModel.softDeleteById(doc._id);

    expect(deleted.deletedAt).toBeDefined();
    expect(deleted.deletedAt).toBeInstanceOf(Date);
  });

  it('find debe excluir documentos soft-deleted', async () => {
    await TestModel.create({ name: 'Active' });
    const toDelete = await TestModel.create({ name: 'Deleted' });
    await TestModel.softDeleteById(toDelete._id);

    const results = await TestModel.find();
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Active');
  });

  it('findOne debe excluir documentos soft-deleted', async () => {
    const doc = await TestModel.create({ name: 'Test' });
    await TestModel.softDeleteById(doc._id);

    const result = await TestModel.findOne({ name: 'Test' });
    expect(result).toBeNull();
  });

  it('countDocuments debe excluir documentos soft-deleted', async () => {
    await TestModel.create({ name: 'Active1' });
    await TestModel.create({ name: 'Active2' });
    const toDelete = await TestModel.create({ name: 'Deleted' });
    await TestModel.softDeleteById(toDelete._id);

    const count = await TestModel.countDocuments();
    expect(count).toBe(2);
  });

  it('findWithDeleted debe incluir documentos soft-deleted', async () => {
    await TestModel.create({ name: 'Active' });
    const toDelete = await TestModel.create({ name: 'Deleted' });
    await TestModel.softDeleteById(toDelete._id);

    const results = await TestModel.findWithDeleted();
    expect(results).toHaveLength(2);
  });

  it('findOneWithDeleted debe encontrar documentos soft-deleted', async () => {
    const doc = await TestModel.create({ name: 'Test' });
    await TestModel.softDeleteById(doc._id);

    const result = await TestModel.findOneWithDeleted({ name: 'Test' });
    expect(result).not.toBeNull();
    expect(result.deletedAt).toBeInstanceOf(Date);
  });

  it('restoreById debe restaurar un documento soft-deleted', async () => {
    const doc = await TestModel.create({ name: 'Test' });
    await TestModel.softDeleteById(doc._id);

    // Verificar que no se encuentra normalmente
    let result = await TestModel.findOne({ name: 'Test' });
    expect(result).toBeNull();

    // Restaurar
    await TestModel.restoreById(doc._id);

    // Verificar que se encuentra de nuevo
    result = await TestModel.findOne({ name: 'Test' });
    expect(result).not.toBeNull();
    expect(result.deletedAt).toBeNull();
  });
});
