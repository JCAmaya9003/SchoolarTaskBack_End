import mongoose from 'mongoose';

const EvaluationSchema = new mongoose.Schema({
    nombre: {
      type: String,
      required: true,
    },
    materia: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
    },
    descripcion: {
      type: String,
      required: true,
    },
    fecha: {
      type: Date,
      required: true,
    },
    peso: {
      type: Number,
      required: true,
    }
  });
  
const Evaluation = mongoose.model('Evaluation', EvaluationSchema);
export default Evaluation;