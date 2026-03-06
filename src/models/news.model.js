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
        trim: true,
    },
    contenido: {
        type: String,
        required: true,
        trim: true,
    },

}, {
    timestamps: true,
});

// Índices para optimizar búsquedas y ordenamiento
NewsSchema.index({ usuario: 1 });
NewsSchema.index({ createdAt: -1 }); // -1 para orden descendente (noticias más recientes primero)

const News = mongoose.model('News', NewsSchema);
export default News;