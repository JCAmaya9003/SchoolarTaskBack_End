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
    },
    fecha_inicio: {
        type: Date,
        required: true,
    },
    fecha_fin: {
        type: Date,
        required: true,
    },
  });

const Reservation = mongoose.model('Reservation', ReservationSchema);
export default Reservation;