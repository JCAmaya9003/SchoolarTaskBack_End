import mongoose from 'mongoose';

const TeacherSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  grado_encargado: [
    {
      materias: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Subject',
          required: true,
        },
      ],
      grado_secciones: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'GradeSection',
          required: true,
        },
      ],
    },
  ],
  telefono: {
    type: String,
    required: true,
    trim: true,
    match: /^\+?[1-9]\d{1,14}$/,
  },
  especialidad: {
    type: String,
    required: true,
    trim: true,
  },
}, {
  timestamps: true,
});

// Índice para optimizar búsquedas por usuario
TeacherSchema.index({ usuario: 1 });

const Teacher = mongoose.model('Teacher', TeacherSchema);
export default Teacher;
