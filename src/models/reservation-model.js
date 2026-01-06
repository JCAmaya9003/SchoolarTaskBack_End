import mongoose from 'mongoose';

const ReservartionSchema = new mongoose.Schema({
    espacio_academico: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicPlace',
      required: true,
    },
    profesor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher',
        required: true,
      },
    fecha: {
        type: Date,
        required: true,
      },
    
  });
  
  module.exports = mongoose.model('Reservation', ReservartionSchema);