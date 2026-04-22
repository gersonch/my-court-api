# Integración de Scalar (OpenAPI Documentation)

## Resumen

Este documento describe el flujo de integración de **Scalar** como alternativa moderna a Swagger UI para la documentación de la API.

> **Nota importante**: Scalar NO reemplaza Swagger. Scalar es una **capa de presentación** que renderiza el documento OpenAPI generado por `@nestjs/swagger`.

---

## Arquitectura

```
┌─────────────┐     ┌─────────────────┐     ┌──────────────────────┐
│   NestJS    │────▶│ @nestjs/swagger │────▶│ @scalar/nestjs-api-  │
│ Controllers │     │ (genera spec)   │     │ reference (render)  │
└─────────────┘     └─────────────────┘     └──────────────────────┘
        │                   │                         │
   @ApiProperty()    DocumentBuilder()        apiReference()
   @ApiTags()        SwaggerModule.createDoc() /api-docs endpoint
```

---

## Flujo de Integración

### 1. Instalación de Dependencias

```bash
npm install @nestjs/swagger @scalar/nestjs-api-reference
```

**Paquetes instalados:**
- `@nestjs/swagger`: Genera el documento OpenAPI desde los controllers y DTOs
- `@scalar/nestjs-api-reference`: Renderiza la documentación con una UI moderna

---

### 2. Configuración en `main.ts`

#### Imports necesarios:

```typescript
// SWAGGER: Importaciones para generar el documento OpenAPI
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'

// SCALAR: Importación para renderizar la documentación
import { apiReference } from '@scalar/nestjs-api-reference'
```

#### Generación del documento OpenAPI (Swagger):

```typescript
// ============================================================
// SWAGGER: Configuración del documento OpenAPI
// ============================================================
const config = new DocumentBuilder()
  .setTitle('My Court API')
  .setDescription('API para gestión de canchas, complejos y reservas')
  .setVersion('1.0')
  // SWAGGER: Agregar autenticación JWT al documento
  .addBearerAuth(
    {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      name: 'Authorization',
      description: 'Ingresa tu token JWT',
      in: 'header',
    },
    'JWT-auth',
  )
  .build()

// SWAGGER: Generar el documento OpenAPI desde los controllers
const document = SwaggerModule.createDocument(app, config)
```

#### Renderizado con Scalar:

```typescript
// SCALAR: Configurar endpoint de documentación
app.use(
  '/api-docs',
  apiReference({
    document: document,
    // SCALAR: Tema visual (opcional)
    theme: 'purple',
  }),
)
```

---

### 3. Decoradores en DTOs (Swagger)

Agregar `@ApiProperty()` a cada propiedad del DTO para documentación自动:

```typescript
// SWAGGER: Decorators para documentación
import { ApiProperty } from '@nestjs/swagger'

export class RegisterDto {
  @ApiProperty({ example: 'Juan Pérez', description: 'Nombre del usuario' })
  @Transform(({ value }: { value: string }) => value.trim())
  @IsString()
  @MinLength(2)
  name: string

  @ApiProperty({ example: 'juan@email.com', description: 'Correo electrónico' })
  @IsEmail()
  email: string

  // ... más propiedades
}
```

---

### 4. Decoradores en Controllers (Swagger)

Agregar `@ApiTags()`, `@ApiOperation()`, `@ApiResponse()`:

```typescript
// SWAGGER: Decorators para documentar el controller
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'

@ApiTags('Autenticación') // SWAGGER: Agrupar endpoints
@Controller('auth')
export class AuthController {
  
  @Post('register')
  @ApiOperation({ summary: 'Registrar nuevo usuario', description: 'Crea un nuevo usuario en el sistema' })
  @ApiResponse({ status: 201, description: 'Usuario creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto)
  }
}
```

---

### 5. Endpoints Disponibles

| Endpoint | Descripción |
|----------|-------------|
| `/api-docs` | **Scalar API Reference** (documentación interactiva) |
| `/api` | Swagger UI tradicional (opcional, deshabilitado por defecto) |

---

## Comparación: Swagger UI vs Scalar

| Característica | Swagger UI | Scalar |
|----------------|------------|--------|
| UI | Funcional, clásica | Moderna, limpia |
| Rendimiento | ~1.8s carga | ~900ms carga |
| Tamaño bundle | Mayor | Menor |
| Theming | Limitado | Múltiples temas |
| Personalización | Básica | Avanzada |
| Precio | Gratuito | Freemium |

---

## Archivos Modificados

| Archivo | Cambio |
|---------|--------|
| `package.json` | Agregadas dependencias |
| `src/main.ts` | Configuración Swagger + Scalar |
| `src/auth/dto/register.dto.ts` | Agregados `@ApiProperty()` |
| `src/auth/dto/login.dto.ts` | Agregados `@ApiProperty()` |
| `src/auth/auth.controller.ts` | Agregados `@ApiTags()`, `@ApiOperation()` |

---

## Pruebas

1. Iniciar el servidor:
   ```bash
   npm run start:dev
   ```

2. Acceder a la documentación:
   - **Scalar**: http://localhost:3000/api-docs
   - **Swagger** (si se habilita): http://localhost:3000/api

---

## Notas

- **No se elimina Swagger**: Se sigue usando para generar el documento OpenAPI
- **Scalar es solo la UI**: No hay cambios en la lógica de la API
- **Escalabilidad**: El documento OpenAPI puede consumirse externamente (`/openapi.json`)
- **Seguridad**: En producción, considerar proteger `/api-docs` con autenticación