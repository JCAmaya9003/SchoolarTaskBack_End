# ARQUITECTURA - SchoolarTask Backend

## FASE 2 - Arquitectura Básica (COMPLETADA)

Este documento explica la arquitectura mejorada del backend después de FASE 2.

---

## 1. MANEJO DE ERRORES

### Middleware Global de Errores

Ubicación: [src/middlewares/error-middleware.js](src/middlewares/error-middleware.js)

**Características**:
- Captura todos los errores no manejados
- Maneja errores de Mongoose, JWT, MongoDB
- Formato de respuesta consistente
- Logging automático de errores

**Uso**: Se aplica automáticamente en [app.js](app.js) como último middleware.

### Clases de Error Personalizadas

Ubicación: [src/errors/errors.js](src/errors/errors.js)

**Clases disponibles**:

| Clase | Código HTTP | Uso |
|-------|-------------|-----|
| `AppError` | Variable | Clase base para todos los errores |
| `ValidationError` | 400 | Datos de entrada inválidos |
| `UnauthorizedError` | 401 | Sin autenticación |
| `InvalidCredentialsError` | 401 | Credenciales incorrectas |
| `ForbiddenError` | 403 | Sin permisos |
| `NotFoundError` | 404 | Recurso no encontrado |
| `ConflictError` | 409 | Conflicto (ej: duplicado) |
| `UserAlreadyExistsError` | 409 | Usuario duplicado |

**Ejemplo de uso**:

```javascript
import { NotFoundError, ValidationError } from '../errors/errors.js';

export const getUser = async (req, res, next) => {
  try {
    const user = await userService.findById(req.params.id);

    if (!user) {
      throw new NotFoundError('Usuario no encontrado');
    }

    res.json(user);
  } catch (error) {
    next(error); // El middleware global lo maneja
  }
};
```

### Middleware de Rutas No Encontradas (404)

Ubicación: [src/middlewares/error-middleware.js](src/middlewares/error-middleware.js)

Captura rutas no definidas automáticamente.

---

## 2. SISTEMA DE LOGGING

### Configuración de Winston

Ubicación: [src/config/logger.js](src/config/logger.js)

**Niveles de log**:
- `error`: Errores críticos
- `warn`: Advertencias
- `info`: Información general
- `debug`: Información de depuración

**Comportamiento por entorno**:

| Entorno | Destino | Nivel |
|---------|---------|-------|
| Development | Consola | debug |
| Production | Archivos + Consola | info/error |

**Archivos de log** (solo producción):
- `logs/error.log`: Solo errores
- `logs/combined.log`: Todos los niveles
- Rotación automática: 5 archivos x 5MB

**Ejemplo de uso**:

```javascript
import logger from '../config/logger.js';

// Info
logger.info('Usuario creado', { userId: user.id, email: user.email });

// Advertencia
logger.warn('Intento de login fallido', { email, ip: req.ip });

// Error
logger.error('Error en base de datos', { error: error.message });

// Debug
logger.debug('Procesando request', { route: req.path, method: req.method });
```

**Archivos actualizados con logger**:
- [src/config/database.js](src/config/database.js)
- [src/middlewares/error-middleware.js](src/middlewares/error-middleware.js)
- [src/middlewares/auth-middleware.js](src/middlewares/auth-middleware.js)
- [src/controllers/oauth-controller.js](src/controllers/oauth-controller.js)
- [app.js](app.js)

---

## 3. RESPUESTAS HTTP CONSISTENTES

### Response Helpers

Ubicación: [src/utils/response-helper.js](src/utils/response-helper.js)

**Helpers disponibles**:

#### Respuestas exitosas:

```javascript
import { successResponse, createdResponse } from '../utils/response-helper.js';

// GET - 200
successResponse(res, users, 'Usuarios obtenidos');
// { success: true, message: "Usuarios obtenidos", data: [...] }

// POST - 201
createdResponse(res, newUser, 'Usuario creado');
// { success: true, message: "Usuario creado", data: {...} }
```

#### Respuestas de error:

```javascript
import { notFoundResponse, validationErrorResponse } from '../utils/response-helper.js';

// 404
notFoundResponse(res, 'Usuario');
// { success: false, error: "Usuario no encontrado" }

// 400 - Validación
validationErrorResponse(res, errors.array());
// { success: false, error: "Errores de validación", errors: [...] }
```

**Todos los helpers**:
- `successResponse(res, data, message, statusCode)`
- `createdResponse(res, data, message)`
- `noContentResponse(res)`
- `errorResponse(res, message, statusCode, errors)`
- `validationErrorResponse(res, errors)`
- `notFoundResponse(res, resource)`
- `unauthorizedResponse(res, message)`
- `forbiddenResponse(res, message)`
- `conflictResponse(res, message)`

---

## 4. FLUJO DE MANEJO DE ERRORES

```
Request → Middleware → Controller
            ↓              ↓
         [Error?]      [Error?]
            ↓              ↓
        next(error) ← throw error
            ↓
    errorHandler Middleware
            ↓
    - Determina tipo de error
    - Asigna código HTTP
    - Loggea con winston
    - Formatea respuesta
            ↓
    Response al cliente
```

---

## 5. ESTRUCTURA DE PROYECTO ACTUALIZADA

```
src/
├── config/
│   ├── database.js      (✓ logging)
│   ├── logger.js        (✓ NUEVO)
│   └── config.js
├── controllers/         (usa error classes)
├── errors/
│   └── errors.js        (✓ EXTENDIDO)
├── middlewares/
│   ├── auth-middleware.js    (✓ logging)
│   ├── error-middleware.js   (✓ NUEVO)
│   └── rate-limiter.js
├── models/
├── repositories/
├── routes/
├── services/
└── utils/
    └── response-helper.js    (✓ NUEVO)
```

---

## 6. BUENAS PRÁCTICAS

### En Controladores:

```javascript
export const createUser = async (req, res, next) => {
  try {
    // Validación
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('Datos inválidos');
    }

    // Lógica
    const user = await userService.create(req.body);

    // Logging
    logger.info('Usuario creado', { userId: user.id });

    // Respuesta
    return createdResponse(res, user, 'Usuario creado con éxito');

  } catch (error) {
    next(error); // Pasa al middleware de errores
  }
};
```

### En Servicios:

```javascript
export const findUserById = async (id) => {
  const user = await User.findById(id);

  if (!user) {
    throw new NotFoundError('Usuario no encontrado');
  }

  return user;
};
```

### Logging apropiado:

```javascript
// ✓ BIEN - logging estructurado
logger.info('Usuario autenticado', { userId: user.id, email: user.email });

// ✗ MAL - logging no estructurado
logger.info(`Usuario ${user.email} autenticado`);
```

---

## 7. CONFIGURACIÓN DE ENTORNOS

### Development (.env):
```env
NODE_ENV=development
```
- Logs en consola con colores
- Stack traces en errores
- Nivel: debug

### Production (.env):
```env
NODE_ENV=production
```
- Logs en archivos
- Sin stack traces públicos
- Nivel: info/error

---

## 8. TESTING DE ERRORES

Para verificar que el manejo de errores funciona:

1. **Ruta no existente**:
   ```bash
   GET /api/ruta-inexistente
   # Debe devolver 404
   ```

2. **Token inválido**:
   ```bash
   GET /api/users
   # Sin token → 401
   ```

3. **Rol insuficiente**:
   ```bash
   GET /api/users
   # Con token de student → 403
   ```

4. **Validación fallida**:
   ```bash
   POST /api/users/register
   Body: { email: "invalid" }
   # Debe devolver 400
   ```

---

## 9. PRÓXIMAS MEJORAS (FASE 3+)

- [ ] Índices en MongoDB
- [ ] Paginación
- [ ] Optimización de queries
- [ ] Rate limiting general
- [ ] Compresión de respuestas
- [ ] Request ID tracing

---

**Fecha de actualización**: 2026-02-04
**Fase completada**: FASE 2 - Arquitectura Básica
