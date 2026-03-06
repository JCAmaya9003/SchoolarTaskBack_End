import mongoose from 'mongoose';

const Evaluation_gradeSchema = new mongoose.Schema({

    estudiante: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    evaluacion: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Evaluation',
        required: true,
    },
    calificacion: {
      type: Number,
      required: true,
    },

  }, {
    timestamps: true,
  });

// Índice compuesto para evitar duplicados y optimizar búsquedas
Evaluation_gradeSchema.index({ estudiante: 1, evaluacion: 1 }, { unique: true });

const Evaluation_grade = mongoose.model('Evaluation_grade', Evaluation_gradeSchema);
export default Evaluation_grade;