import mongoose from 'mongoose';

const EvaluationSchema = new mongoose.Schema({
    nombre: {
      type: String,
      required: true,
      trim: true,
    },
    materia: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
    },
    descripcion: {
      type: String,
      required: true,
      trim: true,
    },
    fecha: {
      type: Date,
      required: true,
    },
    peso: {
      type: Number,
      required: true,
    }
  }, {
    timestamps: true,
  });

// Índices para optimizar búsquedas por materia y fecha
EvaluationSchema.index({ materia: 1 });
EvaluationSchema.index({ fecha: -1 }); // -1 para orden descendente

const Evaluation = mongoose.model('Evaluation', EvaluationSchema);
export default Evaluation;