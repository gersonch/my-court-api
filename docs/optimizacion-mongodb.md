# Optimización de Base de Datos: Índices MongoDB y N+1 Queries

Guía técnica para developers sobre optimización de queries en MongoDB con Mongoose.

---

## Tabla de Contenidos

1. [Índices en MongoDB](#1-índices-en-mongodb)
   - [¿Qué es un índice?](#11-qué-es-un-índice)
   - [B-Tree: La estructura detrás](#12-b-tree-la-estructura-detrás)
   - [Tipos de Índices](#13-tipos-de-índices)
   - [Índices Compuestos](#14-índices-compuestos)
   - [Verificar uso de índices con explain()](#15-verificar-uso-de-índices-con-explain)
   - [Buenas Prácticas](#16-buenas-prácticas)
2. [El Problema N+1](#2-el-problema-n1)
   - [¿Qué es?](#21-qué-es)
   - [Por qué es un problema](#22-por-qué-es-un-problema)
   - [Soluciones](#23-soluciones)
3. [Aggregation Framework](#3-aggregation-framework)
   - [Pipeline de Aggregation](#31-pipeline-de-aggregation)
   - [$lookup Explained](#32-lookup-explained)
   - [$unwind Explained](#33-unwind-explained)
4. [Caso Práctico: Reservas](#4-caso-práctico-reservas)
   - [Schemas con Índices](#41-schemas-con-índices)
   - [Service Optimizado](#42-service-optimizado)
5. [Rendimiento Comparativo](#5-rendimiento-comparativo)
6. [Scripts de Verificación](#6-scripts-de-verificación)

---

## 1. Índices en MongoDB

### 1.1 ¿Qué es un índice?

Un índice en MongoDB es una estructura de datos separada que mejora la velocidad de las operaciones de búsqueda en una colección. Funciona similar a un índice de libro: en lugar de leer todas las páginas para encontrar una palabra, vas directo a la página correcta.

#### Sin índice vs Con índice

```
COLECCIÓN RESERVAS (1,000,000 documentos):

┌─────────────────────────────────────────────────────────────────────┐
│ SIN ÍNDICE - Collection Scan                                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Buscar: { userId: "123" }                                          │
│                                                                      │
│  Documento 1 → userId: 999  ❌ (no match)                           │
│  Documento 2 → userId: 456  ❌                                      │
│  Documento 3 → userId: 123  ✓ (ENCONTRADO!)                        │
│  ...                                                                │
│  Documento 999,998 → userId: 789  ❌                                │
│  Documento 999,999 → userId: 321  ❌                               │
│  Documento 1,000,000 → userId: 654  ❌                             │
│                                                                      │
│  ⏱️ Complexidad: O(n) — Debe revisar TODOS los documentos          │
│  📊 Tiempo estimado (1M docs @ 10ms/doc): ~2.7 horas               │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ CON ÍNDICE - Index Scan                                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Buscar: { userId: "123" }                                          │
│                                                                      │
│  B-Tree:                                                            │
│                    [userId: 500]                                     │
│                   /          \                                       │
│          [userId: 250]      [userId: 750]                           │
│          /        \          /        \                              │
│    [userId: 125] [375]    [625]     [875]                           │
│    /      \    /   \      /   \      /   \                          │
│   ...    ...  ...   ...  ...  ...  ...   ...                       │
│                                                                      │
│  Pasos:                                                             │
│    1. 123 < 500 → izquierda                                         │
│    2. 123 < 250 → izquierda                                         │
│    3. 123 < 125 → izquierda                                         │
│    4. Encontrado → retorna referencia al documento                  │
│                                                                      │
│  ⏱️ Complexidad: O(log n) — Solo log₂(1,000,000) ≈ 20 pasos       │
│  📊 Tiempo estimado: ~0.02ms                                        │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.2 B-Tree: La estructura detrás

MongoDB usa **B-Trees** (Balanced Trees) para almacenar índices. Cada nodo del árbol contiene múltiples claves ordenadas, permitiendo búsqueda eficiente.

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ESTRUCTURA B-TREE                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│                           [500]                                       │
│                    ┌───────┴───────┐                                 │
│                  [250]           [750]                               │
│              ┌───┴───┐       ┌───┴───┐                             │
│           [125]    [375]   [625]    [875]                           │
│           /│\     /│\     /│\     /│\                              │
│          .. ..   .. ..   .. ..   .. ..                              │
│                                                                      │
│  Características:                                                    │
│    • Balanceado: todas las hojas están al mismo nivel               │
│    • Cada nodo tiene múltiples claves (no binario)                  │
│    • Búsqueda: O(log n) garantizado                                  │
│    • Inserción/Eliminación: rebalanceo automático                   │
│                                                                      │
│  Metadata en cada nodo:                                              │
│    • Claves: valores del campo indexado                              │
│    • Punteros: referencias a documentos o nodos hijos                 │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.3 Tipos de Índices

| Tipo            | Descripción           | Ejemplo de Uso                       |
| --------------- | --------------------- | ------------------------------------ |
| **Simple**      | Un solo campo         | `{ email: 1 }`                       |
| **Compuesto**   | Múltiples campos      | `{ userId: 1, startTime: 1 }`        |
| **Multikey**    | Arrays de valores     | `{ tags: 1 }` (indexa cada elemento) |
| **Texto**       | Búsqueda de texto     | `{ description: 'text' }`            |
| **Geoespacial** | Coordenadas           | `{ location: '2dsphere' }`           |
| **Hash**        | Distribución uniforme | `{ _id: 'hashed' }`                  |

### 1.4 Índices Compuestos

Los índices compuestos son poderosos pero requieren entender el **orden de campos**.

```
┌─────────────────────────────────────────────────────────────────────┐
│ ÍNDICE COMPUESTO: { userId: 1, startTime: 1 }                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  El campo userId viene PRIMERO porque:                               │
│    1. Queries que filtran solo por userId lo usan completo           │
│    2. Queries que filtran por userId + startTime lo usan completo   │
│    3. Queries que filtran solo por startTime NO lo usan             │
│                                                                      │
│  EJEMPLOS:                                                          │
│                                                                      │
│  ✅ USA ÍNDICE:                                                      │
│     db.reservations.find({ userId: "123" })                          │
│     db.reservations.find({ userId: "123", startTime: { $gte: ... } })
│                                                                      │
│  ❌ NO USA ÍNDICE:                                                   │
│     db.reservations.find({ startTime: { $gte: ... } })              │
│                                                                      │
│  ESQUEMA VISUAL DEL ÍNDICE:                                         │
│                                                                      │
│  userId: "001" → [startTime: t1, t5, t8]                           │
│  userId: "123" → [startTime: t2, t4, t7]  ← Búsqueda va aquí      │
│  userId: "456" → [startTime: t3, t6, t9]                           │
│  userId: "789" → [startTime: t10]                                  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.5 Verificar uso de índices con explain()

```javascript
// Ejecutar en mongosh o Compass
db.reservations.find({ userId: '123' }).explain('executionStats')
```

**Con resultado de INDEX SCAN (BUENO):**

```json
{
  "queryPlanner": {
    "winningPlan": {
      "stage": "FETCH",
      "inputStage": {
        "stage": "IXSCAN",
        "indexName": "userId_1",
        "direction": "forward"
      }
    }
  },
  "executionStats": {
    "executionTimeMillis": 2,
    "totalDocsExamined": 1,
    "totalKeysExamined": 1,
    "nReturned": 1
  }
}
```

**Con resultado de COLLECTION SCAN (MALO):**

```json
{
  "queryPlanner": {
    "winningPlan": {
      "stage": "COLLSCAN"
    }
  },
  "executionStats": {
    "executionTimeMillis": 1500,
    "totalDocsExamined": 1000000,
    "nReturned": 1
  }
}
```

### 1.6 Buenas Prácticas

| Práctica                          | Recomendación                                              |
| --------------------------------- | ---------------------------------------------------------- |
| **Cardinalidad**                  | Indexa campos de alta cardinalidad (únicos o muy variados) |
| **Orden de campos**               | Campos exactos primero, luego rangos                       |
| **Índices compuestos vs simples** | Prefiere compuestos si consultas usan ambos campos         |
| **Covered Queries**               | Incluye todos los campos necesarios en el índice           |
| **Evita sobre-indexar**           | Cada índice consume RAM y ralentiza writes                 |
| **Indexar en producción**         | Usa `background: true` para no bloquear                    |

```typescript
// Crear índice en background (no bloquea operaciones)
ReservationSchema.index({ userId: 1 }, { background: true })

// Índice único
UserSchema.index({ email: 1 }, { unique: true })

// TTL Index (auto-eliminación)
SessionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 3600 })
```

---

## 2. El Problema N+1

### 2.1 ¿Qué es?

El problema N+1 ocurre cuando para obtener una lista de N elementos, se ejecuta:

- 1 query inicial para los elementos
- N queries adicionales (una por cada elemento)

### 2.2 ¿Por qué es un problema?

```
┌─────────────────────────────────────────────────────────────────────┐
│ ESCENARIO: Mostrar 100 reservas CON nombre de cancha y complejo     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  CÓDIGO N+1:                                                        │
│                                                                      │
│  const reservations = await Reservation.find({ userId })            │
│  // Query 1: Obtiene 100 reservas                                   │
│                                                                      │
│  for (const res of reservations) {                                  │
│    res.field = await Field.findById(res.fieldId)      // +100 queries │
│    res.complex = await Complex.findById(res.complexId) // +100 queries │
│  }                                                                  │
│                                                                      │
│  TOTAL: 1 + 100 + 100 = 201 QUERIES ❌                             │
│                                                                      │
│  TIMELINE:                                                          │
│  |____|____|____|____|____|____|____|____|____|____|...           │
│  10ms 10ms 10ms 10ms 10ms 10ms 10ms 10ms 10ms 10ms ...             │
│  ├─────────────────────────────────────────────────────────────────┤
│  Total: ~2 segundos (solo en queries)                               │
│                                                                      │
│  ESCALABILIDAD:                                                     │
│  50 reservas  → 101 queries → ~500ms                                │
│  100 reservas → 201 queries → ~1000ms                               │
│  500 reservas → 1001 queries → ~5000ms                              │
│                                                                      │
│  ⚠️ El tiempo crece linealmente con los datos                      │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.3 Soluciones

| Solución        | Queries | Pros               | Contras            | Cuándo usar    |
| --------------- | ------- | ------------------ | ------------------ | -------------- |
| **N+1**         | N + 2   | Simple             | Lento              | Nunca en prod  |
| **.populate()** | 3       | Fácil              | Join en memoria    | Datos pequeños |
| **$lookup**     | 1       | Rápido, join en DB | Pipeline más largo | Datos grandes  |

---

## 3. Aggregation Framework

El aggregation framework de MongoDB permite procesar documentos a través de un pipeline de stages, transformando los datos en cada etapa.

### 3.1 Pipeline de Aggregation

```
┌─────────────────────────────────────────────────────────────────────┐
│                    AGGREGATION PIPELINE                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐        │
│  │  $match  │──▶│ $lookup  │──▶│ $unwind  │──▶│ $project │──▶     │
│  └──────────┘   └──────────┘   └──────────┘   └──────────┘        │
│       │                                                   │          │
│   Filtrar       JOIN              Desempaquetar        Proyectar    │
│   documentos    colecciones       arrays a objetos      campos        │
│                                                                      │
│  STAGES DISPONIBLES:                                                │
│                                                                      │
│  $match    → Filtrar documentos (equivalente a WHERE)               │
│  $lookup   → JOIN con otra colección (equivalente a LEFT JOIN)      │
│  $unwind   → Desempaquetar arrays en documentos individuales        │
│  $project  → Seleccionar/remapear campos (equivalente a SELECT)     │
│  $group    → Agrupar y agregar (equivalente a GROUP BY)             │
│  $sort     → Ordenar resultados                                    │
│  $limit    → Limitar cantidad de resultados                        │
│  $skip     → Saltar documentos                                     │
│  $addFields→ Agregar nuevos campos                                 │
│  $count    → Contar documentos                                     │
│  $facet    → Múltiples pipelines en paralelo                       │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2 $lookup Explained

```typescript
// Sintaxis básica de $lookup
{
  $lookup: {
    from: 'fields',              // Colección a joinear (DEBE existir en DB)
    localField: 'fieldId',      // Campo en la colección origen
    foreignField: '_id',        // Campo en la colección destino
    as: 'field'                 // Nombre del array resultado
  }
}
```

```
┌─────────────────────────────────────────────────────────────────────┐
│ $LOOKUP - VISUALIZACIÓN                                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  COLECCIÓN: reservations                    COLECCIÓN: fields        │
│  ┌───────────────────────────┐              ┌─────────────────────┐│
│  │ {                         │              │ {                    ││
│  │   _id: ObjectId("A"),     │              │   _id: ObjectId("X") ││
│  │   fieldId: ObjectId("X"), │─────────────▶│   name: "Cancha 1"   ││
│  │   complexId: ObjectId("Y")│   lookup     │   type: "futbol"     ││
│  │ }                         │              │ }                    ││
│  │ {                         │              │ {                    ││
│  │   _id: ObjectId("B"),     │              │   _id: ObjectId("Z") ││
│  │   fieldId: ObjectId("Z"), │─────────────▶│   name: "Cancha 2"   ││
│  │ }                         │              │   type: "tenis"      ││
│  └───────────────────────────┘              └─────────────────────┘│
│                                                                      │
│  RESULTADO DESPUÉS DE $lookup:                                       │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ {                                                               ││
│  │   _id: ObjectId("A"),                                           ││
│  │   fieldId: ObjectId("X"),                                       ││
│  │   field: [                                                       ││
│  │     { _id: ObjectId("X"), name: "Cancha 1", type: "futbol" }   ││
│  │   ]                                                               ││
│  │ }                                                               ││
│  │ {                                                               ││
│  │   _id: ObjectId("B"),                                           ││
│  │   fieldId: ObjectId("Z"),                                       ││
│  │   field: [                                                       ││
│  │     { _id: ObjectId("Z"), name: "Cancha 2", type: "tenis" }     ││
│  │   ]                                                               ││
│  │ }                                                               ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
│  ⚠️ NOTA: El resultado de $lookup siempre es un ARRAY               │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.3 $unwind Explained

```typescript
// Sintaxis de $unwind
{
  $unwind: {
    path: '$field',                          // Campo array a unwind
    preserveNullAndEmptyArrays: true         // Mantener docs sin array
  }
}
```

```
┌─────────────────────────────────────────────────────────────────────┐
│ $UNWIND - VISUALIZACIÓN                                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ANTES DE $unwind:                                                   │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ {                                                               ││
│  │   _id: "A",                                                     ││
│  │   field: [                                                       ││
│  │     { name: "Cancha 1", type: "futbol" },                       ││
│  │     { name: "Cancha 2", type: "tenis" }                         ││
│  │   ]                                                               ││
│  │ }                                                               ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
│  DESPUÉS DE $unwind con preserveNullAndEmptyArrays: true:           │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ { _id: "A", field: { name: "Cancha 1", type: "futbol" } }     ││
│  │ { _id: "A", field: { name: "Cancha 2", type: "tenis" } }      ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
│  ⚠️ SIN preserveNullAndEmptyArrays (por defecto es false):          │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ Si field = [] o null → El documento se ELIMINA del resultado    ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
│  ¿Por qué usar preserveNullAndEmptyArrays: true?                    │
│  • Evita perder documentos si no hay relación                        │
│  • Más robusto ante datos inconsistentes                             │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 4. Caso Práctico: Reservas

### 4.1 Schemas con Índices

```typescript
// reservation.schema.ts
import { Schema } from 'mongoose'

export const ReservationSchema = new Schema(
  {
    fieldId: { type: Schema.Types.ObjectId, ref: 'Field', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    complexId: { type: Schema.Types.ObjectId, ref: 'Complex', required: true },
    startTime: { type: Date, required: true },
    duration: { type: String, required: true },
    price: { type: Number, required: true },
    status: { type: String, enum: ['confirmed', 'canceled'], default: 'confirmed' },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
)

// ═══════════════════════════════════════════════════════════════════
// ÍNDICES AGREGADOS
// ═══════════════════════════════════════════════════════════════════
//
// 1. { fieldId: 1, startTime: 1 }
//    Uso: Verificar disponibilidad de canchas
//    Query: db.reservations.find({ fieldId: "X", startTime: { $gte: ... } })
//
// 2. { userId: 1, startTime: 1 }
//    Uso: Reservas futuras de un usuario
//    Query: db.reservations.find({ userId: "X", startTime: { $gte: ... } })
//
// 3. { userId: 1, status: 1 }
//    Uso: Historial de reservas por estado
//    Query: db.reservations.find({ userId: "X", status: "confirmed" })
//
// 4. { complexId: 1 }
//    Uso: Todas las reservas de un complejo
//    Query: db.reservations.find({ complexId: "X" })
//
ReservationSchema.index({ fieldId: 1, startTime: 1 })
ReservationSchema.index({ userId: 1, startTime: 1 })
ReservationSchema.index({ userId: 1, status: 1 })
ReservationSchema.index({ complexId: 1 })
```

```typescript
// complexes.schema.ts
export const ComplexSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, required: true },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    city: { type: String, required: true, trim: true },
    // ... otros campos
  },
  { timestamps: true },
)

ComplexSchema.index({ owner: 1 }) // Búsqueda por dueño
ComplexSchema.index({ city: 1, region: 1 }) // Búsqueda por ubicación
```

```typescript
// fields.schema.ts
export const FieldSchema = new Schema({
  name: { type: String, required: true },
  type: { type: String, required: true },
  complexId: { type: Schema.Types.ObjectId, ref: 'Complex' },
  availability: { type: [TimeBlockSchema], required: true },
})

FieldSchema.index({ complexId: 1 }) // Búsqueda de canchas por complejo
```

### 4.2 Service Optimizado

```typescript
// reservations.service.ts
import { BadRequestException, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model, Types } from 'mongoose'

@Injectable()
export class ReservationsService {
  constructor(
    @InjectModel('Reservation') private readonly reservationModel: Model<any>,
    @InjectModel('Field') private readonly fieldModel: Model<any>,
    @InjectModel('Complex') private readonly complexModel: Model<any>,
  ) {}

  // ═══════════════════════════════════════════════════════════════
  // MÉTODO ANTES (N+1) - 100+ queries para 50 reservas
  // ═══════════════════════════════════════════════════════════════
  // async getReservationsByUserFromDate_OLD(userId: string) {
  //   const reservations = await this.reservationModel.find({ userId })
  //
  //   for (const res of reservations) {           // 50 iteraciones
  //     res.field = await this.fieldModel.findById(res.fieldId)    // +50 queries
  //     res.complex = await this.complexModel.findById(res.complexId) // +50 queries
  //   }
  //   return reservations
  // }

  // ═══════════════════════════════════════════════════════════════
  // MÉTODO AHORA (Aggregation) - 1 sola query
  // ═══════════════════════════════════════════════════════════════
  async getReservationsByUserFromDate(userId: string) {
    const fromDate = new Date()
    if (!userId) throw new BadRequestException('User ID is required')

    // Pipeline de aggregation
    const reservations = await this.reservationModel.aggregate([
      // STAGE 1: Filtrar reservas
      // Usa índice: { userId: 1, startTime: 1 }
      {
        $match: {
          userId: new Types.ObjectId(userId),
          startTime: { $gte: fromDate },
          status: { $in: ['confirmed', 'canceled'] },
        },
      },

      // STAGE 2: JOIN con fields
      // Colección 'fields' (Mongoose pluraliza automáticamente)
      {
        $lookup: {
          from: 'fields',
          localField: 'fieldId',
          foreignField: '_id',
          as: 'field',
        },
      },

      // STAGE 3: JOIN con complexes
      {
        $lookup: {
          from: 'complexes',
          localField: 'complexId',
          foreignField: '_id',
          as: 'complex',
        },
      },

      // STAGE 4: Desempaquetar array de field
      {
        $unwind: { path: '$field', preserveNullAndEmptyArrays: true },
      },

      // STAGE 5: Desempaquetar array de complex
      {
        $unwind: { path: '$complex', preserveNullAndEmptyArrays: true },
      },

      // STAGE 6: Proyectar (seleccionar y renombrar campos)
      {
        $project: {
          _id: 1,
          // Convertir ObjectId a string para JSON
          fieldId: { $toString: '$fieldId' },
          userId: { $toString: '$userId' },
          complexId: { $toString: '$complexId' },
          // Campos de reserva
          startTime: 1,
          duration: 1,
          price: 1,
          status: 1,
          createdAt: 1,
          // Campos de los joins (ya no son arrays)
          fieldName: { $ifNull: ['$field.name', ''] },
          complexName: { $ifNull: ['$complex.name', ''] },
        },
      },

      // STAGE 7: Ordenar por fecha
      { $sort: { startTime: 1 } }, // 1 = ASC, -1 = DESC
    ])

    if (!reservations || reservations.length === 0) {
      throw new BadRequestException('No reservations found')
    }

    return reservations
  }
}
```

---

## 5. Rendimiento Comparativo

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    COMPARATIVA DE RENDIMIENTO                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ESCENARIO: Usuario con 100 reservas futuras                                 │
│  Latencia promedio por query: 10ms                                           │
│                                                                              │
│  ┌──────────────────────┬──────────────┬────────────────┬────────────────┐│
│  │ Método               │ # Queries    │ Tiempo Total   │ Eficiencia     ││
│  ├──────────────────────┼──────────────┼────────────────┼────────────────┤│
│  │ N+1                  │ 201          │ ~2010ms        │ ❌❌❌          ││
│  │ .populate()          │ 3            │ ~30ms          │ ✅             ││
│  │ $lookup              │ 1            │ ~15ms          │ ✅✅           ││
│  └──────────────────────┴──────────────┴────────────────┴────────────────┘│
│                                                                              │
│  GRÁFICO COMPARATIVO:                                                        │
│                                                                              │
│  N+1         ██████████████████████████████████████████████████████████████│
│              2010ms                                                          │
│                                                                              │
│  populate()  ████                                                            │
│              30ms                                                            │
│                                                                              │
│  $lookup     ██                                                              │
│              15ms                                                            │
│                                                                              │
│  ─────────────────────────────────────────────────────────────────────────── │
│                                                                              │
│  ESCALABILIDAD:                                                              │
│                                                                              │
│  # Reservas    N+1 (ms)      populate() (ms)    $lookup (ms)               │
│  ─────────────────────────────────────────────────────────────────────────── │
│  10           210             3                   1                          │
│  50           1,010           3                   1                          │
│  100          2,010           3                   1                          │
│  500          10,010          3                   1                          │
│  1,000        20,010          3                   1                          │
│                                                                              │
│  ⚠️ N+1 crece linealmente con los datos                                     │
│  ⚠️ populate() y $lookup son constantes                                     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Scripts de Verificación

### Crear índices manualmente en MongoDB

```javascript
// Ejecutar en mongosh (MongoDB Shell)

use reserva-de-canchas-api

// Índices de Reservation
db.reservations.createIndex({ fieldId: 1, startTime: 1 })
db.reservations.createIndex({ userId: 1, startTime: 1 })
db.reservations.createIndex({ userId: 1, status: 1 })
db.reservations.createIndex({ complexId: 1 })

// Índices de Complex
db.complexes.createIndex({ owner: 1 })
db.complexes.createIndex({ city: 1, region: 1 })

// Índices de Field
db.fields.createIndex({ complexId: 1 })

// Índices de User
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ rut: 1 }, { unique: true })
```

### Verificar índices existentes

```javascript
// Listar todos los índices de una colección
db.reservations.getIndexes()

// Ver tamaño de índices
db.reservations.stats().indexSizes

// Ver qué índice usa una query
db.reservations.find({ userId: '...' }).explain('executionStats')
```

### Eliminar índice no usado

```javascript
// Por nombre del índice
db.reservations.dropIndex('fieldId_1_startTime_1')

// Por especificación
db.reservations.dropIndex({ fieldId: 1, startTime: 1 })
```

---

## Resumen

```
┌─────────────────────────────────────────────────────────────────────┐
│                    KEY TAKEAWAYS                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. ÍNDICES:                                                         │
│     • Mejoran velocidad de búsqueda de O(n) a O(log n)               │
│     • Usar índices compuestos cuando consultas usan múltiples campos │
│     • El orden de campos en índices compuestos importa               │
│     • Verificar uso con explain()                                    │
│                                                                      │
│  2. N+1 QUERIES:                                                     │
│     • Problema común y costoso                                       │
│     • Soluciones: populate() o $lookup                               │
│     • $lookup es más eficiente (1 query vs 3)                       │
│                                                                      │
│  3. AGGREGATION:                                                     │
│     • Pipeline de stages que procesan documentos                     │
│     • $match: filtrar                                                │
│     • $lookup: joinear                                               │
│     • $unwind: desempquetar arrays                                  │
│     • $project: seleccionar campos                                   │
│                                                                      │
│  4. BEST PRACTICES:                                                  │
│     • Indexar campos de alta cardinalidad                            │
│     • Evitar sobre-indexar (ralentiza writes)                        │
│     • Usar preserveNullAndEmptyArrays en $unwind                    │
│     • Convertir ObjectId a string en $project para APIs              │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

_Documento generado para my-court-api — API de Reservas de Canchas_
_Versión: 1.0 — Marzo 2026_
