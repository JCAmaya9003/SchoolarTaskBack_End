import mongoose from 'mongoose';

const StudentSchema = new mongoose.Schema({
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    padre: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Parent',
    },
    grado_seccion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GradeSection',
      required: true,
    },
    alergias: {
      type: String, 
      required: true,
    },
    condiciones_medicas: {
      type: String, 
      required: true,
    },
    contacto_emergencia: {
      nombre: {
        type: String,
        required: true,
      },
      telefono: {
        type: String,
        required: true,
      }
    }
  });
  
  const Student = mongoose.model('Student', StudentSchema);
  export default Student;