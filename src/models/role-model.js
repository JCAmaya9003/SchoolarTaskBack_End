import mongoose from 'mongoose';

const RoleSchema = new mongoose.Schema({
    nombre: {
      type: String,
      required: true,
    },
    permisos: {
      student: {
        type: Boolean,
        required: true,
        default: false,
      },
      parent: {
        type: Boolean,
        required: true,
        default: false,
      },
      teacher: {
        type: Boolean,
        required: true,
        default: false,
      },
      admin: {
        type: Boolean,
        required: true,
        default: false,
      },
    },
  });
  
const Role = mongoose.model('Role', RoleSchema);
export default Role;

//nombrePermiso: student