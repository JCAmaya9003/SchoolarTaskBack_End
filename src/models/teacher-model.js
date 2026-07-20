import mongoose from 'mongoose';

const TeacherSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // Cada asignación es un grado/sección concreto con las materias que el profesor dicta ahí.
  // Antes era { materias:[], grado_secciones:[] } (producto cartesiano ambiguo); ahora es una
  // entrada por clase, para que quede sin ambigüedad qué materias da en qué grado/sección.
  grado_encargado: [
    {
      grado_seccion: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'GradeSection',
        required: true,
      },
      materias: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Subject',
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
