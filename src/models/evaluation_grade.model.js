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

  });
  
const Evaluation_grade = mongoose.model('Evaluation_grade', Evaluation_gradeSchema);
export default Evaluation_grade;