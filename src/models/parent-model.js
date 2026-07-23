import mongoose from 'mongoose';

const ParentSchema = new mongoose.Schema({
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Sin unique: un teléfono no identifica a una persona, y dos padres de la misma familia
    // comparten el de casa. La identidad la da el email del User. Era el único perfil con esta
    // restricción (Teacher.telefono nunca la tuvo), así que rechazaba altas legítimas.
    telefono: {
      type: String,
      required: true,
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