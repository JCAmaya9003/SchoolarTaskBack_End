import mongoose from 'mongoose';

const Academic_placeSchema = new mongoose.Schema({
    lugar: {
      type: String,
      required: true,
    } 
  });
  
const Academic_place = mongoose.model('Academic_place', Academic_placeSchema);
export default Academic_place;