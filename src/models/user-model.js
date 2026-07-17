import mongoose from 'mongoose';
import softDeletePlugin from '../utils/soft-delete-plugin.js';

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
      required: function() {
        // Password es requerido solo si NO hay googleId
        return !this.googleId;
      },
      select: false,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true, // Permite nulls pero únicos si existen
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
      enum: ['Masculino', 'Femenino'],
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
    resetPasswordToken: {
      type: String,
      default: null,
      select: false,
    },
    resetPasswordExpires: {
      type: Date,
      default: null,
    },
    // Protección de fuerza bruta: bloqueo de cuenta independiente de la IP (complementa el
    // rate limiter por IP, que un atacante distribuido puede esquivar rotando de IP).
    failedLoginAttempts: {
      type: Number,
      default: 0,
      select: false,
    },
    lockUntil: {
      type: Date,
      default: null,
      select: false,
    },
    lastFailedLoginAt: {
      type: Date,
      default: null,
      select: false,
    },
  },
  {
    timestamps: true, // Agrega createdAt y updatedAt
  }
);

UserSchema.plugin(softDeletePlugin);

const User = mongoose.model('User', UserSchema);
export default User;