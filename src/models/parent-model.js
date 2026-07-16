import mongoose from 'mongoose';

const ParentSchema = new mongoose.Schema({
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    telefono: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      match: /^\+?[1-9]\d{1,14}$/,
    },
    telefono_trabajo: {
      type: String,
      required: true,
      trim: true,
      match: /^\+?[1-9]\d{1,14}$/,
    },
    lugar_trabajo: {
      type: String,
      required: true,
      trim: true,
    },
    profesion: {
      type: String,
      required: true,
      trim: true,
    },
  }, {
    timestamps: true,
  });

// Índice para optimizar búsquedas por usuario
ParentSchema.index({ usuario: 1 });

const Parent = mongoose.model('Parent', ParentSchema);
export default Parent;