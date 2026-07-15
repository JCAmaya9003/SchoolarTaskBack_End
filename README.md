# SchoolarTaskBack_End

Backend de SchoolarTask: API REST en Node.js/Express con MongoDB (Mongoose), autenticación por JWT (cookie httpOnly) y login con Google OAuth.

## Setup

1. Instalar dependencias:
   ```
   npm install
   ```
2. Copiar `.env.example` a `.env` y completar las variables (Mongo URI, JWT secret, credenciales de Google OAuth, URL del frontend).
3. Levantar el servidor:
   ```
   npm run dev
   ```
   Al conectar a la base de datos se crean automáticamente los roles por defecto (`admin`, `teacher`, `parent`, `student`) si no existen.
4. Documentación interactiva de la API disponible en `/api-docs` (Swagger).

## Tests

```
npm test
```

Usa `mongodb-memory-server`, no requiere una base de datos real.

## Contrato de respuesta

Todas las respuestas de la API usan el mismo sobre:

```jsonc
// Éxito
{
  "success": true,
  "message": "Descripción legible del resultado",
  "data": { /* payload, o null si no aplica */ }
}

// Error (emitido por el error-middleware global)
{
  "success": false,
  "message": "Descripción del error"
}
```

Los controllers arman las respuestas de éxito con `sendSuccess` (`src/utils/apiResponse.js`) y delegan los errores a las clases de `src/errors/errors.js` vía `next(error)`, para que el middleware global las transforme en el mismo formato.
