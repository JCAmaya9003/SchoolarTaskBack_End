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
  },
  especialidad: {
    type: String,
    required: true,
  },
});

const Teacher = mongoose.model('Teacher', TeacherSchema);
export default Teacher;
