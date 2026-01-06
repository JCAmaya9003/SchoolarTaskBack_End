import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    nombre: {
      type: String,
      required: true,
    },
    apellido: {
      type: String,
      required: true,
    },
    username: {
      type: String,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    rol: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Role',
      required: true,
    },
    fecha_nacimiento: {
      type: Date,
      required: true,
    },
    genero: {
      type: String,
      enum: ['Masculino', 'Femenino'], // Enum para valores controlados
      required: true,
    },
      nacionalidad: {
      type: String,
      required: true,
    },
    domicilio: {
      required: true,
      type: String,
    },
  });
  
const User = mongoose.model('User', UserSchema);
export default User;
