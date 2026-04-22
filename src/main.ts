import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ValidationPipe } from '@nestjs/common'
import * as cookieParser from 'cookie-parser'

// SWAGGER: Importaciones para generar el documento OpenAPI
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'

// SCALAR: Importación para renderizar la documentación
import { apiReference } from '@scalar/nestjs-api-reference'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  )
  app.use(cookieParser())

  app.enableCors({ origin: 'http://localhost:5173', credentials: true })

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

  // SCALAR: Configurar endpoint de documentación
  // Usar 'content' directamente (formato actual de Scalar 1.1.x)
  app.use(
    '/api-docs',
    apiReference({
      content: document,
      // SCALAR: Tema visual
      theme: 'purple',
    }),
  )

  // SWAGGER: (Opcional) Habilitar Swagger UI tradicional
  // Si querés tener ambos: descomentá la siguiente línea
  // SwaggerModule.setup('api', app, document)

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0')
}
void bootstrap()
