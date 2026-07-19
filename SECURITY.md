# SEGURIDAD - SchoolarTask Backend

## Checklist de seguridad para producción

Este documento reúne los pasos para asegurar el backend antes de desplegarlo a producción y las medidas de seguridad ya implementadas.

---

## 1. GENERAR UN JWT_SECRET PROPIO

**POR QUÉ**: Cada entorno debe tener su propio `JWT_SECRET` fuerte y aleatorio. Nunca uses el valor de ejemplo ni subas el de producción a Git.

**CÓMO HACERLO**:

```bash
# Opción 1: Usando Node.js (recomendado)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Opción 2: Usando OpenSSL
openssl rand -hex 64
```

**APLICAR**:
1. Copiar el string generado
2. Editar el archivo `.env`
3. Reemplazar el valor de `JWT_SECRET=` con el nuevo string
4. NUNCA compartir este valor ni subirlo a Git

```env
JWT_SECRET=tu_nuevo_secret_aleatorio_de_64_caracteres_aqui
```

---

## 2. CREDENCIALES DE GOOGLE OAUTH

**POR QUÉ**: Las credenciales de OAuth deben ser propias de tu proyecto de Google Cloud y nunca compartirse ni subirse a Git. Son opcionales: sin ellas el login con Google queda deshabilitado, pero el resto de la app funciona.

**PASOS**:

1. Ir a [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Seleccionar tu proyecto o crear uno nuevo
3. Ir a "Credentials" > "Create Credentials" > "OAuth 2.0 Client ID"
4. Tipo: "Web application"
5. Configurar:
   - **Authorized JavaScript origins**:
     - Development: `http://localhost:3000`
     - Production: `https://tu-dominio.com`

   - **Authorized redirect URIs**:
     - Development: `http://localhost:3000/oauth`
     - Production: `https://tu-dominio.com/oauth`

6. Copiar el `Client ID` y `Client Secret`

**APLICAR EN .env**:

```env
GOOGLE_CLIENT_ID=nuevo_client_id_aqui
GOOGLE_CLIENT_SECRET=nuevo_client_secret_aqui
GOOGLE_REDIRECT_URL=http://localhost:3000/oauth  # Cambiar en producción
```

---

## 3. CAMBIAR A PRODUCCIÓN

**Antes de desplegar**, actualizar `.env` con:

```env
NODE_ENV=production
FRONT_URL=https://tu-frontend.com
GOOGLE_REDIRECT_URL=https://tu-backend.com/oauth
```

**IMPORTANTE**:
- Las cookies solo serán seguras con `NODE_ENV=production`
- Asegurar que el servidor usa HTTPS
- Nunca exponer el archivo `.env` en Git (ya está en `.gitignore`)

---

## 4. VERIFICAR .gitignore

Asegurar que `.gitignore` incluya:

```
.env
.env.local
.env.production
node_modules/
```

---

## 5. ROTACIÓN DE SECRETS (MANTENIMIENTO)

**Frecuencia recomendada**:
- JWT_SECRET: Cada 3-6 meses
- Google OAuth: Anualmente o si se sospecha compromiso
- Después de cualquier incidente de seguridad

---

## 6. MEDIDAS DE SEGURIDAD IMPLEMENTADAS

### Implementadas:
- ✅ Passwords y tokens sensibles nunca se exponen en respuestas (`select: false` a nivel de schema)
- ✅ Rate limiting por IP en autenticación (5/15min) + bloqueo de cuenta por fuerza bruta independiente de IP
- ✅ Sanitización de inputs MongoDB (previene NoSQL injection) y defensa XSS en campos de texto libre
- ✅ Cookies httpOnly, `secure` en producción (requiere HTTPS) y `sameSite`
- ✅ Headers de seguridad con helmet
- ✅ OAuth de Google con protección CSRF (state) y verificación de `email_verified`
- ✅ Middleware global de errores, logging (winston), paginación, autorización por ownership, soft delete y recuperación de contraseña
- ✅ `trust proxy` configurable (`TRUST_PROXY`) para desplegar detrás de un reverse proxy sin romper el rate limiting ni las cookies seguras

### Pendientes / a futuro:
- [ ] Rotación automática de secrets
- [ ] Auditoría/monitoreo de accesos en producción

---

## 7. CONTACTO EN CASO DE EMERGENCIA

Si se detecta una brecha de seguridad:
1. Cambiar inmediatamente JWT_SECRET
2. Revocar todas las sesiones activas
3. Regenerar credenciales de OAuth
4. Notificar a los usuarios afectados
5. Revisar logs de acceso

---

## 8. CHECKLIST PRE-PRODUCCIÓN

Antes de desplegar a producción, verificar:

- [ ] JWT_SECRET regenerado y seguro
- [ ] Google OAuth credentials regenerados
- [ ] NODE_ENV=production configurado
- [ ] HTTPS habilitado en el servidor
- [ ] .env no está en Git
- [ ] Rate limiting activo
- [ ] Sanitización MongoDB activa
- [ ] Cookies secure habilitadas
- [ ] Frontend URL correcta
- [ ] Redirect URLs de OAuth correctas
- [ ] Backup de base de datos configurado

---

**Fecha de última actualización**: 2026-07-19
