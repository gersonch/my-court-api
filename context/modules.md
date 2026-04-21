# Módulos

> Estructura de módulos NestJS del proyecto.

## Módulos Existentes

### auth/

- **Path**: `src/auth/`
- **Responsabilidad**: Autenticación y autorización
- **Features**:
  - Login con JWT
  - Google OAuth
  - Registro de usuarios
  - Validación de tokens

### users/

- **Path**: `src/users/`
- **Responsabilidad**: Gestión de usuarios
- **Features**:
  - CRUD usuarios
  - Perfil de usuario
  - Roles (user/admin)
  - Upload de avatar

### complexes/

- **Path**: `src/complexes/`
- **Responsabilidad**: Complejos deportivos
- **Features**:
  - CRUD complejos
  - Imágenes de complejos (Cloudinary)
  - Datos de contacto y ubicación

### fields/

- **Path**: `src/fields/`
- **Responsabilidad**: Canchas dentro de complejos
- **Features**:
  - CRUD canchas
  - Tipos de cancha (5, 7, 11)
  - Precios por horario
  - Disponibilidad

### reservations/

- **Path**: `src/reservations/`
- **Responsabilidad**: Sistema de reservas
- **Features**:
  - Crear/cancelar reservas
  - Validación de horarios
  - Historial de reservas
  - Estados (pending, confirmed, cancelled)

### tournaments/

- **Path**: `src/tournaments/`
- **Responsabilidad**: Torneos deportivos
- **Features**:
  - Crear torneos
  - Agregar equipos y jugadores
  - Estados del torneo (open, in-progress, finished)

### rating/

- **Path**: `src/rating/`
- **Responsabilidad**: Calificaciones y reviews
- **Features**:
  - Rate de complejos (1-5 estrellas)
  - Comentarios

---

## Módulos Comunes

### config/

- Configuración de Cloudinary
- Variables de entorno

### common/

- DTOs compartidos (pagination.dto)
- Guards (API Key, roles)
- Decorators (active-user)
- Interfaces

### types/

- Tipos TypeScript compartidos
