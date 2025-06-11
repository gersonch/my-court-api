import { Module } from '@nestjs/common'
import { ComplexesController } from './complexes.controller'
import { ComplexesService } from './complexes.service'
import { MongooseModule } from '@nestjs/mongoose'
import { ComplexSchema } from './complexes.schema'
import { UserSchema } from 'src/users/users.schema'
import { AuthModule } from 'src/auth/auth.module'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Complex', schema: ComplexSchema },
      { name: 'User', schema: UserSchema },
    ]),
    AuthModule,
  ],
  controllers: [ComplexesController],
  providers: [ComplexesService],
})
export class ComplexesModule {}
