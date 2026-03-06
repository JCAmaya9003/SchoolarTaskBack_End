import mongoose from 'mongoose';

const RoleSchema = new mongoose.Schema({
    nombre: {
      type: String,
      required: true,
      unique: true,
      enum: ['student', 'parent', 'teacher', 'admin'], // Solo estos 4 roles
    },
  },
  {
    timestamps: true, // Agrega createdAt y updatedAt
  }
);

const Role = mongoose.model('Role', RoleSchema);
export default Role;