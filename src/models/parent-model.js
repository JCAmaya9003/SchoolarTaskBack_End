import mongoose from 'mongoose';

const ParentSchema = new mongoose.Schema({
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    telefono: {
      type: String,
      required: true,
      unique: true,
    },
    telefono_trabajo: {
      required: true,
      type: String,
    },
    lugar_trabajo: {
      required: true,
      type: String,
    },
    profesion: {
      required: true,
      type: String,
    },
  });
  
const Parent = mongoose.model('Parent', ParentSchema);
export default Parent;