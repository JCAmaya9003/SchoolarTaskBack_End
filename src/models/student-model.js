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
      trim: true,
    },
    condiciones_medicas: {
      type: String,
      required: true,
      trim: true,
    },
    contacto_emergencia: {
      nombre: {
        type: String,
        required: true,
        trim: true,
      },
      telefono: {
        type: String,
        required: true,
        trim: true,
      }
    }
  }, {
    timestamps: true,
  });

  // Índices para optimizar búsquedas
  StudentSchema.index({ usuario: 1 });
  StudentSchema.index({ padre: 1 });
  StudentSchema.index({ grado_seccion: 1 });

  const Student = mongoose.model('Student', StudentSchema);
  export default Student;