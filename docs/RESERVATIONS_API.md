# API de Reservas — Documentación Frontend

> Versión: v2.0  
> Fecha: 2024-04-14  
> Cambios: Race condition handling

---

## ¿Qué cambió?

| Antes                                                                | Ahora                                                             |
| -------------------------------------------------------------------- | ----------------------------------------------------------------- |
| El servidor verificaba disponibilidad con `findOne()` antes de crear | El servidor intenta crear directamente                            |
| Si dos usuarios pedían el mismo slot → ambos podían crear ❌         | Si dos usuarios pedían el mismo slot → uno falla con error 400 ✅ |
| Error genérico                                                       | Error específico: "slot ya reservado"                             |

**Beneficio**: Se eliminó la race condition. Ya no es posible reservar el mismo horario dos veces.

---

## Crear Reserva

### Endpoint

```
POST /reservations
```

### Headers

```http
Authorization: Bearer <TOKEN>
Content-Type: application/json
```

### Body

```json
{
  "fieldId": "641f1a2b3c4d5e6f7g8h9i0j",
  "userId": "641f1a2b3c4d5e6f7g8h9i0j",
  "complexId": "641f1a2b3c4d5e6f7g8h9i0j",
  "startTime": "2024-04-20T10:00:00.000Z",
  "duration": "01:00",
  "price": 15000
}
```

### Respuesta Exitosa (201)

```json
{
  "_id": "641f1a2b3c4d5e6f7g8h9i0j",
  "fieldId": "641f1a2b3c4d5e6f7g8h9i0j",
  "userId": "641f1a2b3c4d5e6f7g8h9i0j",
  "complexId": "641f1a2b3c4d5e6f7g8h9i0j",
  "startTime": "2024-04-20T10:00:00.000Z",
  "duration": "01:00",
  "price": 15000,
  "status": "confirmed",
  "createdAt": "2024-04-14T10:30:00.000Z"
}
```

### Respuesta Error (400) — Slot Occupied

```json
{
  "statusCode": 400,
  "message": "This time slot has already been reserved. Please choose another time.",
  "error": "Bad Request"
}
```

### Otras Respuestas de Error

| Código | Mensaje                                       | Causa                            |
| ------ | --------------------------------------------- | -------------------------------- |
| 400    | "Field not found"                             | El `fieldId` no existe           |
| 400    | "Reservation time must be in the future"      | Intentan reservar en el pasado   |
| 400    | "This time slot has already been reserved..." | Otro usuario ya reservó ese slot |
| 401    | Unauthorized                                  | Token inválido o отсутствует     |
| 404    | Not Found                                     | Endpoint no existe               |

---

## Obtener Turnos Disponibles

### Endpoint

```
GET /reservations/:fieldId?page=1&limit=10
```

### Ejemplo de Fetch

```javascript
const token = localStorage.getItem('token')
const fieldId = '641f1a2b3c4d5e6f7g8h9i0j'

const response = await fetch(`https://api.mycourt.com/reservations/${fieldId}?page=1&limit=10`, {
  method: 'GET',
  headers: {
    Authorization: `Bearer ${token}`,
  },
})

const data = await response.json()
console.log(data)
// {
//   "data": [
//     { "_id": "...", "startTime": "2024-04-20T10:00:00.000Z", "duration": "01:00" },
//     { "_id": "...", "startTime": "2024-04-20T11:00:00.000Z", "duration": "01:00" }
//   ],
//   "page": 1,
//   "limit": 10,
//   "total": 2
// }
```

---

## Recomendaciones para el Frontend

### 1. Disable botón mientras carga

```javascript
const [loading, setLoading] = useState(false)

const handleReserve = async () => {
  setLoading(true)
  try {
    const response = await fetch('/reservations', { ... })
    if (response.status === 201) {
      // Success
    } else if (response.status === 400) {
      const error = await response.json()
      // Mostrar mensaje al usuario
      showToast(error.message)
    }
  } finally {
    setLoading(false)
  }
}
```

### 2. Mostrar disponibilidad antes de enviar

```javascript
// NO dependas solo del error al crear
// Obtené los horarios ocupados primero

const availableSlots = await fetch(`/reservations/${fieldId}`)
const occupiedTimes = availableSlots.data.map((s) => s.startTime)

// Filtrá en el frontend los horarios que el usuario puede elegir
```

### 3. Retry automático opcional

```javascript
// Si el usuario ve "slot occupado", podés ofrecer:
// - "Otro usuario acabou de reservar. ¿Querés buscar otro horario?"
// - NO hagás retry automático (puede ser confuso)
```

---

## Changelog

### v2.0 (2024-04-14)

- **Cambio**: Race condition resuelta via unique index en MongoDB
- **BC**: El endpoint de creación puede retornar 400 si el slot ya fue tomado por otro usuario
- **Nota**: El error message cambió a uno más descriptivo
