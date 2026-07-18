# SchoolarTaskBack_End

[![CI](https://github.com/JCAmaya9003/SchoolarTaskBack_End/actions/workflows/ci.yml/badge.svg)](https://github.com/JCAmaya9003/SchoolarTaskBack_End/actions/workflows/ci.yml)

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

## Docker

Para levantar el backend junto con una instancia de MongoDB sin instalar nada más que Docker:

1. Copiar `.env.example` a `.env` y completar al menos `JWT_SECRET` (el resto tiene valores por defecto razonables para desarrollo).
2. Levantar todo con un solo comando:
   ```
   docker compose up --build
   ```
   Esto construye la imagen del backend (multi-stage, imagen final chica, corre como usuario sin privilegios), arranca MongoDB con un volumen persistente y espera a que la base esté sana antes de iniciar la API.
3. La API queda disponible en `http://localhost:3000` y el health check en `http://localhost:3000/health`.

El `MONGO_URI` dentro del compose apunta al servicio `mongo` por red interna, así que no hace falta tener MongoDB instalado en la máquina.

## Health check

`GET /health` (público, sin auth ni rate limit) responde `200` con `{ status, db, uptime }` cuando la conexión a MongoDB está activa, o `503` si la base no está disponible. Lo usan el healthcheck de Docker y puede usarlo cualquier balanceador u orquestador.

## Email (reset de contraseña)

El flujo de recuperación de contraseña (`POST /users/forgot-password`) genera un token de un solo uso, con expiración de 1 hora, y envía por email un enlace `FRONT_URL/reset-password/<token>`.

El envío usa SMTP vía `nodemailer` y es agnóstico del proveedor: sirve cualquier servicio con SMTP (Resend, SendGrid, Mailtrap, Gmail, etc.). Se configura con las variables `SMTP_*` y `EMAIL_FROM` del `.env` (ver `.env.example`).

Si el SMTP **no** está configurado (desarrollo local, CI, tests), el envío se omite con un warning en el log en vez de fallar, y fuera de producción el token se loguea para poder probar el flujo de punta a punta sin un servidor de correo real.

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
