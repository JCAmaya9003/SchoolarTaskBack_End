# SEGURIDAD - SchoolarTask Backend

## ACCIÓN URGENTE REQUERIDA

Este documento contiene instrucciones críticas para asegurar el backend antes de ir a producción.

---

## 1. REGENERAR JWT_SECRET

**POR QUÉ**: El JWT_SECRET actual puede estar expuesto en el historial de Git o en el código compartido.

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

## 2. REGENERAR CREDENCIALES DE GOOGLE OAUTH

**POR QUÉ**: Las credenciales actuales pueden estar comprometidas.

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

### FASE 1 - Completada:
- ✅ Eliminada exposición de passwords en respuestas API
- ✅ Rate limiting en endpoints de autenticación (5 intentos/15min)
- ✅ Sanitización de inputs MongoDB (previene NoSQL injection)
- ✅ Cookies seguras en producción (HTTPS required)

### PRÓXIMAS FASES:
- [ ] FASE 2: Middleware global de errores, logging
- [ ] FASE 3: Índices MongoDB, paginación
- [ ] FASE 4: Validación de autorización por usuario
- [ ] FASE 5: Refactoring de código
- [ ] FASE 6: Soft delete, recuperación de contraseña
- [ ] FASE 7: Testing y documentación

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

**Fecha de última actualización**: 2026-02-04
**Fase completada**: FASE 1 - Seguridad Crítica
