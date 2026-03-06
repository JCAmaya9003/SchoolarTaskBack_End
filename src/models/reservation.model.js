import mongoose from 'mongoose';

const ReservationSchema = new mongoose.Schema({
    lugar: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Academic_place',
        required: true,
      },
    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    descripcion: {
        type: String,
        trim: true,
    },
    fecha_inicio: {
        type: Date,
        required: true,
    },
    fecha_fin: {
        type: Date,
        required: true,
    },
  }, {
    timestamps: true,
  });

// Índices para optimizar búsquedas y prevenir conflictos
ReservationSchema.index({ lugar: 1, fecha_inicio: 1, fecha_fin: 1 });
ReservationSchema.index({ usuario: 1 });
ReservationSchema.index({ fecha_inicio: 1 });

const Reservation = mongoose.model('Reservation', ReservationSchema);
export default Reservation;