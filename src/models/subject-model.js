import mongoose from 'mongoose';

const SubjectSchema = new mongoose.Schema({
    nombre: {
      type: String,
      required: true,
    } 
  });
  
const Subject = mongoose.model('Subject', SubjectSchema);
export default Subject;