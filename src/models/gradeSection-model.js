import mongoose from 'mongoose';

const GradeSectionSchema = new mongoose.Schema({
  grado: {
      type: String,
      required: true,
      trim: true,
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
