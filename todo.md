# TODO — My Court API

> Tracking de issues, features pendientes y decisiones.

## 🎯 Frontends consumidores

La API consume **dos frontends** con necesidades distintas:

### 1. Dashboard Web (React) — para `owners`
- Auth por **cookies** (httpOnly, navegador)
- Cliente: navegador desktop

### 2. App Móvil (React Native + Expo) — para `users`
- Auth por **Bearer tokens** (headers)
- Cliente: iOS / Android

### Implicaciones para los endpoints

| Aspecto | Web (owner) | Mobile (user) |
|---|---|---|
| Auth | Cookies httpOnly | Bearer token |
| Login endpoint | `/auth/login/owner` | `/auth/login` |
| Vista de complejos | Solo el propio (gestión) | Listado público + detalle |
| Reservas | Dashboard (cambiar status) | Crear + ver propias |
| Torneos | CRUD completo | Ver + suscribirse |
| Rating | No usa | Crear/actualizar/ver |

**Decisión:** Mantener una sola API que sirva a ambos. Los endpoints deben distinguir contexto por rol del token, no por header/path dedicado.

---

## 🔒 Seguridad

### Resueltos ✅

- [x] Role injection en registro (`RegisterDto` aceptaba `role`, removido)
- [x] `POST /users` sin auth (eliminado, register vive en `/auth/register`)
- [x] Validación de rol bypassable en login (rol se valida antes de generar tokens)

### Diferidos ⏸️

- [ ] **Google OAuth callback envía token en URL** — esperar a que Expo+Google OAuth funcione. Actual: `auth.controller.ts:130-148`
- [ ] **`GET /users` sin auth** — intencional para dev, agregar `@Auth(Role.ADMIN)` antes de prod

### Pendientes críticos 🔴

- [ ] **Rotación de refresh tokens** — actualmente se reusa el mismo token. Cada `/auth/refresh` debería generar uno nuevo y hashear el anterior en DB (`auth.controller.ts:103-108`)
- [ ] **IDOR en tournaments** — `@Get('user/:id')` y `subscribe` con `userId` del body
- [ ] **Bug en reservations controller** — `GET /:fieldId` colisiona con `GET /:reservationId`, además `find(fieldId)` está mal

### Pendientes medios 🟡

- [ ] Bcrypt salt=10 → subir a 12 (OWASP)
- [ ] Password min 6 caracteres → 8
- [ ] Agregar `helmet` para headers de seguridad
- [ ] Rate limit específico en login (ThrottlerGuard global es muy permisivo)
- [ ] CORS hardcodeado a `localhost:5173` → mover a env var
- [ ] `getComplexByOwnerId` IDOR (cualquier owner ve complejos ajenos)
- [ ] `Rating.getRatingForComplex` carga todos los ratings en memoria → usar aggregation `$avg`

### Pendientes bajos 🔵

- [ ] Limpiar `ApiKeyGuard` (no se usa, tiene bugs)
- [ ] `UserProfileDto` permite cambiar email sin verificación
- [ ] Login expone refresh token en body (preferir solo cookies httpOnly)
- [ ] Inputs sin sanitizar (XSS depende del cliente)

---

## 🏟️ Complexes

### Modelo de visibilidad

**Público** (visible para `user` regular):
- `name`, `description`, `image_url`
- `region`, `city`, `country`, `address`
- `stars`, `sports`, `fieldsNumber`
- `equipment`, `facilities`

**Privado** (solo `owner` o `admin`):
- `owner` (ObjectId)

### Decisión de creación

**Actual:** Solo `admin` puede crear complejos vía `POST /complexes`.

**Razón:** Evitar complejos fantasma/spam, validar manualmente antes de publicar.

**Futuro:** Self-service con verificación post-creación (moderación por admin). Decisión pendiente según crecimiento.

### Features por implementar

#### Vista pública
- [ ] Endpoint público `GET /complexes/:id` para usuarios regulares (hoy solo owners pueden ver detalle)

#### Edición por owner
- [ ] Permitir editar `name`, `description`, `address`, `region`, `city`, `country` (hoy solo se editan `sports/equipment/facilities`)
- [ ] Permitir eliminar el propio complejo (no existe endpoint)

#### Anti-complejos-fantasma
- [ ] Agregar campo `status` al schema (`pending` / `approved` / `rejected`)
- [ ] Agregar `verifiedAt`, `verifiedBy`, `rejectionReason`
- [ ] Definir flujo: ¿admin crea con `approved` directo o pasa por moderación?
- [ ] Endpoint admin para aprobar/rechazar complejos pendientes

#### Búsqueda y filtrado
- [ ] Filtros por ciudad, sport, equipamiento
- [ ] Búsqueda por texto (nombre/descripción)
- [ ] Geolocalización real (lat/lng) para "cerca de mí"
- [ ] Resolver `name` unique global → compuesto `(name, owner)` para evitar griefing

### Bugs a limpiar 🧹

- [ ] `GET /complexes/id` devuelve `"hola"` (placeholder olvidado en `complexes.controller.ts:47-49`)
- [ ] `findAll()` en service existe pero no se usa
- [ ] `userHasRoleOwner` no usa el enum `Role.OWNER` (inconsistencia)
- [ ] DTO `createComplexesDto` sin `@MaxLength` ni validación de tamaño
- [ ] `getComplexByOwnerId` permite IDOR (ver seguridad)

---

## 👤 Users

- [ ] Limpiar import huérfano de `CreateUserDto` en `users.controller.ts`
- [ ] Eliminar campo `provider` del `RegisterDto` (lo fuerza el service, no necesita estar en el DTO)

---

## 📝 Notas

- `provider` en `RegisterDto` está como código muerto: el servicio siempre lo sobreescribe con `'local'`. Eliminar del DTO y forzar en service.
- El JWT tiene dos secrets separados pero la validación se hacía con `process.env` directo (ya corregido en #5/#6 — ahora se valida con Joi al boot).
