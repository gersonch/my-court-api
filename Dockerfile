FROM node:22-alpine

WORKDIR /app

# Copiar package files primero (cache de dependencias)
COPY package*.json ./

RUN npm ci

# Copiar código fuente
COPY . .

# Build de TypeScript
RUN npm run build

# Crear usuario no-root (seguridad)
RUN addgroup -g 1001 -S nodeapp && \
    adduser -S nodeapp -u 1001 -G nodeapp

# Cambiar ownership de archivos
RUN chown -R nodeapp:nodeapp /app

# Cambiar a usuario no-root
USER nodeapp

# Exponer puerto
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --temperror=localhost:3000 || exit 1

# Iniciar app
CMD ["npm", "run", "start:prod"]