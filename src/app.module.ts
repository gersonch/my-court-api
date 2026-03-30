import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { UsersModule } from './users/users.module'
import { ComplexesModule } from './complexes/complexes.module'
import { AuthModule } from './auth/auth.module'
import { FieldsModule } from './fields/fields.module'
import { RatingModule } from './rating/rating.module'
import { TournamentsModule } from './tournaments/tournaments.module'
import { ReservationsModule } from './reservations/reservations.module'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import { APP_GUARD } from '@nestjs/core'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const uri = configService.get<string>('MONGODB_URI')
        if (!uri) {
          throw new Error('MONGODB_URI environment variable is not set')
        }
        return { uri }
      },
      inject: [ConfigService],
    }),
    ThrottlerModule.forRoot([
      {
        // Limite de 5 solicitudes por minuto para rutas generales
        ttl: 10000 * 6, // 1 minuto
        limit: 100, // 100 solicitudes por minuto
      },
    ]),
    UsersModule,
    ComplexesModule,
    AuthModule,
    FieldsModule,
    RatingModule,
    TournamentsModule,
    ReservationsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
