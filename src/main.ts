import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ValidationPipe } from '@nestjs/common'
import * as cookieParser from 'cookie-parser'

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

  app.enableCors(
    { origin: '*', credentials: true }, // Permite el uso de cookies
  )
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0')
}
void bootstrap()
