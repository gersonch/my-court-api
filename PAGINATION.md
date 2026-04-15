# Paginación - Estilo "Load More"

## Overview

Implementación de paginación estilo **"Load More"** / **Infinite Scroll** para los endpoints que devuelven listados. Este patrón permite al frontend cargar datos de forma incremental sin necesidad de números de página visibles.

## Estructura del Response

Todos los endpoints paginados devuelven el siguiente formato:

```json
{
  "data": [
    { ... },
    { ... }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalItems": 45,
    "totalPages": 5,
    "hasMore": true
  }
}
```

| Campo        | Descripción                                        |
| ------------ | -------------------------------------------------- |
| `page`       | Página actual (1-indexed)                          |
| `limit`      | Items solicitados por página                       |
| `totalItems` | Total de items en la base de datos                 |
| `totalPages` | Total de páginas (`Math.ceil(totalItems / limit)`) |
| `hasMore`    | `true` si hay más páginas disponibles              |

## DTO Reutilizable

**Archivo**: `src/common/dto/pagination.dto.ts`

```typescript
class PaginationQueryDto {
  page?: number = 1 // Default: página 1
  limit?: number = 10 // Default: 10 items, máximo 100
}
```

### Uso en un endpoint

```typescript
@Get()
findAll(@Query() pagination: PaginationQueryDto) {
  return this.service.findAllPaginated(pagination.page, pagination.limit)
}
```

## Endpoints con Paginación

### Complexes

```http
GET /complexes?page=1&limit=10
```

| Parámetro | Tipo  | Default | Máximo |
| --------- | ----- | ------- | ------ |
| `page`    | query | 1       | -      |
| `limit`   | query | 10      | 100    |

**Response**: Lista de complejos con paginación.

---

### Fields (por Complex)

```http
GET /fields/complex/:complexId?page=1&limit=10
```

| Parámetro | Tipo  | Default | Máximo |
| --------- | ----- | ------- | ------ |
| `page`    | query | 1       | -      |
| `limit`   | query | 10      | 100    |

**Response**: Lista de canchas de un complejo con paginación.

---

### Reservations (por Field)

```http
GET /reservations/:fieldId?page=1&limit=10
```

| Parámetro | Tipo  | Default | Máximo |
| --------- | ----- | ------- | ------ |
| `page`    | query | 1       | -      |
| `limit`   | query | 10      | 100    |

**Response**: Lista de reservas de una cancha (próximos 7 días) con paginación.

---

### Reservations (por Usuario - Futuras)

```http
GET /reservations/user?page=1&limit=10
```

| Parámetro | Tipo  | Default | Máximo |
| --------- | ----- | ------- | ------ |
| `page`    | query | 1       | -      |
| `limit`   | query | 10      | 100    |

**Response**: Lista de reservas futuras del usuario con paginación.

---

## Implementación en Frontend

### Ejemplo: Botón "Cargar Más"

```tsx
const [complexes, setComplexes] = useState([])
const [page, setPage] = useState(1)
const [hasMore, setHasMore] = useState(true)
const limit = 10

const loadMore = async () => {
  const response = await fetch(`/complexes?page=${page}&limit=${limit}`)
  const data = await response.json()

  setComplexes([...complexes, ...data.data])
  setHasMore(data.pagination.hasMore)
  setPage(page + 1)
}

return (
  <div>
    <ComplexList data={complexes} />
    {hasMore && <button onClick={loadMore}>Cargar más</button>}
  </div>
)
```

### Ejemplo: Infinite Scroll

```tsx
const [complexes, setComplexes] = useState([])
const [page, setPage] = useState(1)

useEffect(() => {
  const loadData = async () => {
    const response = await fetch(`/complexes?page=${page}&limit=10`)
    const data = await response.json()
    setComplexes((prev) => [...prev, ...data.data])
  }
  loadData()
}, [page])

// Usar IntersectionObserver para detectar scroll
```

## Decisiones de Diseño

### Por qué Page/Limit en vez de Cursor?

| Aspecto              | Page/Limit | Cursor/Next |
| -------------------- | ---------- | ----------- |
| Debugging            | ✅ Fácil   | ❌ Difícil  |
| Navegación backwards | ✅ Sí      | ❌ No       |
| UI "Load More"       | ✅ Sí      | ✅ Sí       |
| Complex queries      | ✅ Bueno   | ⚠️ Limitado |

**Elegimos Page/Limit** porque:

1. Es más fácil de debuggear
2. El frontend controla el "Cargar más" fácilmente
3. No hay necesidades estrictas de real-time data

### Por qué máximo 100?

- Previene queries excesivamente pesadas
- 100 items es suficiente para cualquier caso de uso
- Se puede ajustar si es necesario

## Archivos Modificados

| Archivo                                       | Cambio                                                                    |
| --------------------------------------------- | ------------------------------------------------------------------------- |
| `src/common/dto/pagination.dto.ts`            | ✅ Creado                                                                 |
| `src/complexes/complexes.service.ts`          | Agregado `findAllPaginated()`                                             |
| `src/complexes/complexes.controller.ts`       | Actualizado `GET /`                                                       |
| `src/fields/fields.service.ts`                | Agregado `getFieldsByComplexPaginated()`                                  |
| `src/fields/fields.controller.ts`             | Actualizado `GET /complex/:complexId`                                     |
| `src/reservations/reservations.service.ts`    | Agregado `getReservationsPaginated()`, `getReservationsByUserPaginated()` |
| `src/reservations/reservations.controller.ts` | Actualizado `GET /:fieldId`, `GET /user`                                  |

## Cómo Usar los Endpoints

### Flujo Completo: "Cargar Más" para Complexes

#### 1. Carga Inicial (Primera Página)

```bash
GET http://localhost:3000/complexes?page=1&limit=10
```

**Headers** (si requiere auth):

```bash
Authorization: Bearer <JWT_TOKEN>
```

**Response:**

```json
{
  "data": [
    {
      "_id": "6811f5c8d72EXAMPLEa",
      "name": "Club Deportivo Norte",
      "sportType": "futbol",
      "location": { "address": "Av.Principal 123" }
    },
    {
      "_id": "6811f5c8d72EXAMPLEb",
      "name": "Paddle Center",
      "sportType": "padel",
      "location": { "address": "Calle Falsa 456" }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalItems": 25,
    "totalPages": 3,
    "hasMore": true
  }
}
```

#### 2. Cargar Siguiente Página

```bash
GET http://localhost:3000/complexes?page=2&limit=10
```

**Response:**

```json
{
  "data": [
    {
      "_id": "6811f5c8d72EXAMPLEc",
      "name": "Tenis Club",
      "sportType": "tenis",
      "location": { "address": "Av.Tenis 789" }
    }
  ],
  "pagination": {
    "page": 2,
    "limit": 10,
    "totalItems": 25,
    "totalPages": 3,
    "hasMore": false
  }
}
```

#### 3. Fin de la Lista

Cuando `hasMore` es `false`, hiding el botón "Cargar más".

---

### Ejemplo: Reservas del Usuario

```bash
GET http://localhost:3000/reservations/user?page=1&limit=5
Authorization: Bearer <JWT_TOKEN>
```

**Response:**

```json
{
  "data": [
    {
      "_id": "6811f5c8d72EXAMPLE",
      "fieldId": "6811f5c8d72FIELD01",
      "complexId": "6811f5c8d72COMPLEX",
      "startTime": "2025-04-15T10:00:00.000Z",
      "duration": 60,
      "price": 5000,
      "status": "confirmed",
      "fieldName": "Cancha 1",
      "complexName": "Club Deportivo Norte"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 5,
    "totalItems": 12,
    "totalPages": 3,
    "hasMore": true
  }
}
```

---

### Ejemplo: Canchas de un Complejo

```bash
GET http://localhost:3000/fields/complex/6811f5c8d72COMPLEX?page=1&limit=10
```

**Response:**

```json
{
  "data": [
    {
      "_id": "6811f5c8d72FIELD01",
      "name": "Cancha 1",
      "complexId": "6811f5c8d72COMPLEX",
      "sportType": "futbol",
      "price": 5000
    },
    {
      "_id": "6811f5c8d72FIELD02",
      "name": "Cancha 2",
      "complexId": "6811f5c8d72COMPLEX",
      "sportType": "futbol",
      "price": 5000
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalItems": 8,
    "totalPages": 1,
    "hasMore": false
  }
}
```

---

### Casos Especiales

#### Sin parámetros (usa defaults)

```bash
GET http://localhost:3000/complexes
# Equivalente a: ?page=1&limit=10
```

#### Con límite custom

```bash
GET http://localhost:3000/complexes?page=1&limit=25
# Máximo permitido: 100
```

---

## Testing

Ejemplo de requests:

```bash
# Primer batch
curl "http://localhost:3000/complexes?page=1&limit=5"

# Segundo batch
curl "http://localhost:3000/complexes?page=2&limit=5"

# Sin parámetros (defaults)
curl "http://localhost:3000/complexes"
```

Response esperado (page 1):

```json
{
  "data": [
    { "_id": "1", "name": "Complex A" },
    { "_id": "2", "name": "Complex B" },
    { "_id": "3", "name": "Complex C" },
    { "_id": "4", "name": "Complex D" },
    { "_id": "5", "name": "Complex E" }
  ],
  "pagination": {
    "page": 1,
    "limit": 5,
    "totalItems": 12,
    "totalPages": 3,
    "hasMore": true
  }
}
```
