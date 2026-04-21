# Arquitectura

> Decisiones estructurales y patrones de diseño del proyecto.

## Stack

| Tecnología         | Propósito           |
| ------------------ | ------------------- |
| NestJS             | Framework backend   |
| MongoDB + Mongoose | Base de datos       |
| JWT + Passport     | Autenticación       |
| Cloudinary         | Storage de imágenes |
| Docker             | Contenedores        |

## Estructura de Módulos

```
src/
├── auth/           # Autenticación (JWT, Google OAuth)
├── users/          # Gestión de usuarios
├── complexes/     # Complejos deportivos
├── fields/        # Canchas
├── reservations/  # Reservas
├── tournaments/  # Torneos
├── rating/        # Calificaciones
├── config/        # Configuraciones
├── common/        # DTOs, guards, decorators
└── types/         # Tipos compartidos
```

## Patrones

- **Módulos NestJS**: Estructura modular por dominio
- **DTOs**: Validación de entrada con class-validator
- **Schemas Mongoose**: Modelos de datos
- **Controllers**: Endpoints REST
- **Services**: Lógica de negocio

## Decisiones Clave

<!-- Links a decisiones.md para decisiones arquitectónicas -->

---

## Diagramas

<!-- Agregar diagrams aquí si es necesario -->
