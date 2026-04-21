# Database

> Modelos y esquemas de MongoDB.

## Conexión

- **URI**: Variable de entorno `MONGODB_URI`
- **ODM**: Mongoose ^8.15.1
- **Config**: `src/app.module.ts`

---

## Schemas

### User

```typescript
{
  _id: ObjectId,
  email: string,
  password: string (hash),
  name: string,
  lastname: string,
  phone: string,
  avatar: string (URL),
  role: enum['user', 'admin'],
  googleId: string (optional),
  createdAt: Date,
  updatedAt: Date
}
```

### Complex

```typescript
{
  _id: ObjectId,
  name: string,
  description: string,
  address: string,
  phone: string,
  images: string[] (URLs),
  location: {
    type: 'Point',
    coordinates: [longitude, latitude]
  },
  owner: ObjectId (ref: User),
  createdAt: Date,
  updatedAt: Date
}
```

### Field

```typescript
{
  _id: ObjectId,
  name: string,
  type: enum['5', '7', '11'],
  pricePerHour: number,
  complex: ObjectId (ref: Complex),
  images: string[],
  available: boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Reservation

```typescript
{
  _id: ObjectId,
  user: ObjectId (ref: User),
  field: ObjectId (ref: Field),
  complex: ObjectId (ref: Complex),
  date: Date,
  startTime: string,
  endTime: string,
  status: enum['pending', 'confirmed', 'cancelled'],
  totalPrice: number,
  createdAt: Date,
  updatedAt: Date
}
```

### Tournament

```typescript
{
  _id: ObjectId,
  name: string,
  description: string,
  type: enum['5', '7', '11'],
  maxTeams: number,
  startDate: Date,
  endDate: Date,
  status: enum['open', 'in-progress', 'finished'],
  teams: [{
    name: string,
    players: string[]
  }],
  owner: ObjectId (ref: User),
  createdAt: Date,
  updatedAt: Date
}
```

### Rating

```typescript
{
  _id: ObjectId,
  user: ObjectId (ref: User),
  complex: ObjectId (ref: Complex),
  rating: number (1-5),
  comment: string,
  createdAt: Date,
  updatedAt: Date
}
```

---

## Índices

- `User.email`: unique
- `Field.complex`: index
- `Reservation.field + date`: compound index
- `Rating.complex`: index

---

## Notas

- Timestamps automáticos con `timestamps: true`
- `_id` con `ObjectId` de MongoDB
- Relaciones via `ref` en schemas
