# syntax=docker/dockerfile:1

# ---- Etapa de dependencias: instala SOLO las de producción ----
# Se usa la imagen completa (no slim) porque bcrypt es un módulo nativo y acá está
# garantizado el toolchain por si tiene que compilarse (node:22 y node:22-slim comparten
# la misma base Debian/glibc, así que node_modules es binariamente compatible entre etapas).
FROM node:22 AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# npm ci = install reproducible desde el lockfile; --omit=dev deja fuera vitest, supertest,
# mongodb-memory-server, etc. (no se necesitan en runtime).
RUN npm ci --omit=dev

# ---- Etapa de runtime: imagen final chica, sin toolchain de build ----
FROM node:22-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app

# Solo el código de la app y las dependencias ya resueltas.
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY app.js ./
COPY src ./src

# La imagen oficial de node trae un usuario 'node' sin privilegios: no correr como root.
USER node

EXPOSE 3000
CMD ["node", "app.js"]
