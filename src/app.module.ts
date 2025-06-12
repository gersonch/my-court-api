import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { UsersModule } from './users/users.module'
import { ComplexesModule } from './complexes/complexes.module'
import { AuthModule } from './auth/auth.module'
import { FieldsModule } from './fields/fields.module'
import { ReservationsModule } from './reservations/reservations.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
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
    UsersModule,
    ComplexesModule,

    AuthModule,

    FieldsModule,

    ReservationsModule,
  ],
})
export class AppModule {}
