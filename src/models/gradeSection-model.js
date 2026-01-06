import mongoose from 'mongoose';

const GradeSectionSchema = new mongoose.Schema({
  grado: {
      type: String,
      required: true,
  },
  seccion: {
      type: String,
      required: true,
  },
  materias: 
    [
      {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Subject',
          required: true,
      },
    ],
});

const GradeSection = mongoose.model('GradeSection', GradeSectionSchema);
export default GradeSection;
