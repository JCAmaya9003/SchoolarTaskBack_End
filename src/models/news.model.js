import mongoose from 'mongoose';

const NewsSchema = new mongoose.Schema({
    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    titulo: {
        type: String,
        required: true, 
    },
    contenido: {
        type: String,
        required: true, 
    },

});
  
const News = mongoose.model('News', NewsSchema);
export default News;