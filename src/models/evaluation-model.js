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
    // La evaluación pertenece a una clase concreta (grado/sección), no a la materia "en general".
    // Así "Parcial 1" de Mate en 5A y en 6A son evaluaciones distintas.
    grado_seccion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GradeSection',
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
EvaluationSchema.index({ grado_seccion: 1 });
EvaluationSchema.index({ fecha: -1 }); // -1 para orden descendente
// Una evaluación es única por nombre + materia + clase (grado/sección). Permite mismo nombre
// de evaluación para la misma materia en grados/secciones distintos.
EvaluationSchema.index({ nombre: 1, materia: 1, grado_seccion: 1 }, { unique: true });

const Evaluation = mongoose.model('Evaluation', EvaluationSchema);
export default Evaluation;