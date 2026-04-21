# Auth

> Sistema de autenticación y autorización.

## Estrategias

### JWT Strategy

- **Paquete**: `passport-jwt`
- **Archivo**: `src/auth/strategies/jwt.strategy.ts`
- **Secret**: Variable de entorno `JWT_SECRET`
- **Expiración**: 15 minutos (access token)

### Google OAuth

- **Paquete**: `passport-google-oauth20`
- **Estrategia**: `GoogleStrategy` (`src/auth/strategies/google.strategy.ts`)
- **Scope**: `profile`, `email`

---

## Flujo de Auth

### Registro

```
POST /auth/register
Body: { email, password, name, lastname, phone }
```

### Login

```
POST /auth/login
Body: { email, password }
Response: { access_token, refresh_token }
```

### Google Login

```
GET /auth/google → Redirect a Google
GET /auth/google/callback → Redirect con token
```

### Refresh Token

```
POST /auth/refresh
Cookie: refresh_token
Response: { access_token }
```

---

## Roles

| Rol     | Descripción     |
| ------- | --------------- |
| `user`  | Usuario regular |
| `admin` | Administrador   |

### Guards

- `RolesGuard`: Verifica rol del usuario
- `@Roles()`: Decorator para especificar rol requerido

---

## Seguridad

- Passwords hasheados con `bcrypt`
- Tokens en cookies HTTP-only
- Rate limiting (100 req/min)
- Throttler para protección de login

---

## Variables de Entorno

```
JWT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

---

## Links

- [Flujo Auth](../flujo-auth.md) - Documentación adicional
