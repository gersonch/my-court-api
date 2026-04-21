# Stack

> Tecnologías y herramientas del proyecto.

## Backend

| Tecnología              | Versión | Propósito           |
| ----------------------- | ------- | ------------------- |
| NestJS                  | ^11.0.1 | Framework           |
| TypeScript              | ^5.7.3  | Lenguaje            |
| Mongoose                | ^8.15.1 | ODM MongoDB         |
| @nestjs/mongoose        | ^11.0.3 | Integración MongoDB |
| @nestjs/jwt             | ^11.0.0 | JSON Web Tokens     |
| Passport                | ^0.7.0  | Autenticación       |
| passport-jwt            | ^4.0.1  | Strategy JWT        |
| passport-google-oauth20 | ^2.0.0  | Google OAuth        |

## Utilities

| Tecnología        | Propósito              |
| ----------------- | ---------------------- |
| dayjs             | Fechas y horarios      |
| bcrypt            | Hash de passwords      |
| class-validator   | Validación de DTOs     |
| class-transformer | Transformación de DTOs |
| multer            | Upload de archivos     |
| cloudinary        | 存储 de imágenes       |

## DevOps

| Tecnología | Propósito       |
| ---------- | --------------- |
| Docker     | Contenedores    |
| MongoDB    | Base de datos   |
| Node.js    | Runtime         |
| npm        | Package manager |

## Testing

- Jest (incluido en NestJS)
- Supertest para e2e

---

## Dependencias Obsoletas

- `@nestjs/swagger` →替换por `@scalar/nestjs-api-reference`
