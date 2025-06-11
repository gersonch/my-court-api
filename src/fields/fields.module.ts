import { Module } from '@nestjs/common'
import { FieldsService } from './fields.service'
import { FieldsController } from './fields.controller'
import { MongooseModule } from '@nestjs/mongoose'
import { FieldsSchema } from './field.schema'
import { ComplexSchema } from 'src/complexes/complexes.schema'

import { ComplexesModule } from 'src/complexes/complexes.module'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Field', schema: FieldsSchema },
      { name: 'Complex', schema: ComplexSchema },
    ]),
    ComplexesModule,
  ],
  controllers: [FieldsController],
  providers: [FieldsService],
})
export class FieldsModule {}
