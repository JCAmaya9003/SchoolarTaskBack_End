import mongoose from 'mongoose';

// Grados válidos: del 1 al 12 (algunas escuelas llegan hasta 11, otras hasta 12). Se exporta
// para que el validador de la ruta rechace grados inválidos con el mismo criterio que el modelo.
export const GRADOS_VALIDOS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

const GradeSectionSchema = new mongoose.Schema({
  grado: {
      type: String,
      required: true,
      trim: true,
      enum: GRADOS_VALIDOS,
  },
  seccion: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      match: /^[A-Z]$/,
  },
  materias:
    [
      {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Subject',
      },
    ],
}, {
  timestamps: true,
});

// Índice único compuesto para evitar duplicados de grado+sección
GradeSectionSchema.index({ grado: 1, seccion: 1 }, { unique: true });

const GradeSection = mongoose.model('GradeSection', GradeSectionSchema);
export default GradeSection;
