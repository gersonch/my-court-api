import { Module } from '@nestjs/common'
import { ComplexesController } from './complexes.controller'
import { ComplexesService } from './complexes.service'
import { MongooseModule } from '@nestjs/mongoose'
import { ComplexSchema } from './complexes.schema'

@Module({
  imports: [MongooseModule.forFeature([{ name: 'Complex', schema: ComplexSchema }])],
  controllers: [ComplexesController],
  providers: [ComplexesService],
})
export class ComplexesModule {}
