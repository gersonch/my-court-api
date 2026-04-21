# API

> Endpoints principales de la API.

## Base URL

```
http://localhost:3000/api
```

## Documentación

- **Swagger**: `/docs` (deprecated)
- **Scalar**: `/reference`

---

## Endpoints por Módulo

### Auth

| Método | Endpoint                | Descripción              |
| ------ | ----------------------- | ------------------------ |
| POST   | `/auth/register`        | Registro de usuario      |
| POST   | `/auth/login`           | Login con email/password |
| GET    | `/auth/google`          | Login con Google         |
| GET    | `/auth/google/callback` | Callback Google          |
| POST   | `/auth/refresh`         | Refresh token            |

### Users

| Método | Endpoint    | Descripción               |
| ------ | ----------- | ------------------------- |
| GET    | `/users/me` | Perfil del usuario actual |
| PATCH  | `/users/me` | Actualizar perfil         |
| DELETE | `/users/me` | Eliminar cuenta           |

### Complexes

| Método | Endpoint                | Descripción            |
| ------ | ----------------------- | ---------------------- |
| GET    | `/complexes`            | Listar complejos       |
| GET    | `/complexes/:id`        | Ver complejo           |
| POST   | `/complexes`            | Crear complejo (admin) |
| PATCH  | `/complexes/:id`        | Actualizar complejo    |
| DELETE | `/complexes/:id`        | Eliminar complejo      |
| POST   | `/complexes/:id/images` | Subir imágenes         |

### Fields

| Método | Endpoint      | Descripción       |
| ------ | ------------- | ----------------- |
| GET    | `/fields`     | Listar canchas    |
| GET    | `/fields/:id` | Ver cancha        |
| POST   | `/fields`     | Crear cancha      |
| PATCH  | `/fields/:id` | Actualizar cancha |
| DELETE | `/fields/:id` | Eliminar cancha   |

### Reservations

| Método | Endpoint                   | Descripción      |
| ------ | -------------------------- | ---------------- |
| GET    | `/reservations`            | Mis reservas     |
| GET    | `/reservations/:id`        | Ver reserva      |
| POST   | `/reservations`            | Crear reserva    |
| PATCH  | `/reservations/:id/cancel` | Cancelar reserva |

### Tournaments

| Método | Endpoint                 | Descripción       |
| ------ | ------------------------ | ----------------- |
| GET    | `/tournaments`           | Listar torneos    |
| GET    | `/tournaments/:id`       | Ver torneo        |
| POST   | `/tournaments`           | Crear torneo      |
| PATCH  | `/tournaments/:id`       | Actualizar torneo |
| POST   | `/tournaments/:id/teams` | Agregar equipos   |

### Rating

| Método | Endpoint                      | Descripción             |
| ------ | ----------------------------- | ----------------------- |
| GET    | `/ratings/complex/:complexId` | Ver ratings de complejo |
| POST   | `/ratings`                    | Crear rating            |

---

## Autenticación

- JWT en header: `Authorization: Bearer <token>`
- Cookies HTTP-only para refresh tokens

## Rate Limiting

- 100 requests por minuto por IP
- Configurado con `@nestjs/throttler`
