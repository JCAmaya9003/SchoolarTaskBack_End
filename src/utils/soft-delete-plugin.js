/**
 * Plugin de Mongoose para soft delete.
 * Agrega campo `deletedAt` y filtra documentos eliminados automáticamente en queries.
 * Uso: schema.plugin(softDeletePlugin);
 */
const softDeletePlugin = (schema) => {
  schema.add({
    deletedAt: { type: Date, default: null },
  });

  // Filtrar documentos soft-deleted en queries normales
  const addNotDeletedFilter = function () {
    if (this.getOptions().includeDeleted !== true) {
      this.where({ deletedAt: null });
    }
  };

  schema.pre('find', addNotDeletedFilter);
  schema.pre('findOne', addNotDeletedFilter);
  schema.pre('countDocuments', addNotDeletedFilter);
  schema.pre('findOneAndUpdate', addNotDeletedFilter);

  // Soft delete por ID
  schema.statics.softDeleteById = async function (id) {
    return this.findByIdAndUpdate(
      id,
      { deletedAt: new Date() },
      { new: true }
    ).setOptions({ includeDeleted: true });
  };

  // Restaurar por ID
  schema.statics.restoreById = async function (id) {
    return this.findByIdAndUpdate(
      id,
      { deletedAt: null },
      { new: true }
    ).setOptions({ includeDeleted: true });
  };

  // Buscar incluyendo eliminados
  schema.statics.findWithDeleted = function (filter = {}) {
    return this.find(filter).setOptions({ includeDeleted: true });
  };

  schema.statics.findOneWithDeleted = function (filter = {}) {
    return this.findOne(filter).setOptions({ includeDeleted: true });
  };
};

export default softDeletePlugin;
