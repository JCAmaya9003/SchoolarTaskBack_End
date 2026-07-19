# SchoolarTaskBack_End

[![CI](https://github.com/JCAmaya9003/SchoolarTaskBack_End/actions/workflows/ci.yml/badge.svg)](https://github.com/JCAmaya9003/SchoolarTaskBack_End/actions/workflows/ci.yml)

Backend de SchoolarTask: API REST en Node.js/Express con MongoDB (Mongoose), autenticación por JWT (cookie httpOnly) y login con Google OAuth.

## Requisitos

- **Node.js 22+** (la versión está fijada en `.nvmrc`) y npm.
- **MongoDB corriendo** (local o en la nube, ej. MongoDB Atlas). Si no querés instalar MongoDB, usá el camino con [Docker](#docker), que ya lo incluye.

## Setup (local)

1. Instalar dependencias:
   ```
   npm install
   ```
2. Copiar `.env.example` a `.env`. Lo mínimo para arrancar es `MONGO_URI`, `JWT_SECRET` y `FRONT_URL`. Las credenciales de **Google OAuth** y el **SMTP** de email son **opcionales**: sin ellas la app arranca igual, solo quedan deshabilitados el login con Google y el envío del email de reset (ver secciones más abajo). Si falta alguna variable recomendada, la app avisa en el log al arrancar.
3. Tener MongoDB corriendo y que `MONGO_URI` apunte a él.
4. Levantar el servidor:
   ```
   npm run dev
   ```
   Al conectar a la base de datos se crean automáticamente los roles por defecto (`admin`, `teacher`, `parent`, `student`) si no existen.
5. Documentación interactiva de la API disponible en `/api-docs` (Swagger).

> ¿No querés instalar Node ni MongoDB? Saltá directo a [Docker](#docker): levanta el backend y la base con un solo comando.

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

## Despliegue en la nube

El backend corre en cualquier plataforma que ejecute Node (Render, Railway, Fly.io, una VM, etc.) o contenedores (con el `Dockerfile` incluido). Checklist de variables de entorno en el panel del proveedor:

- `NODE_ENV=production`
- `MONGO_URI` apuntando a tu base gestionada (ej. MongoDB Atlas).
- `JWT_SECRET` fuerte (generalo con `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`).
- `FRONT_URL` con la URL real del frontend (necesaria para CORS y para el enlace del email de reset).
- `TRUST_PROXY=1` — casi todas las plataformas ponen un reverse proxy delante; sin esto el rate limiter agrupa a todos los clientes bajo la IP del proxy y las cookies seguras no se setean bien.
- Opcionales: `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`/`GOOGLE_REDIRECT_URL` para login con Google, y `SMTP_*`/`EMAIL_FROM` para el email de reset.

Además:

- **HTTPS obligatorio**: en producción las cookies se marcan `secure`, así que solo viajan por HTTPS (las plataformas tipo Render/Railway ya sirven HTTPS por defecto).
- El proveedor suele inyectar el puerto por la variable `PORT`; la app ya la respeta.
- Si usás login con Google, actualizá en Google Cloud Console la *redirect URI* a `https://tu-backend/oauth`.

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
