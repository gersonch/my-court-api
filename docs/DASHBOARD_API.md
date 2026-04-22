# API Dashboard - Guía de Integración

> Guía completa de endpoints para consumir la API del proyecto.

---

## Autenticación

Todos los endpoints protegidos requieren:

```http
Authorization: Bearer <token>
```

El token se obtiene del endpoint `/auth/login`.

---

## Roles

| Rol     | Descripción       |
| ------- | ----------------- |
| `user`  | Usuario común     |
| `owner` | Dueño de complejo |
| `admin` | Administrador     |

---

## Auth

### 1. Registro

```http
POST /auth/register
Content-Type: application/json

{
  "name": "Juan Pérez",
  "email": "juan@email.com",
  "password": "password123",
  "role": "user"  // user, owner, o admin
}
```

**Respuesta:**

```json
{
  "id": "user-id",
  "name": "Juan Pérez",
  "email": "juan@email.com",
  "role": "user"
}
```

---

### 2. Login

```http
POST /auth/login
Content-Type: application/json

{
  "email": "juan@email.com",
  "password": "password123"
}
```

**Respuesta:**

```json
{
  "token": "eyJhbGciOiJIUz...",
  "refreshToken": "eyJhbGciOiJIUz...",
  "user": {
    "id": "user-id",
    "name": "Juan Pérez",
    "email": "juan@email.com",
    "role": "user"
  }
}
```

**Cookies设置:**

- `token`: 15 minutos
- `refreshToken`: 7 días

---

### 3. Refresh Token

```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUz..."
}
```

---

### 4. Logout

```http
POST /auth/logout
```

---

### 5. Login con Google

```http
GET /auth/google
```

Redirige a Google para autenticación.

---

## Users

### 1. Crear Usuario (Público)

```http
POST /users
Content-Type: application/json

{
  "name": "Juan",
  "email": "juan@email.com",
  "password": "password123"
}
```

---

### 2. Ver Todos los Usuarios (Público)

```http
GET /users
```

---

### 3. Mi Perfil

```http
GET /users/:id
Authorization: Bearer <token>
```

**Validación:** Solo puede ver su propio perfil.

---

### 4. Actualizar Mi Perfil

```http
PATCH /users/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Juan Actualizado",
  "lastname": "Pérez"
}
```

---

### 5. Subir Foto de Perfil

```http
PATCH /users/:id/image
Authorization: Bearer <token>
Content-Type: multipart/form-data

// Body: form-data con campo "file"
```

---

### 6. Eliminar Foto de Perfil

```http
PATCH /users/:id/delete-image
Authorization: Bearer <token>
Content-Type: application/json

{
  "imageUrl": "http://cloudinary.com/..."
}
```

---

## Complexes

### 1. Ver Todos los Complejos (Público)

```http
GET /complexes?page=1&limit=10
```

---

### 2. Crear Complejo

```http
POST /complexes
Authorization: Bearer <token> (Admin)
Content-Type: application/json

{
  "name": "Club de Pádel",
  "address": "Calle 123",
  "phone": "123456789",
  "owner": "user-id"
}
```

---

### 3. Mi Complejo

```http
GET /complexes/:complexId
Authorization: Bearer <token> (Owner)
```

---

### 4. Actualizar Mi Complejo

```http
PATCH /complexes/update
Authorization: Bearer <token> (Owner)
Content-Type: application/json

{
  "name": "Nuevo Nombre",
  "address": "Nueva Dirección"
}
```

---

### 5. Agregar Imagen al Complejo

```http
PUT /complexes/add-image
Authorization: Bearer <token> (Owner)
Content-Type: multipart/form-data

// Body: form-data con campo "file"
```

---

### 6. Eliminar Imagen del Complejo

```http
PATCH /complexes/delete-image
Authorization: Bearer <token> (Owner)
Content-Type: application/json

{
  "image-url": "http://cloudinary.com/..."
}
```

---

## Fields (Canchas)

### 1. Crear Cancha

```http
POST /fields
Authorization: Bearer <token> (Owner)
Content-Type: application/json

{
  "name": "Cancha 1",
  "type": "padel",  // o "futbol"
  "complexId": "complex-id"
}
```

---

### 2. Ver Cancha por ID

```http
GET /fields/:id
```

---

### 3. Ver Canchas por Complejo

```http
GET /fields/complex/:complexId?page=1&limit=10
```

---

## Reservations

### 1. Crear Reserva

```http
POST /reservations
Authorization: Bearer <token>
Content-Type: application/json

{
  "fieldId": "field-id",
  "date": "2026-05-01",
  "startTime": "10:00",
  "endTime": "11:00"
}
```

---

### 2. Mis Reservas

```http
GET /reservations/user?page=1&limit=10
Authorization: Bearer <token>
```

---

### 3. Historial de Mis Reservas

```http
GET /reservations/user/history?limit=10
Authorization: Bearer <token>
```

---

### 4. Ver Reservas de una Cancha

```http
GET /reservations/:fieldId?page=1&limit=10
```

---

### 5. Cancelar Reserva

```http
PATCH /reservations/:reservationId/cancel
Authorization: Bearer <token>
```

---

## Tournaments

### 1. Ver Torneos Abiertos de un Complejo (Público)

```http
GET /tournaments?complexId=123abc
```

---

### 2. Crear Torneo

```http
POST /tournaments
Authorization: Bearer <token> (Owner)
Content-Type: application/json

{
  "name": "Torneo Americano",
  "sport": "padel",
  "tournamentType": "americano",  // americano, liga, playoff
  "config": {
    "teamsCount": 4,
    "rounds": 3,
    "courtCount": 1
  }
}
```

**Parámetros:**

- `name`: Nombre del torneo
- `sport`: `"padel"` o `"futbol"`
- `tournamentType`: `"americano"`, `"liga"` o `"playoff"`
- `config` (opcional):
  - `teamsCount`: Cantidad de equipos (4, 8, 16 para playoff)
  - `rounds`: Cantidad de rondas (americano)
  - `courtCount`: Cantidad de canchas (americano)

---

### 3. Abrir Torneo

```http
PATCH /tournaments/open/:id
Authorization: Bearer <token> (Owner)
Content-Type: application/json

{
  "category": "Primera división",
  "startDate": "2026-05-01",
  "endDate": "2026-05-15"
}
```

---

### 4. Eliminar Torneo

```http
DELETE /tournaments/delete/:id
Authorization: Bearer <token> (Owner)
```

---

### 5. Agregar Jugadores (Americano)

```http
POST /tournaments/add-players/:id
Authorization: Bearer <token> (Owner)
Content-Type: application/json

{
  "players": [
    { "userId": "user-1", "position": "reves" },
    { "userId": "user-2", "position": "drive" }
  ]
}
```

**Validaciones:**

- Cantidad: 4, 6 u 8 jugadores (número par)
- Solo usuarios existentes

---

### 6. Agregar Equipos (Liga/Playoff)

```http
PATCH /tournaments/add-teams/:id
Authorization: Bearer <token> (Owner)
Content-Type: application/json

{
  "teams": [
    {
      "name": "Equipo 1",
      "players": [
        { "userId": "user-1", "position": "delantero" },
        { "userId": "user-2", "position": "defensa" }
      ]
    }
  ]
}
```

---

### 7. Generar Fixture (Americano)

```http
POST /tournaments/generate-schedule/:id
Authorization: Bearer <token> (Owner)
```

---

### 8. Ver Schedule

```http
GET /tournaments/schedule/:id
Authorization: Bearer <token>
```

---

### 9. Actualizar Resultado

```http
PATCH /tournaments/match/:id
Authorization: Bearer <token> (Owner)
Content-Type: application/json

{
  "matchIndex": 0,
  "pointsA": 16,
  "pointsB": 14,
  "isFinished": true
}
```

---

### 10. Ver Ranking

```http
GET /tournaments/ranking/:id
Authorization: Bearer <token>
```

---

### 11. Ver Equipos

```http
GET /tournaments/teams/:id
Authorization: Bearer <token>
```

---

### 12. Suscribirse a un Torneo

```http
POST /tournaments/subscribe/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": "user-id"  // opcional
}
```

---

### 13. Mi Estado de Suscripción

```http
GET /tournaments/subscribe-status/:id
Authorization: Bearer <token>
```

---

### 14. Ver Suscriptores

```http
GET /tournaments/subscribers/:id
Authorization: Bearer <token> (Owner)
```

---

### 15. Aprobar/Rechazar Suscriptor

```http
PATCH /tournaments/subscribers/:id/:userId
Authorization: Bearer <token> (Owner)
Content-Type: application/json

{
  "action": "approve"  // o "reject"
}
```

---

### 16. Agregar Usuarios Aprobados

```http
POST /tournaments/add-approved-users/:id
Authorization: Bearer <token> (Owner)
```

---

### 17. Torneos por Usuario

```http
GET /tournaments/user/:userId
Authorization: Bearer <token>
```

---

## Ratings

### 1. Crear Rating

```http
POST /rating/:complexId
Authorization: Bearer <token>
Content-Type: application/json

{
  "rating": 5,
  "comment": "Excelente complejo"
}
```

---

### 2. Actualizar Rating

```http
PUT /rating/:complexId
Authorization: Bearer <token>
Content-Type: application/json

{
  "rating": 4,
  "comment": "Muy bueno"
}
```

---

### 3. Mi Rating en un Complejo

```http
GET /rating/:complexId/user
Authorization: Bearer <token>
```

---

### 4. Ratings de Varios Complejos (Público)

```http
GET /rating?ids=complex1,complex2,complex3
```

---

## Resumen de Endpoints

### Públicos (sin auth)

| Método | Endpoint                     | Descripción              |
| ------ | ---------------------------- | ------------------------ |
| POST   | `/auth/register`             | Registrarse              |
| POST   | `/auth/login`                | Iniciar sesión           |
| GET    | `/complexes`                 | Listar complejos         |
| GET    | `/complexes/:id`             | Ver complejo             |
| GET    | `/fields/:id`                | Ver cancha               |
| GET    | `/fields/complex/:complexId` | Listar canchas           |
| GET    | `/reservations/:fieldId`     | Ver reservas             |
| GET    | `/tournaments?complexId=`    | Ver tournaments abiertos |
| GET    | `/rating?ids=`               | Ver ratings              |

---

### Protegidos (USER)

| Método | Endpoint                            | Descripción       |
| ------ | ----------------------------------- | ----------------- |
| POST   | `/auth/refresh`                     | Refresh token     |
| POST   | `/auth/logout`                      | Cerrar sesión     |
| GET    | `/users/:id`                        | Mi perfil         |
| PATCH  | `/users/:id`                        | Actualizar perfil |
| PATCH  | `/users/:id/image`                  | Subir foto        |
| POST   | `/reservations`                     | Crear reserva     |
| GET    | `/reservations/user`                | Mis reservas      |
| GET    | `/reservations/user/history`        | Historial         |
| PATCH  | `/reservations/:id/cancel`          | Cancelar          |
| POST   | `/tournaments/subscribe/:id`        | Suscribirse       |
| GET    | `/tournaments/subscribe-status/:id` | Mi estado         |
| GET    | `/tournaments/schedule/:id`         | Ver fixture       |
| GET    | `/tournaments/ranking/:id`          | Ver ranking       |
| POST   | `/rating/:complexId`                | Crear rating      |
| PUT    | `/rating/:complexId`                | Actualizar rating |
| GET    | `/rating/:complexId/user`           | Mi rating         |

---

### Protegidos (OWNER)

| Método | Endpoint                               | Descripción          |
| ------ | -------------------------------------- | -------------------- |
| POST   | `/complexes`                           | Crear complejo       |
| PATCH  | `/complexes/update`                    | Actualizar           |
| PUT    | `/complexes/add-image`                 | Agregar imagen       |
| PATCH  | `/complexes/delete-image`              | Eliminar imagen      |
| GET    | `/complexes/:complexId`                | Mi complejo          |
| POST   | `/fields`                              | Crear cancha         |
| POST   | `/tournaments`                         | Crear torneo         |
| PATCH  | `/tournaments/open/:id`                | Abrir torneo         |
| DELETE | `/tournaments/delete/:id`              | Eliminar             |
| POST   | `/tournaments/add-players/:id`         | Agregar players      |
| PATCH  | `/tournaments/add-teams/:id`           | Agregar equipos      |
| POST   | `/tournaments/generate-schedule/:id`   | Generar fixture      |
| PATCH  | `/tournaments/match/:id`               | Actualizar resultado |
| GET    | `/tournaments/subscribers/:id`         | Ver suscriptores     |
| PATCH  | `/tournaments/subscribers/:id/:userId` | Aprobar/rechazar     |
| POST   | `/tournaments/add-approved-users/:id`  | Agregar aprobados    |

---

### Protegidos (ADMIN)

| Método | Endpoint     | Descripción    |
| ------ | ------------ | -------------- |
| POST   | `/complexes` | Crear complejo |

---

## Notas Importantes

1. **Americano**: Solo para pádel. Requiere 4, 6 u 8 jugadores.
2. **Playoff**: Requiere 4, 8 o 16 equipos.
3. **Liga**: Mínimo 4 equipos.
4. El flujo de tournaments es: crear → abrir → agregar jugadores/equipos → generar fixture → actualizar resultados.
