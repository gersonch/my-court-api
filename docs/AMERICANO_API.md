# Americano Tournament API

> Guía de integración para el modo Americano de torneos.

---

## Flujo Completo

```
1. OWNER: Crear torneo (tipo: americano, sport: padel)
2. OWNER: Abrir torneo (state: open)
3. USER: Suscribirse ("quiero participar")
4. OWNER: Ver lista de suscriptores
5. OWNER: Aprobar/rechazar suscriptores
6. OWNER: Agregar usuarios aprobados (addApprovedUsers)
7. OWNER: Generar schedule
8. OWNER/USER: Ver schedule
9. OWNER: Actualizar resultados de partidos
10. USER: Ver ranking
```

1. OWNER: Crear torneo (tipo: americano, sport: padel)
2. OWNER: Abrir torneo (state: open)
3. USER: Suscribirse ("quiero participar")
4. OWNER: Ver lista de suscriptores
5. OWNER: Aprobar/rechazar suscriptores
6. OWNER: Generar schedule
7. OWNER/USER: Ver schedule
8. OWNER: Actualizar resultados de partidos
9. USER: Ver ranking

````

---

## Endpoints

### 0. Ver Torneos Abiertos de un Complejo (Público)

```http
GET /tournaments?complexId=123abc
````

**Descripción:** Endpoint público para ver los torneos abiertos de un complejo.

**Parámetros (query):**

- `complexId`: ID del complejo

**Respuesta:**

```json
[
  {
    "_id": "tournament-id-1",
    "name": "Torneo Americano Weekend",
    "state": "open",
    "sport": "padel"
  },
  {
    "_id": "tournament-id-2",
    "name": "Liga de Fútbol 5",
    "state": "open",
    "sport": "futbol"
  }
]
```

**Nota:** Solo retorna torneos con `state: "open"`.

---

### 1. Crear Torneo Americano

```http
POST /tournaments
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Torneo Americano Weekend",
  "sport": "padel",
  "tournamentType": "americano",
  "config": {
    "teamsCount": 4,
    "rounds": 3,
    "courtCount": 1
  }
}
```

**Respuesta:**

```json
{
  "_id": "tournament-id",
  "name": "Torneo Americano Weekend",
  "sport": "padel",
  "tournamentType": "americano",
  "state": "inactive",
  "config": {
    "teamsCount": 4,
    "rounds": 3,
    "courtCount": 1
  },
  "ranking": [],
  "schedule": []
}
```

---

### 2. Abrir Torneo

```http
PATCH /tournaments/open/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "category": "Primera división",
  "startDate": "2026-05-01",
  "endDate": "2026-05-01"
}
```

---

### 3. Agregar Jugadores

```http
POST /tournaments/add-players/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "players": [
    { "userId": "user-123", "position": "reves" },
    { "userId": "user-456", "position": "drive" },
    { "userId": "user-789", "position": "reves" },
    { "userId": "user-012", "position": "drive" }
  ]
}
```

**Validaciones:**

- Cantidad de jugadores: 4, 6, u 8 (número par)
- Solo usuarios existentes

**Respuesta:**

```json
{
  "_id": "tournament-id",
  "ranking": [
    { "playerId": "user-123", "playerName": "Juan", "points": 0, "gamesPlayed": 0 },
    { "playerId": "user-456", "playerName": "Pedro", "points": 0, "gamesPlayed": 0 },
    { "playerId": "user-789", "playerName": "Lucas", "points": 0, "gamesPlayed": 0 },
    { "playerId": "user-012", "playerName": "Mateo", "points": 0, "gamesPlayed": 0 }
  ]
}
```

---

### 4. Generar Schedule

```http
POST /tournaments/generate-schedule/:id
Authorization: Bearer <token>
```

**Respuesta:**

```json
[
  {
    "round": 1,
    "courtNumber": 1,
    "startTime": "9:00",
    "coupleA": ["user-123", "user-456"],
    "coupleB": ["user-789", "user-012"],
    "pointsA": 0,
    "pointsB": 0,
    "isFinished": false
  },
  {
    "round": 2,
    "courtNumber": 1,
    "startTime": "10:00",
    "coupleA": ["user-123", "user-789"],
    "coupleB": ["user-456", "user-012"],
    "pointsA": 0,
    "pointsB": 0,
    "isFinished": false
  },
  {
    "round": 3,
    "courtNumber": 1,
    "startTime": "11:00",
    "coupleA": ["user-123", "user-012"],
    "coupleB": ["user-456", "user-789"],
    "pointsA": 0,
    "pointsB": 0,
    "isFinished": false
  }
]
```

**Nota:** Para 4 jugadores → 3 rondas (N-1). Cada jugador juega contra todos.

---

### 5. Ver Schedule

```http
GET /tournaments/schedule/:id
Authorization: Bearer <token>
```

---

### 6. Actualizar Resultado de Partido

```http
PATCH /tournaments/match/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "matchIndex": 0,
  "pointsA": 16,
  "pointsB": 14,
  "isFinished": true
}
```

**Parámetros:**

- `matchIndex`: Índice del partido en el array de schedule (0, 1, 2...)
- `pointsA`: Puntos de la pareja A (ej: 16)
- `pointsB`: Puntos de la pareja B (ej: 14)
- `isFinished`: true/false

**Nota:** Los puntos se suman al ranking de cada jugador automáticamente.

**Respuesta:**

```json
{
  "match": {
    "round": 1,
    "coupleA": ["user-123", "user-456"],
    "coupleB": ["user-789", "user-012"],
    "pointsA": 16,
    "pointsB": 14,
    "isFinished": true
  },
  "ranking": [
    { "playerId": "user-123", "points": 16, "gamesPlayed": 1 },
    { "playerId": "user-456", "points": 16, "gamesPlayed": 1 },
    { "playerId": "user-789", "points": 14, "gamesPlayed": 1 },
    { "playerId": "user-012", "points": 14, "gamesPlayed": 1 }
  ]
}
```

---

### 7. Ver Ranking

```http
GET /tournaments/ranking/:id
Authorization: Bearer <token>
```

**Respuesta:**

```json
[
  { "playerId": "user-123", "playerName": "Juan", "points": 30, "gamesPlayed": 3 },
  { "playerId": "user-456", "playerName": "Pedro", "points": 28, "gamesPlayed": 3 },
  { "playerId": "user-789", "playerName": "Lucas", "points": 20, "gamesPlayed": 3 },
  { "playerId": "user-012", "playerName": "Mateo", "points": 18, "gamesPlayed": 3 }
]
```

**Ordenado por:** points (descendente)

---

## Ejemplo de Partida Completa

### Escenario: 4 jugadores, 3 rondas

**Ronda 1:**

- Pareja A: Juan + Pedro
- Pareja B: Lucas + Mateo
- Resultado: 16-14
- Puntos: Juan=16, Pedro=16, Lucas=14, Mateo=14

**Ronda 2:**

- Pareja A: Juan + Lucas
- Pareja B: Pedro + Mateo
- Resultado: 16-12
- Puntos: Juan=32, Lucas=30, Pedro=28, Mateo=14

**Ronda 3:**

- Pareja A: Juan + Mateo
- Pareja B: Pedro + Lucas
- Resultado: 14-16
- Puntos: Juan=46, Mateo=28, Pedro=44, Lucas=46

**Ranking Final:**

1. Juan: 46 pts
2. Lucas: 46 pts
3. Pedro: 44 pts
4. Mateo: 28 pts

---

## Errores Comunes

| Código | Mensaje                                      | Solución                   |
| ------ | -------------------------------------------- | -------------------------- |
| 400    | Americano requires an even number of players | Enviar 4, 6, u 8 jugadores |
| 400    | Americano requires 4, 6, or 8 players        | Verificar cantidad         |
| 400    | No players registered                        | Llamar addPlayers primero  |
| 400    | Tournament must be open                      | Llamar open/:id primero    |
| 400    | Match not found                              | Verificar matchIndex       |

---

## Notas

- **Puntos**: Se juega a 16 puntos (gana el que llega primero)
- **Empates**: En americano no hay empates, se juega hasta que alguien llegue a 16
- **Courts**: Si hay más de 2 jugadores, se puede configurar `courtCount` paraparallel matches

---

## Sistema de Suscripciones

> Los usuarios se suscriben al torneo y el owner aprueba/rechaza.

### 1. Suscribirse al Torneo (USER)

```http
POST /tournaments/subscribe/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": "user-123"  // opcional, usa el token si no se envía
}
```

**Respuesta:**

```json
{
  "message": "Subscription successful",
  "status": "pending"
}
```

### 2. Ver Mi Estado de Suscripción (USER)

```http
GET /tournaments/subscribe-status/:id
Authorization: Bearer <token>
```

**Respuesta:**

```json
{
  "userId": "user-123",
  "status": "pending",
  "subscribedAt": "2026-04-21T10:00:00Z"
}
```

### 3. Ver Suscriptores (OWNER)

```http
GET /tournaments/subscribers/:id
Authorization: Bearer <token>
```

**Respuesta:**

```json
[
  {
    "userId": "user-123",
    "status": "pending",
    "subscribedAt": "2026-04-21T10:00:00Z",
    "userName": "Juan",
    "userLastname": "Pérez"
  },
  {
    "userId": "user-456",
    "status": "approved",
    "subscribedAt": "2026-04-21T09:00:00Z",
    "userName": "Pedro",
    "userLastname": "García"
  }
]
```

### 4. Aprobar/Rechazar Suscriptor (OWNER)

```http
PATCH /tournaments/subscribers/:id/:userId
Authorization: Bearer <token>
Content-Type: application/json

{
  "action": "approve"  // o "reject"
}
```

**Respuesta:**

```json
{
  "message": "User approved",
  "status": "approved",
  "userId": "user-123"
}
```

### 5. Agregar Usuarios Aprobados (OWNER)

```http
POST /tournaments/add-approved-users/:id
Authorization: Bearer <token>
```

**Descripción:** Toma todos los usuarios con status === 'approved' y los agrega al tournament.

**Validaciones:**

- Necesita número par de usuarios (4, 6, u 8)
- Solo usuarios approved

**Respuesta:**

```json
{
  "message": "Added 4 players to tournament",
  "playersAdded": 4,
  "ranking": [
    { "playerId": "user-123", "playerName": "Juan", "points": 0, "gamesPlayed": 0 },
    { "playerId": "user-456", "playerName": "Pedro", "points": 0, "gamesPlayed": 0 },
    { "playerId": "user-789", "playerName": "Lucas", "points": 0, "gamesPlayed": 0 },
    { "playerId": "user-012", "playerName": "Mateo", "points": 0, "gamesPlayed": 0 }
  ]
}
```

---

## Estados de Suscripción

| Estado     | Descripción                  |
| ---------- | ---------------------------- |
| `pending`  | Usuario esperando aprobación |
| `approved` | Usuario aceptado             |
| `rejected` | Usuario rechazado            |
